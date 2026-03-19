import express from 'express';
import helmet from 'helmet';
import { createServer } from 'node:http';
import { randomBytes, createHmac, timingSafeEqual } from 'node:crypto';
import { Server } from 'socket.io';
import { createInitialState, applyAction } from '../engine/index.ts';
import type { GameState, GameError, Color } from '../engine/index.ts';
import type { ClientEvents, ServerEvents, RoomInfo, PlayerInfo, GameResult } from './protocol.ts';
import { validateAction, validateRoomId, validateCreateRoomOpts, validateDisplayName, validatePlayerToken, validatePlayerId } from './validation.ts';
import { createPlayer, getPlayerByToken, getPlayer, updatePlayerStats, recordMatch, getPlayerMatches, getLeaderboard, Timestamp } from './db.ts';
import type { MatchSummary } from './protocol.ts';
import { calculateElo } from './elo.ts';

const app = express();
app.disable('x-powered-by');
app.use(helmet());
const httpServer = createServer(app);

const io = new Server<ClientEvents, ServerEvents>(httpServer, {
  cors: {
    origin: process.env.CLIENT_ORIGIN?.split(',').map(o => o.trim()) ?? 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

// --- Session management ---

interface PlayerSession {
  sessionId: string;
  token: string;
  socketId: string | null;
  roomId: string | null;
  color: Color | null;
  createdAt: number;
  lastSeen: number;
  playerId: string | null;
  displayName: string | null;
  rating: number | null;
}

const sessions = new Map<string, PlayerSession>();

const SERVER_SECRET = randomBytes(32);

const SESSION_IDLE_EXPIRY_MS = 60 * 60 * 1000; // 1 hour (not in a room)
const SESSION_ABSOLUTE_EXPIRY_MS = 4 * 60 * 60 * 1000; // 4 hours

function createSessionToken(sessionId: string): string {
  return createHmac('sha256', SERVER_SECRET).update(sessionId).digest('hex');
}

function verifySessionToken(sessionId: string, token: string): boolean {
  const expected = createHmac('sha256', SERVER_SECRET).update(sessionId).digest('hex');
  try {
    return timingSafeEqual(Buffer.from(token), Buffer.from(expected));
  } catch {
    return false; // different lengths → invalid
  }
}

function createSession(socketId: string): PlayerSession {
  const sessionId = randomBytes(16).toString('hex');
  const token = createSessionToken(sessionId);
  const now = Date.now();
  const session: PlayerSession = {
    sessionId,
    token,
    socketId,
    roomId: null,
    color: null,
    createdAt: now,
    lastSeen: now,
    playerId: null,
    displayName: null,
    rating: null,
  };
  sessions.set(sessionId, session);
  return session;
}

function getSessionBySocketId(socketId: string): PlayerSession | undefined {
  for (const session of sessions.values()) {
    if (session.socketId === socketId) return session;
  }
  return undefined;
}

// --- Room state ---

interface Room {
  id: string;
  white: string | null;   // sessionId (not socket.id)
  black: string | null;   // sessionId (not socket.id)
  state: GameState;
  startingGold: number;
  rated: boolean;
  rematchRequested: Color | null;
  disconnectTimers: Map<Color, ReturnType<typeof setTimeout>>;
  createdAt: number;
  matchRecorded: boolean;
}

const rooms = new Map<string, Room>();

const MAX_ROOMS = 1000;
const DISCONNECT_GRACE_MS = 30_000;
const ROOM_EXPIRY_MS = 60 * 60 * 1000; // 1 hour
const ROOM_MAX_LIFETIME_MS = 4 * 60 * 60 * 1000; // 4 hours absolute

function generateRoomId(): string {
  return randomBytes(4).toString('hex'); // 8 hex chars
}

function getPlayerColor(room: Room, sessionId: string): Color | null {
  if (room.white === sessionId) return 'white';
  if (room.black === sessionId) return 'black';
  return null;
}

function playerCount(room: Room): number {
  return (room.white ? 1 : 0) + (room.black ? 1 : 0);
}

function roomStatus(room: Room): RoomInfo['status'] {
  if (room.state.status === 'checkmate' || room.state.status === 'stalemate' || room.state.status === 'draw') return 'finished';
  if (!room.white || !room.black) return 'waiting';
  return 'playing';
}

function toRoomInfo(room: Room): RoomInfo {
  const info: RoomInfo = {
    id: room.id,
    players: playerCount(room),
    status: roomStatus(room),
    startingGold: room.startingGold,
    modeName: room.state.modeConfig.name,
    rated: room.rated,
  };
  if (room.white) {
    const s = sessions.get(room.white);
    if (s?.displayName) {
      info.whiteName = s.displayName;
      if (s.rating !== null) info.whiteRating = s.rating;
    }
  }
  if (room.black) {
    const s = sessions.get(room.black);
    if (s?.displayName) {
      info.blackName = s.displayName;
      if (s.rating !== null) info.blackRating = s.rating;
    }
  }
  return info;
}

// --- Rate limiting ---

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

const rateLimits = new Map<string, Map<string, RateLimitBucket>>();

const RATE_LIMITS: Record<string, { maxPerWindow: number; windowMs: number }> = {
  'authenticate': { maxPerWindow: 10, windowMs: 60_000 },
  'register': { maxPerWindow: 5, windowMs: 60_000 },
  'login': { maxPerWindow: 10, windowMs: 60_000 },
  'create-room': { maxPerWindow: 5, windowMs: 60_000 },
  'join-room': { maxPerWindow: 10, windowMs: 60_000 },
  'action': { maxPerWindow: 60, windowMs: 60_000 },
  'request-rematch': { maxPerWindow: 5, windowMs: 60_000 },
  'list-rooms': { maxPerWindow: 10, windowMs: 60_000 },
  'get-profile': { maxPerWindow: 10, windowMs: 60_000 },
  'get-leaderboard': { maxPerWindow: 5, windowMs: 60_000 },
};

function checkRateLimit(socketId: string, event: string): boolean {
  const limit = RATE_LIMITS[event];
  if (!limit) return true;

  if (!rateLimits.has(socketId)) {
    rateLimits.set(socketId, new Map());
  }
  const socketBuckets = rateLimits.get(socketId)!;

  const now = Date.now();
  let bucket = socketBuckets.get(event);

  if (!bucket || now >= bucket.resetAt) {
    bucket = { count: 0, resetAt: now + limit.windowMs };
    socketBuckets.set(event, bucket);
  }

  bucket.count++;
  return bucket.count <= limit.maxPerWindow;
}

// --- Stale room cleanup ---

setInterval(() => {
  const now = Date.now();
  for (const [roomId, room] of rooms) {
    const age = now - room.createdAt;
    if (age > ROOM_MAX_LIFETIME_MS) {
      io.to(roomId).emit('room-closed', 'Room expired');
      rooms.delete(roomId);
      console.log(`Force-expired room ${roomId} (age: ${Math.round(age / 60000)}m)`);
    } else if (age > ROOM_EXPIRY_MS && playerCount(room) === 0) {
      rooms.delete(roomId);
      console.log(`Expired empty room ${roomId}`);
    }
  }

  // Clean up stale sessions
  for (const [sessionId, session] of sessions) {
    const age = now - session.createdAt;
    const idle = now - session.lastSeen;
    // Absolute expiry: 4 hours regardless
    if (age > SESSION_ABSOLUTE_EXPIRY_MS) {
      sessions.delete(sessionId);
      console.log(`Expired session ${sessionId} (absolute age: ${Math.round(age / 60000)}m)`);
    // Idle expiry: 1 hour if not in a room
    } else if (idle > SESSION_IDLE_EXPIRY_MS && !session.roomId) {
      sessions.delete(sessionId);
      console.log(`Expired idle session ${sessionId}`);
    }
  }
}, 60_000);

// --- Socket.IO events ---

io.on('connection', (socket) => {
  console.log(`Connected: ${socket.id}`);

  // --- Authentication ---

  socket.on('authenticate', (sessionId, token, callback) => {
    if (!checkRateLimit(socket.id, 'authenticate')) {
      // Still issue a session even if rate-limited on auth — we don't want
      // to leave the client in limbo. Rate limiting on auth is mostly to
      // prevent brute-force token guessing.
      const session = createSession(socket.id);
      callback({ sessionId: session.sessionId, token: session.token });
      return;
    }

    // Reconnection: client provides existing session credentials
    if (sessionId && token) {
      const existing = sessions.get(sessionId);
      if (existing && verifySessionToken(sessionId, token)) {
        // Valid session — rebind socket
        existing.socketId = socket.id;
        existing.lastSeen = Date.now();

        // If the session was in a room, re-join the Socket.IO room
        // so they receive broadcasts again
        if (existing.roomId) {
          const room = rooms.get(existing.roomId);
          if (room) {
            socket.join(existing.roomId);
            const color = getPlayerColor(room, existing.sessionId);
            if (color) {
              // Clear any disconnect timer for this color
              const timer = room.disconnectTimers.get(color);
              if (timer) {
                clearTimeout(timer);
                room.disconnectTimers.delete(color);
                io.to(existing.roomId).emit('player-reconnected', color);
              }
            }
          } else {
            // Room no longer exists — clear stale reference
            existing.roomId = null;
            existing.color = null;
          }
        }

        console.log(`Session ${sessionId} re-authenticated (socket ${socket.id})`);
        callback({ sessionId: existing.sessionId, token: existing.token });
        return;
      }
      // Invalid token or session not found — fall through to create new session
      console.log(`Invalid session credentials for ${sessionId}, issuing new session`);
    }

    // New session
    const session = createSession(socket.id);
    console.log(`New session ${session.sessionId} for socket ${socket.id}`);
    callback({ sessionId: session.sessionId, token: session.token });
  });

  // --- Helper: require authentication ---

  function requireSession(): PlayerSession | null {
    const session = getSessionBySocketId(socket.id);
    if (!session) {
      console.log(`Unauthenticated event from socket ${socket.id}`);
      return null;
    }
    session.lastSeen = Date.now();
    return session;
  }

  // --- Player identity ---

  function getPlayerInfo(session: PlayerSession): PlayerInfo | null {
    if (!session.playerId || !session.displayName) return null;
    return { playerId: session.playerId, displayName: session.displayName, rating: session.rating ?? 1200 };
  }

  function emitPlayerInfoForRoom(room: Room, roomId: string): void {
    if (room.white) {
      const wSession = sessions.get(room.white);
      if (wSession) {
        const info = getPlayerInfo(wSession);
        if (info) io.to(roomId).emit('player-info', 'white', info);
      }
    }
    if (room.black) {
      const bSession = sessions.get(room.black);
      if (bSession) {
        const info = getPlayerInfo(bSession);
        if (info) io.to(roomId).emit('player-info', 'black', info);
      }
    }
  }

  socket.on('register', async (displayName, callback) => {
    const session = requireSession();
    if (!session) {
      callback({ error: 'Not authenticated' });
      return;
    }

    if (!checkRateLimit(socket.id, 'register')) {
      callback({ error: 'Rate limited' });
      return;
    }

    const validatedName = validateDisplayName(displayName);
    if (!validatedName) {
      callback({ error: 'Invalid display name (2-20 chars, letters/numbers/spaces only)' });
      return;
    }

    try {
      const result = await createPlayer(validatedName);
      session.playerId = result.playerId;
      session.displayName = validatedName;
      session.rating = 1200;
      callback({ playerId: result.playerId, playerToken: result.playerToken, displayName: validatedName });
      console.log(`Registered player "${validatedName}" (${result.playerId}) for session ${session.sessionId}`);
    } catch (err) {
      console.error('Registration error:', err);
      callback({ error: 'Registration failed' });
    }
  });

  socket.on('login', async (playerToken, callback) => {
    const session = requireSession();
    if (!session) {
      callback({ error: 'Not authenticated' });
      return;
    }

    if (!checkRateLimit(socket.id, 'login')) {
      callback({ error: 'Rate limited' });
      return;
    }

    const validatedToken = validatePlayerToken(playerToken);
    if (!validatedToken) {
      callback({ error: 'Invalid token format' });
      return;
    }

    try {
      const result = await getPlayerByToken(validatedToken);
      if (!result) {
        callback({ error: 'Player not found' });
        return;
      }
      session.playerId = result.playerId;
      session.displayName = result.player.displayName;
      session.rating = result.player.rating;
      callback({
        playerId: result.playerId,
        displayName: result.player.displayName,
        rating: result.player.rating,
      });
      console.log(`Login: "${result.player.displayName}" (${result.playerId}) for session ${session.sessionId}`);
    } catch (err) {
      console.error('Login error:', err);
      callback({ error: 'Login failed' });
    }
  });

  // --- Room events ---

  socket.on('create-room', (opts, callback) => {
    const session = requireSession();
    if (!session) {
      callback({ roomId: '', color: 'white', error: 'Not authenticated' });
      return;
    }

    if (!checkRateLimit(socket.id, 'create-room')) {
      callback({ roomId: '', color: 'white', error: 'Rate limited' });
      return;
    }

    const validatedOpts = validateCreateRoomOpts(opts);
    if (opts !== undefined && opts !== null && validatedOpts === null) {
      callback({ roomId: '', color: 'white', error: 'Invalid options' });
      return;
    }

    if (rooms.size >= MAX_ROOMS) {
      callback({ roomId: '', color: 'white', error: 'Server is at capacity' });
      return;
    }
    const roomId = generateRoomId();
    const startingGold = validatedOpts?.startingGold ?? 3;
    const modeConfig = validatedOpts?.modeConfig;
    const room: Room = {
      id: roomId,
      white: session.sessionId,
      black: null,
      state: createInitialState(modeConfig, startingGold),
      startingGold,
      rated: validatedOpts?.rated ?? true,
      rematchRequested: null,
      disconnectTimers: new Map(),
      createdAt: Date.now(),
      matchRecorded: false,
    };
    rooms.set(roomId, room);
    session.roomId = roomId;
    session.color = 'white';
    socket.join(roomId);
    callback({ roomId, color: 'white' });
    console.log(`Room ${roomId} created by session ${session.sessionId}`);
  });

  socket.on('join-room', (roomId, callback) => {
    const session = requireSession();
    if (!session) {
      callback({ error: 'Not authenticated' });
      return;
    }

    if (!checkRateLimit(socket.id, 'join-room')) {
      callback({ error: 'Rate limited' });
      return;
    }

    const validatedRoomId = validateRoomId(roomId);
    if (validatedRoomId === null) {
      callback({ error: 'Invalid room ID' });
      return;
    }

    const room = rooms.get(validatedRoomId);
    if (!room) {
      callback({ error: 'Room not found' });
      return;
    }

    // Check if this session is already in this room (reconnection via authenticate
    // already handles re-joining, but the client may also call join-room after reconnect)
    const existingColor = getPlayerColor(room, session.sessionId);
    if (existingColor) {
      // Already in this room — just re-join the Socket.IO room and return state
      socket.join(validatedRoomId);
      callback({ roomId: validatedRoomId, color: existingColor, state: room.state });
      return;
    }

    // Check if room is full
    if (room.white && room.black) {
      callback({ error: 'Room is full' });
      return;
    }

    const color: Color = room.white ? 'black' : 'white';
    if (color === 'white') room.white = session.sessionId;
    else room.black = session.sessionId;

    session.roomId = validatedRoomId;
    session.color = color;

    // Clear any disconnect timer for this color
    const timer = room.disconnectTimers.get(color);
    if (timer) {
      clearTimeout(timer);
      room.disconnectTimers.delete(color);
      io.to(validatedRoomId).emit('player-reconnected', color);
    } else {
      io.to(validatedRoomId).emit('player-joined', color);
    }

    socket.join(validatedRoomId);
    callback({ roomId: validatedRoomId, color, state: room.state });
    // Emit game-state to all players so they get the correct mode/state
    io.to(validatedRoomId).emit('game-state', room.state);
    // Emit player identity info when both players are in the room
    emitPlayerInfoForRoom(room, validatedRoomId);
    console.log(`Session ${session.sessionId} joined room ${validatedRoomId} as ${color}`);
  });

  async function handleMatchEnd(room: Room, roomId: string): Promise<void> {
    const { state } = room;
    const isTerminal = state.status === 'checkmate' || state.status === 'stalemate' || state.status === 'draw';
    if (!isTerminal || room.matchRecorded) return;

    room.matchRecorded = true;

    const wSession = room.white ? sessions.get(room.white) : null;
    const bSession = room.black ? sessions.get(room.black) : null;
    const bothRegistered = !!(wSession?.playerId && bSession?.playerId);

    if (!room.rated || !bothRegistered) {
      // Casual or anonymous — emit unrated result
      io.to(roomId).emit('game-result', {
        ratingChange: { white: 0, black: 0 },
        newRating: { white: 0, black: 0 },
        rated: false,
      } as GameResult);
      return;
    }

    try {
      const wPlayer = await getPlayer(wSession!.playerId!);
      const bPlayer = await getPlayer(bSession!.playerId!);
      if (!wPlayer || !bPlayer) return;

      // Determine score: 1 = white wins, 0 = black wins, 0.5 = draw
      let scoreWhite = 0.5;
      if (state.winner === 'white') scoreWhite = 1;
      else if (state.winner === 'black') scoreWhite = 0;

      const { newRatingA, newRatingB } = calculateElo(
        wPlayer.rating, bPlayer.rating, scoreWhite,
        wPlayer.gamesPlayed, bPlayer.gamesPlayed,
      );

      const wChange = newRatingA - wPlayer.rating;
      const bChange = newRatingB - bPlayer.rating;

      // Determine result for match record
      const result = state.winner === 'white' ? 'white' : state.winner === 'black' ? 'black' : 'draw';
      const winField = result === 'draw' ? 'draws' : result === 'white' ? 'wins' : 'losses';
      const loseField = result === 'draw' ? 'draws' : result === 'white' ? 'losses' : 'wins';

      const now = Timestamp.now();

      // Update both players and record match in parallel
      await Promise.all([
        updatePlayerStats(wSession!.playerId!, {
          gamesPlayed: wPlayer.gamesPlayed + 1,
          [winField]: (wPlayer[winField] ?? 0) + 1,
          rating: newRatingA,
          lastGameAt: now,
        }),
        updatePlayerStats(bSession!.playerId!, {
          gamesPlayed: bPlayer.gamesPlayed + 1,
          [loseField]: (bPlayer[loseField] ?? 0) + 1,
          rating: newRatingB,
          lastGameAt: now,
        }),
        recordMatch({
          roomId: room.id,
          mode: state.modeConfig.name,
          white: {
            playerId: wSession!.playerId!,
            displayName: wSession!.displayName!,
            ratingBefore: wPlayer.rating,
            ratingAfter: newRatingA,
          },
          black: {
            playerId: bSession!.playerId!,
            displayName: bSession!.displayName!,
            ratingBefore: bPlayer.rating,
            ratingAfter: newRatingB,
          },
          result: result as 'white' | 'black' | 'draw',
          winReason: state.winReason ?? null,
          rated: true,
          turnCount: state.halfMoveCount,
          startedAt: Timestamp.fromMillis(room.createdAt),
          endedAt: now,
        }),
      ]);

      io.to(roomId).emit('game-result', {
        ratingChange: { white: wChange, black: bChange },
        newRating: { white: newRatingA, black: newRatingB },
        rated: true,
      } as GameResult);

      console.log(`Match recorded: ${room.id} — W:${wChange > 0 ? '+' : ''}${wChange} B:${bChange > 0 ? '+' : ''}${bChange}`);
    } catch (err) {
      console.error('Match recording error:', err);
    }
  }

  socket.on('action', (roomId, action) => {
    const session = requireSession();
    if (!session) return;

    if (!checkRateLimit(socket.id, 'action')) {
      socket.emit('action-error', { type: 'error', code: 'INVALID_ACTION', message: 'Rate limited' } as GameError);
      return;
    }

    const validatedRoomId = validateRoomId(roomId);
    if (validatedRoomId === null) return;

    const validatedAction = validateAction(action);
    if (validatedAction === null) {
      socket.emit('action-error', { type: 'error', code: 'INVALID_ACTION', message: 'Invalid action payload' } as GameError);
      return;
    }

    const room = rooms.get(validatedRoomId);
    if (!room) return;

    const color = getPlayerColor(room, session.sessionId);
    if (!color) return;

    // Resign is allowed regardless of whose turn it is
    if (validatedAction.type === 'resign') {
      // Temporarily set turn to the resigning player so applyAction gives the win to opponent
      const resignState = { ...room.state, turn: color };
      const result = applyAction(resignState, validatedAction);
      if ('type' in result && result.type === 'error') {
        socket.emit('action-error', result as GameError);
        return;
      }
      room.state = result as GameState;
      io.to(validatedRoomId).emit('game-state', room.state);
      handleMatchEnd(room, validatedRoomId);
      return;
    }

    if (color !== room.state.turn) {
      socket.emit('action-error', { type: 'error', code: 'NOT_YOUR_TURN', message: 'Not your turn' });
      return;
    }

    try {
      const result = applyAction(room.state, validatedAction);
      if ('type' in result && result.type === 'error') {
        socket.emit('action-error', result as GameError);
        return;
      }

      room.state = result as GameState;
      io.to(validatedRoomId).emit('game-state', room.state);
      handleMatchEnd(room, validatedRoomId);
    } catch (err) {
      console.error(`Action error in room ${validatedRoomId}:`, err);
      socket.emit('action-error', { type: 'error', code: 'INVALID_ACTION', message: 'Server error processing action' } as GameError);
    }
  });

  socket.on('request-rematch', (roomId) => {
    const session = requireSession();
    if (!session) return;

    if (!checkRateLimit(socket.id, 'request-rematch')) return;

    const validatedRoomId = validateRoomId(roomId);
    if (validatedRoomId === null) return;

    const room = rooms.get(validatedRoomId);
    if (!room) return;

    const color = getPlayerColor(room, session.sessionId);
    if (!color) return;

    if (room.rematchRequested && room.rematchRequested !== color) {
      // Both players have requested — start new game
      room.state = createInitialState(room.state.modeConfig, room.startingGold);
      room.rematchRequested = null;
      room.matchRecorded = false;
      io.to(validatedRoomId).emit('rematch-accepted', room.state);
    } else {
      room.rematchRequested = color;
      socket.to(validatedRoomId).emit('rematch-requested', color);
    }
  });

  socket.on('list-rooms', (callback) => {
    // list-rooms does not require authentication — lobby browsing is open
    if (!checkRateLimit(socket.id, 'list-rooms')) {
      callback([]);
      return;
    }

    const waiting: RoomInfo[] = [];
    for (const room of rooms.values()) {
      if (!room.white || !room.black) {
        waiting.push(toRoomInfo(room));
      }
    }
    callback(waiting);
  });

  socket.on('get-profile', async (playerId, callback) => {
    if (!checkRateLimit(socket.id, 'get-profile')) {
      callback({ error: 'Rate limited' });
      return;
    }

    const validatedId = validatePlayerId(playerId);
    if (!validatedId) {
      callback({ error: 'Invalid player ID' });
      return;
    }

    try {
      const player = await getPlayer(validatedId);
      if (!player) {
        callback({ error: 'Player not found' });
        return;
      }

      const matches = await getPlayerMatches(validatedId, 10);
      const recentMatches: MatchSummary[] = matches.map((m, i) => {
        const isWhite = m.white.playerId === validatedId;
        const opponentId = isWhite ? m.black.playerId : m.white.playerId;
        const opponent = isWhite ? m.black.displayName : m.white.displayName;
        const opponentRating = isWhite ? m.black.ratingBefore : m.white.ratingBefore;
        const myBefore = isWhite ? m.white.ratingBefore : m.black.ratingBefore;
        const myAfter = isWhite ? m.white.ratingAfter : m.black.ratingAfter;
        const result = m.result === 'draw' ? 'draw' : ((m.result === 'white') === isWhite ? 'win' : 'loss');
        return {
          matchId: `m${i}`,
          opponentId,
          opponent,
          opponentRating,
          result: result as 'win' | 'loss' | 'draw',
          ratingChange: myAfter - myBefore,
          mode: m.mode,
          date: m.endedAt.toMillis ? new Date(m.endedAt.toMillis()).toISOString() : '',
        };
      });

      callback({
        playerId: validatedId,
        displayName: player.displayName,
        rating: player.rating,
        gamesPlayed: player.gamesPlayed,
        wins: player.wins,
        losses: player.losses,
        draws: player.draws,
        recentMatches,
      });
    } catch (err) {
      console.error('Profile error:', err);
      callback({ error: 'Failed to load profile' });
    }
  });

  socket.on('get-leaderboard', async (callback) => {
    if (!checkRateLimit(socket.id, 'get-leaderboard')) {
      callback([]);
      return;
    }

    try {
      const entries = await getLeaderboard(20);
      callback(entries.map((e, i) => ({ ...e, rank: i + 1 })));
    } catch (err) {
      console.error('Leaderboard error:', err);
      callback([]);
    }
  });

  socket.on('disconnect', () => {
    console.log(`Disconnected: ${socket.id}`);

    // Clean up rate limit state
    rateLimits.delete(socket.id);

    // Find session for this socket
    const session = getSessionBySocketId(socket.id);
    if (session) {
      session.socketId = null;
      session.lastSeen = Date.now();
    }

    // Find rooms this session was in and handle disconnect grace period
    for (const [roomId, room] of rooms) {
      // Look up by sessionId, not socket.id
      const sessionId = session?.sessionId;
      if (!sessionId) continue;

      const color = getPlayerColor(room, sessionId);
      if (!color) continue;

      // NOTE: Do NOT clear the sessionId from the room slot.
      // The session still "owns" that seat. We just mark the socket as gone
      // (already done above by setting session.socketId = null).

      // Notify opponent
      io.to(roomId).emit('player-disconnected', color);

      // Start grace period — if player doesn't reconnect, vacate the seat
      const timer = setTimeout(() => {
        room.disconnectTimers.delete(color);
        // Check if the session is still disconnected (socketId still null)
        const currentSession = sessions.get(sessionId);
        const stillDisconnected = !currentSession || !currentSession.socketId;
        if (stillDisconnected) {
          // Vacate the room slot
          if (color === 'white') room.white = null;
          else room.black = null;

          // Clear session's room reference
          if (currentSession) {
            currentSession.roomId = null;
            currentSession.color = null;
          }

          io.to(roomId).emit('room-closed', 'Opponent disconnected');
          rooms.delete(roomId);
          console.log(`Room ${roomId} closed — ${color} (session ${sessionId}) did not reconnect`);
        }
      }, DISCONNECT_GRACE_MS);

      room.disconnectTimers.set(color, timer);
    }
  });
});

// --- Health check ---

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// --- Start ---

const PORT = parseInt(process.env.PORT ?? '3001', 10);
httpServer.listen(PORT, () => {
  console.log(`Chess Gold server v1.0 listening on port ${PORT}`);
});
