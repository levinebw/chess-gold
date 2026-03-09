import { parseFen } from 'chessops/fen';
import type { Color } from 'chessops';
import type { GameState, PurchasableRole, Square } from '../types.ts';
import { CHESS_GOLD_CONFIG } from '../config.ts';
import { getValidPlacementSquares } from '../placement.ts';
import type { BotPersona, SpendingDecision } from './types.ts';

/** All purchasable piece types. */
const PURCHASABLE_PIECES: PurchasableRole[] = ['pawn', 'knight', 'bishop', 'rook', 'queen'];

/**
 * Score a placement square based on how useful it is.
 * Central squares and squares near the opponent are preferred for aggressive
 * personas; defensive placements near the king for defensive ones.
 */
function scorePlacementSquare(
  _state: GameState,
  square: Square,
  piece: PurchasableRole,
  color: Color,
  persona: BotPersona,
): number {
  const rank = Math.floor(square / 8);
  const file = square % 8;
  let score = 0;

  // Centrality bonus
  const centerDist = Math.abs(3.5 - file) + Math.abs(3.5 - rank);
  score += (7 - centerDist) * 0.1;

  // Aggressive personas prefer forward placements
  if (color === 'white') {
    score += rank * persona.aggression * 0.15;
  } else {
    score += (7 - rank) * persona.aggression * 0.15;
  }

  // Knights and bishops prefer center; rooks prefer open files
  if (piece === 'knight' || piece === 'bishop') {
    if (centerDist <= 2) score += 0.3;
  }

  // Pawns: prefer central files
  if (piece === 'pawn') {
    const fileCenterDist = Math.abs(3.5 - file);
    score += (3.5 - fileCenterDist) * 0.2;
  }

  return score;
}

/**
 * Find the best square for placing a given piece type.
 */
function findBestPlacementSquare(
  state: GameState,
  piece: PurchasableRole,
  color: Color,
  persona: BotPersona,
): Square | null {
  const squares = getValidPlacementSquares(state, piece);
  if (squares.length === 0) return null;

  let bestSquare = squares[0];
  let bestScore = -Infinity;

  for (const sq of squares) {
    const score = scorePlacementSquare(state, sq, piece, color, persona);
    if (score > bestScore) {
      bestScore = score;
      bestSquare = sq;
    }
  }

  return bestSquare;
}

/**
 * Count how many non-king pieces a color has on the board.
 */
function countPieces(state: GameState, color: Color): number {
  const setup = parseFen(state.fen);
  if (setup.isErr) return 0;

  const board = setup.value.board;
  const pieces = color === 'white' ? board.white : board.black;
  let count = 0;

  for (const sq of pieces) {
    const piece = board.get(sq);
    if (piece && piece.role !== 'king') count++;
  }

  return count;
}

/**
 * Decide whether the bot should buy a piece or save gold this turn.
 *
 * Decision factors:
 * - persona.greed: high greed = prefer saving
 * - piece count: fewer pieces = more incentive to buy
 * - gold available (after income will be awarded by applyAction)
 * - piece priority: which piece the persona values most
 *
 * Returns a SpendingDecision with the action, and optionally the piece + square.
 */
export function decideSpending(
  state: GameState,
  persona: BotPersona,
): SpendingDecision {
  // If the mode doesn't use gold economy, never buy
  if (!state.modeConfig.goldEconomy) {
    return { action: 'save' };
  }

  const color = state.turn;
  // Gold available now (income will be added by applyAction before this action executes)
  const goldAfterIncome = state.gold[color] + CHESS_GOLD_CONFIG.goldPerTurn;
  const myPieceCount = countPieces(state, color);

  // Greed threshold: greedy bots need more gold surplus before spending.
  // With greed=0, threshold ~2; with greed=1, threshold ~6.
  const spendingThreshold = 2 + persona.greed * 4;

  // Early game boost: if we have very few pieces, lower the threshold
  const earlyGameBoost = myPieceCount < 3 ? 2 : myPieceCount < 5 ? 1 : 0;
  const effectiveThreshold = Math.max(1, spendingThreshold - earlyGameBoost);

  // Find the best piece to buy based on priority and affordability
  // Sort pieces by priority (descending), then filter by affordability
  const candidates: Array<{ piece: PurchasableRole; priority: number; price: number; square: Square }> = [];

  for (const piece of PURCHASABLE_PIECES) {
    const price = CHESS_GOLD_CONFIG.piecePrices[piece];
    if (goldAfterIncome < price) continue; // can't afford even after income

    const square = findBestPlacementSquare(state, piece, color, persona);
    if (square === null) continue; // no valid placement squares

    const priority = persona.piecePriority[piece];
    candidates.push({ piece, priority, price, square });
  }

  if (candidates.length === 0) {
    return { action: 'save' };
  }

  // Sort by priority descending, then by price ascending (prefer cheaper at equal priority)
  candidates.sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority;
    return a.price - b.price;
  });

  const best = candidates[0];

  // Check if we have enough gold above the threshold to justify spending
  // Gold after buying = goldAfterIncome - price
  const goldAfterBuy = goldAfterIncome - best.price;

  // Always buy if we have very few pieces (need army)
  if (myPieceCount < 2) {
    return { action: 'buy', piece: best.piece, square: best.square };
  }

  // If gold after buying would drop us below a minimum reserve, save instead
  // (unless we have very low piece count)
  if (goldAfterBuy < effectiveThreshold && myPieceCount >= 3) {
    // Maybe buy a cheaper piece instead
    const cheaper = candidates.find(c => goldAfterIncome - c.price >= effectiveThreshold * 0.5);
    if (cheaper) {
      return { action: 'buy', piece: cheaper.piece, square: cheaper.square };
    }
    return { action: 'save' };
  }

  return { action: 'buy', piece: best.piece, square: best.square };
}
