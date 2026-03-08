import { parseFen, makeFen } from 'chessops/fen';
import type { GameState, GameAction, GameError, GameModeConfig } from './types.ts';
import { CHESS_GOLD_CONFIG, MODE_PRESETS } from './config.ts';
import { awardTurnIncome, canAffordPiece, deductPurchaseCost } from './gold.ts';
import { isValidPlacement, placementResolvesCheck } from './placement.ts';
import { getLegalMoves, isInCheck, isCheckmate, isStalemate, applyMove } from './position.ts';
import { checkAllConverted } from './win-conditions.ts';

const KINGS_ONLY_FEN = '4k3/8/8/8/8/8/8/4K3 w - - 0 1';
const STANDARD_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

export function createInitialState(modeConfig?: GameModeConfig, startingGold?: number): GameState {
  const config = modeConfig ?? MODE_PRESETS['chess-gold'];
  const gold = startingGold ?? CHESS_GOLD_CONFIG.startingGold;
  const fen = config.standardStart ? STANDARD_FEN : KINGS_ONLY_FEN;
  return {
    fen,
    turn: 'white',
    turnNumber: 1,
    halfMoveCount: 0,
    gold: {
      white: gold,
      black: gold,
    },
    inventory: { white: [], black: [] },
    items: { white: [], black: [] },
    equipment: {},
    lootBoxes: [],
    lootBoxesCollected: { white: 0, black: 0 },
    status: 'active',
    winner: null,
    actionHistory: [],
    modeConfig: config,
  };
}

function makeError(code: GameError['code'], message: string): GameError {
  return { type: 'error', code, message };
}

export function applyAction(state: GameState, action: GameAction): GameState | GameError {
  // 1. Reject if game is over
  if (state.status === 'checkmate' || state.status === 'stalemate') {
    return makeError('GAME_OVER', 'Game is already over');
  }

  // 2. Award turn income
  let current = awardTurnIncome(state);
  const actingPlayer = current.turn;

  // 3. Validate and apply action
  if (action.type === 'move') {
    // If this move includes a promotion, verify player can afford it
    if (action.promotion) {
      if (current.gold[actingPlayer] < CHESS_GOLD_CONFIG.promotionCost) {
        return makeError('INSUFFICIENT_GOLD', 'Not enough gold to promote');
      }
    }

    const legalMoves = getLegalMoves(current);
    const destsFromSquare = legalMoves.get(action.from);
    if (!destsFromSquare || !destsFromSquare.includes(action.to)) {
      return makeError('ILLEGAL_MOVE', 'Illegal move');
    }

    // applyMove handles capture gold, turn flip, and promotion (via chessops play)
    current = applyMove(current, action.from, action.to, action.promotion);

    // Deduct promotion cost
    if (action.promotion) {
      current = {
        ...current,
        gold: {
          ...current.gold,
          [actingPlayer]: current.gold[actingPlayer] - CHESS_GOLD_CONFIG.promotionCost,
        },
      };
    }

  } else if (action.type === 'place') {
    if (!canAffordPiece(current, action.piece)) {
      return makeError('INSUFFICIENT_GOLD', 'Not enough gold');
    }
    if (!isValidPlacement(current, action.piece, action.square)) {
      return makeError('INVALID_PLACEMENT', 'Invalid placement square');
    }
    if (isInCheck(current) && !placementResolvesCheck(current, action.piece, action.square)) {
      return makeError('INVALID_PLACEMENT', 'Placement must resolve check');
    }

    current = deductPurchaseCost(current, action.piece);

    // Update FEN with the placed piece
    const setup = parseFen(current.fen);
    if (setup.isErr) return makeError('INVALID_ACTION', 'Invalid board state');
    setup.value.board.set(action.square, { role: action.piece, color: actingPlayer });
    // Update the turn in the FEN setup so makeFen reflects black to move
    setup.value.turn = actingPlayer === 'white' ? 'black' : 'white';
    const newFen = makeFen(setup.value);

    current = {
      ...current,
      fen: newFen,
      turn: actingPlayer === 'white' ? 'black' : 'white',
    };
  }

  // 4. Record action
  current = {
    ...current,
    actionHistory: [...current.actionHistory, action],
  };

  // 5. Update counters
  const newHalfMoveCount = state.halfMoveCount + 1;
  const newTurnNumber = current.turn === 'white' ? state.turnNumber + 1 : state.turnNumber;
  current = {
    ...current,
    halfMoveCount: newHalfMoveCount,
    turnNumber: newTurnNumber,
  };

  // 6. Check game-over
  const winConditions = current.modeConfig.winConditions;

  if (!current.modeConfig.noCheck && isCheckmate(current)) {
    current = {
      ...current,
      status: 'checkmate',
      winner: actingPlayer,
    };
  } else if (isStalemate(current)) {
    current = {
      ...current,
      status: 'stalemate',
    };
  }

  // Check mode-specific win conditions
  if (current.status !== 'checkmate' && current.status !== 'stalemate') {
    if (winConditions.includes('all-converted')) {
      const winner = checkAllConverted(current);
      if (winner) {
        current = {
          ...current,
          status: 'checkmate',
          winner,
        };
      }
    }
  }

  return current;
}
