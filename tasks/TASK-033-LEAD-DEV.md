# Task 033 — Lead Developer

## Inventory + Equipment Engine

### Objective

Implement inventory management (placing pieces from loot box rewards) and the equipment system (equipping items to pieces on the board with gameplay effects). This builds on the loot box rewards from Task 031.

### Phase

v0.7 — Loot Boxes

### Prerequisites

- Task 031 (Loot Box Core Engine) complete

### Scope

#### 1. Inventory: Place from Inventory

The `PlaceAction` already has a `fromInventory: boolean` field. Implement the inventory path:

**In game reducer (`src/engine/game.ts`):**

When `action.type === 'place' && action.fromInventory === true`:
- Validate piece exists in `state.inventory[currentPlayer]`
- Validate placement square is valid (same rules as bought pieces)
- Remove piece from inventory (first matching `InventoryItem`)
- Place piece on board (update FEN)
- Do NOT deduct gold (inventory pieces are free)
- Flip turn

**In `src/engine/placement.ts`:**
- `hasInInventory(state: GameState, piece: Role): boolean`
- `removeFromInventory(state: GameState, piece: Role): GameState`

#### 2. Equipment: Equip Action

Handle `EquipAction` in the game reducer:

**Validation:**
- Player must own the item in `state.items[currentPlayer]`
- Target square must contain a friendly piece
- Target square must not already have equipment
- Player must have enough gold to pay equip cost (`equipCosts` in config)
- Cannot equip to king

**Resolution:**
- Deduct equip cost from player's gold
- Remove item from `state.items[currentPlayer]`
- Add to `state.equipment[squareName]` as `EquippedItem`
- Equipping does NOT consume the turn (free action, like pawn hits)

#### 3. Equipment Movement

Equipment must travel with pieces. Modify `applyMove` in `src/engine/position.ts` or post-move processing in `game.ts`:

- **On move:** Transfer `equipment[fromSquare]` → `equipment[toSquare]`
- **On capture (attacker wins):** Attacker's equipment moves to capture square. Defender's equipment is destroyed.
- **On capture with Turtle Shell:** See item effects below.
- **On piece conversion (Conqueror):** Equipment stays on the piece (swaps with it).

#### 4. Equipment Effects

Each item modifies gameplay when equipped:

##### Crossbow (2g to equip)

**Effect:** The equipped piece can perform a ranged capture — it captures an enemy piece within 2 squares (in its normal movement directions) without moving to that square. The captured piece is removed; the crossbow piece stays put.

**Implementation:**
- Add `getRangedCaptures(state: GameState, square: Square): Square[]` to a new `src/engine/equipment.ts` module
- Returns squares of enemy pieces within 2 squares along the piece's normal movement vectors
- UI dispatches a special `MoveAction` where `from === to` but with a `rangedTarget` field (or a new action type)
- Alternative simpler approach: treat as a `HitLootBoxAction`-style action with a new `RangedCaptureAction`

**Design note:** If crossbow ranged captures prove too complex for move generation, simplify to: "Crossbow piece can capture any adjacent enemy piece without moving" (like a stationary hit). Defer full 2-square range to a future iteration.

##### Turtle Shell (2g to equip)

**Effect:** The piece survives one capture. When an opponent captures a turtle-shelled piece, the shell absorbs the hit instead: the attacking piece returns to its origin, the defending piece stays, and `remainingHits` on the shell decrements. Shell destroyed at 0 hits.

**Implementation:**
- In `applyMove`, before removing the captured piece, check `equipment[toSquare]` for turtle shell
- If turtle shell with `remainingHits > 0`: decrement hits, do NOT remove defender, return attacker to origin square
- If `remainingHits` reaches 0: remove the equipment entry
- Config default: `remainingHits: 1` (one-time use)

##### Crown (3.5g to equip)

**Effect:** Immediately promotes the equipped piece to queen. The crown is consumed on use (one-time effect, not persistent equipment).

**Implementation:**
- On equip: change the piece's role to queen in the FEN
- Remove the equipment entry (crown is consumed, not persistent)
- Cannot equip to king or queen (already a queen)
- Cannot equip to pawn on back rank (use normal promotion instead)

#### 5. Equipment Cleanup

- When a piece with equipment is captured (and doesn't have turtle shell), remove the equipment entry
- When undoing a move, restore equipment to previous state (requires equipment in undo history)

### Files to Create/Modify

| File | Action |
|------|--------|
| `src/engine/equipment.ts` | **Create** — equipment effects, ranged captures, validation |
| `src/engine/game.ts` | **Modify** — handle `EquipAction`, `PlaceAction` from inventory, equipment movement |
| `src/engine/placement.ts` | **Modify** — add inventory helpers |
| `src/engine/position.ts` | **Modify** — equipment transfer on move, turtle shell capture logic |
| `src/engine/types.ts` | **Possibly modify** — add `RangedCaptureAction` if needed |

### Open Design Questions

1. **Crossbow range mechanic** — 2 squares along movement vectors vs. any adjacent? The simpler "any adjacent" might be better for v0.7 MVP.
2. **Equipment + undo** — does undo restore consumed crowns? Turtle shell hits? This needs undo history to track equipment state.
3. **Equipment + piece conversion** — in Conqueror mode, if a piece with equipment is converted, does equipment transfer to the new owner?
4. **Bot interaction** — bots need to understand equipment for proper evaluation. Defer bot equipment awareness to a later task or keep it simple (bot ignores equipment for now).

### Acceptance Criteria

- [ ] Inventory pieces can be placed for free
- [ ] Inventory validation works (can't place pieces not in inventory)
- [ ] Equip action validates ownership, gold, target piece
- [ ] Equip action deducts gold and moves item to equipment slot
- [ ] Equipment moves with pieces on normal moves
- [ ] Equipment destroyed when piece captured (no turtle shell)
- [ ] Crossbow allows ranged/adjacent capture without moving
- [ ] Turtle Shell absorbs one capture, then is destroyed
- [ ] Crown promotes piece to queen and is consumed
- [ ] Equipment state is consistent after undo
