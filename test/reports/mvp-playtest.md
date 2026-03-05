# MVP Playtest Report

Date: 2026-03-05
Tester: QA Agent

## Test Environment
- App started via `npm run dev`
- Playwright E2E tests run via `npx playwright test`
- Engine unit tests: 123/123 passing
- E2E tests: 7/7 passing

## E2E Smoke Test Results

| Test | Result |
|------|--------|
| Game starts with two kings and correct gold | PASS |
| Player can move a piece | PASS |
| Player can buy and place a pawn | PASS |
| Gold increases with turn income | PASS |
| Shop buttons disabled when unaffordable | PASS |
| Game over dialog not visible at start | PASS |
| State changes after move (gold updates) | PASS |

## Game 1: Quick Checkmate (Engine-Level)
- **Approach:** 19-action sequence from initial state to ladder mate (tested in game.test.ts integration test)
- **Result:** PASS
- **Details:** White saves gold over multiple turns, places two rooks (5g each), delivers ladder mate with Ra6+, Rh7+, Ra8#. Gold tracking correct throughout: income awarded before each action, rook costs deducted, final state shows checkmate with white as winner.
- **Issues found:** None (after QA-BUG-001 and QA-BUG-002 fixes)

## Game 2: Placement-Heavy (Engine-Level)
- **Approach:** Covered by placement.test.ts (25 tests) + edge-cases.test.ts
- **Result:** PASS
- **Details verified:**
  - White places on rows 1-3, Black on rows 6-8
  - Placement on rows 4-5 rejected
  - Placement on opponent's side rejected
  - Placement on occupied squares rejected
  - Pawns can't be placed on back rank
  - Non-pawn pieces can be placed on back rank
  - Placement during check must resolve check
- **Issues found:** None

## Game 3: Edge Cases (Engine-Level)
- **Approach:** Covered by edge-cases.test.ts (18 tests) + gold.test.ts + promotion.test.ts
- **Result:** PASS
- **Details verified:**
  - Gold arithmetic with 0.5 increments: no floating point drift after 7 captures
  - Zero gold: can still move (free action), cannot buy any piece
  - Promotion at exactly 1g: succeeds, leaves 0g
  - Promotion at 0g: rejected (stuck pawn stays)
  - En passant only available immediately after two-square advance
  - Move preserves gold values (no accidental reset)
  - King cannot move into check
- **Issues found:** None

## UI Smoke Tests (E2E via Playwright)
- Board renders with Chessground
- Kings visible on e1/e8
- Click-to-move works (e1 to d1)
- Turn indicator updates after each move
- Gold display updates with turn income
- Shop shows piece prices, buttons disable when unaffordable
- Placement mode activates on shop click, hint text appears
- Pawn placement on valid square succeeds and deducts gold
- Game over dialog not shown during active play

## Bugs Found
None. All previously filed bugs (QA-BUG-001, QA-BUG-002) have been resolved.

## Summary
The MVP is functioning correctly. All 123 engine unit tests pass, 5 UI hook tests pass, and 7 E2E smoke tests pass. The game is playable from start to checkmate with correct gold economy, placement rules, and game-over detection.
