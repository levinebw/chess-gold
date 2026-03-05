# Task 004 — QA Engineer

## Game Reducer Tests (RED phase)

### Objective

Write the failing test suite for the top-level game reducer (`test/engine/game.test.ts`). This is the module that ties everything together — it receives actions (move, place), validates them, applies them through the lower-level modules (gold, placement, position, promotion), manages turns, awards income, and detects game-over conditions.

This is the last major engine module before the UI phase begins.

This task runs **in parallel** with Lead Dev Task 004 (position + promotion implementation).

### Prerequisites

- Read `CONCEPT-CHESS-GOLD.md` — full game rules
- Read `ARCHITECTURE.md` section 4 — game engine architecture, turn state machine
- Read `AGENT-QA.md` — game flow test plan
- Run `npx vitest run` first to confirm baseline (47 pass, 25 fail)

### Deliverables

#### Game Reducer Tests (`test/engine/game.test.ts`)

**Suggested exports from `game.ts` that your tests should import:**
- `createInitialState(modeConfig?: GameModeConfig): GameState` — creates a fresh game state for the given mode (defaults to Chess Gold)
- `applyAction(state: GameState, action: GameAction): GameState | GameError` — the core reducer: validates and applies any action

**Game initialization:**
```typescript
describe('game initialization', () => {
  it('creates a game with only kings on the board (e1 and e8)')
  it('starts with white to move')
  it('starts with 3 gold for each player')
  it('starts with turn number 1')
  it('starts with status active')
  it('uses Chess Gold mode config by default')
})
```

**Turn management:**
```typescript
describe('turn management', () => {
  it('awards +1 gold to the active player at the start of their turn')
  it('switches turn from white to black after a move action')
  it('switches turn from white to black after a place action')
  it('increments halfMoveCount after each action')
  it('increments turnNumber after both players have moved')
  it('rejects actions when it is not the players turn')
})
```

**Move actions:**
```typescript
describe('move actions', () => {
  it('applies a legal move and updates the board')
  it('rejects an illegal move')
  it('awards capture gold when a piece is captured')
  it('records the action in actionHistory')
})
```

**Place actions:**
```typescript
describe('place actions', () => {
  it('places a piece on a valid square and deducts gold')
  it('rejects placement with insufficient gold')
  it('rejects placement on an invalid square')
  it('rejects placement of a piece outside the placement zone')
  it('updates the FEN after placement')
  it('records the action in actionHistory')
})
```

**Game over detection:**
```typescript
describe('game over detection', () => {
  it('detects checkmate and sets status to checkmate')
  it('detects stalemate and sets status to stalemate')
  it('sets the winner when checkmate occurs')
  it('does not set a winner on stalemate')
  it('rejects actions after game is over')
})
```

**Full game integration:**
```typescript
describe('full game flow', () => {
  it('can play a sequence of moves and placements to reach checkmate')
  // This is a multi-step integration test:
  // 1. White places a piece, gold deducted, turn passes
  // 2. Black places a piece, gold deducted, turn passes
  // 3. Continue with moves and placements
  // 4. Eventually reach checkmate
  // Use a scripted sequence of actions that leads to a known outcome.
})
```

For the full game integration test, you'll need to design a sequence of actions that:
1. Starts from the initial state (kings only, 3 gold each)
2. Uses place actions to add pieces
3. Uses move actions to maneuver
4. Ends in checkmate

This doesn't need to be a sophisticated game — just a valid sequence. Example approach: both players buy and place pieces over several turns (accumulating gold from income), then maneuver to a checkmate position. Scholar's mate won't work since pieces start off-board, but a simple back-rank mate with a rook and queen is achievable.

### Notes on applyAction Interface

`applyAction` is the **single entry point** to the game engine. It should:
1. Check if the game is already over → return error
2. Award turn income (+1 gold) at the start of the action processing
3. Validate the action based on type (move vs. place)
4. Apply the action through the appropriate lower-level module
5. Check for game-over conditions (checkmate, stalemate)
6. Update status and winner if needed
7. Switch the turn
8. Return the new state (or GameError if invalid)

Your tests define this contract. The developer implements to match.

### Test Helpers

You may want to add to `test/helpers/`:
- `applyActions(state: GameState, actions: GameAction[]): GameState` — applies a sequence of actions, useful for the integration test. Throws if any action returns an error.

### Done When

- [ ] `test/engine/game.test.ts` contains 20+ tests covering initialization, turns, moves, placements, game-over, and integration
- [ ] Tests import `createInitialState` and `applyAction` from `src/engine/game.ts`
- [ ] Full game integration test has a valid, playable sequence of actions
- [ ] `npx vitest run` discovers all new tests
- [ ] All new game tests fail (RED phase)
- [ ] No import or syntax errors
- [ ] Commit and push

### Notes

- This is the most important test file — it validates the entire game engine end-to-end
- The integration test is the single most valuable test in the suite. Take time to design a valid action sequence.
- For move actions, you need the chessops `Square` values. Use the `sq()` helper from your other test files.
- Gold income timing matters: the tests should verify that gold is awarded at the right moment (start of turn, before action processing)
- Do not write implementation code
