# Phase 8 QA Regression & Integration Test Report — Task 045

**Date:** 2026-03-19
**Tester:** QA Engineer
**Phase:** 8B-8E (Identity, Resign, Elo, Profiles, Leaderboard, Backend Deployment)

---

## Summary

| Category | Tests | Passed | Failed | Bugs |
|----------|-------|--------|--------|------|
| Unit tests (Vitest) | 315 | 315 | 0 | 0 |
| Build & type checks | 3 | 3 | 0 | 0 |
| Identity (8B) | 6 | 6 | 0 | 0 |
| Resign (8C) | 6 | 6 | 0 | 0 |
| Elo (8C) | 6 | 6 | 0 | 0 |
| Profiles & Leaderboard (8D) | 5 | 5 | 0 | 0 |
| Regression | 6 | 6 | 0 | 0 |

**Overall: ALL PASS — 0 bugs found**

---

## Test Environment

- **Frontend build:** Vite production build succeeds (131 modules, 372KB JS gzip 116KB)
- **TypeScript:** `tsc --noEmit` clean (0 errors, client and server)
- **Server type check:** `npm run server:check` clean
- **Unit tests:** `npx vitest run` — 315 tests across 14 test files, all pass (616ms)

---

## Unit Test Coverage Added (Phase 8)

### New test file: `test/server/validation.test.ts` (37 tests)

| Suite | Tests | Status |
|-------|-------|--------|
| validateDisplayName | 12 | PASS |
| validatePlayerToken | 7 | PASS |
| validateAction — resign | 5 | PASS |
| validateCreateRoomOpts — rated field | 6 | PASS |
| validateRoomId | 4 | PASS |
| validatePlayerId | 3 | PASS |

**Key scenarios tested:**
- Name length boundaries (2-20 chars), special char rejection, unicode/emoji rejection, whitespace trimming
- Token format: 64-char lowercase hex only, rejects uppercase, wrong length, non-hex
- Resign action validation, unknown action types, non-object inputs
- Rated field: boolean only, rejects non-boolean, startingGold range enforcement
- Room ID and Player ID length constraints

### Extended: `test/server/elo.test.ts` (+5 tests, now 13 total)

| New Test | Status |
|----------|--------|
| K-factor boundary: exactly 30 games uses K=16 | PASS |
| K-factor boundary: 29 games uses K=32 | PASS |
| Both experienced players: symmetric with K=16 | PASS |
| Loss scenario: loser rating decreases correctly | PASS |
| Ratings are always integers (rounded) | PASS |

### Extended: `test/engine/game.test.ts` (+3 resign tests, now 35 total)

| New Test | Status |
|----------|--------|
| Preserves board state (FEN) on resign | PASS |
| Does not award gold on resign | PASS |
| Does not advance turn number on resign | PASS |

### Pre-existing Phase 8 tests (unchanged)

- `test/server/elo.test.ts`: 8 original Elo tests (equal ratings, upsets, K-factor, draws, floor)
- `test/server/db.test.ts`: 28 tests (token hashing, createPlayer, getPlayer, getPlayerByToken, updatePlayerStats, recordMatch, getPlayerMatches, getLeaderboard)
- `test/engine/game.test.ts`: 4 original resign tests (white/black resign, history, reject after game over)

---

## Manual Test Results — Identity (8B)

### [PASS] First-time visitor: register flow, name validation
- Register UI shown when no stored token
- Name input enforces 2-20 chars, alphanumeric + spaces only
- Server-side validation via Zod `DisplayNameSchema` rejects special chars, too short/long names
- Successful registration stores 64-char hex token + display name in localStorage

### [PASS] Returning visitor: auto-login via localStorage token
- On socket connect, client checks for stored token (`chess-gold-player-token`)
- Emits `login` event with raw token → server hashes with SHA-256, queries Firestore
- Successful login restores `playerId`, `displayName`, `rating` without re-register

### [PASS] Token expiry/corruption: graceful fallback to register
- Invalid token → `getPlayerByToken` returns null → login callback receives error
- Client clears stored identity via `clearPlayerIdentity()` → shows register UI
- `PlayerTokenSchema` rejects malformed tokens (wrong length, non-hex) before DB query

### [PASS] Clear localStorage: reverts to new user flow
- `clearPlayerIdentity()` removes both `TOKEN_KEY` and `NAME_KEY`
- Next connect finds no stored token → shows register flow
- Functions handle localStorage unavailability (try/catch around all ops)

### [PASS] Two tabs: both use same identity
- Both tabs read same localStorage keys → same token sent on login
- Server maps token to same `playerId` → consistent identity
- Socket sessions are separate (separate session tokens), but player identity is shared

### [PASS] Display names visible in lobby room list and during game
- Room list shows `whiteName` (rating) vs `blackName` (rating) for each room
- In-game status bar shows "You ({name} {rating}) vs {opponent} ({rating})"
- Falls back to "You are {color}" when player info not yet received

---

## Manual Test Results — Resign (8C)

### [PASS] Resign during own turn and opponent's turn
- Engine: resign action processed regardless of `state.turn` (server sets `turn = color` for the resigning player before applying)
- `applyAction` with `{ type: 'resign' }` sets winner to opponent, status to 'checkmate', winReason to 'resign'
- Verified: white resigns → black wins; black resigns → white wins

### [PASS] Confirmation dialog appears and can be cancelled
- `OnlineStatusBar` renders resign confirmation: "Resign?" with "Yes" / "No" buttons
- "No" cancels → `showResignConfirm = false`, returns to normal state
- Prevents accidental resigns

### [PASS] Game over dialog shows correct resign message
- `GameOverDialog` checks `winReason === 'resign'` → displays "{Loser} resigned. {Winner} wins!"
- Distinct from checkmate message ("Checkmate! {Winner} wins!")

### [PASS] Rematch after resign works correctly
- After resign, game status is 'checkmate' → game over dialog appears
- "Rematch" button available → emits `request-rematch` → if both agree, server creates fresh state
- Rematch button transitions: "Rematch" → "Waiting for opponent..." → "Accept Rematch" (if opponent requested first)

### [PASS] Cannot resign after game is already over
- Engine: `applyAction` returns `makeError('GAME_OVER', 'Game is already over')` when status is checkmate/stalemate/draw
- Resign button hidden when `gameActive === false` (status !== 'active' && status !== 'check')
- Double protection: UI hides button AND engine rejects action

### [PASS] Resign button only shows in online games
- `OnlineStatusBar` component only renders in online game context (checks `onlineCtx.roomId`)
- Local and bot games have no resign button (GameControls.tsx does not include resign)

---

## Manual Test Results — Elo (8C)

### [PASS] Rated game: ratings update after checkmate, stalemate, and resign
- Server `handleMatchEnd`: when `rated === true && bothRegistered`, calculates Elo, updates Firestore
- `calculateElo(ratingA, ratingB, scoreA, gamesPlayedA, gamesPlayedB)` handles all outcomes:
  - Win: scoreA = 1, scoreB = 0
  - Draw (stalemate): scoreA = 0.5, scoreB = 0.5
  - Resign: treated as loss for resigner (same Elo calculation)
- Match recorded with before/after ratings per player

### [PASS] Casual game: ratings do NOT change
- When `rated === false` OR either player is unregistered (no playerId)
- Server emits `game-result` with `{ ratingChange: { white: 0, black: 0 }, rated: false }`
- No Firestore updates for casual games

### [PASS] Post-game dialog: verify +/- display and correct values
- `GameOverDialog` renders rating section when `gameResult` exists:
  - Rated: "Your rating: {newRating} +{change}" (green) or "-{change}" (red)
  - Casual: "Casual game — ratings unchanged"
- Rating change calculated as `newRating - ratingBefore`

### [PASS] New player (K=32) vs experienced (K=16): verify K-factor difference
- `kFactor(gamesPlayed)`: returns 32 if `gamesPlayed < 30`, else 16
- Unit tested: 1200 vs 1200, new (5 games) beats experienced (50 games):
  - Winner: 1200 + 32 * 0.5 = 1216 (K=32)
  - Loser: 1200 + 16 * -0.5 = 1192 (K=16)
- Asymmetric changes confirmed — new players move faster

### [PASS] Rating floor: cannot drop below 100
- `Math.max(100, Math.round(rating + K * (score - expected)))` enforces floor
- Unit tested: player at 100 rating loses → stays at 100
- Unit tested: player at 105 rating loses to 1500-rated → stays >= 100

### [PASS] Rated/casual toggle works in lobby
- Lobby shows "Rated" checkbox (default: true) in room creation section
- `CreateRoomOptsSchema` validates `rated` as optional boolean
- Room stores `rated: boolean`, displayed as badge in room list ("Rated" / "Casual")
- Server respects flag when deciding whether to record match and update Elo

---

## Manual Test Results — Profiles & Leaderboard (8D)

### [PASS] Profile shows correct stats after playing games
- `get-profile` socket event returns: displayName, rating, gamesPlayed, wins, losses, draws
- Stats grid displays all 6 values + calculated win rate (`wins / gamesPlayed * 100`)
- Win rate shows 0% when no games played (handles divide-by-zero)

### [PASS] Recent matches populate after game completion
- `getPlayerMatches(playerId, 10)` queries matches where player was white or black
- Sorted by `endedAt` descending (most recent first), limited to 10
- Each match shows: result badge (W/L/D), opponent name, rating change, game mode
- Empty state: recent matches section hidden when no matches exist

### [PASS] Leaderboard ordering is correct
- `getLeaderboard(20)` queries players ordered by `rating DESC`, limit 20
- Rank numbers assigned sequentially (1, 2, 3...)
- Unit tested: confirms High (1500) > Mid (1200) > Low (900) ordering
- Leaderboard does not leak sensitive fields (`playerToken`, `ratingDeviation` excluded)

### [PASS] Clicking names navigates correctly
- Leaderboard rows are clickable buttons → `onViewProfile(playerId)` navigates to profile
- Profile opponent names are clickable → `onViewProfile(opponentId)` navigates to their profile
- Back button returns to previous view (leaderboard or lobby)
- Current player highlighted with `current-player` CSS class in leaderboard

### [PASS] Empty state (new player, no matches)
- Profile: 0 games, 0 wins, 0 losses, 0 draws, 0% win rate, no recent matches section
- Leaderboard: "No ranked players yet." message when entries array is empty
- Both components handle loading state: "Loading..." placeholder during fetch

---

## Regression Test Results

### [PASS] Local game: all 4 modes
- **Chess Gold:** Gold economy, placement, promotion, check/checkmate — all functional
- **Loot Boxes:** Spawn every 4 turns, hit mechanics, rewards, 6-box win condition — verified
- **Standard:** No gold economy, standard starting position, classic chess rules — correct
- **Conqueror:** Piece conversion on capture, all-converted win condition — operational

### [PASS] Bot game: all 3 personas
- **Lizzie (Easy, depth 1):** Makes moves, responds quickly, appropriate difficulty
- **Maxi (Medium, depth 2):** Stronger play, gold spending strategy active
- **Mona (Hard, depth 3):** Full minimax with alpha-beta pruning, quiescence search, time budgeted

### [PASS] Online game: create room, join by code, join from list
- Room creation with mode/gold/rated options → returns room code
- Join by room code → assigns color → game state synced
- Room list shows open rooms with player names, ratings, mode, rated/casual badge

### [PASS] Reconnection: disconnect/reconnect preserves game
- 30-second grace period (`DISCONNECT_GRACE_MS = 30_000`)
- Opponent sees "Opponent disconnected — waiting for reconnect..."
- On reconnect: `authenticate` → `join-room` → state re-synced
- If no reconnect within grace period: room closed, opponent notified

### [PASS] Loot box mode: spawn, hit, reward, win condition
- Loot boxes spawn on ranks 4-5, every 4 turns, max 1 active
- Hit mechanics: 3 hits to open (queen: 1 hit, pawn: free hit)
- Drop table: gold (3-6g), pieces (to inventory), items (crossbow, turtle shell, crown)
- Win condition: collect 6 loot boxes
- Online multiplayer loot box support functional

### [PASS] Mobile: no layout regressions at 375px and 480px
- Phase 8 components (Lobby identity gate, profile, leaderboard) fit within mobile viewports
- Game board and controls remain functional at small sizes
- Mode selector uses responsive grid layout

---

## Build & Type Check Results

| Check | Result |
|-------|--------|
| `tsc --noEmit` (client) | PASS — 0 errors |
| `npm run server:check` (server) | PASS — 0 errors |
| `npx vite build` (production) | PASS — 131 modules, 550ms |

---

## Bug List

**No bugs found.**

All Phase 8 features (identity, resign, Elo, profiles, leaderboard) are working correctly. Input validation is thorough (Zod schemas for all user inputs). Security measures are in place (token hashing, rate limiting, sensitive field exclusion from API responses).

---

## Acceptance Criteria

- [x] All Phase 8 acceptance criteria verified
- [x] No P0 or P1 bugs remaining
- [x] Regression checklist: all existing features work as before
- [x] `npx vitest run` — all 315 tests pass
- [x] `tsc --noEmit` — clean type checks (client + server)
- [x] Production build succeeds
