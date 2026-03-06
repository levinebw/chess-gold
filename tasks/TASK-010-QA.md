# Task 010 — QA Engineer

## Test Pawn Promotion Flow

### Objective

The promotion UI was added (Board.tsx intercepts pawn-to-last-rank moves, shows a PromotionDialog, dispatches with `promotion` field). The engine (`game.ts`) now deducts promotion cost (1g) when processing a move with `action.promotion`. These code paths have **no test coverage**. Write tests to cover them.

### Prerequisites

- Promotion UI is implemented and manually verified working in Chrome
- All 123 existing tests pass

### Deliverables

#### 1. Engine Tests — Promotion via `applyAction`

Add tests to `test/engine/game.test.ts` (or a new `test/engine/promotion-flow.test.ts` if preferred) covering:

1. **Promotion deducts gold** — Move a pawn to rank 8 with `promotion: 'queen'`. Verify 1g deducted from the acting player.
2. **Promotion produces correct piece** — For each of queen, rook, bishop, knight: verify the resulting FEN contains the promoted piece.
3. **Promotion rejected when insufficient gold** — Set up a state where player has 0g (after income is awarded, they'd have 1g — so set gold to -1 + goldPerTurn to test the edge). Actually: income is awarded first (1g), so player needs gold < 0 after income to fail. With `promotionCost: 1` and `goldPerTurn: 1`, a player with 0g starting gold gets 1g income = exactly enough. To test rejection, set gold to -0.5 (so after +1 income = 0.5g < 1g cost). Verify `INSUFFICIENT_GOLD` error returned.
4. **Promotion cost reads from config** — Verify `CHESS_GOLD_CONFIG.promotionCost` is used (not hardcoded).
5. **Non-promotion moves unaffected** — A normal king move does NOT deduct promotion cost.

**Test setup hint:** Use FENs with a pawn on rank 7 (white) or rank 2 (black) ready to advance. Example for white:
- `4k3/4P3/8/8/8/8/8/4K3 w - - 0 1` — white pawn on e7, can move to e8
- The legal move is e7→e8 (square 52→60) with `promotion: 'queen'`

#### 2. E2E Tests — Promotion Dialog (if Playwright is set up)

If Playwright E2E tests exist (`test/e2e/`), add a test:

1. Set up a position with a pawn one square from promotion
2. Move the pawn to the last rank
3. Verify the promotion dialog appears (`.promotion-overlay` visible)
4. Click the queen button
5. Verify the promoted piece appears on the board
6. Verify gold was deducted

If E2E test infrastructure makes this too complex, skip and document why.

### Constraints

- Do not change engine or UI code — tests only
- All existing tests must still pass

### Done When

**Status: COMPLETE**

- [x] Engine tests cover promotion gold deduction
- [x] Engine tests cover promotion rejection on insufficient gold
- [x] Engine tests verify correct piece in FEN for all 4 promotion choices
- [x] All tests pass (`npx vitest run`)
- [x] Commit and push
