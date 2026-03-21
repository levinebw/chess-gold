import { parseFen, makeFen } from 'chessops/fen';
import type { GameState, GameAction, GameError, GameModeConfig } from './types.ts';
import { CHESS_GOLD_CONFIG, MODE_PRESETS } from './config.ts';
import { awardTurnIncome, canAffordPiece, deductPurchaseCost } from './gold.ts';
import { isValidPlacement, placementResolvesCheck, getValidPlacementSquares, hasInInventory, removeFromInventory } from './placement.ts';
import { getLegalMoves, isInCheck, isCheckmate, isStalemate, applyMove } from './position.ts';
import { checkAllConverted, checkLootBoxesCollected, checkAllEliminated } from './win-conditions.ts';
import { shouldSpawnLootBox, spawnLootBox, validateHit, applyHit, autoHitAfterMove } from './lootbox.ts';
import { validateEquip, applyEquip } from './equipment.ts';

const PURCHASABLE_PIECES: Array<import('./types.ts').PurchasableRole> = ['pawn', 'knight', 'bishop', 'rook', 'queen'];

/**
 * Check if the player to move (who is in checkmate per chessops) can buy and
 * place a piece that blocks the check. Accounts for turn income that will be
 * awarded when their applyAction runs.
 */
function canPlacementEscapeCheck(state: GameState): boolean {
  if (!state.modeConfig.goldEconomy) return false;

  const goldAfterIncome = state.gold[state.turn] + CHESS_GOLD_CONFIG.goldPerTurn;

  for (const piece of PURCHASABLE_PIECES) {
    if (goldAfterIncome < CHESS_GOLD_CONFIG.piecePrices[piece]) continue;
    const squares = getValidPlacementSquares(state, piece);
    if (squares.length > 0) return true;
  }
  return false;
}

const KINGS_ONLY_FEN = '4k3/8/8/8/8/8/8/4K3 w - - 0 1';
const STANDARD_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

const GOLD_MINE_STARTING_GOLD = 9999;

export function createInitialState(modeConfig?: GameModeConfig, startingGold?: number): GameState {
  const config = modeConfig ?? MODE_PRESETS['chess-gold'];
  const gold = startingGold ?? (config.unrestrictedPlacement ? GOLD_MINE_STARTING_GOLD : CHESS_GOLD_CONFIG.startingGold);
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
    lastLootBoxReward: null,
    pendingLootPiece: null,
    status: 'active',
    winner: null,
    winReason: null,
    actionHistory: [],
    positionHistory: [],
    lastPlacementTurn: { white: null, black: null },
    modeConfig: config,
  };
}

function makeError(code: GameError['code'], message: string): GameError {
  return { type: 'error', code, message };
}

export function applyAction(state: GameState, action: GameAction): GameState | GameError {
  // 1. Reject if game is over
  if (state.status === 'checkmate' || state.status === 'stalemate' || state.status === 'draw') {
    return makeError('GAME_OVER', 'Game is already over');
  }

  // 2. Handle resign immediately
  if (action.type === 'resign') {
    const winner = state.turn === 'white' ? 'black' : 'white';
    return {
      ...state,
      status: 'checkmate',
      winner,
      winReason: 'resign',
      actionHistory: [...state.actionHistory, action],
    };
  }

  // 3. Clear previous loot box reward and award turn income
  let current: GameState = { ...state, lastLootBoxReward: null };
  const consumesTurn = action.type === 'move' || action.type === 'place';
  current = consumesTurn ? awardTurnIncome(current) : current;
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

    // Capture pre-move board for auto-hit check
    const preMoveSetup = parseFen(current.fen);
    const preMoveBoard = preMoveSetup.isOk ? preMoveSetup.value.board : null;

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

    // Auto-hit: if piece was attacking a loot box and landed adjacent, hit it
    if (preMoveBoard) {
      current = autoHitAfterMove(current, action.from, action.to, preMoveBoard);
    }

  } else if (action.type === 'place') {
    // Placement throttle: can only place every other turn
    if (current.modeConfig.placementThrottle && !action.fromInventory) {
      const lastTurn = current.lastPlacementTurn[actingPlayer];
      if (lastTurn !== null && current.turnNumber - lastTurn < 2) {
        return makeError('INVALID_PLACEMENT', 'Placement throttle: you can only place a piece every other turn');
      }
    }

    if (action.fromInventory) {
      // Place from inventory — free, no gold cost
      if (!hasInInventory(current, action.piece)) {
        return makeError('INVALID_PLACEMENT', 'Piece not in inventory');
      }
    } else {
      // Place by purchasing — costs gold
      if (!canAffordPiece(current, action.piece)) {
        return makeError('INSUFFICIENT_GOLD', 'Not enough gold');
      }
    }

    if (!isValidPlacement(current, action.piece, action.square)) {
      return makeError('INVALID_PLACEMENT', 'Invalid placement square');
    }
    if (isInCheck(current) && !placementResolvesCheck(current, action.piece, action.square)) {
      return makeError('INVALID_PLACEMENT', 'Placement must resolve check');
    }

    if (action.fromInventory) {
      current = removeFromInventory(current, action.piece);
    } else {
      current = deductPurchaseCost(current, action.piece);
    }

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
      lastPlacementTurn: {
        ...current.lastPlacementTurn,
        [actingPlayer]: current.turnNumber,
      },
    };
  } else if (action.type === 'equip') {
    const equipError = validateEquip(current, action.item, action.square);
    if (equipError) {
      return makeError('INVALID_ACTION', equipError);
    }

    // applyEquip handles gold deduction, inventory removal, equipment placement,
    // and crown promotion. Does NOT consume the turn.
    current = applyEquip(current, action.item, action.square);
  } else if (action.type === 'hit-loot-box') {
    const hitError = validateHit(current, action.pieceSquare, action.lootBoxSquare);
    if (hitError) {
      return makeError('INVALID_ACTION', hitError);
    }

    // applyHit handles hit counting, opening, reward distribution, and turn consumption
    current = applyHit(current, action.pieceSquare, action.lootBoxSquare);
  }

  // 4. Record action
  current = {
    ...current,
    actionHistory: [...current.actionHistory, action],
  };

  // 5. Update counters and position history
  const newHalfMoveCount = state.halfMoveCount + 1;
  const newTurnNumber = current.turn === 'white' ? state.turnNumber + 1 : state.turnNumber;

  // Normalize FEN for repetition: board + turn + castling + en passant (drop clocks)
  const fenParts = current.fen.split(' ');
  const normalizedFen = fenParts.slice(0, 4).join(' ');
  const newHistory = [...(current.positionHistory ?? []), normalizedFen];

  current = {
    ...current,
    halfMoveCount: newHalfMoveCount,
    turnNumber: newTurnNumber,
    positionHistory: newHistory,
  };

  // 6. Check game-over
  const winConditions = current.modeConfig.winConditions;

  if (!current.modeConfig.noCheck && isCheckmate(current) && !canPlacementEscapeCheck(current)) {
    current = {
      ...current,
      status: 'checkmate',
      winner: actingPlayer,
      winReason: 'checkmate',
    };
  } else if (isStalemate(current)) {
    current = {
      ...current,
      status: 'stalemate',
    };
  } else {
    // Threefold repetition (skip in loot box mode — win condition is collection, not positional)
    if (!current.modeConfig.lootBoxes) {
      const count = newHistory.filter(f => f === normalizedFen).length;
      if (count >= 3) {
        current = { ...current, status: 'draw' };
      }
    }
  }

  // Check mode-specific win conditions
  if (current.status !== 'checkmate' && current.status !== 'stalemate' && current.status !== 'draw') {
    if (winConditions.includes('all-converted')) {
      const winner = checkAllConverted(current);
      if (winner) {
        current = {
          ...current,
          status: 'checkmate',
          winner,
          winReason: 'all-converted',
        };
      }
    }

    if (winConditions.includes('loot-boxes-collected')) {
      const winner = checkLootBoxesCollected(current);
      if (winner) {
        current = {
          ...current,
          status: 'checkmate',
          winner,
          winReason: 'loot-boxes-collected',
        };
      }
    }

    if (winConditions.includes('all-eliminated')) {
      const winner = checkAllEliminated(current);
      if (winner) {
        current = {
          ...current,
          status: 'checkmate',
          winner,
          winReason: 'all-eliminated',
        };
      }
    }
  }

  // 7. Spawn loot box (after all status checks, at very end)
  if (current.status === 'active' || current.status === 'check') {
    if (shouldSpawnLootBox(current)) {
      current = spawnLootBox(current);
    }
  }

  return current;
}
