import type { GameState, GameAction, PlaceAction, MoveAction } from '../types.ts';
import type { BotPersona } from './types.ts';
import { findBestMoves } from './search.ts';
import type { ScoredAction } from './search.ts';
import { decideSpending } from './strategy.ts';
import { evaluatePosition } from './evaluate.ts';

/**
 * Apply randomness to move selection.
 *
 * With randomness=0, always picks the best move.
 * With randomness>0, may pick a suboptimal move from the top candidates.
 *
 * The approach: among all moves within `randomness * maxRange` of the best
 * score, pick one at random (uniformly).
 */
function applyRandomness(
  scored: ScoredAction[],
  randomness: number,
): MoveAction {
  if (scored.length === 0) {
    throw new Error('No moves available');
  }

  if (scored.length === 1 || randomness === 0) {
    return scored[0].action;
  }

  const bestScore = scored[0].score;
  const worstScore = scored[scored.length - 1].score;
  const range = bestScore - worstScore;

  // Threshold: moves within this score range of the best are candidates
  const threshold = range * randomness;
  const candidates = scored.filter(s => bestScore - s.score <= threshold);

  // Pick a random candidate
  const idx = Math.floor(Math.random() * candidates.length);
  return candidates[idx].action;
}

/**
 * Choose the best action for the bot given the current game state and persona.
 *
 * Flow:
 * 1. Check for checkmate-in-one (always take it)
 * 2. Evaluate whether to spend gold (buy a piece) or make a move
 * 3. Pick the best action with persona-based randomness
 *
 * Returns a GameAction (either a MoveAction or PlaceAction).
 */
export function chooseAction(state: GameState, persona: BotPersona): GameAction {
  const botColor = state.turn;

  // --- 1. Evaluate spending vs moving ---
  const spending = decideSpending(state, persona);
  const bestMoves = findBestMoves(state, persona);

  // --- 2. Checkmate in one: always take it (detected by findBestMoves) ---
  if (bestMoves.length > 0 && bestMoves[0].score >= 9999) {
    return bestMoves[0].action;
  }

  // If there are no legal moves, we must try to place a piece
  if (bestMoves.length === 0) {
    if (spending.action === 'buy' && spending.piece !== undefined && spending.square !== undefined) {
      const placeAction: PlaceAction = {
        type: 'place',
        piece: spending.piece,
        square: spending.square,
        fromInventory: false,
      };
      return placeAction;
    }
    // No moves and can't buy — game should be over (stalemate),
    // but be defensive: return a null-ish move that will be caught by the caller
    // This shouldn't happen in practice because stalemate is detected.
    // Return the first legal move if somehow there are hidden ones, or a place action.
    throw new Error('Bot has no available actions — game should be over');
  }

  // --- 3. Decide: buy a piece or move? ---
  if (spending.action === 'buy' && spending.piece !== undefined && spending.square !== undefined) {
    // Compare the value of placing a piece vs making the best move.
    // Use a heuristic: placing is good if we have few pieces or the best move
    // isn't particularly strong.
    const bestMoveScore = bestMoves[0].score;
    const baselineScore = evaluatePosition(state, botColor, persona);

    // How much does the best move improve our position?
    const moveImprovement = bestMoveScore - baselineScore;

    // Placement threshold: aggressive bots prefer moves, defensive bots
    // prefer building up. If move improvement is marginal, buy instead.
    const placementPreference = (1 - persona.aggression) * 0.5 + 0.3;

    // Buy if: move improvement is small, or persona strongly prefers building
    if (moveImprovement < placementPreference) {
      const placeAction: PlaceAction = {
        type: 'place',
        piece: spending.piece,
        square: spending.square,
        fromInventory: false,
      };
      return placeAction;
    }
  }

  // --- 4. Pick a move with randomness ---
  return applyRandomness(bestMoves, persona.randomness);
}
