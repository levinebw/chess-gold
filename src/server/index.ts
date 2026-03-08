import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { createInitialState, applyAction } from '../engine/index.ts';
import type { GameState, GameError, Color } from '../engine/index.ts';
import type { ClientEvents, ServerEvents, RoomInfo } from './protocol.ts';

const app = express();
const httpServer = createServer(app);

const io = new Server<ClientEvents, ServerEvents>(httpServer, {
  cors: {
    origin: process.env.CLIENT_ORIGIN?.split(',') ?? 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

// --- Room state ---

interface Room {
  id: string;
  white: string | null;
  black: string | null;
  state: GameState;
  startingGold: number;
  rematchRequested: Color | null;
  disconnectTimers: Map<Color, ReturnType<typeof setTimeout>>;
  createdAt: number;
}

const rooms = new Map<string, Room>();

const DISCONNECT_GRACE_MS = 30_000;
const ROOM_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

function generateRoomId(): string {
  return Math.random().toString(36).slice(2, 8);
}

function getPlayerColor(room: Room, socketId: string): Color | null {
  if (room.white === socketId) return 'white';
  if (room.black === socketId) return 'black';
  return null;
}

function playerCount(room: Room): number {
  return (room.white ? 1 : 0) + (room.black ? 1 : 0);
}

function roomStatus(room: Room): RoomInfo['status'] {
  if (room.state.status === 'checkmate' || room.state.status === 'stalemate') return 'finished';
  if (!room.white || !room.black) return 'waiting';
  return 'playing';
}

function toRoomInfo(room: Room): RoomInfo {
  return {
    id: room.id,
    players: playerCount(room),
    status: roomStatus(room),
    startingGold: room.startingGold,
  };
}

// --- Stale room cleanup ---

setInterval(() => {
  const now = Date.now();
  for (const [roomId, room] of rooms) {
    if (now - room.createdAt > ROOM_EXPIRY_MS && playerCount(room) === 0) {
      rooms.delete(roomId);
      console.log(`Expired empty room ${roomId}`);
    }
  }
}, 60_000);

// --- Socket.IO events ---

io.on('connection', (socket) => {
  console.log(`Connected: ${socket.id}`);

  socket.on('create-room', (opts, callback) => {
    const roomId = generateRoomId();
    const startingGold = opts?.startingGold ?? 3;
    const room: Room = {
      id: roomId,
      white: socket.id,
      black: null,
      state: createInitialState(undefined, startingGold),
      startingGold,
      rematchRequested: null,
      disconnectTimers: new Map(),
      createdAt: Date.now(),
    };
    rooms.set(roomId, room);
    socket.join(roomId);
    callback({ roomId, color: 'white' });
    console.log(`Room ${roomId} created by ${socket.id}`);
  });

  socket.on('join-room', (roomId, callback) => {
    const room = rooms.get(roomId);
    if (!room) {
      callback({ error: 'Room not found' });
      return;
    }

    // Check if this is a reconnection (socket replacing a disconnected player)
    // Reconnection is handled by the client sending join-room with the same roomId
    if (room.white && room.black) {
      callback({ error: 'Room is full' });
      return;
    }

    const color: Color = room.white ? 'black' : 'white';
    if (color === 'white') room.white = socket.id;
    else room.black = socket.id;

    // Clear any disconnect timer for this color
    const timer = room.disconnectTimers.get(color);
    if (timer) {
      clearTimeout(timer);
      room.disconnectTimers.delete(color);
      io.to(roomId).emit('player-reconnected', color);
    } else {
      io.to(roomId).emit('player-joined', color);
    }

    socket.join(roomId);
    callback({ roomId, color, state: room.state });
    console.log(`${socket.id} joined room ${roomId} as ${color}`);
  });

  socket.on('action', (roomId, action) => {
    const room = rooms.get(roomId);
    if (!room) return;

    const color = getPlayerColor(room, socket.id);
    if (!color) return;
    if (color !== room.state.turn) {
      socket.emit('action-error', { type: 'error', code: 'NOT_YOUR_TURN', message: 'Not your turn' });
      return;
    }

    try {
      const result = applyAction(room.state, action);
      if ('type' in result && result.type === 'error') {
        socket.emit('action-error', result as GameError);
        return;
      }

      room.state = result as GameState;
      io.to(roomId).emit('game-state', room.state);
    } catch (err) {
      console.error(`Action error in room ${roomId}:`, err);
      socket.emit('action-error', { type: 'error', code: 'INVALID_ACTION', message: 'Server error processing action' } as GameError);
    }
  });

  socket.on('request-rematch', (roomId) => {
    const room = rooms.get(roomId);
    if (!room) return;

    const color = getPlayerColor(room, socket.id);
    if (!color) return;

    if (room.rematchRequested && room.rematchRequested !== color) {
      // Both players have requested — start new game
      room.state = createInitialState(undefined, room.startingGold);
      room.rematchRequested = null;
      io.to(roomId).emit('rematch-accepted', room.state);
    } else {
      room.rematchRequested = color;
      socket.to(roomId).emit('rematch-requested', color);
    }
  });

  socket.on('list-rooms', (callback) => {
    const waiting: RoomInfo[] = [];
    for (const room of rooms.values()) {
      if (!room.white || !room.black) {
        waiting.push(toRoomInfo(room));
      }
    }
    callback(waiting);
  });

  socket.on('disconnect', () => {
    console.log(`Disconnected: ${socket.id}`);

    for (const [roomId, room] of rooms) {
      const color = getPlayerColor(room, socket.id);
      if (!color) continue;

      // Clear the socket reference but keep the room alive for reconnection
      if (color === 'white') room.white = null;
      else room.black = null;

      // Notify opponent
      io.to(roomId).emit('player-disconnected', color);

      // Start grace period — if player doesn't reconnect, close the room
      const timer = setTimeout(() => {
        room.disconnectTimers.delete(color);
        // If still disconnected, close the room
        if ((color === 'white' && !room.white) || (color === 'black' && !room.black)) {
          io.to(roomId).emit('room-closed', 'Opponent disconnected');
          rooms.delete(roomId);
          console.log(`Room ${roomId} closed — ${color} did not reconnect`);
        }
      }, DISCONNECT_GRACE_MS);

      room.disconnectTimers.set(color, timer);
    }
  });
});

// --- Health check ---

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', rooms: rooms.size });
});

// --- Start ---

const PORT = parseInt(process.env.PORT ?? '3001', 10);
httpServer.listen(PORT, () => {
  console.log(`Chess Gold server v1.0 listening on port ${PORT}`);
});
