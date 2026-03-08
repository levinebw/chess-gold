// Pluggable win condition checkers

import { parseFen } from 'chessops/fen';
import type { Color, GameState, WinConditionChecker } from './types.ts';

/**
 * Check if all non-king pieces on the board belong to one color.
 * Returns that color (the winner) or null.
 */
export function checkAllConverted(state: GameState): Color | null {
  const setup = parseFen(state.fen);
  if (setup.isErr) return null;

  const board = setup.value.board;

  let hasWhiteNonKing = false;
  let hasBlackNonKing = false;

  for (const square of board.white) {
    const piece = board.get(square);
    if (piece && piece.role !== 'king') {
      hasWhiteNonKing = true;
      break;
    }
  }

  for (const square of board.black) {
    const piece = board.get(square);
    if (piece && piece.role !== 'king') {
      hasBlackNonKing = true;
      break;
    }
  }

  // If there are no non-king pieces at all, no winner
  if (!hasWhiteNonKing && !hasBlackNonKing) return null;

  // If only one color has non-king pieces, that color wins
  if (hasWhiteNonKing && !hasBlackNonKing) return 'white';
  if (hasBlackNonKing && !hasWhiteNonKing) return 'black';

  return null;
}

export const WIN_CONDITION_CHECKERS: Partial<Record<string, WinConditionChecker>> = {
  'all-converted': checkAllConverted,
};
