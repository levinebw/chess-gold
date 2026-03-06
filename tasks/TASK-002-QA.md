# Task 002 — QA Engineer

## Placement Validation Tests (RED phase)

### Objective

Write the failing test suite for the placement module (`test/engine/placement.test.ts`). These tests define the expected behavior for piece placement — where pieces can go, pawn restrictions, and placement-as-check-defense. All tests should fail (RED) since `placement.ts` has no implementation yet.

This task runs **in parallel** with Lead Dev Task 002 (gold implementation). You work on `test/engine/placement.test.ts` while the developer works on `src/engine/gold.ts`. No file conflicts.

### Prerequisites

- Read `CONCEPT-CHESS-GOLD.md` — placement rules section
- Read `ARCHITECTURE.md` section 3.2 — placement config values
- Read `AGENT-QA.md` — placement test plan
- Run `npx vitest run` first — confirm gold tests still fail as expected (baseline check)

### Deliverables

#### Placement Tests (`test/engine/placement.test.ts`)

Write tests for every placement rule in the spec. Import from `src/engine/placement.ts` (the empty placeholder). Define the expected function signatures by how you call them in tests.

**Suggested exports from `placement.ts` that your tests should import:**
- `getValidPlacementSquares(state: GameState, piece: PurchasableRole): Square[]` — returns list of legal placement squares for a given piece
- `isValidPlacement(state: GameState, piece: PurchasableRole, square: Square): boolean` — checks if a specific placement is legal
- `placementResolvesCheck(state: GameState, piece: PurchasableRole, square: Square): boolean` — checks if placing this piece on this square resolves check

**Placement zone rules:**
```typescript
describe('placement zones', () => {
  it('allows white to place pieces on rows 1-3')
  it('allows black to place pieces on rows 6-8')
  it('rejects placement on rows 4-5 (mid-board) for white')
  it('rejects placement on rows 4-5 (mid-board) for black')
  it('rejects placement on opponents side of the board')
  it('rejects placement on an occupied square')
})
```

**Pawn placement restrictions:**
```typescript
describe('pawn placement', () => {
  it('rejects pawn placement on back rank for white (row 1)')
  it('rejects pawn placement on back rank for black (row 8)')
  it('allows pawn placement on row 2 for white')
  it('allows pawn placement on row 3 for white')
  it('allows pawn placement on row 7 for black')
  it('allows pawn placement on row 6 for black')
})
```

**Non-pawn pieces:**
```typescript
describe('non-pawn placement', () => {
  it('allows bishop placement on back rank (row 1) for white')
  it('allows knight placement on row 1 for white')
  it('allows rook placement on row 1 for white')
  it('allows queen placement on row 1 for white')
})
```

**Placement and check:**
```typescript
describe('placement and check', () => {
  it('allows placement that blocks check')
  it('rejects placement that does not resolve check')
  it('allows placement when not in check (normal placement)')
})
```

For check-related tests, you'll need to set up board states where the king is in check. Use `createGameState()` with a custom FEN that puts the king in check. Example FENs:

- White king in check from black rook: `4k3/8/8/8/8/8/8/r3K3 w - - 0 1`
- White can block with placement on the a-file between rook and king

**Placement uses the turn:**
```typescript
describe('turn usage', () => {
  it('placement consumes the players turn')
  it('rejects placement when it is not the players turn')
})
```

### Test Helpers

If you need new helper functions (e.g., `createBoardWithPieces()`), add them to `test/helpers/`. Keep them generic and reusable.

Consider adding to `test/helpers/gameState.ts`:
- `createCheckState(color: Color): GameState` — creates a state where the specified player is in check (useful for check-related placement tests)

### Done When

**Status: COMPLETE**

- [x] `test/engine/placement.test.ts` contains 15+ tests covering all placement rules
- [x] Tests import from `src/engine/placement.ts` with clear function signatures
- [x] Check-related tests use realistic FEN positions
- [x] `npx vitest run` discovers all new tests
- [x] All new placement tests fail (RED phase — no implementation exists)
- [x] No import errors or syntax errors
- [x] Commit and push

### Notes

- Use `createGameState()` for every test — override `fen` and `turn` as needed for board setup
- Test both white and black perspectives where the rules are asymmetric (different row numbers)
- For check-related tests, verify your FEN strings are valid by thinking through the board position
- The function signatures you define in your test imports become the contract the developer must implement — choose them carefully
- Do not write implementation code
