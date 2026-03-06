# Task 015 — QA Engineer

## Phase 2 Regression Playtest

### Objective

After Phase 2 polish tasks (011-014) are complete, run a full regression playtest at the deployed URL to verify:
1. All Phase 1 functionality still works
2. New Phase 2 features (rules screen, visual feedback, sounds) work correctly
3. Mobile layout works on a phone-sized viewport

### Deliverables

#### 1. Deployed URL Playtest

Play 2 complete games at https://levinebw.github.io/chess-gold/:
- Game 1: Focus on visual feedback (last move highlights, check glow, gold pulse)
- Game 2: Focus on sound effects and rules screen

#### 2. Mobile Viewport Test

Using Chrome DevTools device toolbar (iPhone SE or similar):
- Verify board scales correctly
- Verify shop is usable below the board
- Verify rules dialog is scrollable
- Verify promotion dialog is usable

#### 3. Regression Test

Run `npx vitest run` and confirm all tests pass. Verify no regressions from Phase 2 changes.

#### 4. Report

Write results to `test/reports/phase2-playtest.md` with the standard format (steps taken, observations, pass/fail per game).

### Done When

**Status: COMPLETE**

- [x] 2 games played at deployed URL
- [x] Mobile viewport tested
- [x] All tests pass
- [x] Report written
- [x] Commit and push
