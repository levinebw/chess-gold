# Task 007 — QA Engineer

## E2E Smoke Tests + Full MVP Playtest

### Objective

The MVP is playable. Your job is to:
1. Implement the Playwright E2E smoke tests from the stubs created in Task 005
2. Perform a thorough manual playtest of the full game
3. File bug reports for any issues found

This task runs **after** Lead Dev completes Task 007 (full UI is wired).

### Prerequisites

- Lead Dev has completed Task 007 (shop, placement, game over all working)
- Playwright is installed and configured (from Task 005)
- `npm run dev` starts the fully playable game
- All engine tests pass

### Deliverables

#### 1. E2E Smoke Tests (`test/e2e/game-flow.spec.ts`)

Implement the stub tests from Task 005. These test the actual browser UI end-to-end.

**Critical test flows:**

```typescript
test('game starts with two kings and correct gold', async ({ page }) => {
  await page.goto('/');
  // Verify board renders
  // Verify gold displays show "3" for both players
  // Verify turn indicator shows "White"
});

test('player can buy and place a pawn', async ({ page }) => {
  await page.goto('/');
  // Click pawn in shop
  // Click a valid square (e.g., a2)
  // Verify pawn appears on the board
  // Verify gold was deducted (3 + 1 income - 1 pawn = 3)
  // Verify turn passed to black
});

test('player can move a piece', async ({ page }) => {
  await page.goto('/');
  // Move white king from e1 to d1 (click-click or drag)
  // Verify board updated
  // Verify turn passed to black
});

test('capture awards gold', async ({ page }) => {
  // This may require a longer setup sequence
  // Place pieces, maneuver into a capture, verify gold change
});

test('game ends on checkmate', async ({ page }) => {
  // Play a scripted sequence to checkmate
  // Verify game over dialog appears
  // Verify winner is displayed
  // Verify "New Game" button works
});

test('illegal placement is rejected', async ({ page }) => {
  await page.goto('/');
  // Try to place outside zone
  // Verify rejection feedback
});
```

**Tips:**
- Use `page.locator()` to find board squares, shop buttons, gold displays
- Chessground renders as SVG/DOM elements — inspect the rendered HTML to find the right selectors
- For Chessground piece moves, you may need to simulate mouse events (mousedown, mousemove, mouseup) rather than simple clicks
- Start the dev server before tests: configure `webServer` in `playwright.config.ts`

#### 2. Manual Playtest Report

Play at least 3 complete games and document findings:

**Game 1: Quick checkmate**
- Both players build up gold, white buys rooks, delivers ladder mate
- Verify all gold transactions were correct throughout

**Game 2: Placement-heavy game**
- Buy and place multiple piece types
- Verify placement zones are correct for both white and black
- Try placing on occupied squares, opponent's side, mid-board — all rejected

**Game 3: Edge cases**
- Start with only king moves for several turns to accumulate gold
- Buy an expensive piece (queen at 8g — need 8 turns of income)
- Capture pieces and verify capture rewards
- Try to buy with insufficient gold
- Reach stalemate if possible (tricky — may need specific setup)

Document results in `test/reports/mvp-playtest.md`:
```
# MVP Playtest Report

## Game 1: [description]
- Result: [pass/fail]
- Issues found: [list or "none"]

## Game 2: ...

## Bugs Found
[Bug reports in standard format from AGENT-QA.md]
```

#### 3. Bug Reports

For any issues found during E2E tests or manual playtest, file bug reports following the format in AGENT-QA.md. Include:
- Steps to reproduce
- Expected vs. actual behavior
- Severity
- Screenshot if relevant (for UI bugs)

### Done When

**Status: COMPLETE**

- [x] E2E smoke tests implemented (6+ tests)
- [x] `npx playwright test` runs and passes (or failures are documented as bugs)
- [x] 3 complete games playtested manually
- [x] Playtest report written in `test/reports/mvp-playtest.md`
- [x] All bugs filed as bug reports
- [x] Commit and push

### Notes

- E2E tests are **smoke tests** — they verify critical paths, not exhaustive rule coverage. The engine unit tests cover rules.
- Chessground DOM structure may require some exploration to find the right selectors. Use the browser DevTools inspector.
- If Playwright is flaky with Chessground drag-and-drop, use click-to-move instead (click source, click destination).
- The manual playtest is as important as the automated tests at this stage. Play the game as a real user would.
