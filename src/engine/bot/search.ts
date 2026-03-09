import { parseFen } from 'chessops/fen';
import type { Color } from 'chessops';
import type { GameState, MoveAction } from '../types.ts';
import { getLegalMoves } from '../position.ts';
import { applyAction } from '../game.ts';
import { evaluatePosition } from './evaluate.ts';
import type { BotPersona, EvaluationScore } from './types.ts';

/** Maximum quiescence depth to avoid infinite capture chains. */
const MAX_QUIESCENCE_DEPTH = 3;

/** Default time budget for move search (ms). */
const DEFAULT_TIME_BUDGET_MS = 2000;

interface TaggedMove {
  action: MoveAction;
  isCapture: boolean;
}

/**
 * Generate all legal move actions with capture/promotion tagging.
 * Parses FEN once instead of per-move.
 */
function generateTaggedMoves(state: GameState): TaggedMove[] {
  const legalMoves = getLegalMoves(state);
  const setup = parseFen(state.fen);
  if (setup.isErr) return [];

  const board = setup.value.board;
  const epSquare = setup.value.epSquare;
  const moves: TaggedMove[] = [];

  for (const [from, destinations] of legalMoves) {
    const piece = board.get(from);
    const isPawn = piece?.role === 'pawn';

    for (const to of destinations) {
      // Promotion: pawn reaching last rank
      const isPromotion = isPawn &&
        ((piece!.color === 'white' && Math.floor(to / 8) === 7) ||
         (piece!.color === 'black' && Math.floor(to / 8) === 0));

      // Capture: opponent piece on target, or en passant
      const target = board.get(to);
      const isCapture = (target !== undefined && target.color !== state.turn) ||
        (isPawn === true && to === epSquare);

      const action: MoveAction = isPromotion
        ? { type: 'move', from, to, promotion: 'queen' }
        : { type: 'move', from, to };

      moves.push({ action, isCapture });
    }
  }

  return moves;
}

/**
 * Quiescence search: keep searching captures only until the position is quiet.
 * Uses minimax convention: always evaluates from botColor's perspective.
 */
function quiescence(
  state: GameState,
  botColor: Color,
  persona: BotPersona,
  alpha: number,
  beta: number,
  depth: number,
  maximizing: boolean,
  deadline: number,
): EvaluationScore {
  const standPat = evaluatePosition(state, botColor, persona);

  if (depth >= MAX_QUIESCENCE_DEPTH || Date.now() > deadline) return standPat;

  // Terminal states
  if (state.status === 'checkmate' || state.status === 'stalemate' || state.status === 'draw') {
    return standPat;
  }

  // Only search captures
  const taggedMoves = generateTaggedMoves(state);
  const captures = taggedMoves.filter(m => m.isCapture);

  if (maximizing) {
    let currentAlpha = alpha;
    if (standPat >= beta) return beta;
    if (standPat > currentAlpha) currentAlpha = standPat;

    for (const { action } of captures) {
      if (Date.now() > deadline) break;
      const result = applyAction(state, action);
      if ('type' in result && result.type === 'error') continue;

      const score = quiescence(
        result as GameState, botColor, persona,
        currentAlpha, beta, depth + 1, false, deadline,
      );

      if (score >= beta) return beta;
      if (score > currentAlpha) currentAlpha = score;
    }

    return currentAlpha;
  } else {
    let currentBeta = beta;
    if (standPat <= alpha) return alpha;
    if (standPat < currentBeta) currentBeta = standPat;

    for (const { action } of captures) {
      if (Date.now() > deadline) break;
      const result = applyAction(state, action);
      if ('type' in result && result.type === 'error') continue;

      const score = quiescence(
        result as GameState, botColor, persona,
        alpha, currentBeta, depth + 1, true, deadline,
      );

      if (score <= alpha) return alpha;
      if (score < currentBeta) currentBeta = score;
    }

    return currentBeta;
  }
}

/**
 * Minimax search with alpha-beta pruning and time budget.
 */
function minimax(
  state: GameState,
  botColor: Color,
  persona: BotPersona,
  depth: number,
  alpha: number,
  beta: number,
  maximizing: boolean,
  deadline: number,
): EvaluationScore {
  // Terminal states
  if (state.status === 'checkmate' || state.status === 'stalemate' || state.status === 'draw') {
    return evaluatePosition(state, botColor, persona);
  }

  if (depth === 0 || Date.now() > deadline) {
    return quiescence(state, botColor, persona, alpha, beta, 0, maximizing, deadline);
  }

  const taggedMoves = generateTaggedMoves(state);
  if (taggedMoves.length === 0) {
    return evaluatePosition(state, botColor, persona);
  }

  // Move ordering: captures first for better pruning
  taggedMoves.sort((a, b) => (b.isCapture ? 1 : 0) - (a.isCapture ? 1 : 0));

  if (maximizing) {
    let maxEval = -Infinity;
    for (const { action } of taggedMoves) {
      if (Date.now() > deadline) break;
      const result = applyAction(state, action);
      if ('type' in result && result.type === 'error') continue;

      const evalScore = minimax(
        result as GameState, botColor, persona,
        depth - 1, alpha, beta, false, deadline,
      );

      maxEval = Math.max(maxEval, evalScore);
      alpha = Math.max(alpha, evalScore);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const { action } of taggedMoves) {
      if (Date.now() > deadline) break;
      const result = applyAction(state, action);
      if ('type' in result && result.type === 'error') continue;

      const evalScore = minimax(
        result as GameState, botColor, persona,
        depth - 1, alpha, beta, true, deadline,
      );

      minEval = Math.min(minEval, evalScore);
      beta = Math.min(beta, evalScore);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

/**
 * Score a single move action using the search at the persona's depth.
 */
function scoreMoveAction(
  state: GameState,
  action: MoveAction,
  botColor: Color,
  persona: BotPersona,
  deadline: number,
): EvaluationScore {
  const result = applyAction(state, action);
  if ('type' in result && result.type === 'error') return -Infinity;

  const nextState = result as GameState;

  // Immediate checkmate = maximum score
  if (nextState.status === 'checkmate' && nextState.winner === botColor) {
    return 10000;
  }

  if (persona.searchDepth <= 1) {
    return quiescence(nextState, botColor, persona, -Infinity, Infinity, 0, false, deadline);
  }

  return minimax(
    nextState, botColor, persona,
    persona.searchDepth - 1, -Infinity, Infinity, false, deadline,
  );
}

export interface ScoredAction {
  action: MoveAction;
  score: EvaluationScore;
}

/**
 * Find the best move for the current position.
 * Returns scored moves sorted best-first.
 * Integrates mate-in-one detection (no separate pass needed).
 * Stops early if time budget is exceeded.
 */
export function findBestMoves(
  state: GameState,
  persona: BotPersona,
  timeBudgetMs: number = DEFAULT_TIME_BUDGET_MS,
): ScoredAction[] {
  const deadline = Date.now() + timeBudgetMs;
  const botColor = state.turn;
  const taggedMoves = generateTaggedMoves(state);

  if (taggedMoves.length === 0) return [];

  // Evaluate captures first — more likely to be good moves, and ensures
  // the most impactful moves are scored even if time runs out
  taggedMoves.sort((a, b) => (b.isCapture ? 1 : 0) - (a.isCapture ? 1 : 0));

  const scored: ScoredAction[] = [];

  for (const { action } of taggedMoves) {
    const score = scoreMoveAction(state, action, botColor, persona, deadline);

    // Mate-in-one: return immediately
    if (score >= 9999) {
      return [{ action, score }];
    }

    scored.push({ action, score });

    // Check time budget after each top-level move evaluation
    if (Date.now() > deadline) break;
  }

  scored.sort((a, b) => b.score - a.score);
  return scored;
}

/**
 * Check if there's a checkmate in one move.
 * Returns the mating move if found, otherwise null.
 */
export function findCheckmateInOne(state: GameState): MoveAction | null {
  const taggedMoves = generateTaggedMoves(state);

  for (const { action } of taggedMoves) {
    const result = applyAction(state, action);
    if ('type' in result && result.type === 'error') continue;

    const nextState = result as GameState;
    if (nextState.status === 'checkmate') {
      return action;
    }
  }

  return null;
}
