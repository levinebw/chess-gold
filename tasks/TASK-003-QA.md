# Task 003 — QA Engineer

## Promotion + Position Tests (RED phase)

### Objective

Write failing test suites for the next two engine modules: promotion (`test/engine/promotion.test.ts`) and position/move validation (`test/engine/position.test.ts`). These define the expected behavior for pawn promotion with gold cost and for the chessops wrapper that handles legal moves, check detection, and board state. All tests should fail (RED).

This task runs **in parallel** with Lead Dev Task 003 (placement implementation).

### Prerequisites

- Read `CONCEPT-CHESS-GOLD.md` — pawn promotion and en passant sections
- Read `AGENT-QA.md` — promotion and en passant test plans
- Read `ARCHITECTURE.md` section 4.2 — chessops integration strategy
- Run `npx vitest run` first to confirm baseline (21 pass, 25 fail)

### Deliverables

#### 1. Promotion Tests (`test/engine/promotion.test.ts`)

**Suggested exports from `promotion.ts` that your tests should import:**
- `canPromote(state: GameState, square: Square): boolean` — checks if pawn on given square can be promoted (is on last rank + has gold)
- `applyPromotion(state: GameState, square: Square, promoteTo: PurchasableRole): GameState` — promotes the pawn and deducts gold

**Test cases from the spec:**

```typescript
describe('Pawn Promotion', () => {
  describe('promotion eligibility', () => {
    it('allows promotion when pawn reaches the last rank and player has 1+ gold')
    it('rejects promotion when gold is less than 1')
    it('rejects promotion when pawn is not on the last rank')
    it('rejects promotion of a piece that is not a pawn')
  })

  describe('promotion cost', () => {
    it('deducts 1 gold for promotion')
    it('reads promotion cost from config')
    it('allows promotion when gold is exactly 1')
  })

  describe('promotion choices', () => {
    it('can promote to a queen')
    it('can promote to a rook')
    it('can promote to a bishop')
    it('can promote to a knight')
    it('cannot promote to a king')
    it('cannot promote to a pawn')
  })

  describe('stuck pawn', () => {
    it('pawn remains on last rank when player cannot afford promotion')
    // A pawn on the 8th rank (for white) with 0 gold stays there
    // until the player has enough gold
  })
})
```

Use FEN strings to set up board states with pawns on the 7th or 8th rank. Examples:
- White pawn on e8 (promoted position): `4k3/8/8/8/8/8/8/4K3 w - - 0 1` with pawn manually on e8 — actually, a pawn can't normally be in FEN on e8 without promotion, so use a FEN like `4k3/4P3/8/8/8/8/8/4K3 w - - 0 1` (pawn on e7 about to promote) or construct the post-move state.

Think carefully about how to represent these states — discuss with the Lead Developer if the FEN approach doesn't cleanly support pre-promotion testing.

#### 2. Position/Move Tests (`test/engine/position.test.ts`)

**Suggested exports from `position.ts` that your tests should import:**
- `getLegalMoves(state: GameState): Map<Square, Square[]>` — returns legal moves for the active player (maps from-square to list of to-squares)
- `isInCheck(state: GameState): boolean` — is the active player's king in check?
- `isCheckmate(state: GameState): boolean` — is the active player checkmated?
- `isStalemate(state: GameState): boolean` — is the active player stalemated?
- `applyMove(state: GameState, from: Square, to: Square, promotion?: Role): GameState` — applies a move and returns new state with updated FEN

**Test cases:**

```typescript
describe('Position / Move Validation', () => {
  describe('legal moves', () => {
    it('returns legal moves for the active player')
    it('king can move to adjacent unattacked squares')
    it('returns empty moves for pieces with no legal moves')
  })

  describe('check detection', () => {
    it('detects when the king is in check')
    it('returns false when the king is not in check')
  })

  describe('checkmate detection', () => {
    it('detects checkmate')
    it('does not report checkmate when escape is possible')
  })

  describe('stalemate detection', () => {
    it('detects stalemate (no legal moves, not in check)')
  })

  describe('move application', () => {
    it('updates FEN after a legal move')
    it('switches the active turn after a move')
  })

  describe('en passant', () => {
    it('en passant works normally for pawns that advance two squares')
    it('en passant capture awards 0.5 gold')
    // For the gold award test, you may need to call both applyMove and
    // awardCaptureReward, or the move application may handle gold internally.
    // Define the interface based on what makes sense — the developer implements it.
  })
})
```

Use realistic FEN positions. Examples:
- Checkmate: `4k3/8/8/8/8/5q2/8/7K b - - 0 1` (not quite — construct a real checkmate position)
- Stalemate: `k7/8/1K6/8/8/8/8/8 b - - 0 1` (black king trapped with no legal moves)
- En passant: use FEN with en passant square set (6th field of FEN)

### Done When

**Status: COMPLETE**

- [x] `test/engine/promotion.test.ts` contains 10+ tests covering all promotion rules
- [x] `test/engine/position.test.ts` contains 10+ tests covering moves, check, checkmate, stalemate, en passant
- [x] Tests import from the correct source modules with clear function signatures
- [x] FEN positions are valid and represent the intended board states
- [x] `npx vitest run` discovers all new tests
- [x] All new tests fail (RED phase)
- [x] No import or syntax errors
- [x] Commit and push

### Notes

- Constructing valid FEN strings for edge cases (checkmate, stalemate, en passant) requires care. Verify your FENs by thinking through the board. Use the chessops square mapping: a1=0, row 1 = squares 0-7.
- For en passant + gold tests, you're defining the interface boundary — should `applyMove` handle gold automatically, or should it be a separate step? Define what makes sense and the developer will implement it. Document your assumption in a test comment.
- Do not write implementation code.
