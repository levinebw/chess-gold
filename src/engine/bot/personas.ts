import type { BotPersona } from './types.ts';

/**
 * Lizzie -- A friendly pup who loves a good game!
 * Balanced, beginner-friendly. Makes occasional suboptimal moves.
 * Prefers pawns and knights over heavy pieces.
 */
export const LIZZIE: BotPersona = {
  id: 'lizzie',
  name: 'Lizzie',
  description: 'A friendly pup who loves a good game!',
  avatar: '\u{1F415}', // dog
  aggression: 0.4,
  greed: 0.4,
  riskTolerance: 0.3,
  piecePriority: { pawn: 3, knight: 2, bishop: 2, rook: 1, queen: 1 },
  searchDepth: 1,
  randomness: 0.25,
};

/**
 * Maxi -- Small but fierce! Plays to win.
 * Aggressive, competitive, harder to beat.
 * Prefers knights, queens, and rooks. Spends gold freely.
 */
export const MAXI: BotPersona = {
  id: 'maxi',
  name: 'Maxi',
  description: 'Small but fierce! Plays to win.',
  avatar: '\u{1F43A}', // wolf
  aggression: 0.85,
  greed: 0.2,
  riskTolerance: 0.8,
  piecePriority: { pawn: 1, knight: 3, bishop: 1, rook: 2, queen: 3 },
  searchDepth: 2,
  randomness: 0.1,
};

/**
 * Mona -- The best girl. Very difficult to beat.
 * Deep search, minimal randomness, strong positional play.
 * Values queens and rooks highly. Plays sharp, accurate chess.
 */
export const MONA: BotPersona = {
  id: 'mona',
  name: 'Mona',
  description: 'The best girl. Very difficult to beat.',
  avatar: '\u{1F436}', // dog face
  aggression: 0.7,
  greed: 0.3,
  riskTolerance: 0.6,
  piecePriority: { pawn: 2, knight: 2, bishop: 3, rook: 3, queen: 3 },
  searchDepth: 3,
  randomness: 0.03,
};

/** All available bot personas. */
export const BOT_PERSONAS: BotPersona[] = [LIZZIE, MAXI, MONA];
