# TASK-049: Phase 9 Engine Tests + Playtest

**Role:** QA Engineer
**Phase:** 9C — Testing
**Status:** TODO
**Priority:** High
**Dependencies:** TASK-046, TASK-047, TASK-048

## Context

Verify King's Chess and Gold Mine engine logic, UI integration, and cross-mode regression. Both modes reuse significant existing infrastructure (gold economy, piece conversion, win conditions) so regression coverage is critical.

## Test Scenarios

### King's Chess — Placement Throttle

- [ ] Place a piece on turn 1 → succeeds
- [ ] Attempt to place on turn 2 (immediately after) → rejected with throttle error
- [ ] Place on turn 3 (one turn gap) → succeeds
- [ ] Moving a piece is never throttled (any turn)
- [ ] Throttle tracks per-player independently (white places turn 1, black can still place turn 1)
- [ ] `canPlaceThisTurn()` returns correct values at each phase

### King's Chess — Piece Conversion + Gold Economy Combined

- [ ] Capture an enemy pawn: receive 0.5 gold AND pawn switches to your color
- [ ] Capture an enemy queen: receive 4 gold AND queen switches to your color
- [ ] Converted piece appears at attacker's origin square with correct color
- [ ] Converted pieces are movable on subsequent turns
- [ ] All-converted win condition triggers when all opponent pieces (excluding king) are your color
- [ ] Verify king is not converted on capture (king capture = checkmate path)

### King's Chess — Full Game Flow

- [ ] Play a complete game to all-converted victory
- [ ] Verify gold income (+1/turn) works throughout
- [ ] Verify placement zones (rows 1-3) are enforced
- [ ] Verify promotion works with gold cost

### Gold Mine — All-Eliminated Win Condition

- [ ] Capture all opponent pieces including king → winner declared
- [ ] One opponent piece remaining → game continues
- [ ] Both players have pieces → no winner
- [ ] Checkmate also ends the game (dual win condition)

### Gold Mine — Unrestricted Placement

- [ ] Place a piece on row 4, 5, 6, 7 → succeeds (outside normal zone)
- [ ] Place a piece on opponent's back rank → succeeds (non-pawn)
- [ ] Place a pawn on back rank (row 1 or 8) → rejected
- [ ] Place on an occupied square → rejected
- [ ] Place during check → must resolve check (standard rule still applies)

### Gold Mine — Economy

- [ ] Starting gold is effectively unlimited (can buy a queen on turn 1)
- [ ] Multiple queens purchasable in sequence
- [ ] Capture rewards still awarded (even if gold is functionally infinite)

### Regression

- [ ] Chess Gold (mode 1): no changes in behavior
- [ ] Loot Boxes (mode 2): no changes in behavior
- [ ] Standard Chess (mode 9): no changes in behavior
- [ ] Conqueror (mode 4): no changes in behavior
- [ ] Bot play: all existing bot personas work in all modes
- [ ] Online multiplayer: room creation, join, and play for both new modes

### UI

- [ ] Mode selector shows King's Chess and Gold Mine with correct descriptions
- [ ] Rules dialog has correct rules for each mode
- [ ] King's Chess: shop is disabled during throttled turns with message
- [ ] Gold Mine: placement highlights cover full board
- [ ] Mobile: both modes playable at 375px and 480px

## Output

- [ ] `test/engine/kings-chess.test.ts` — placement throttle unit tests
- [ ] `test/engine/gold-mine.test.ts` — all-eliminated + unrestricted placement unit tests
- [ ] `test/reports/phase9-qa-report.md` — full test checklist with pass/fail and bug list

## Acceptance Criteria

- [ ] All unit tests pass
- [ ] All manual test scenarios verified
- [ ] No P0 or P1 bugs remaining
- [ ] Regression: all existing modes work unchanged
- [ ] `npx vitest run` — all tests pass
