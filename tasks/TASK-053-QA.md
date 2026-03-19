# TASK-053: Siege Mode Tests + Playtest

**Role:** QA Engineer
**Phase:** 10C — Testing
**Status:** TODO
**Priority:** High
**Dependencies:** TASK-050, TASK-051, TASK-052

## Context

Siege mode introduces the most complex new engine mechanics since the loot box system. The center pulse, temporary upgrades, and custom move generation all need thorough testing. The upgrade move generation in particular has many edge cases around king safety and piece interactions.

## Test Scenarios

### Center Pulse Timing

- [ ] Pulse fires after exactly 5 half-moves (not full turns)
- [ ] Counter resets to 0 after pulse
- [ ] Pulse fires repeatedly (move 5, 10, 15, ...)
- [ ] Counter does not increment in non-Siege modes
- [ ] Siege state is `null` in non-Siege modes

### Pulse Piece Detection

- [ ] Piece on d4 during pulse → receives upgrade
- [ ] Piece on d5 during pulse → receives upgrade
- [ ] Piece on e4 during pulse → receives upgrade
- [ ] Piece on e5 during pulse → receives upgrade
- [ ] Empty center square during pulse → no upgrade created
- [ ] Multiple pieces on center squares → all receive upgrades
- [ ] Opponent's pieces on center squares → also receive upgrades (both sides benefit)

### Upgrade Expiry

- [ ] Upgrade consumed after upgraded piece moves → entry removed
- [ ] Upgrade NOT consumed when non-upgraded piece moves → persists
- [ ] Upgraded piece captured before moving → entry cleaned up
- [ ] Previous pulse upgrades cleared when new pulse fires
- [ ] Unused upgrade expires at next pulse (not carried indefinitely)

### Pawn Upgrade (King-like Movement)

- [ ] Upgraded pawn can move 1 square forward → succeeds
- [ ] Upgraded pawn can move 1 square backward → succeeds
- [ ] Upgraded pawn can move 1 square sideways → succeeds
- [ ] Upgraded pawn can move 1 square diagonally (all 4 directions) → succeeds
- [ ] Upgraded pawn can capture in any direction (not just forward diagonal)
- [ ] Upgraded pawn move that leaves king in check → rejected
- [ ] After upgrade used, pawn reverts to normal movement

### Knight Upgrade (Double Jump)

- [ ] Upgraded knight makes two consecutive L-moves → valid
- [ ] Upgraded knight captures on first jump → move ends at first jump
- [ ] Upgraded knight captures on second jump → move ends at second jump
- [ ] Upgraded knight cannot land on friendly piece (either jump as final destination)
- [ ] Double jump that leaves king in check → rejected
- [ ] After upgrade used, knight reverts to single L-move

### Slider Upgrade (Pass Through Friendly Piece)

- [ ] Upgraded rook passes through one friendly piece along rank → valid
- [ ] Upgraded rook passes through one friendly piece along file → valid
- [ ] Upgraded rook cannot pass through two friendly pieces on same line → blocked after second
- [ ] Upgraded bishop passes through one friendly piece on diagonal → valid
- [ ] Upgraded queen passes through one friendly piece on any line → valid
- [ ] Slider cannot pass through enemy piece (can capture, but stops) → standard capture behavior
- [ ] Pass-through move that exposes king (removing blocker) → rejected
- [ ] After upgrade used, slider reverts to normal movement (no pass-through)

### Center-Occupied Win Condition

- [ ] White occupies d4, d5, e4, e5 simultaneously → white wins
- [ ] Black occupies all 4 → black wins
- [ ] 3 of 4 center squares occupied by same color → game continues
- [ ] Mixed occupation (2 white, 2 black) → game continues
- [ ] Center occupation win checked alongside checkmate (dual condition)
- [ ] Checkmate still wins even if center not occupied

### Full Game Flow

- [ ] Play a complete Siege game to center-occupied victory
- [ ] Play a complete Siege game to checkmate victory
- [ ] Standard starting position loads correctly
- [ ] No gold economy UI visible (shop, gold display hidden)
- [ ] Pulse visual fires and is visible
- [ ] Upgrade indicators appear and disappear correctly

### Regression

- [ ] Chess Gold (mode 1): no changes
- [ ] Loot Boxes (mode 2): no changes
- [ ] Standard Chess (mode 9): no changes
- [ ] Conqueror (mode 4): no changes
- [ ] King's Chess (mode 5): no changes
- [ ] Gold Mine (mode 3): no changes
- [ ] Bot play: all modes including Siege
- [ ] Online multiplayer: Siege mode playable online

## Output

- [ ] `test/engine/siege.test.ts` — pulse timing, upgrade, move generation, and win condition tests
- [ ] `test/reports/phase10-qa-report.md` — full test checklist with pass/fail and bug list

## Acceptance Criteria

- [ ] All unit tests pass (target 30+ test cases for siege mechanics)
- [ ] All manual test scenarios verified
- [ ] No P0 or P1 bugs remaining
- [ ] Upgrade move generation correct for all piece types
- [ ] King safety enforced for all upgraded moves
- [ ] Regression: all existing modes work unchanged
- [ ] `npx vitest run` — all tests pass
