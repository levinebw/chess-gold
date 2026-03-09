import { parseFen } from 'chessops/fen';
import type { Color, Board } from 'chessops';
import type { GameState } from '../types.ts';
import type { BotPersona, EvaluationScore } from './types.ts';

// Standard piece values
const PIECE_VALUES: Record<string, number> = {
  pawn: 1,
  knight: 3,
  bishop: 3,
  rook: 5,
  queen: 9,
  king: 0, // kings aren't counted in material — they're always present
};

// Center squares (d4, e4, d5, e5) = squares 27, 28, 35, 36
const CENTER_SQUARES = new Set([27, 28, 35, 36]);

// Extended center (c3-f3 through c6-f6)
const EXTENDED_CENTER = new Set([
  18, 19, 20, 21, // c3, d3, e3, f3
  26, 27, 28, 29, // c4, d4, e4, f4
  34, 35, 36, 37, // c5, d5, e5, f5
  42, 43, 44, 45, // c6, d6, e6, f6
]);

// King safety: squares adjacent to typical king positions
// In Chess Gold, kings start on e1/e8 so we evaluate nearby cover
function kingRingSafety(
  board: Board,
  color: Color,
): number {
  // Find king square
  const kingSquares = color === 'white' ? board.white.intersect(board.king) : board.black.intersect(board.king);
  let kingSq = -1;
  for (const sq of kingSquares) {
    kingSq = sq;
    break;
  }
  if (kingSq === -1) return 0;

  const kingFile = kingSq % 8;
  const kingRank = Math.floor(kingSq / 8);

  let defenders = 0;
  // Check the 8 squares around the king for friendly pieces
  for (let dr = -1; dr <= 1; dr++) {
    for (let df = -1; df <= 1; df++) {
      if (dr === 0 && df === 0) continue;
      const r = kingRank + dr;
      const f = kingFile + df;
      if (r < 0 || r > 7 || f < 0 || f > 7) continue;
      const sq = r * 8 + f;
      const piece = board.get(sq);
      if (piece && piece.color === color) {
        defenders++;
      }
    }
  }

  return defenders;
}

/**
 * Evaluate a position from the perspective of `color`.
 * Returns a signed score: positive = good for `color`, negative = bad.
 *
 * Factors:
 * 1. Material balance
 * 2. Gold advantage
 * 3. Center control
 * 4. King safety (weighted by 1 - aggression)
 *
 * Persona modifiers adjust the weight of each factor.
 */
export function evaluatePosition(
  state: GameState,
  color: Color,
  persona: BotPersona,
): EvaluationScore {
  const setup = parseFen(state.fen);
  if (setup.isErr) return 0;

  const board = setup.value.board;
  const opponent: Color = color === 'white' ? 'black' : 'white';

  // --- Terminal state detection ---
  if (state.status === 'checkmate') {
    return state.winner === color ? 10000 : -10000;
  }
  if (state.status === 'stalemate' || state.status === 'draw') {
    return 0;
  }

  // --- 1. Material balance ---
  let myMaterial = 0;
  let oppMaterial = 0;

  const mySquares = color === 'white' ? board.white : board.black;
  const oppSquares = color === 'white' ? board.black : board.white;

  for (const sq of mySquares) {
    const piece = board.get(sq);
    if (piece) myMaterial += PIECE_VALUES[piece.role] ?? 0;
  }
  for (const sq of oppSquares) {
    const piece = board.get(sq);
    if (piece) oppMaterial += PIECE_VALUES[piece.role] ?? 0;
  }

  const materialScore = myMaterial - oppMaterial;

  // --- 2. Gold advantage ---
  const goldScore = (state.gold[color] - state.gold[opponent]) * 0.3;

  // --- 3. Center control ---
  let myCenterControl = 0;
  let oppCenterControl = 0;

  for (const sq of mySquares) {
    if (CENTER_SQUARES.has(sq)) myCenterControl += 0.5;
    else if (EXTENDED_CENTER.has(sq)) myCenterControl += 0.2;
  }
  for (const sq of oppSquares) {
    if (CENTER_SQUARES.has(sq)) oppCenterControl += 0.5;
    else if (EXTENDED_CENTER.has(sq)) oppCenterControl += 0.2;
  }

  const centerScore = myCenterControl - oppCenterControl;

  // --- 4. King safety ---
  const myKingSafety = kingRingSafety(board, color);
  const oppKingSafety = kingRingSafety(board, opponent);
  const safetyScore = (myKingSafety - oppKingSafety) * 0.2;

  // --- Persona weighting ---
  // More aggressive personas weigh material and center control higher,
  // less aggressive personas weigh king safety higher.
  const aggressionFactor = persona.aggression;

  const materialWeight = 1.0 + aggressionFactor * 0.3;
  const goldWeight = 1.0;
  const centerWeight = 0.5 + aggressionFactor * 0.5;
  const safetyWeight = 0.5 + (1 - aggressionFactor) * 0.8;

  // Risk-tolerant personas value having more pieces to trade
  const tradeBonus = persona.riskTolerance * 0.1 * myMaterial;

  return (
    materialScore * materialWeight +
    goldScore * goldWeight +
    centerScore * centerWeight +
    safetyScore * safetyWeight +
    tradeBonus
  );
}

/**
 * Quick material-only evaluation for quiescence search.
 * Much faster than full evaluation.
 */
export function evaluateMaterial(state: GameState, color: Color): EvaluationScore {
  const setup = parseFen(state.fen);
  if (setup.isErr) return 0;

  const board = setup.value.board;

  let myMaterial = 0;
  let oppMaterial = 0;

  const mySquares = color === 'white' ? board.white : board.black;
  const oppSquares = color === 'white' ? board.black : board.white;

  for (const sq of mySquares) {
    const piece = board.get(sq);
    if (piece) myMaterial += PIECE_VALUES[piece.role] ?? 0;
  }
  for (const sq of oppSquares) {
    const piece = board.get(sq);
    if (piece) oppMaterial += PIECE_VALUES[piece.role] ?? 0;
  }

  return myMaterial - oppMaterial;
}
