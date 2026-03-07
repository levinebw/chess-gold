import type { GameState, GameAction, GameError, Color } from '../engine/index.ts';

// --- Client → Server events ---

export interface ClientEvents {
  'create-room': (opts: CreateRoomOpts, callback: (res: CreateRoomResponse) => void) => void;
  'join-room': (roomId: string, callback: (res: JoinRoomResponse) => void) => void;
  'action': (roomId: string, action: GameAction) => void;
  'request-rematch': (roomId: string) => void;
  'list-rooms': (callback: (rooms: RoomInfo[]) => void) => void;
}

export interface CreateRoomOpts {
  startingGold?: number;
}

export interface CreateRoomResponse {
  roomId: string;
  color: Color;
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
  'rematch-requested': (by: Color) => void;
  'rematch-accepted': (state: GameState) => void;
  'room-closed': (reason: string) => void;
}

// --- Room info for lobby listing ---

export interface RoomInfo {
  id: string;
  players: number;
  status: 'waiting' | 'playing' | 'finished';
  startingGold: number;
}
