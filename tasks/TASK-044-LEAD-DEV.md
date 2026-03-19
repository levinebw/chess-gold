# TASK-044: Player Profiles & Leaderboard

**Role:** Lead Developer
**Phase:** 8D — Player Profiles
**Status:** TODO
**Priority:** Medium
**Dependencies:** TASK-042, TASK-043

## Context

With persistent identity, match recording, and Elo in place, players need a way to view their stats and see how they rank against others.

## Deliverables

### 1. Server endpoints (`src/server/index.ts`)
- [ ] `get-profile(playerId, callback)` → player stats + last 10 matches
- [ ] `get-leaderboard(callback)` → top 20 players by rating
- [ ] Rate limits: `get-profile` 10/min, `get-leaderboard` 5/min

### 2. Protocol types (`src/server/protocol.ts`)
- [ ] `ProfileResponse`: `{ playerId, displayName, rating, gamesPlayed, wins, losses, draws, recentMatches: MatchSummary[] }`
- [ ] `MatchSummary`: `{ matchId, opponent, opponentRating, result, ratingChange, mode, date }`
- [ ] `LeaderboardEntry`: `{ rank, playerId, displayName, rating, gamesPlayed, wins }`

### 3. Validation (`src/server/validation.ts`)
- [ ] `PlayerIdSchema`: valid Firestore document ID

### 4. Player profile component (`src/ui/components/PlayerProfile.tsx` — new)
- [ ] Display: name, rating, win/loss/draw record, win rate %
- [ ] Recent matches table: opponent, result (W/L/D with color), rating change, mode, date
- [ ] Clickable opponent names → their profile
- [ ] "Back" button to lobby
- [ ] Loading and error states

### 5. Leaderboard component (`src/ui/components/Leaderboard.tsx` — new)
- [ ] Ranked list: #1-20 with name, rating, games played, wins
- [ ] Highlight current player's row if in top 20
- [ ] Clickable names → profile
- [ ] "Back" button to lobby

### 6. Navigation
- [ ] `src/ui/components/Lobby.tsx`: Add "Leaderboard" button. Player name clickable → profile.
- [ ] `src/ui/App.tsx`: Add screen types `{ type: 'profile'; playerId: string }` and `{ type: 'leaderboard' }`. Render corresponding components.

### 7. Styling (`src/styles/main.css`)
- [ ] Profile page layout
- [ ] Leaderboard table
- [ ] Match history rows
- [ ] Mobile-responsive

## Files

**Create:**
- `src/ui/components/PlayerProfile.tsx`
- `src/ui/components/Leaderboard.tsx`

**Modify:**
- `src/server/index.ts`
- `src/server/protocol.ts`
- `src/server/validation.ts`
- `src/ui/App.tsx`
- `src/ui/components/Lobby.tsx`
- `src/styles/main.css`

## Acceptance Criteria

- [ ] Player profile shows accurate stats (games, wins, losses, draws, rating)
- [ ] Recent matches show last 10 games with opponent, result, rating change, mode
- [ ] Leaderboard shows top 20 players by rating
- [ ] Current player highlighted in leaderboard if present
- [ ] Clicking a player name navigates to their profile
- [ ] Loading states shown while fetching data
- [ ] Error states handled gracefully (player not found, network error)
- [ ] Profile and leaderboard are mobile-responsive
- [ ] All existing tests pass
- [ ] `npm run server:check` passes
