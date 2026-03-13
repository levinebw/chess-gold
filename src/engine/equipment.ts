// Equipment system: validation, effects, and equipment movement

import { parseFen, makeFen } from 'chessops/fen';
import { makeSquare } from 'chessops';
import type {
  GameState,
  Square,
  ItemType,
  EquippedItem,
  Color,
} from './types.ts';
import { CHESS_GOLD_CONFIG } from './config.ts';

// --- Equip Validation ---

export function validateEquip(
  state: GameState,
  item: ItemType,
  square: Square,
): string | null {
  const player = state.turn;

  // Player must own the item in inventory
  const hasItem = state.inventory[player].some(
    inv => inv.type === 'item' && inv.itemType === item,
  );
  if (!hasItem) return 'Item not in inventory';

  // Target must have a friendly piece
  const setup = parseFen(state.fen);
  if (setup.isErr) return 'Invalid board state';
  const piece = setup.value.board.get(square);
  if (!piece) return 'No piece at that square';
  if (piece.color !== player) return 'Not your piece';

  // Cannot equip to king
  if (piece.role === 'king') return 'Cannot equip items to king';

  // Crown cannot equip to queen (already a queen)
  if (item === 'crown' && piece.role === 'queen') return 'Cannot crown a queen';

  // Target must not already have equipment
  const sqName = makeSquare(square);
  if (state.equipment[sqName]) return 'Square already has equipment';

  // Must have enough gold
  const cost = CHESS_GOLD_CONFIG.lootBox.equipCosts[item];
  if (state.gold[player] < cost) return 'Not enough gold to equip';

  return null; // valid
}

// --- Apply Equip ---

export function applyEquip(
  state: GameState,
  item: ItemType,
  square: Square,
): GameState {
  const player = state.turn;
  const sqName = makeSquare(square);
  const cost = CHESS_GOLD_CONFIG.lootBox.equipCosts[item];

  // Remove item from inventory (first matching)
  const invIndex = state.inventory[player].findIndex(
    inv => inv.type === 'item' && inv.itemType === item,
  );
  const newInventory = [...state.inventory[player]];
  newInventory.splice(invIndex, 1);

  // Deduct gold
  const newGold = state.gold[player] - cost;

  let current: GameState = {
    ...state,
    inventory: {
      ...state.inventory,
      [player]: newInventory,
    },
    gold: {
      ...state.gold,
      [player]: newGold,
    },
  };

  // Crown: immediate promotion to queen, crown is consumed (not persistent equipment)
  if (item === 'crown') {
    current = applyCrownPromotion(current, square, player);
  } else {
    // Add equipment to square
    const equipped: EquippedItem = { type: item };
    if (item === 'turtle-shell') {
      equipped.remainingHits = 1;
    }
    current = {
      ...current,
      equipment: {
        ...current.equipment,
        [sqName]: equipped,
      },
    };
  }

  // Equipping does NOT consume the turn
  return current;
}

// --- Crown Promotion ---

function applyCrownPromotion(
  state: GameState,
  square: Square,
  player: Color,
): GameState {
  const setup = parseFen(state.fen);
  if (setup.isErr) return state;

  // Change piece role to queen
  setup.value.board.set(square, { role: 'queen', color: player });
  const newFen = makeFen(setup.value);

  return {
    ...state,
    fen: newFen,
  };
}

// --- Equipment Movement (called from position.ts/game.ts after moves) ---

export function transferEquipment(
  equipment: GameState['equipment'],
  fromSquare: Square,
  toSquare: Square,
): GameState['equipment'] {
  const fromName = makeSquare(fromSquare);
  const toName = makeSquare(toSquare);

  const eq = equipment[fromName];
  if (!eq) return equipment;

  // Remove from old square, add to new square
  const newEquipment = { ...equipment };
  delete newEquipment[fromName];
  newEquipment[toName] = eq;
  return newEquipment;
}

export function removeEquipment(
  equipment: GameState['equipment'],
  square: Square,
): GameState['equipment'] {
  const sqName = makeSquare(square);
  if (!equipment[sqName]) return equipment;

  const newEquipment = { ...equipment };
  delete newEquipment[sqName];
  return newEquipment;
}

/**
 * Check if a piece at the given square has a turtle shell that can absorb a capture.
 */
export function hasTurtleShell(
  equipment: GameState['equipment'],
  square: Square,
): boolean {
  const sqName = makeSquare(square);
  const eq = equipment[sqName];
  return !!eq && eq.type === 'turtle-shell' && (eq.remainingHits ?? 0) > 0;
}

/**
 * Decrement turtle shell hits. Returns updated equipment.
 * Removes the equipment entry if hits reach 0.
 */
export function decrementTurtleShell(
  equipment: GameState['equipment'],
  square: Square,
): GameState['equipment'] {
  const sqName = makeSquare(square);
  const eq = equipment[sqName];
  if (!eq || eq.type !== 'turtle-shell') return equipment;

  const remaining = (eq.remainingHits ?? 1) - 1;
  if (remaining <= 0) {
    const newEquipment = { ...equipment };
    delete newEquipment[sqName];
    return newEquipment;
  }

  return {
    ...equipment,
    [sqName]: { ...eq, remainingHits: remaining },
  };
}

// --- Crossbow: Adjacent Ranged Capture ---

/**
 * Get squares of enemy pieces that can be captured by a crossbow-equipped piece.
 * Simplified v0.7: captures any adjacent enemy piece without moving.
 */
export function getCrossbowTargets(
  state: GameState,
  square: Square,
): Square[] {
  const sqName = makeSquare(square);
  const eq = state.equipment[sqName];
  if (!eq || eq.type !== 'crossbow') return [];

  const setup = parseFen(state.fen);
  if (setup.isErr) return [];
  const board = setup.value.board;

  const piece = board.get(square);
  if (!piece) return [];

  const targets: Square[] = [];
  const file = square % 8;
  const rank = Math.floor(square / 8);

  for (let df = -1; df <= 1; df++) {
    for (let dr = -1; dr <= 1; dr++) {
      if (df === 0 && dr === 0) continue;
      const nf = file + df;
      const nr = rank + dr;
      if (nf < 0 || nf > 7 || nr < 0 || nr > 7) continue;
      const target = (nr * 8 + nf) as Square;
      const targetPiece = board.get(target);
      if (targetPiece && targetPiece.color !== piece.color) {
        targets.push(target);
      }
    }
  }

  return targets;
}
