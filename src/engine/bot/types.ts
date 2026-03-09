import type { PurchasableRole } from '../types.ts';

/**
 * Priority weights for piece purchasing decisions.
 * Higher value = stronger preference to buy that piece type.
 */
export type PiecePriority = Record<PurchasableRole, number>;

/** Signed evaluation score (positive = good for the color being evaluated). */
export type EvaluationScore = number;

/**
 * A bot persona controls how the AI plays: how aggressive it is,
 * how much it hoards gold, and how deeply it searches.
 */
export interface BotPersona {
  id: string;
  name: string;
  description: string;
  avatar: string;

  /** 0 = defensive, 1 = aggressive. Adjusts evaluation weights. */
  aggression: number;

  /** 0 = spends gold freely, 1 = hoards gold. Affects buy threshold. */
  greed: number;

  /** 0 = avoids trades, 1 = seeks trades. Adjusts capture value. */
  riskTolerance: number;

  /** Preference weights for which pieces to buy first. */
  piecePriority: PiecePriority;

  /** Search depth: 1 = easy (greedy), 2-3 = medium (minimax). */
  searchDepth: number;

  /** 0 = deterministic, 0.3 = occasionally picks suboptimal moves. */
  randomness: number;
}

/**
 * Result of the gold-spending strategy evaluation.
 */
export interface SpendingDecision {
  action: 'save' | 'buy';
  piece?: PurchasableRole;
  square?: number;
}
