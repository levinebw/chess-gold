// Loot box lifecycle: spawning, hit validation, opening, drop table rolling

import { parseFen } from 'chessops/fen';
import type { Board } from 'chessops/board';
import type { Role } from 'chessops/types';
import type {
  GameState,
  LootBox,
  LootBoxDrop,
  Square,
  Color,
  InventoryItem,
} from './types.ts';
import { CHESS_GOLD_CONFIG } from './config.ts';

// --- Spawning ---

export function shouldSpawnLootBox(state: GameState): boolean {
  if (!state.modeConfig.lootBoxes) return false;

  // Not on turn 1
  if (state.turnNumber <= 1) return false;

  // Respect max active boxes
  const { maxActiveBoxes, spawnInterval } = CHESS_GOLD_CONFIG.lootBox;
  if (state.lootBoxes.length >= maxActiveBoxes) return false;

  // Spawn every spawnInterval turns
  return state.turnNumber % spawnInterval === 0;
}

export function spawnLootBox(
  state: GameState,
  rng: () => number = Math.random,
): GameState {
  const emptySquares = getEmptyMiddleSquares(state);
  if (emptySquares.length === 0) return state;

  const idx = Math.floor(rng() * emptySquares.length);
  const square = emptySquares[idx];

  const box: LootBox = {
    square,
    hitsRemaining: CHESS_GOLD_CONFIG.lootBox.hitsToOpen,
    lastHitBy: null,
    spawnedOnTurn: state.turnNumber,
  };

  return {
    ...state,
    lootBoxes: [...state.lootBoxes, box],
  };
}

/**
 * Returns empty squares in ranks 3-6 (middle board area) that are not
 * occupied by pieces or existing loot boxes.
 */
function getEmptyMiddleSquares(state: GameState): Square[] {
  const setup = parseFen(state.fen);
  if (setup.isErr) return [];
  const board = setup.value.board;

  const lootBoxSquares = new Set(state.lootBoxes.map(lb => lb.square));
  const result: Square[] = [];

  // Ranks 4-5 correspond to rows 3-4 in 0-indexed
  for (let rank = 3; rank <= 4; rank++) {
    for (let file = 0; file < 8; file++) {
      const sq = (rank * 8 + file) as Square;
      if (board.get(sq) === undefined && !lootBoxSquares.has(sq)) {
        result.push(sq);
      }
    }
  }

  return result;
}

// --- Hit Validation ---

export function validateHit(
  state: GameState,
  pieceSquare: Square,
  lootBoxSquare: Square,
): string | null {
  const setup = parseFen(state.fen);
  if (setup.isErr) return 'Invalid board state';
  const board = setup.value.board;

  // Piece must exist and belong to current player
  const piece = board.get(pieceSquare);
  if (!piece) return 'No piece at that square';
  if (piece.color !== state.turn) return 'Not your piece';

  // Kings cannot hit loot boxes
  if (piece.role === 'king') return 'Kings cannot hit loot boxes';

  // Loot box must exist at target square
  const box = state.lootBoxes.find(lb => lb.square === lootBoxSquare);
  if (!box) return 'No loot box at that square';

  // Must be adjacent (8-directional, 1 square)
  if (!isAdjacent(pieceSquare, lootBoxSquare)) {
    return 'Piece must be adjacent to loot box';
  }

  return null; // valid
}

export function isAdjacent(a: Square, b: Square): boolean {
  const aFile = a % 8;
  const aRank = Math.floor(a / 8);
  const bFile = b % 8;
  const bRank = Math.floor(b / 8);

  const fileDiff = Math.abs(aFile - bFile);
  const rankDiff = Math.abs(aRank - bRank);

  return fileDiff <= 1 && rankDiff <= 1 && (fileDiff + rankDiff > 0);
}

// --- Hit Resolution ---

export function applyHit(
  state: GameState,
  pieceSquare: Square,
  lootBoxSquare: Square,
  rng: () => number = Math.random,
): GameState {
  const setup = parseFen(state.fen);
  if (setup.isErr) return state;
  const board = setup.value.board;
  const piece = board.get(pieceSquare);
  if (!piece) return state;

  const boxIndex = state.lootBoxes.findIndex(lb => lb.square === lootBoxSquare);
  if (boxIndex === -1) return state;

  const box = state.lootBoxes[boxIndex];
  const isQueen = piece.role === 'queen';
  const isPawn = piece.role === 'pawn';

  // Calculate remaining hits (queen does more damage per config)
  const { queenHitsToOpen, hitsToOpen } = CHESS_GOLD_CONFIG.lootBox;
  const queenDamage = Math.ceil(hitsToOpen / queenHitsToOpen);
  const newHitsRemaining = isQueen
    ? Math.max(0, box.hitsRemaining - queenDamage)
    : box.hitsRemaining - 1;

  let current = state;

  if (newHitsRemaining <= 0) {
    // Box opens — roll drop table and distribute reward
    const lastHitBy = state.turn;
    const reward = rollDropTable(CHESS_GOLD_CONFIG.lootBox.dropTable, rng);

    current = distributeReward(current, lastHitBy, reward);

    // Store reward for UI display
    current = {
      ...current,
      lastLootBoxReward: { player: lastHitBy, reward },
    };

    // Increment lootBoxesCollected
    current = {
      ...current,
      lootBoxesCollected: {
        ...current.lootBoxesCollected,
        [lastHitBy]: current.lootBoxesCollected[lastHitBy] + 1,
      },
    };

    // Remove the loot box
    current = {
      ...current,
      lootBoxes: current.lootBoxes.filter((_, i) => i !== boxIndex),
    };
  } else {
    // Update hit count on the box
    const updatedBoxes = current.lootBoxes.map((lb, i) =>
      i === boxIndex
        ? { ...lb, hitsRemaining: newHitsRemaining, lastHitBy: state.turn }
        : lb,
    );
    current = { ...current, lootBoxes: updatedBoxes };
  }

  // Turn consumption: pawn hits do NOT consume the turn
  if (!isPawn) {
    current = {
      ...current,
      turn: state.turn === 'white' ? 'black' : 'white',
    };
  }

  return current;
}

// --- Drop Table ---

export function rollDropTable(
  dropTable: LootBoxDrop[],
  rng: () => number = Math.random,
): LootBoxDrop['contents'] {
  const totalWeight = dropTable.reduce((sum, drop) => sum + drop.weight, 0);
  let roll = rng() * totalWeight;

  for (const drop of dropTable) {
    roll -= drop.weight;
    if (roll <= 0) {
      return drop.contents;
    }
  }

  // Fallback to last entry (should not happen with valid weights)
  return dropTable[dropTable.length - 1].contents;
}

// --- Reward Distribution ---

function distributeReward(
  state: GameState,
  player: Color,
  reward: LootBoxDrop['contents'],
): GameState {
  switch (reward.type) {
    case 'gold':
      return {
        ...state,
        gold: {
          ...state.gold,
          [player]: state.gold[player] + reward.amount,
        },
      };

    case 'piece': {
      // King from drop table -> treat as queen
      const pieceRole = reward.piece === 'king' ? 'queen' : reward.piece;
      const item: InventoryItem = { type: 'piece', pieceType: pieceRole };
      return {
        ...state,
        inventory: {
          ...state.inventory,
          [player]: [...state.inventory[player], item],
        },
      };
    }

    case 'item': {
      const item: InventoryItem = { type: 'item', itemType: reward.item };
      return {
        ...state,
        inventory: {
          ...state.inventory,
          [player]: [...state.inventory[player], item],
        },
      };
    }

    default:
      return state;
  }
}

// --- Auto-hit on move ---

/**
 * After a move, check if the piece was attacking a loot box square from
 * its original position and landed adjacent. If so, auto-hit.
 * Called from game.ts after applyMove.
 */
export function autoHitAfterMove(
  state: GameState,
  from: Square,
  to: Square,
  preMoveBoard: Board,
): GameState {
  if (!state.modeConfig.lootBoxes || state.lootBoxes.length === 0) return state;

  const piece = preMoveBoard.get(from);
  if (!piece || piece.role === 'king') return state;

  for (const box of state.lootBoxes) {
    if (isAdjacent(to, box.square) && wasAttacking(preMoveBoard, from, piece.role, box.square)) {
      // Auto-hit — but don't consume the turn (the move already did)
      return applyAutoHit(state, to, box.square);
    }
  }

  return state;
}

/**
 * Check if a piece of the given role on `from` was attacking `target`
 * on the given board (line of sight for sliding pieces, pattern for others).
 */
function wasAttacking(board: Board, from: number, role: Role, target: number): boolean {
  const fromFile = from % 8;
  const fromRank = Math.floor(from / 8);
  const targetFile = target % 8;
  const targetRank = Math.floor(target / 8);

  const df = targetFile - fromFile;
  const dr = targetRank - fromRank;

  switch (role) {
    case 'rook':
      return (df === 0 || dr === 0) && isClearPath(board, from, target);
    case 'bishop':
      return Math.abs(df) === Math.abs(dr) && df !== 0 && isClearPath(board, from, target);
    case 'queen':
      return ((df === 0 || dr === 0) || (Math.abs(df) === Math.abs(dr) && df !== 0))
        && isClearPath(board, from, target);
    case 'knight': {
      const adf = Math.abs(df);
      const adr = Math.abs(dr);
      return (adf === 1 && adr === 2) || (adf === 2 && adr === 1);
    }
    case 'pawn': {
      // Pawns attack diagonally forward by 1
      const color = board.get(from)?.color;
      const forward = color === 'white' ? 1 : -1;
      return dr === forward && Math.abs(df) === 1;
    }
    default:
      return false;
  }
}

/**
 * Check if the path between two squares is clear of pieces (exclusive of endpoints).
 */
function isClearPath(board: Board, from: number, to: number): boolean {
  const fromFile = from % 8;
  const fromRank = Math.floor(from / 8);
  const toFile = to % 8;
  const toRank = Math.floor(to / 8);

  const stepFile = Math.sign(toFile - fromFile);
  const stepRank = Math.sign(toRank - fromRank);

  let f = fromFile + stepFile;
  let r = fromRank + stepRank;

  while (f !== toFile || r !== toRank) {
    const sq = r * 8 + f;
    if (board.get(sq) !== undefined) return false;
    f += stepFile;
    r += stepRank;
  }

  return true;
}

/**
 * Apply a hit without consuming the turn (the move already consumed it).
 * The turn has already been flipped by applyMove, so we need to determine
 * the acting player from the post-move state (it's the opponent's turn now,
 * so the hitter is the opposite color).
 */
function applyAutoHit(
  state: GameState,
  pieceSquare: Square,
  lootBoxSquare: Square,
): GameState {
  const boxIndex = state.lootBoxes.findIndex(lb => lb.square === lootBoxSquare);
  if (boxIndex === -1) return state;

  const postMoveFen = parseFen(state.fen);
  if (postMoveFen.isErr) return state;
  const piece = postMoveFen.value.board.get(pieceSquare);
  if (!piece) return state;

  const hitter = piece.color;
  const box = state.lootBoxes[boxIndex];
  const isQueen = piece.role === 'queen';

  const { queenHitsToOpen, hitsToOpen } = CHESS_GOLD_CONFIG.lootBox;
  const queenDamage = Math.ceil(hitsToOpen / queenHitsToOpen);
  const newHitsRemaining = isQueen
    ? Math.max(0, box.hitsRemaining - queenDamage)
    : box.hitsRemaining - 1;

  let current = state;

  if (newHitsRemaining <= 0) {
    const reward = rollDropTable(CHESS_GOLD_CONFIG.lootBox.dropTable);
    current = distributeReward(current, hitter, reward);
    current = {
      ...current,
      lastLootBoxReward: { player: hitter, reward },
      lootBoxesCollected: {
        ...current.lootBoxesCollected,
        [hitter]: current.lootBoxesCollected[hitter] + 1,
      },
      lootBoxes: current.lootBoxes.filter((_, i) => i !== boxIndex),
    };
  } else {
    const updatedBoxes = current.lootBoxes.map((lb, i) =>
      i === boxIndex
        ? { ...lb, hitsRemaining: newHitsRemaining, lastHitBy: hitter }
        : lb,
    );
    current = { ...current, lootBoxes: updatedBoxes };
  }

  // Do NOT flip turn — the move already consumed the turn
  return current;
}
