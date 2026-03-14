// Loot box lifecycle: spawning, hit validation, opening, drop table rolling

import { parseFen } from 'chessops/fen';
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

function isAdjacent(a: Square, b: Square): boolean {
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
