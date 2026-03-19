# TASK-042: Elo Rating System

**Role:** Backend Developer
**Phase:** 8C — Elo Rating System
**Status:** TODO
**Priority:** High
**Dependencies:** TASK-039, TASK-040, TASK-041

## Context

With persistent player identity and resign in place, we can now track match results and calculate Elo ratings. Standard Elo formula, server-authoritative, with rated/casual room toggle and match recording in Firestore.

## Deliverables

### 1. Elo calculation module (`src/server/elo.ts` — new)
- [ ] `calculateElo(ratingA, ratingB, scoreA, gamesPlayedA, gamesPlayedB)` → `{ newRatingA, newRatingB }`
- [ ] Standard formula: `E_A = 1 / (1 + 10^((R_B - R_A) / 400))`
- [ ] K-factor: 32 for players with < 30 games, 16 otherwise
- [ ] `scoreA`: 1 for win, 0 for loss, 0.5 for draw
- [ ] Minimum rating floor: 100

### 2. Room rated flag
- [ ] Add `rated: boolean` to `Room` interface (`src/server/index.ts`)
- [ ] Add `rated?: boolean` to `CreateRoomOpts` (`src/server/protocol.ts`)
- [ ] Add to `CreateRoomOptsSchema` (`src/server/validation.ts`)
- [ ] Add to `RoomInfo` (shown in lobby so players know if a room is rated)
- [ ] Default: `true` for rooms where both players are registered

### 3. Match recording on game end (`src/server/index.ts`)
- [ ] After `applyAction` produces a terminal status (`checkmate`, `stalemate`, `draw`):
  - If room is `rated` and both players have `playerId`:
    - Compute Elo changes via `calculateElo`
    - Call `db.updatePlayerStats()` for both players
    - Call `db.recordMatch()` to persist match document
  - Emit `game-result` event to both players with rating deltas

### 4. Protocol additions (`src/server/protocol.ts`)
- [ ] Server event: `game-result(result: GameResult)`
- [ ] `GameResult` type:
  ```typescript
  {
    ratingChange: Record<Color, number>;  // e.g. { white: +12, black: -12 }
    newRating: Record<Color, number>;
    rated: boolean;
  }
  ```

### 5. Tests (`test/server/elo.test.ts`)
- [ ] Equal ratings: verify symmetric K-factor split
- [ ] High vs low rating: verify expected values
- [ ] K=32 for new player vs K=16 for experienced
- [ ] Draw produces smaller changes than win/loss
- [ ] Floor at 100 rating (can't go below)

## Files

**Create:**
- `src/server/elo.ts`
- `test/server/elo.test.ts`

**Modify:**
- `src/server/index.ts`
- `src/server/protocol.ts`
- `src/server/validation.ts`

## Acceptance Criteria

- [ ] Elo calculation correct per standard formula
- [ ] K-factor: 32 for < 30 games, 16 otherwise
- [ ] Rated rooms record matches to Firestore on game end
- [ ] Casual rooms do not affect ratings or record matches
- [ ] `game-result` event sent to both players with rating deltas
- [ ] Rating cannot drop below 100
- [ ] All Elo unit tests pass
- [ ] `npm run server:check` passes
- [ ] `npx vitest run` — all existing tests pass
