# Task 018 — Lead Developer

## Multiplayer Server: Room System + Socket.IO

### Objective

Build the WebSocket game server using Node.js + Express + Socket.IO. The server manages game rooms, runs the authoritative game engine, and relays state to connected clients.

### Prerequisites

- Task 017 complete (shared engine imports work)

### Deliverables

#### 1. Server Entry Point: `src/server/index.ts`

- Express + Socket.IO server
- CORS configured to allow GitHub Pages origin
- Health check endpoint (`GET /health`)

#### 2. Room Manager: `src/server/rooms.ts`

Game room lifecycle:

```typescript
interface GameRoom {
  id: string;                    // 6-character alphanumeric code
  state: GameState;
  players: {
    white: string | null;        // Socket ID
    black: string | null;
  };
  spectators: string[];
  createdAt: number;
  lastActivity: number;
}
```

**Room operations:**
- `createRoom()` — generates a unique room code, initializes game state
- `joinRoom(roomId, socketId)` — assigns player to white or black (first = white, second = black)
- `leaveRoom(roomId, socketId)` — handles disconnection
- `getRoom(roomId)` — retrieve room state
- `cleanupStaleRooms()` — remove rooms inactive for >1 hour

#### 3. Socket.IO Events

**Client → Server:**
| Event | Payload | Description |
|-------|---------|-------------|
| `create-room` | — | Create a new game room |
| `join-room` | `{ roomId }` | Join an existing room |
| `action` | `GameAction` | Submit a move or placement |

**Server → Client:**
| Event | Payload | Description |
|-------|---------|-------------|
| `room-created` | `{ roomId }` | Room code to share |
| `room-joined` | `{ color, state }` | Player's assigned color + initial state |
| `state-update` | `{ state }` | New game state after a valid action |
| `error` | `{ message }` | Action rejected (illegal move, not your turn, etc.) |
| `opponent-connected` | — | Other player joined |
| `opponent-disconnected` | — | Other player disconnected |

#### 4. Server-Authoritative Game Logic

The server runs `applyAction()` on every received action:
1. Verify it's the acting player's turn (match socket ID to assigned color)
2. Call `applyAction(room.state, action)`
3. If valid: update room state, broadcast `state-update` to both players
4. If error: send `error` only to the acting player

**The client NEVER updates game state locally for multiplayer.** It sends actions and waits for the server's `state-update`.

#### 5. Dockerfile

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY dist/server/ ./dist/server/
COPY dist/engine/ ./dist/engine/
EXPOSE 8080
CMD ["node", "dist/server/index.js"]
```

#### 6. Build Script

Add to `package.json`:
```json
{
  "scripts": {
    "build:server": "tsc -p tsconfig.server.json",
    "start:server": "node dist/server/index.js",
    "dev:server": "tsx src/server/index.ts"
  }
}
```

Create `tsconfig.server.json` extending the base config but targeting Node.js (no DOM libs).

### Constraints

- Game state is in-memory only (no database for MVP multiplayer)
- Maximum 100 concurrent rooms (reasonable for alpha)
- Server restarts lose all active games (acceptable for alpha)
- No spectator mode yet (placeholder in room structure)

### Done When

- [ ] Server starts and listens on port 8080
- [ ] Can create a room and get a room code
- [ ] Two clients can join the same room
- [ ] Moves are validated server-side and broadcast to both players
- [ ] Invalid moves return errors only to the acting player
- [ ] Turn enforcement works (can't move when it's not your turn)
- [ ] Disconnection is detected and opponent is notified
- [ ] Health check endpoint responds
- [ ] `npm run dev:server` works locally
- [ ] All existing frontend tests still pass
- [ ] Commit and push
