import { parseFen } from 'chessops/fen';
import type { Color } from 'chessops';
import type { GameState, MoveAction } from '../types.ts';
import { getLegalMoves, applyMove, isInCheck } from '../position.ts';
import { checkAllConverted } from '../win-conditions.ts';
import { evaluatePosition } from './evaluate.ts';
import type { BotPersona, EvaluationScore } from './types.ts';

/** Maximum quiescence depth to avoid infinite capture chains. */
const MAX_QUIESCENCE_DEPTH = 2;

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
 * Lightweight move application for search.
 * Uses applyMove (position.ts) directly — bypasses game.ts validation,
 * income, history, and status detection. ~3x faster per node.
 */
function applyMoveForSearch(state: GameState, action: MoveAction): GameState | null {
  try {
    return applyMove(state, action.from, action.to, action.promotion);
  } catch {
    return null;
  }
}

/**
 * Check if the position is terminal. Returns a score if terminal, null otherwise.
 * Call AFTER generating tagged moves for the position.
 */
function evaluateTerminal(
  state: GameState,
  taggedMoves: TaggedMove[],
  botColor: Color,
): EvaluationScore | null {
  // Mode-specific win conditions (e.g. Conqueror's all-converted)
  if (state.modeConfig.winConditions?.includes('all-converted')) {
    const winner = checkAllConverted(state);
    if (winner) return winner === botColor ? 10000 : -10000;
  }

  // No legal moves = checkmate or stalemate
  if (taggedMoves.length === 0) {
    if (!state.modeConfig.noCheck && isInCheck(state)) {
      // Checkmate — bad for the side to move
      return state.turn === botColor ? -10000 : 10000;
    }
    return 0; // Stalemate
  }

  return null; // Not terminal
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
  if (depth >= MAX_QUIESCENCE_DEPTH || Date.now() > deadline) {
    return evaluatePosition(state, botColor, persona);
  }

  const taggedMoves = generateTaggedMoves(state);

  // Terminal check
  const terminal = evaluateTerminal(state, taggedMoves, botColor);
  if (terminal !== null) return terminal;

  const standPat = evaluatePosition(state, botColor, persona);
  const captures = taggedMoves.filter(m => m.isCapture);

  if (captures.length === 0) return standPat; // Quiet position

  if (maximizing) {
    let currentAlpha = alpha;
    if (standPat >= beta) return beta;
    if (standPat > currentAlpha) currentAlpha = standPat;

    for (const { action } of captures) {
      if (Date.now() > deadline) break;
      const result = applyMoveForSearch(state, action);
      if (!result) continue;

      const score = quiescence(
        result, botColor, persona,
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
      const result = applyMoveForSearch(state, action);
      if (!result) continue;

      const score = quiescence(
        result, botColor, persona,
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
  const taggedMoves = generateTaggedMoves(state);

  // Terminal check (checkmate, stalemate, mode-specific wins)
  const terminal = evaluateTerminal(state, taggedMoves, botColor);
  if (terminal !== null) return terminal;

  if (depth === 0 || Date.now() > deadline) {
    return quiescence(state, botColor, persona, alpha, beta, 0, maximizing, deadline);
  }

  // Move ordering: captures first for better pruning
  taggedMoves.sort((a, b) => (b.isCapture ? 1 : 0) - (a.isCapture ? 1 : 0));

  if (maximizing) {
    let maxEval = -Infinity;
    for (const { action } of taggedMoves) {
      if (Date.now() > deadline) break;
      const result = applyMoveForSearch(state, action);
      if (!result) continue;

      const evalScore = minimax(
        result, botColor, persona,
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
      const result = applyMoveForSearch(state, action);
      if (!result) continue;

      const evalScore = minimax(
        result, botColor, persona,
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
  const nextState = applyMoveForSearch(state, action);
  if (!nextState) return -Infinity;

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
    const result = applyMoveForSearch(state, action);
    if (!result) continue;

    // Check if opponent has no legal moves and is in check
    const childMoves = generateTaggedMoves(result);
    if (childMoves.length === 0 && !result.modeConfig.noCheck && isInCheck(result)) {
      return action;
    }
  }

  return null;
}
