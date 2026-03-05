import { parseFen, makeFen } from 'chessops/fen';
import type { GameState, PurchasableRole, Square } from './types.ts';
import { CHESS_GOLD_CONFIG } from './config.ts';

const VALID_PROMOTION_TARGETS: ReadonlySet<string> = new Set(['queen', 'rook', 'bishop', 'knight']);

function lastRank(color: 'white' | 'black'): number {
  return color === 'white' ? 7 : 0;
}

export function canPromote(state: GameState, square: Square): boolean {
  const setup = parseFen(state.fen);
  if (setup.isErr) return false;

  const piece = setup.value.board.get(square);
  if (!piece || piece.role !== 'pawn' || piece.color !== state.turn) return false;

  const rank = Math.floor(square / 8);
  if (rank !== lastRank(state.turn)) return false;

  return state.gold[state.turn] >= CHESS_GOLD_CONFIG.promotionCost;
}

export function applyPromotion(state: GameState, square: Square, promoteTo: PurchasableRole): GameState {
  if (!VALID_PROMOTION_TARGETS.has(promoteTo)) return state;

  const setup = parseFen(state.fen);
  if (setup.isErr) return state;

  const piece = setup.value.board.get(square);
  if (!piece || piece.role !== 'pawn' || piece.color !== state.turn) return state;

  const rank = Math.floor(square / 8);
  if (rank !== lastRank(state.turn)) return state;

  if (state.gold[state.turn] < CHESS_GOLD_CONFIG.promotionCost) return state;

  // Replace the pawn with the promoted piece
  setup.value.board.set(square, { role: promoteTo, color: state.turn });

  const newFen = makeFen(setup.value);
  const newGold = state.gold[state.turn] - CHESS_GOLD_CONFIG.promotionCost;

  return {
    ...state,
    fen: newFen,
    gold: {
      ...state.gold,
      [state.turn]: newGold,
    },
  };
}
