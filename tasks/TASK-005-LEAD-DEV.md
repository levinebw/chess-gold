# Task 005 — Lead Developer

## Implement Game Reducer (GREEN phase)

### Objective

Implement `src/engine/game.ts` — the top-level game reducer that ties all engine modules together. Make all 28 failing game tests pass. This is the final engine module in Phase 1.

This module is the **single entry point** for the game engine. It receives actions, validates them, applies them through the lower-level modules, manages turns, awards income, and detects game-over conditions.

### Prerequisites

- Read the failing tests: `test/engine/game.test.ts` — 28 tests
- Run `npx vitest run` to see all 28 failures and understand expected behaviors
- Review the existing engine modules you'll be composing:
  - `gold.ts` — `awardTurnIncome`, `canAffordPiece`, `deductPurchaseCost`, `awardCaptureReward`
  - `placement.ts` — `isValidPlacement`
  - `position.ts` — `getLegalMoves`, `isCheckmate`, `isStalemate`, `applyMove`
  - `promotion.ts` — `canPromote`, `applyPromotion`
  - `config.ts` — `CHESS_GOLD_CONFIG`, `MODE_PRESETS`
  - `types.ts` — `GameState`, `GameAction`, `GameError`, `GameErrorCode`

### Deliverables

#### Implement `src/engine/game.ts`

Export these two functions:

**`createInitialState(modeConfig?: GameModeConfig): GameState`**
- Creates a fresh game state for a new game
- Default mode is `MODE_PRESETS['chess-gold']`
- FEN: `4k3/8/8/8/8/8/8/4K3 w - - 0 1` (kings only)
- Starting gold: `CHESS_GOLD_CONFIG.startingGold` for both players
- Turn: white, turnNumber: 1, halfMoveCount: 0
- Status: active, winner: null
- Empty actionHistory, inventory, items, equipment, lootBoxes, lootBoxesCollected

**`applyAction(state: GameState, action: GameAction): GameState | GameError`**

This is the core reducer. The processing order matters — read the tests carefully:

1. **Check game over** — if `state.status` is `checkmate` or `stalemate`, return a `GameError` with code `GAME_OVER`

2. **Award turn income** — call `awardTurnIncome(state)` to give the active player +1 gold before processing the action

3. **Validate and apply the action** based on `action.type`:

   **For `'move'` actions:**
   - Get legal moves via `getLegalMoves(state)` (after income is applied)
   - Verify `action.from` has legal moves and `action.to` is among them
   - If illegal, return `GameError` with code `ILLEGAL_MOVE`
   - Apply via `applyMove(state, action.from, action.to, action.promotion)`
   - Note: `applyMove` already handles capture gold and turn flip

   **For `'place'` actions:**
   - Check if the player can afford the piece via `canAffordPiece(state, action.piece)` (after income)
   - Check if the square is valid via `isValidPlacement(state, action.piece, action.square)`
   - If either fails, return `GameError` with appropriate code (`INSUFFICIENT_GOLD` or `INVALID_PLACEMENT`)
   - Deduct gold via `deductPurchaseCost(state, action.piece)`
   - Update the FEN to place the piece on the board (use chessops `parseFen`/`makeFen`)
   - Flip the turn

4. **Record action** — push the action onto `actionHistory`

5. **Update counters** — increment `halfMoveCount`, increment `turnNumber` when both players have moved (i.e., when the new turn is `white`)

6. **Check for game-over** — after the move is applied, check:
   - `isCheckmate(newState)` → set status to `'checkmate'`, winner is the player who just moved
   - `isStalemate(newState)` → set status to `'stalemate'`, winner stays `null`

7. **Return the new state**

### Key Details from the Tests

Study these carefully — they define the contract:

- **Gold income timing**: Income is awarded BEFORE action processing. So a player with 4g who receives +1g = 5g can afford a rook (5g) on that turn.
- **Turn flip for moves**: `applyMove` in `position.ts` already flips the turn. Don't flip it again.
- **Turn flip for placements**: You must flip the turn manually after placement.
- **halfMoveCount**: Starts at 0, increments by 1 after every action (move or place).
- **turnNumber**: Starts at 1. Increments after black moves (i.e., when it becomes white's turn again).
- **actionHistory**: Array of `GameAction` objects. Each applied action is pushed onto it.
- **Game over detection**: Runs on the state AFTER the move. The "active player" at that point is the opponent (turn was already flipped). So `isCheckmate(newState)` checks if the opponent is mated. If true, the winner is the player who just acted.
- **Placement FEN update**: When placing a piece, modify the board via chessops `parseFen`/`makeFen` and set the piece with `board.set(square, { role: piece, color: activePlayer })`.
- **The applyActions helper**: The integration test calls `applyActions(state, actions, applyAction)` — it chains actions sequentially and throws on any error. The 19-action ladder mate sequence must work end-to-end.

### Constraints

- **Pure functions** — no mutations, return new state objects
- **Compose existing modules** — import and call functions from gold.ts, placement.ts, position.ts. Don't duplicate logic.
- **Return `GameError` for invalid actions** — use the `GameError` type from types.ts with appropriate `GameErrorCode`
- **No UI imports** — this is engine code

### Done When

- [ ] `npx vitest run` — all 100 tests pass (72 existing + 28 game tests)
- [ ] `game.ts` exports `createInitialState` and `applyAction`
- [ ] Full 19-action integration test plays to checkmate successfully
- [ ] Gold income, capture rewards, and placement costs are all correct
- [ ] Game-over detection works for both checkmate and stalemate
- [ ] All functions are pure
- [ ] Commit and push
