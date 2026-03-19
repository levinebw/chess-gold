# TASK-039: Firestore Setup & Player Data Layer

**Role:** Backend Developer
**Phase:** 8B — Persistent Player Identity
**Status:** COMPLETE
**Priority:** High (foundational)
**Dependencies:** None

## Context

Chess Gold currently has no database — all state is ephemeral in-memory. This task introduces Firestore as the persistence layer with typed CRUD functions for players and matches. Cloud Run provides default credentials automatically.

## Scope

Create a `src/server/db.ts` module that initializes the Firestore client and exports typed CRUD functions for the `players` and `matches` collections.

## Deliverables

### 1. Add Firestore dependency
- [ ] Add `@google-cloud/firestore` to `dependencies` in `package.json`

### 2. Create `src/server/db.ts`
- [ ] Initialize Firestore client (respects `FIRESTORE_PROJECT_ID` env var, falls back to `GOOGLE_CLOUD_PROJECT`)
- [ ] Define `PlayerDoc` interface:
  ```typescript
  {
    displayName: string;
    playerToken: string;      // SHA-256 hash of raw token
    createdAt: Timestamp;
    gamesPlayed: number;
    wins: number;
    losses: number;
    draws: number;
    rating: number;           // Default 1200
    ratingDeviation: number;  // Default 350
    lastGameAt: Timestamp | null;
  }
  ```
- [ ] Define `MatchDoc` interface:
  ```typescript
  {
    roomId: string;
    mode: string;
    white: { playerId: string; displayName: string; ratingBefore: number; ratingAfter: number };
    black: { playerId: string; displayName: string; ratingBefore: number; ratingAfter: number };
    result: 'white' | 'black' | 'draw';
    winReason: string | null;
    rated: boolean;
    turnCount: number;
    startedAt: Timestamp;
    endedAt: Timestamp;
  }
  ```
- [ ] Export functions:
  - `createPlayer(displayName): Promise<{ playerId, playerToken }>`
  - `getPlayer(playerId): Promise<PlayerDoc | null>`
  - `getPlayerByToken(rawToken): Promise<{ playerId, player } | null>` (hashes token, queries)
  - `updatePlayerStats(playerId, updates): Promise<void>`
  - `recordMatch(matchData): Promise<string>` (returns matchId)
  - `getPlayerMatches(playerId, limit): Promise<MatchDoc[]>`
  - `getLeaderboard(limit): Promise<Array<{ playerId, displayName, rating, gamesPlayed, wins }>>`
- [ ] Player tokens: generate `randomBytes(32).toString('hex')`, store SHA-256 hash in Firestore, return raw token to caller once
- [ ] Default rating: 1200

### 3. Create `test/server/db.test.ts`
- [ ] Unit tests for all CRUD operations
- [ ] Verify token hashing (raw token ≠ stored value)
- [ ] Test leaderboard ordering (descending by rating)
- [ ] Test getPlayerByToken with valid and invalid tokens

## Files

**Create:**
- `src/server/db.ts`
- `test/server/db.test.ts`

**Modify:**
- `package.json` (add `@google-cloud/firestore`)

## Acceptance Criteria

- [ ] `npm run server:check` passes with new module
- [ ] Unit tests pass for all CRUD functions
- [ ] `PlayerDoc` and `MatchDoc` interfaces are exported
- [ ] Player tokens stored hashed (SHA-256), never in plaintext
- [ ] `getLeaderboard` returns players sorted by rating descending
- [ ] No import of Firestore anywhere in `src/engine/` or `src/ui/` (server-only)
- [ ] `npx vitest run` — all existing tests pass
