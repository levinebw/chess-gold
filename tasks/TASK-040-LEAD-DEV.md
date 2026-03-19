# TASK-040: Guest Identity & Display Names

**Role:** Lead Developer
**Phase:** 8B — Persistent Player Identity
**Status:** COMPLETE
**Priority:** High
**Dependencies:** TASK-039

## Context

Players currently have no persistent identity — sessions are anonymous and ephemeral. This task wires the Firestore player layer into the session/socket system so players pick a display name on first visit, receive a persistent token in localStorage, and auto-login on return.

## Deliverables

### 1. New protocol events (`src/server/protocol.ts`)
- [ ] Client event: `register(displayName, callback)` → creates Firestore player, returns `{ playerId, playerToken, displayName }`
- [ ] Client event: `login(playerToken, callback)` → looks up player by token, returns player info
- [ ] Server event: `player-info(color, info)` → sent to room when both players' identities are known
- [ ] Add `PlayerInfo` type: `{ playerId: string; displayName: string; rating: number }`

### 2. Server changes (`src/server/index.ts`)
- [ ] Add `playerId` and `displayName` fields to `PlayerSession` interface
- [ ] Add `register` handler: validate display name, call `db.createPlayer()`, link to session
- [ ] Add `login` handler: call `db.getPlayerByToken()`, link to session, return player info
- [ ] On `join-room`: if both players have player IDs, emit `player-info` for both colors
- [ ] Extend `RoomInfo` with optional `whiteName`/`blackName` fields for lobby display
- [ ] Rate limits: `register` 5/min, `login` 10/min

### 3. Validation (`src/server/validation.ts`)
- [ ] `DisplayNameSchema`: 2-20 chars, alphanumeric + spaces, trimmed
- [ ] `PlayerTokenSchema`: 64-char hex string

### 4. Client persistence (`src/ui/utils/playerIdentity.ts` — new)
- [ ] `getStoredPlayerToken(): string | null` — reads `localStorage` key `chess-gold-player-token`
- [ ] `setStoredPlayerToken(token: string)` — writes to localStorage
- [ ] `getStoredDisplayName(): string | null` — reads `chess-gold-display-name`
- [ ] `setStoredDisplayName(name: string)` — writes
- [ ] `clearPlayerIdentity()` — clears both

### 5. Lobby UI (`src/ui/components/Lobby.tsx`)
- [ ] On socket connect + authenticate: check localStorage for player token
  - If found → emit `login`. On success, proceed to lobby. On failure, show register form.
  - If not found → show "Enter your name" input + "Play" button
- [ ] On register success: store token + name in localStorage
- [ ] Show "Playing as: {name}" at top of lobby
- [ ] In room list: show host display name alongside room ID and mode

### 6. Online game UI (`src/ui/components/OnlineGameView.tsx`)
- [ ] Show both players' display names in status bar ("You (Alice) vs Bob")
- [ ] Listen for `player-info` event to populate opponent info

## Files

**Create:**
- `src/ui/utils/playerIdentity.ts`

**Modify:**
- `src/server/index.ts`
- `src/server/protocol.ts`
- `src/server/validation.ts`
- `src/ui/components/Lobby.tsx`
- `src/ui/components/OnlineGameView.tsx`
- `src/ui/hooks/useOnlineGame.ts`

## Acceptance Criteria

- [ ] First-time visitors see "Enter your name" prompt before creating/joining rooms
- [ ] Display name persists across sessions via localStorage token
- [ ] Returning visitors auto-login and skip the name prompt
- [ ] Display names visible in lobby room list next to host rooms
- [ ] Both player names visible during online games
- [ ] Display name validation: 2-20 chars, alphanumeric + spaces only
- [ ] Invalid/expired tokens gracefully fall back to register flow
- [ ] `npx vitest run` — all existing tests pass
- [ ] `npm run server:check` passes
