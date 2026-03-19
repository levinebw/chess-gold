# TASK-057: Flashlight Multiplayer — Server-Authoritative Visibility

**Role:** Lead Developer
**Phase:** 11C — Flashlight Multiplayer
**Status:** TODO
**Priority:** High
**Dependencies:** TASK-054, TASK-055, TASK-056

## Context

Fog of war in multiplayer requires the server to be the authority on what each player can see. The client must NOT receive the full game state — it should only receive the squares visible to that player. Otherwise, a savvy player could inspect the WebSocket messages and see the opponent's hidden pieces.

### Prerequisites

- Read Task 054, 055, 056 deliverables
- Read `src/server/index.ts` (Socket.IO server, state broadcasting)
- Read `src/server/protocol.ts` (client-server protocol)
- Read `src/engine/visibility.ts` (visibility calculation from Task 055)

## Deliverables

### 1. Server-side visibility filtering

- [ ] Import `calculateVisibility` on the server
- [ ] Before sending game state to a player, filter the state:
  - Compute `visibleSquares = calculateVisibility(state, playerColor)`
  - Remove/redact pieces on hidden squares from the FEN
  - Remove loot boxes on hidden squares (if applicable)
  - Remove equipment info for hidden squares
  - Remove action history entries that reveal hidden information (opponent placements on hidden squares)
- [ ] Create a `filterStateForPlayer(state: GameState, color: Color): GameState` function in a shared location (importable by server)

### 2. FEN redaction

- [ ] Generate a modified FEN where hidden squares show as empty
- [ ] The client receives a "fog FEN" — it looks like a normal board but with fewer pieces
- [ ] When a hidden piece moves into a visible square, the client sees the piece appear
- [ ] When a visible piece moves into a hidden square, the client sees the piece disappear

### 3. Protocol changes

- [ ] Add `visibility: Square[]` field to the state update sent to clients (so the client knows which squares to fog)
- [ ] Alternative: client computes visibility locally from the filtered state. Since the client only has visible pieces, `calculateVisibility` on the filtered state should produce the correct visible set. Evaluate which approach is simpler.
- [ ] If server sends visibility set: add to `ServerToClientEvents` in `protocol.ts`

### 4. Client-side handling

- [ ] Client receives filtered state → renders with fog overlay (Task 056 already handles this)
- [ ] Client should NOT attempt to compute "true" legal moves from the filtered state for opponent validation — trust the server
- [ ] Reconnection: server sends filtered state snapshot (already the pattern — just ensure fog filtering is applied)

### 5. Spectator mode consideration

- [ ] If spectators exist (future), they see the full board (no fog) — do not apply visibility filtering for spectator connections
- [ ] For now, just add a comment/TODO noting this consideration

### 6. Anti-cheat

- [ ] Verify that the client never receives hidden piece positions in any message (state updates, action confirmations, game-result events)
- [ ] Server-side: move validation uses the full (unfiltered) state — server knows the true board
- [ ] Client-side: moves are sent as actions; server validates against full state and returns filtered result

## Files

**Create:**
- `src/engine/visibility-filter.ts` (or add `filterStateForPlayer` to `visibility.ts`)

**Modify:**
- `src/server/index.ts` (apply visibility filter before state broadcast)
- `src/server/protocol.ts` (optional: add visibility field to state updates)

## Acceptance Criteria

- [ ] Online Flashlight game: each player sees only their visible squares
- [ ] Hidden opponent pieces are NOT in the state received by the client
- [ ] Piece appears when it moves into a visible square
- [ ] Piece disappears when it moves out of visible squares
- [ ] Server validates moves against full state (not filtered state)
- [ ] Reconnection sends correctly filtered state
- [ ] Non-fog-of-war online modes are unaffected (full state broadcast as before)
- [ ] `npm run server:check` passes
- [ ] `npx vitest run` — all existing tests pass
