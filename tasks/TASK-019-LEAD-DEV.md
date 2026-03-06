# Task 019 — Lead Developer

## Multiplayer Client: Lobby UI + Network Integration

### Objective

Add a lobby/menu screen to the frontend where players can create or join online games. Connect the UI to the Socket.IO server for real-time multiplayer play.

### Prerequisites

- Task 018 complete (server is running and tested)

### Deliverables

#### 1. Menu Screen: `src/ui/components/MenuScreen.tsx`

The game starts at a menu instead of immediately loading a local game:

- **Play Local** — Starts a local 2-player game (current behavior)
- **Create Online Game** — Connects to server, creates a room, shows room code
- **Join Online Game** — Input field for room code, joins existing room

#### 2. Waiting Screen

After creating a room, show:
- Room code (large, easy to share/read aloud)
- "Waiting for opponent..." message
- Cancel button (leaves room, returns to menu)

#### 3. Socket.IO Client: `src/ui/hooks/useMultiplayer.ts`

Hook that manages the WebSocket connection:

```typescript
interface UseMultiplayerReturn {
  connected: boolean;
  roomId: string | null;
  playerColor: Color | null;
  opponentConnected: boolean;
  gameState: GameState | null;
  error: string | null;
  createRoom: () => void;
  joinRoom: (roomId: string) => void;
  sendAction: (action: GameAction) => void;
  leaveRoom: () => void;
}
```

**Key behaviors:**
- Auto-reconnect on disconnect (Socket.IO built-in)
- On reconnect, re-join the room and re-sync state
- Only allow actions when it's the player's turn AND they're the correct color
- Disable undo in online mode

#### 4. Integrate with Board

When in multiplayer mode:
- Board is oriented to the player's color (white at bottom for white, black at bottom for black)
- Moves are sent to server instead of dispatched locally
- State updates come from server `state-update` events
- Opponent's moves animate on the board automatically

#### 5. App Routing

Update `App.tsx` to switch between:
- Menu screen (default)
- Local game (current GameProvider setup)
- Online game (multiplayer GameProvider with server state)

Use simple React state for "routing" — no need for a router library.

#### 6. Server URL Configuration

```typescript
const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:8080';
```

Set via environment variable for production (Cloud Run URL).

### Constraints

- Local play must continue to work exactly as before
- No account/login required — anonymous play
- Room codes should be easy to type/read (6 alphanumeric characters, no ambiguous chars like 0/O, 1/l)
- Undo is disabled in online mode

### Done When

- [ ] Menu screen with Local / Create / Join options
- [ ] Can create a room and see the room code
- [ ] Can join a room by entering a code
- [ ] Two players can play a full game online
- [ ] Board orientation matches player color
- [ ] Opponent disconnection is shown
- [ ] Auto-reconnect works
- [ ] Local play still works
- [ ] Undo is disabled in online mode
- [ ] All existing tests pass
- [ ] Commit and push
