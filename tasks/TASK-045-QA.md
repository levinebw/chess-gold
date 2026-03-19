# TASK-045: Phase 8 QA Regression & Integration Test

**Role:** QA Engineer
**Phase:** 8B-8D
**Status:** TODO
**Priority:** High
**Dependencies:** TASK-040, TASK-041, TASK-042, TASK-043, TASK-044

## Context

Full end-to-end regression testing of all Phase 8 features. Verify identity persistence, Elo calculations, match recording, resign flow, profiles, and leaderboard. Ensure no regressions in existing gameplay.

## Test Scenarios

### Identity (8B)
- [ ] First-time visitor: register flow, name validation (too short, too long, special chars)
- [ ] Returning visitor: auto-login via localStorage token
- [ ] Token expiry/corruption: graceful fallback to register
- [ ] Clear localStorage: reverts to new user flow
- [ ] Two tabs: both use same identity
- [ ] Display names visible in lobby room list and during game

### Resign (8C)
- [ ] Resign during own turn and opponent's turn
- [ ] Confirmation dialog appears and can be cancelled
- [ ] Game over dialog shows correct resign message
- [ ] Rematch after resign works correctly
- [ ] Cannot resign after game is already over
- [ ] Resign button only shows in online games

### Elo (8C)
- [ ] Rated game: ratings update after checkmate, stalemate, and resign
- [ ] Casual game: ratings do NOT change
- [ ] Post-game dialog: verify +/- display and correct values
- [ ] New player (K=32) vs experienced (K=16): verify K-factor difference
- [ ] Rating floor: cannot drop below 100
- [ ] Rated/casual toggle works in lobby

### Profiles & Leaderboard (8D)
- [ ] Profile shows correct stats after playing games
- [ ] Recent matches populate after game completion
- [ ] Leaderboard ordering is correct
- [ ] Clicking names navigates correctly
- [ ] Empty state (new player, no matches)

### Regression
- [ ] Local game: all 4 modes (Chess Gold, Loot Boxes, Standard, Conqueror)
- [ ] Bot game: all 3 personas (Lizzie, Maxi, Mona)
- [ ] Online game: create room, join by code, join from list
- [ ] Reconnection: disconnect/reconnect preserves game
- [ ] Loot box mode: spawn, hit, reward, win condition
- [ ] Mobile: no layout regressions at 375px and 480px

## Output

- [ ] `test/reports/phase8-qa-report.md` — test checklist with pass/fail, bug list with severity and repro steps

## Acceptance Criteria

- [ ] All Phase 8 acceptance criteria verified
- [ ] No P0 or P1 bugs remaining
- [ ] Regression checklist: all existing features work as before
- [ ] `npx vitest run` — all tests pass
