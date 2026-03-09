import { parseFen } from 'chessops/fen';
import type { Color } from 'chessops';
import type { GameState, MoveAction, Square } from '../types.ts';
import { getLegalMoves } from '../position.ts';
import { applyAction } from '../game.ts';
import { evaluatePosition } from './evaluate.ts';
import type { BotPersona, EvaluationScore } from './types.ts';

/** Maximum quiescence depth to avoid infinite capture chains. */
const MAX_QUIESCENCE_DEPTH = 3;

/**
 * Check if a move is a capture by inspecting the board.
 */
function isCapture(state: GameState, from: Square, to: Square): boolean {
  const setup = parseFen(state.fen);
  if (setup.isErr) return false;

  const target = setup.value.board.get(to);
  if (target && target.color !== state.turn) return true;

  // Check en passant
  const piece = setup.value.board.get(from);
  if (piece?.role === 'pawn' && to === setup.value.epSquare) return true;

  return false;
}

/**
 * Check if a pawn move reaches the last rank (promotion needed).
 */
function isPromotionMove(state: GameState, from: Square, to: Square): boolean {
  const setup = parseFen(state.fen);
  if (setup.isErr) return false;

  const piece = setup.value.board.get(from);
  if (!piece || piece.role !== 'pawn') return false;

  const toRank = Math.floor(to / 8);
  return (piece.color === 'white' && toRank === 7) || (piece.color === 'black' && toRank === 0);
}

/**
 * Generate all legal move actions for the current position.
 * Handles promotion by generating queen promotion (strongest default).
 */
function generateMoveActions(state: GameState): MoveAction[] {
  const legalMoves = getLegalMoves(state);
  const actions: MoveAction[] = [];

  for (const [from, destinations] of legalMoves) {
    for (const to of destinations) {
      if (isPromotionMove(state, from, to)) {
        // For search, always consider queen promotion (dominant choice)
        // We only add queen here for simplicity; the bot almost never
        // wants to underpromote
        actions.push({ type: 'move', from, to, promotion: 'queen' });
      } else {
        actions.push({ type: 'move', from, to });
      }
    }
  }

  return actions;
}

/**
 * Quiescence search: keep searching captures only until the position is quiet.
 * This prevents horizon effects where a piece hangs right after the search depth.
 *
 * Uses minimax convention: always evaluates from botColor's perspective.
 * `maximizing` indicates whether the side to move is the bot (true) or opponent (false).
 */
function quiescence(
  state: GameState,
  botColor: Color,
  persona: BotPersona,
  alpha: number,
  beta: number,
  depth: number,
  maximizing: boolean,
): EvaluationScore {
  const standPat = evaluatePosition(state, botColor, persona);

  if (depth >= MAX_QUIESCENCE_DEPTH) return standPat;

  // Terminal states
  if (state.status === 'checkmate' || state.status === 'stalemate' || state.status === 'draw') {
    return standPat;
  }

  // Only search captures
  const moveActions = generateMoveActions(state);
  const captures = moveActions.filter(m => isCapture(state, m.from, m.to));

  if (maximizing) {
    let currentAlpha = alpha;
    if (standPat >= beta) return beta;
    if (standPat > currentAlpha) currentAlpha = standPat;

    for (const action of captures) {
      const result = applyAction(state, action);
      if ('type' in result && result.type === 'error') continue;

      const score = quiescence(
        result as GameState,
        botColor,
        persona,
        currentAlpha,
        beta,
        depth + 1,
        false,
      );

      if (score >= beta) return beta;
      if (score > currentAlpha) currentAlpha = score;
    }

    return currentAlpha;
  } else {
    let currentBeta = beta;
    if (standPat <= alpha) return alpha;
    if (standPat < currentBeta) currentBeta = standPat;

    for (const action of captures) {
      const result = applyAction(state, action);
      if ('type' in result && result.type === 'error') continue;

      const score = quiescence(
        result as GameState,
        botColor,
        persona,
        alpha,
        currentBeta,
        depth + 1,
        true,
      );

      if (score <= alpha) return alpha;
      if (score < currentBeta) currentBeta = score;
    }

    return currentBeta;
  }
}

/**
 * Minimax search with alpha-beta pruning.
 *
 * At depth 0, drops into quiescence search.
 * `maximizing` is true when it's the bot's turn to move.
 */
function minimax(
  state: GameState,
  botColor: Color,
  persona: BotPersona,
  depth: number,
  alpha: number,
  beta: number,
  maximizing: boolean,
): EvaluationScore {
  // Terminal states
  if (state.status === 'checkmate' || state.status === 'stalemate' || state.status === 'draw') {
    return evaluatePosition(state, botColor, persona);
  }

  if (depth === 0) {
    return quiescence(state, botColor, persona, alpha, beta, 0, maximizing);
  }

  const moveActions = generateMoveActions(state);
  if (moveActions.length === 0) {
    return evaluatePosition(state, botColor, persona);
  }

  // Move ordering: captures first for better pruning
  moveActions.sort((a, b) => {
    const aCapture = isCapture(state, a.from, a.to) ? 1 : 0;
    const bCapture = isCapture(state, b.from, b.to) ? 1 : 0;
    return bCapture - aCapture;
  });

  if (maximizing) {
    let maxEval = -Infinity;
    for (const action of moveActions) {
      const result = applyAction(state, action);
      if ('type' in result && result.type === 'error') continue;

      const evalScore = minimax(
        result as GameState,
        botColor,
        persona,
        depth - 1,
        alpha,
        beta,
        false,
      );

      maxEval = Math.max(maxEval, evalScore);
      alpha = Math.max(alpha, evalScore);
      if (beta <= alpha) break; // prune
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const action of moveActions) {
      const result = applyAction(state, action);
      if ('type' in result && result.type === 'error') continue;

      const evalScore = minimax(
        result as GameState,
        botColor,
        persona,
        depth - 1,
        alpha,
        beta,
        true,
      );

      minEval = Math.min(minEval, evalScore);
      beta = Math.min(beta, evalScore);
      if (beta <= alpha) break; // prune
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
): EvaluationScore {
  const result = applyAction(state, action);
  if ('type' in result && result.type === 'error') return -Infinity;

  const nextState = result as GameState;

  if (persona.searchDepth <= 1) {
    // Depth 1: just evaluate the resulting position + quiescence
    // After bot's move, opponent moves next (minimizing)
    return quiescence(nextState, botColor, persona, -Infinity, Infinity, 0, false);
  }

  // Depth 2+: run minimax from the opponent's perspective
  return minimax(
    nextState,
    botColor,
    persona,
    persona.searchDepth - 1,
    -Infinity,
    Infinity,
    false, // opponent moves next
  );
}

export interface ScoredAction {
  action: MoveAction;
  score: EvaluationScore;
}

/**
 * Find the best move for the current position.
 *
 * Returns all legal moves scored and sorted (best first).
 * Caller applies randomness.
 */
export function findBestMoves(
  state: GameState,
  persona: BotPersona,
): ScoredAction[] {
  const botColor = state.turn;
  const moveActions = generateMoveActions(state);

  if (moveActions.length === 0) return [];

  const scored: ScoredAction[] = moveActions.map(action => ({
    action,
    score: scoreMoveAction(state, action, botColor, persona),
  }));

  // Sort descending by score (best first)
  scored.sort((a, b) => b.score - a.score);

  return scored;
}

/**
 * Check if there's a checkmate in one move.
 * Returns the mating move if found, otherwise null.
 */
export function findCheckmateInOne(state: GameState): MoveAction | null {
  const moveActions = generateMoveActions(state);

  for (const action of moveActions) {
    const result = applyAction(state, action);
    if ('type' in result && result.type === 'error') continue;

    const nextState = result as GameState;
    if (nextState.status === 'checkmate') {
      return action;
    }
  }

  return null;
}
