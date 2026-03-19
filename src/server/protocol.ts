import type { GameState, GameAction, GameError, Color, GameModeConfig } from '../engine/index.ts';

// --- Authentication ---

export interface AuthResponse {
  sessionId: string;
  token: string;
}

// --- Player identity ---

export interface PlayerInfo {
  playerId: string;
  displayName: string;
  rating: number;
}

export interface RegisterResponse {
  playerId?: string;
  playerToken?: string;
  displayName?: string;
  error?: string;
}

export interface LoginResponse {
  playerId?: string;
  displayName?: string;
  rating?: number;
  error?: string;
}

// --- Client → Server events ---

export interface ClientEvents {
  'authenticate': (sessionId: string | null, token: string | null, callback: (res: AuthResponse) => void) => void;
  'register': (displayName: string, callback: (res: RegisterResponse) => void) => void;
  'login': (playerToken: string, callback: (res: LoginResponse) => void) => void;
  'create-room': (opts: CreateRoomOpts, callback: (res: CreateRoomResponse) => void) => void;
  'join-room': (roomId: string, callback: (res: JoinRoomResponse) => void) => void;
  'action': (roomId: string, action: GameAction) => void;
  'request-rematch': (roomId: string) => void;
  'list-rooms': (callback: (rooms: RoomInfo[]) => void) => void;
  'get-profile': (playerId: string, callback: (res: ProfileResponse) => void) => void;
  'get-leaderboard': (callback: (res: LeaderboardEntry[]) => void) => void;
}

export interface CreateRoomOpts {
  startingGold?: number;
  modeConfig?: GameModeConfig;
  rated?: boolean;
}

export interface CreateRoomResponse {
  roomId: string;
  color: Color;
  error?: string;
}

export interface JoinRoomResponse {
  roomId?: string;
  color?: Color;
  state?: GameState;
  error?: string;
}

// --- Server → Client events ---

export interface ServerEvents {
  'game-state': (state: GameState) => void;
  'action-error': (error: GameError) => void;
  'player-joined': (color: Color) => void;
  'player-disconnected': (color: Color) => void;
  'player-reconnected': (color: Color) => void;
  'player-info': (color: Color, info: PlayerInfo) => void;
  'rematch-requested': (by: Color) => void;
  'rematch-accepted': (state: GameState) => void;
  'room-closed': (reason: string) => void;
  'game-result': (result: GameResult) => void;
}

// --- Game result (post-match Elo) ---

export interface GameResult {
  ratingChange: Record<Color, number>;
  newRating: Record<Color, number>;
  rated: boolean;
}

// --- Room info for lobby listing ---

export interface RoomInfo {
  id: string;
  players: number;
  status: 'waiting' | 'playing' | 'finished';
  startingGold: number;
  modeName: string;
  rated: boolean;
  whiteName?: string;
  blackName?: string;
  whiteRating?: number;
  blackRating?: number;
}

// --- Profile & Leaderboard ---

export interface ProfileResponse {
  playerId?: string;
  displayName?: string;
  rating?: number;
  gamesPlayed?: number;
  wins?: number;
  losses?: number;
  draws?: number;
  recentMatches?: MatchSummary[];
  error?: string;
}

export interface MatchSummary {
  matchId: string;
  opponentId: string;
  opponent: string;
  opponentRating: number;
  result: 'win' | 'loss' | 'draw';
  ratingChange: number;
  mode: string;
  date: string;
}

export interface LeaderboardEntry {
  rank: number;
  playerId: string;
  displayName: string;
  rating: number;
  gamesPlayed: number;
  wins: number;
}
