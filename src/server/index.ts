import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { createInitialState, applyAction } from '../engine/index.ts';
import type { GameState, GameAction, GameError } from '../engine/index.ts';

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173',
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
}

const rooms = new Map<string, Room>();

function generateRoomId(): string {
  return Math.random().toString(36).slice(2, 8);
}

function getPlayerColor(room: Room, socketId: string): 'white' | 'black' | null {
  if (room.white === socketId) return 'white';
  if (room.black === socketId) return 'black';
  return null;
}

// --- Socket.IO events ---

io.on('connection', (socket) => {
  console.log(`Connected: ${socket.id}`);

  socket.on('create-room', (opts: { startingGold?: number }, callback) => {
    const roomId = generateRoomId();
    const startingGold = opts?.startingGold ?? 3;
    const room: Room = {
      id: roomId,
      white: socket.id,
      black: null,
      state: createInitialState(undefined, startingGold),
      startingGold,
    };
    rooms.set(roomId, room);
    socket.join(roomId);
    callback({ roomId, color: 'white' });
    console.log(`Room ${roomId} created by ${socket.id}`);
  });

  socket.on('join-room', (roomId: string, callback) => {
    const room = rooms.get(roomId);
    if (!room) {
      callback({ error: 'Room not found' });
      return;
    }
    if (room.white && room.black) {
      callback({ error: 'Room is full' });
      return;
    }

    const color = room.white ? 'black' : 'white';
    if (color === 'white') room.white = socket.id;
    else room.black = socket.id;

    socket.join(roomId);
    callback({ roomId, color });
    io.to(roomId).emit('game-state', room.state);
    console.log(`${socket.id} joined room ${roomId} as ${color}`);
  });

  socket.on('action', (roomId: string, action: GameAction) => {
    const room = rooms.get(roomId);
    if (!room) return;

    const color = getPlayerColor(room, socket.id);
    if (!color) return;
    if (color !== room.state.turn) {
      socket.emit('action-error', { code: 'NOT_YOUR_TURN', message: 'Not your turn' });
      return;
    }

    const result = applyAction(room.state, action);
    if ('type' in result && result.type === 'error') {
      socket.emit('action-error', result as GameError);
      return;
    }

    room.state = result as GameState;
    io.to(roomId).emit('game-state', room.state);
  });

  socket.on('new-game', (roomId: string) => {
    const room = rooms.get(roomId);
    if (!room) return;
    if (!getPlayerColor(room, socket.id)) return;

    room.state = createInitialState(undefined, room.startingGold);
    io.to(roomId).emit('game-state', room.state);
  });

  socket.on('disconnect', () => {
    console.log(`Disconnected: ${socket.id}`);
    for (const [roomId, room] of rooms) {
      if (room.white === socket.id || room.black === socket.id) {
        io.to(roomId).emit('player-disconnected');
        rooms.delete(roomId);
      }
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
  console.log(`Chess Gold server listening on port ${PORT}`);
});
