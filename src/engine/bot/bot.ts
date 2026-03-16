import { parseFen } from 'chessops/fen';
import type { GameState, GameAction, PlaceAction, MoveAction, HitLootBoxAction, PurchasableRole, Square } from '../types.ts';
import type { BotPersona } from './types.ts';
import { findBestMoves } from './search.ts';
import type { ScoredAction } from './search.ts';
import { decideSpending } from './strategy.ts';
import { evaluatePosition } from './evaluate.ts';
import { validateHit } from '../lootbox.ts';
import { getValidPlacementSquares } from '../placement.ts';
import { CHESS_GOLD_CONFIG } from '../config.ts';
import { isInCheck } from '../position.ts';

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
 * Find all valid hit-loot-box actions for the current player.
 * Returns hits grouped by whether they come from pawns (free actions)
 * or non-pawns (consume the turn).
 */
function findLootBoxHits(state: GameState): { pawnHits: HitLootBoxAction[]; nonPawnHits: HitLootBoxAction[] } {
  const pawnHits: HitLootBoxAction[] = [];
  const nonPawnHits: HitLootBoxAction[] = [];

  if (!state.modeConfig.lootBoxes || state.lootBoxes.length === 0) {
    return { pawnHits, nonPawnHits };
  }

  const setup = parseFen(state.fen);
  if (setup.isErr) return { pawnHits, nonPawnHits };
  const board = setup.value.board;

  for (const box of state.lootBoxes) {
    // Check all 8 adjacent squares for pieces that can hit
    const bFile = box.square % 8;
    const bRank = Math.floor(box.square / 8);

    for (let df = -1; df <= 1; df++) {
      for (let dr = -1; dr <= 1; dr++) {
        if (df === 0 && dr === 0) continue;
        const nf = bFile + df;
        const nr = bRank + dr;
        if (nf < 0 || nf > 7 || nr < 0 || nr > 7) continue;

        const sq = (nr * 8 + nf) as Square;
        if (validateHit(state, sq, box.square) === null) {
          const piece = board.get(sq);
          if (!piece) continue;

          const action: HitLootBoxAction = {
            type: 'hit-loot-box',
            pieceSquare: sq,
            lootBoxSquare: box.square,
          };

          if (piece.role === 'pawn') {
            pawnHits.push(action);
          } else {
            nonPawnHits.push(action);
          }
        }
      }
    }
  }

  return { pawnHits, nonPawnHits };
}

/**
 * When in check with no legal moves, find a piece+square combo to buy
 * and place that resolves the check. Uses getValidPlacementSquares which
 * already filters for placements that resolve check.
 */
function findCheckEscapePlacement(state: GameState): PlaceAction | null {
  if (!state.modeConfig.goldEconomy) return null;

  const goldAfterIncome = state.gold[state.turn] + CHESS_GOLD_CONFIG.goldPerTurn;
  const pieces: PurchasableRole[] = ['pawn', 'knight', 'bishop', 'rook', 'queen'];

  for (const piece of pieces) {
    const price = CHESS_GOLD_CONFIG.piecePrices[piece];
    if (goldAfterIncome < price) continue;

    const squares = getValidPlacementSquares(state, piece);
    if (squares.length > 0) {
      return {
        type: 'place',
        piece,
        square: squares[0],
        fromInventory: false,
      };
    }
  }

  return null;
}

/**
 * Choose the best action for the bot given the current game state and persona.
 *
 * Flow:
 * 1. Handle pending loot piece placement (must place before anything else)
 * 2. Execute free pawn loot box hits (don't consume the turn)
 * 3. Check for checkmate-in-one (always take it)
 * 4. Consider non-pawn loot box hits vs moves
 * 5. Evaluate whether to spend gold (buy a piece) or make a move
 * 6. Pick the best action with persona-based randomness
 *
 * Returns a GameAction (MoveAction, PlaceAction, or HitLootBoxAction).
 */
export function chooseAction(state: GameState, persona: BotPersona): GameAction {
  const botColor = state.turn;

  // --- 1. Check for free pawn loot box hits ---
  const { pawnHits, nonPawnHits } = findLootBoxHits(state);

  // Pawn hits are free actions (don't consume the turn), always take them
  if (pawnHits.length > 0) {
    return pawnHits[0];
  }

  // --- 2. Evaluate spending vs moving ---
  const spending = decideSpending(state, persona);
  const bestMoves = findBestMoves(state, persona);

  // --- 3. Checkmate in one: always take it (detected by findBestMoves) ---
  if (bestMoves.length > 0 && bestMoves[0].score >= 9999) {
    return bestMoves[0].action;
  }

  // --- 4. Consider non-pawn loot box hits ---
  // Loot box hits are very valuable (gold, pieces, items), so prefer them
  // over mediocre moves. Only skip if there's a very strong move available.
  if (nonPawnHits.length > 0 && bestMoves.length > 0) {
    const bestMoveScore = bestMoves[0].score;
    const baselineScore = evaluatePosition(state, botColor, persona);
    const moveImprovement = bestMoveScore - baselineScore;

    // Hit the loot box unless the best move is very strong (e.g., winning material)
    // A loot box hit is worth roughly 3-5 gold equivalent, so ~1.0-1.5 eval points
    if (moveImprovement < 2.0) {
      // Prefer queen hits (they do more damage per hit)
      const setup = parseFen(state.fen);
      if (setup.isOk) {
        const board = setup.value.board;
        const queenHit = nonPawnHits.find(h => {
          const piece = board.get(h.pieceSquare);
          return piece?.role === 'queen';
        });
        return queenHit ?? nonPawnHits[0];
      }
      return nonPawnHits[0];
    }
  }

  // If no legal moves but loot box hits available, take a hit
  if (bestMoves.length === 0 && nonPawnHits.length > 0) {
    return nonPawnHits[0];
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

    // Bug #2 fix: when in check with no legal moves, decideSpending might
    // not find a valid placement that resolves check. Explicitly search for one.
    if (isInCheck(state)) {
      const escapePlacement = findCheckEscapePlacement(state);
      if (escapePlacement) {
        return escapePlacement;
      }
    }

    // No moves, no hits, no buys — game should be over (stalemate/checkmate),
    // but be defensive.
    throw new Error('Bot has no available actions — game should be over');
  }

  // --- 5. Decide: buy a piece or move? ---
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

  // --- 6. Pick a move with randomness ---
  return applyRandomness(bestMoves, persona.randomness);
}
