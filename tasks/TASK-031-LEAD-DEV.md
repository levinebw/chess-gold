# Task 031 — Lead Developer

## Loot Box Core Engine: Spawn, Hit, Open, Reward

### Objective

Implement the full loot box lifecycle in the game engine: spawning boxes on the board, hitting them with pieces, opening them when hits are depleted, rolling the drop table, and distributing rewards. Also implement the `loot-boxes-collected` win condition.

### Phase

v0.7 — Loot Boxes

### Prerequisites

None. All types (`LootBox`, `HitLootBoxAction`, `LootBoxConfig`, `LootBoxDrop`) and config values already exist in `src/engine/types.ts` and `src/engine/config.ts`. The `GameState` already has `lootBoxes`, `lootBoxesCollected` fields.

### Scope

#### 1. Loot Box Spawning (`src/engine/lootbox.ts` — new file)

Create a `lootbox.ts` module with pure functions:

- `shouldSpawnLootBox(state: GameState): boolean`
  - Only when `state.modeConfig.lootBoxes === true`
  - Every `spawnInterval` turns (config: 4)
  - Only if `state.lootBoxes.length < maxActiveBoxes` (config: 1)
  - Not on turn 1 (let players set up first)

- `spawnLootBox(state: GameState): GameState`
  - Pick a random empty square (not occupied by any piece or existing loot box)
  - Create `LootBox` with `hitsRemaining` from config (3), `lastHitBy: null`, `spawnedOnTurn`
  - Append to `state.lootBoxes`
  - Spawning uses a deterministic seed if provided (for testing), else `Math.random()`

#### 2. Hit Mechanics (in game reducer `src/engine/game.ts`)

Handle `HitLootBoxAction` in `applyAction`:

- **Validation:**
  - Piece must exist at `action.pieceSquare` and belong to current player
  - Loot box must exist at `action.lootBoxSquare`
  - Piece must be adjacent to loot box (8-directional, 1 square away)
  - Piece must not be a king (kings can't hit loot boxes)

- **Hit resolution:**
  - Decrement `lootBox.hitsRemaining`
  - Set `lootBox.lastHitBy = state.turn`
  - Queen: set `hitsRemaining = 0` immediately (config: `queenHitsToOpen: 1`)
  - Pawn hits do NOT consume the player's turn (`pawnHitsWithoutMoving: true`) — the player still gets to move/place after hitting with a pawn

- **Turn consumption:**
  - Hitting with a non-pawn piece consumes the turn (turn flips)
  - Hitting with a pawn does NOT consume the turn (player continues)

#### 3. Opening + Rewards

When `hitsRemaining` reaches 0 after a hit:

- Roll the drop table (weighted random selection from `CHESS_GOLD_CONFIG.lootBox.dropTable`)
- Distribute reward based on `lastHitBy`:
  - `{ type: 'gold', amount }` → add to player's gold
  - `{ type: 'piece', piece }` → add to player's inventory as `InventoryItem`
  - `{ type: 'item', item }` → add to player's items list
- Increment `state.lootBoxesCollected[lastHitBy]`
- Remove the loot box from `state.lootBoxes`

- `rollDropTable(dropTable: LootBoxDrop[]): LootBoxDrop['contents']`
  - Weighted random selection (sum weights, pick random in range, accumulate)

#### 4. Win Condition: `loot-boxes-collected`

Add to `src/engine/win-conditions.ts`:

- `checkLootBoxesCollected(state: GameState): Color | null`
  - If any player's `lootBoxesCollected >= boxesToWin` (config: 6), they win
  - Return the winning color, or null

Integrate into game reducer's post-action win condition check (alongside `all-converted`).

#### 5. Spawn Integration

After each action in the game reducer (after status checks), call `shouldSpawnLootBox` → `spawnLootBox` to add a loot box to the board if conditions are met.

### Key Design Decisions

- **Pawn hit = free action**: Pawns can hit without using their turn. This is a core mechanic — it makes pawns valuable near loot boxes.
- **Queen instant-open**: Queens open loot boxes in 1 hit instead of 3.
- **King excluded**: Kings cannot hit loot boxes.
- **Random square selection**: Use empty squares only (no pieces, no existing loot boxes). Squares should be in the middle area of the board (ranks 3-6) to encourage interaction.
- **Two Kings from drop table**: The drop table includes king at 0.01% weight. For now, if a king is rolled, treat it as a queen piece in inventory (design decision pending).

### Files to Create/Modify

| File | Action |
|------|--------|
| `src/engine/lootbox.ts` | **Create** — spawning, hit validation, opening, drop table |
| `src/engine/game.ts` | **Modify** — handle `HitLootBoxAction`, spawn integration, win condition |
| `src/engine/win-conditions.ts` | **Modify** — add `checkLootBoxesCollected` |

### Acceptance Criteria

- [ ] Loot boxes spawn on the correct interval on empty squares
- [ ] Hit validation rejects: non-adjacent, wrong player, king, no piece
- [ ] Hit counting works (3 hits to open, 1 for queen)
- [ ] Pawn hits don't consume the turn
- [ ] Drop table rolls produce correctly weighted results
- [ ] Rewards distribute to the correct player (gold, piece to inventory, item)
- [ ] Loot box removed from state after opening
- [ ] `loot-boxes-collected` win condition triggers at 6 collected
- [ ] Spawn doesn't exceed `maxActiveBoxes`
- [ ] Spawn doesn't place on occupied squares
