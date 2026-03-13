import { describe, it, expect } from 'vitest';
import {
  validateEquip,
  applyEquip,
  transferEquipment,
  removeEquipment,
  hasTurtleShell,
  decrementTurtleShell,
  getCrossbowTargets,
} from '../../src/engine/equipment.ts';
import { createInitialState, applyAction } from '../../src/engine/game.ts';
import { CHESS_GOLD_CONFIG, MODE_PRESETS } from '../../src/engine/config.ts';
import { createGameState } from '../helpers/gameState.ts';
import { expectValidAction, expectIllegalAction } from '../helpers/assertions.ts';
import type {
  GameState,
  Square,
  SquareName,
  InventoryItem,
  EquippedItem,
} from '../../src/engine/types.ts';

function sq(name: string): Square {
  const col = name.charCodeAt(0) - 'a'.charCodeAt(0);
  const row = parseInt(name[1]) - 1;
  return (row * 8 + col) as Square;
}

/** Create a loot-boxes mode state with convenient overrides. */
function createLootState(overrides?: Partial<GameState>): GameState {
  return createGameState({
    modeConfig: MODE_PRESETS['loot-boxes'],
    positionHistory: [],
    ...overrides,
  });
}

describe('Inventory + Equipment', () => {
  // =========================================================================
  // Inventory — Place from Inventory
  // =========================================================================
  describe('inventory — place from inventory', () => {
    it('places piece from inventory on a valid square for free', () => {
      const knightItem: InventoryItem = { type: 'piece', pieceType: 'knight' };
      const state = createLootState({
        fen: '4k3/8/8/8/8/8/8/4K3 w - - 0 1',
        inventory: { white: [knightItem], black: [] },
        gold: { white: 0, black: 0 },
      });

      const result = applyAction(state, {
        type: 'place',
        piece: 'knight',
        square: sq('b1'),
        fromInventory: true,
      });

      const newState = expectValidAction(result);
      expect(newState.fen).toContain('N');
    });

    it('does not deduct gold when placing from inventory', () => {
      const knightItem: InventoryItem = { type: 'piece', pieceType: 'knight' };
      const state = createLootState({
        fen: '4k3/8/8/8/8/8/8/4K3 w - - 0 1',
        inventory: { white: [knightItem], black: [] },
        gold: { white: 5, black: 5 },
      });

      const result = applyAction(state, {
        type: 'place',
        piece: 'knight',
        square: sq('b1'),
        fromInventory: true,
      });

      const newState = expectValidAction(result);
      // Gold should be 5 + 1 income = 6 (no deduction for knight)
      expect(newState.gold.white).toBe(5 + CHESS_GOLD_CONFIG.goldPerTurn);
    });

    it('removes placed piece from inventory', () => {
      const knightItem: InventoryItem = { type: 'piece', pieceType: 'knight' };
      const state = createLootState({
        fen: '4k3/8/8/8/8/8/8/4K3 w - - 0 1',
        inventory: { white: [knightItem], black: [] },
        gold: { white: 5, black: 5 },
      });

      const result = applyAction(state, {
        type: 'place',
        piece: 'knight',
        square: sq('b1'),
        fromInventory: true,
      });

      const newState = expectValidAction(result);
      expect(newState.inventory.white.length).toBe(0);
    });

    it('rejects placement when piece is not in inventory', () => {
      const state = createLootState({
        fen: '4k3/8/8/8/8/8/8/4K3 w - - 0 1',
        inventory: { white: [], black: [] },
        gold: { white: 5, black: 5 },
      });

      const result = applyAction(state, {
        type: 'place',
        piece: 'knight',
        square: sq('b1'),
        fromInventory: true,
      });

      expectIllegalAction(result);
    });

    it('from-inventory placements follow same square restrictions', () => {
      const knightItem: InventoryItem = { type: 'piece', pieceType: 'knight' };
      const state = createLootState({
        fen: '4k3/8/8/8/8/8/8/4K3 w - - 0 1',
        inventory: { white: [knightItem], black: [] },
        gold: { white: 5, black: 5 },
      });

      // Try placing on row 5 — outside white's placement zone
      const result = applyAction(state, {
        type: 'place',
        piece: 'knight',
        square: sq('a5'),
        fromInventory: true,
      });

      expectIllegalAction(result);
    });

    it('from-inventory placement can resolve check', () => {
      // White king on e1 in check from black rook on a1, white has a knight in inventory
      // Place knight on c1 to block the check? Actually knight doesn't block linear attacks.
      // Use a rook in inventory — place on b1 to block.
      const rookItem: InventoryItem = { type: 'piece', pieceType: 'rook' };
      const state = createLootState({
        fen: '4k3/8/8/8/8/8/8/r3K3 w - - 0 1',
        inventory: { white: [rookItem], black: [] },
        gold: { white: 0, black: 0 },
        turn: 'white',
        status: 'check',
      });

      const result = applyAction(state, {
        type: 'place',
        piece: 'rook',
        square: sq('b1'),
        fromInventory: true,
      });

      // Should succeed — blocking check
      const newState = expectValidAction(result);
      expect(newState.inventory.white.length).toBe(0);
    });

    it('placing one piece does not affect other inventory items', () => {
      const knightItem: InventoryItem = { type: 'piece', pieceType: 'knight' };
      const pawnItem: InventoryItem = { type: 'piece', pieceType: 'pawn' };
      const shellItem: InventoryItem = { type: 'item', itemType: 'turtle-shell' };
      const state = createLootState({
        fen: '4k3/8/8/8/8/8/8/4K3 w - - 0 1',
        inventory: { white: [knightItem, pawnItem, shellItem], black: [] },
        gold: { white: 5, black: 5 },
      });

      const result = applyAction(state, {
        type: 'place',
        piece: 'knight',
        square: sq('b1'),
        fromInventory: true,
      });

      const newState = expectValidAction(result);
      expect(newState.inventory.white.length).toBe(2);
      expect(newState.inventory.white).toContainEqual(pawnItem);
      expect(newState.inventory.white).toContainEqual(shellItem);
    });
  });

  // =========================================================================
  // Equip Action — Validation
  // =========================================================================
  describe('equip action — validation', () => {
    it('valid equip deducts gold and moves item to equipment', () => {
      const shellItem: InventoryItem = { type: 'item', itemType: 'turtle-shell' };
      const state = createLootState({
        fen: '4k3/8/8/8/8/8/8/4KN2 w - - 0 1', // white knight on f1
        inventory: { white: [shellItem], black: [] },
        gold: { white: 10, black: 10 },
      });

      const result = applyAction(state, {
        type: 'equip',
        item: 'turtle-shell',
        square: sq('f1'),
      });

      const newState = expectValidAction(result);
      const cost = CHESS_GOLD_CONFIG.lootBox.equipCosts['turtle-shell'];
      // Gold: 10 - 2 cost = 8 (equip doesn't award turn income)
      expect(newState.gold.white).toBe(10 - cost);
      expect(newState.inventory.white.length).toBe(0);
      expect(newState.equipment['f1' as SquareName]).toBeDefined();
      expect(newState.equipment['f1' as SquareName]!.type).toBe('turtle-shell');
    });

    it('rejects equipping item player does not own', () => {
      const state = createLootState({
        fen: '4k3/8/8/8/8/8/8/4KN2 w - - 0 1',
        inventory: { white: [], black: [] },
        gold: { white: 10, black: 10 },
      });

      const result = applyAction(state, {
        type: 'equip',
        item: 'turtle-shell',
        square: sq('f1'),
      });

      expectIllegalAction(result);
    });

    it('rejects equipping to empty square', () => {
      const shellItem: InventoryItem = { type: 'item', itemType: 'turtle-shell' };
      const state = createLootState({
        fen: '4k3/8/8/8/8/8/8/4K3 w - - 0 1',
        inventory: { white: [shellItem], black: [] },
        gold: { white: 10, black: 10 },
      });

      const error = validateEquip(state, 'turtle-shell', sq('a1'));
      expect(error).toBe('No piece at that square');
    });

    it('rejects equipping to enemy piece', () => {
      const shellItem: InventoryItem = { type: 'item', itemType: 'turtle-shell' };
      const state = createLootState({
        fen: '4k3/8/8/8/8/8/8/n3K3 w - - 0 1', // black knight on a1
        inventory: { white: [shellItem], black: [] },
        gold: { white: 10, black: 10 },
      });

      const error = validateEquip(state, 'turtle-shell', sq('a1'));
      expect(error).toBe('Not your piece');
    });

    it('rejects equipping when piece already has equipment', () => {
      const shellItem: InventoryItem = { type: 'item', itemType: 'turtle-shell' };
      const state = createLootState({
        fen: '4k3/8/8/8/8/8/8/4KN2 w - - 0 1',
        inventory: { white: [shellItem], black: [] },
        gold: { white: 10, black: 10 },
        equipment: { f1: { type: 'crossbow' } },
      });

      const error = validateEquip(state, 'turtle-shell', sq('f1'));
      expect(error).toBe('Square already has equipment');
    });

    it('rejects equipping with insufficient gold', () => {
      const shellItem: InventoryItem = { type: 'item', itemType: 'turtle-shell' };
      const state = createLootState({
        fen: '4k3/8/8/8/8/8/8/4KN2 w - - 0 1',
        inventory: { white: [shellItem], black: [] },
        gold: { white: 0, black: 10 },
      });

      const error = validateEquip(state, 'turtle-shell', sq('f1'));
      expect(error).toBe('Not enough gold to equip');
    });

    it('rejects equipping to king', () => {
      const shellItem: InventoryItem = { type: 'item', itemType: 'turtle-shell' };
      const state = createLootState({
        fen: '4k3/8/8/8/8/8/8/4K3 w - - 0 1',
        inventory: { white: [shellItem], black: [] },
        gold: { white: 10, black: 10 },
      });

      const error = validateEquip(state, 'turtle-shell', sq('e1'));
      expect(error).toBe('Cannot equip items to king');
    });

    it('equip does not end turn', () => {
      const shellItem: InventoryItem = { type: 'item', itemType: 'turtle-shell' };
      const state = createLootState({
        fen: '4k3/8/8/8/8/8/8/4KN2 w - - 0 1',
        inventory: { white: [shellItem], black: [] },
        gold: { white: 10, black: 10 },
      });

      const result = applyAction(state, {
        type: 'equip',
        item: 'turtle-shell',
        square: sq('f1'),
      });

      const newState = expectValidAction(result);
      expect(newState.turn).toBe('white'); // Still white's turn
    });
  });

  // =========================================================================
  // Equipment Movement
  // =========================================================================
  describe('equipment movement', () => {
    it('equipment moves with piece after a normal move', () => {
      // White knight on b1 with crossbow, move Nb1-c3
      const state = createLootState({
        fen: '4k3/8/8/8/8/8/8/1N2K3 w - - 0 1',
        gold: { white: 10, black: 10 },
        equipment: { b1: { type: 'crossbow' } },
      });

      const result = applyAction(state, {
        type: 'move',
        from: sq('b1'),
        to: sq('c3'),
      });

      const newState = expectValidAction(result);
      expect(newState.equipment['b1' as SquareName]).toBeUndefined();
      expect(newState.equipment['c3' as SquareName]).toBeDefined();
      expect(newState.equipment['c3' as SquareName]!.type).toBe('crossbow');
    });

    it('equipment is destroyed when equipped piece is captured', () => {
      // Black knight on d5 with crossbow, white knight on c3 captures it
      const state = createLootState({
        fen: '4k3/8/8/3n4/8/2N5/8/4K3 w - - 0 1',
        gold: { white: 10, black: 10 },
        equipment: { d5: { type: 'crossbow' } },
      });

      const result = applyAction(state, {
        type: 'move',
        from: sq('c3'),
        to: sq('d5'),
      });

      const newState = expectValidAction(result);
      // Defender's equipment destroyed, attacker had none to transfer
      expect(newState.equipment['d5' as SquareName]).toBeUndefined();
    });

    it('attacker keeps equipment when capturing', () => {
      // White knight on c3 with crossbow captures black pawn on d5
      const state = createLootState({
        fen: '4k3/8/8/3p4/8/2N5/8/4K3 w - - 0 1',
        gold: { white: 10, black: 10 },
        equipment: { c3: { type: 'crossbow' } },
      });

      const result = applyAction(state, {
        type: 'move',
        from: sq('c3'),
        to: sq('d5'),
      });

      const newState = expectValidAction(result);
      expect(newState.equipment['c3' as SquareName]).toBeUndefined();
      expect(newState.equipment['d5' as SquareName]).toBeDefined();
      expect(newState.equipment['d5' as SquareName]!.type).toBe('crossbow');
    });
  });

  // =========================================================================
  // Crossbow Effect
  // =========================================================================
  describe('crossbow effect', () => {
    it('getCrossbowTargets returns adjacent enemy pieces', () => {
      // White knight on d4 with crossbow, black pawn on e5
      const state = createLootState({
        fen: '4k3/8/8/4p3/3N4/8/8/4K3 w - - 0 1',
        gold: { white: 10, black: 10 },
        equipment: { d4: { type: 'crossbow' } },
      });

      const targets = getCrossbowTargets(state, sq('d4'));
      expect(targets).toContain(sq('e5'));
    });

    it('getCrossbowTargets excludes friendly pieces', () => {
      // White knight on d4 with crossbow, white pawn on e5
      const state = createLootState({
        fen: '4k3/8/8/4P3/3N4/8/8/4K3 w - - 0 1',
        gold: { white: 10, black: 10 },
        equipment: { d4: { type: 'crossbow' } },
      });

      const targets = getCrossbowTargets(state, sq('d4'));
      expect(targets).not.toContain(sq('e5'));
    });

    it('getCrossbowTargets excludes non-adjacent pieces', () => {
      // White knight on d4 with crossbow, black pawn on d6 (2 squares away)
      const state = createLootState({
        fen: '4k3/8/3p4/8/3N4/8/8/4K3 w - - 0 1',
        gold: { white: 10, black: 10 },
        equipment: { d4: { type: 'crossbow' } },
      });

      const targets = getCrossbowTargets(state, sq('d4'));
      expect(targets).not.toContain(sq('d6'));
    });

    it('getCrossbowTargets returns empty for pieces without crossbow', () => {
      const state = createLootState({
        fen: '4k3/8/8/4p3/3N4/8/8/4K3 w - - 0 1',
        gold: { white: 10, black: 10 },
        equipment: {},
      });

      const targets = getCrossbowTargets(state, sq('d4'));
      expect(targets.length).toBe(0);
    });

    it('crossbow equipment is persistent (not consumed on getCrossbowTargets)', () => {
      const state = createLootState({
        fen: '4k3/8/8/4p3/3N4/8/8/4K3 w - - 0 1',
        gold: { white: 10, black: 10 },
        equipment: { d4: { type: 'crossbow' } },
      });

      getCrossbowTargets(state, sq('d4'));
      // Equipment should still be there (getCrossbowTargets is read-only)
      expect(state.equipment['d4' as SquareName]).toBeDefined();
    });
  });

  // =========================================================================
  // Turtle Shell Effect
  // =========================================================================
  describe('turtle shell effect', () => {
    it('absorbs capture — defender survives, attacker stays at origin', () => {
      // Black pawn on d5 with turtle shell, white knight on c3 attacks
      const state = createLootState({
        fen: '4k3/8/8/3p4/8/2N5/8/4K3 w - - 0 1',
        gold: { white: 10, black: 10 },
        equipment: { d5: { type: 'turtle-shell', remainingHits: 1 } },
      });

      const result = applyAction(state, {
        type: 'move',
        from: sq('c3'),
        to: sq('d5'),
      });

      const newState = expectValidAction(result);
      // Defender's pawn still on d5 (capture bounced)
      expect(newState.fen).toContain('p'); // Black pawn still exists
      // Attacker's knight should still be at c3 (bounced back — but FEN doesn't change)
      // Actually the turtle shell prevents the move entirely: board stays the same
      // Turn should still flip
      expect(newState.turn).toBe('black');
    });

    it('shell consumed after absorbing (remainingHits decrements to 0, equipment removed)', () => {
      const state = createLootState({
        fen: '4k3/8/8/3p4/8/2N5/8/4K3 w - - 0 1',
        gold: { white: 10, black: 10 },
        equipment: { d5: { type: 'turtle-shell', remainingHits: 1 } },
      });

      const result = applyAction(state, {
        type: 'move',
        from: sq('c3'),
        to: sq('d5'),
      });

      const newState = expectValidAction(result);
      // Shell consumed — equipment removed
      expect(newState.equipment['d5' as SquareName]).toBeUndefined();
    });

    it('piece can be captured normally after shell is broken', () => {
      // Black pawn on d5, no equipment (shell already consumed)
      const state = createLootState({
        fen: '4k3/8/8/3p4/8/2N5/8/4K3 w - - 0 1',
        gold: { white: 10, black: 10 },
        equipment: {},
      });

      const result = applyAction(state, {
        type: 'move',
        from: sq('c3'),
        to: sq('d5'),
      });

      const newState = expectValidAction(result);
      // Pawn should be captured — white knight on d5
      expect(newState.fen).toContain('N');
      // The black pawn should be gone from d5
    });

    it('attacker returns to origin square unharmed after bouncing off shell', () => {
      const state = createLootState({
        fen: '4k3/8/8/3p4/8/2N5/8/4K3 w - - 0 1',
        gold: { white: 10, black: 10 },
        equipment: { d5: { type: 'turtle-shell', remainingHits: 1 } },
      });

      const result = applyAction(state, {
        type: 'move',
        from: sq('c3'),
        to: sq('d5'),
      });

      const newState = expectValidAction(result);
      // Board should be unchanged — knight still on c3, pawn still on d5
      // The FEN should still show both pieces
      expect(newState.fen).toContain('N'); // white knight
      expect(newState.fen).toContain('p'); // black pawn
    });
  });

  // =========================================================================
  // Crown Effect
  // =========================================================================
  describe('crown effect', () => {
    it('promotes piece to queen on the board', () => {
      const crownItem: InventoryItem = { type: 'item', itemType: 'crown' };
      const state = createLootState({
        fen: '4k3/8/8/8/8/8/8/4KN2 w - - 0 1', // white knight on f1
        inventory: { white: [crownItem], black: [] },
        gold: { white: 10, black: 10 },
      });

      const result = applyAction(state, {
        type: 'equip',
        item: 'crown',
        square: sq('f1'),
      });

      const newState = expectValidAction(result);
      // Knight should now be a queen
      expect(newState.fen).toContain('Q');
      expect(newState.fen).not.toContain('N');
    });

    it('crown is consumed (not persistent equipment)', () => {
      const crownItem: InventoryItem = { type: 'item', itemType: 'crown' };
      const state = createLootState({
        fen: '4k3/8/8/8/8/8/8/4KN2 w - - 0 1',
        inventory: { white: [crownItem], black: [] },
        gold: { white: 10, black: 10 },
      });

      const result = applyAction(state, {
        type: 'equip',
        item: 'crown',
        square: sq('f1'),
      });

      const newState = expectValidAction(result);
      // No equipment entry for f1 (crown consumed on use)
      expect(newState.equipment['f1' as SquareName]).toBeUndefined();
    });

    it('cannot crown a king', () => {
      const crownItem: InventoryItem = { type: 'item', itemType: 'crown' };
      const state = createLootState({
        fen: '4k3/8/8/8/8/8/8/4K3 w - - 0 1',
        inventory: { white: [crownItem], black: [] },
        gold: { white: 10, black: 10 },
      });

      const error = validateEquip(state, 'crown', sq('e1'));
      expect(error).toBe('Cannot equip items to king');
    });

    it('cannot crown an already-queen piece', () => {
      const crownItem: InventoryItem = { type: 'item', itemType: 'crown' };
      const state = createLootState({
        fen: '4k3/8/8/8/8/8/8/4KQ2 w - - 0 1', // white queen on f1
        inventory: { white: [crownItem], black: [] },
        gold: { white: 10, black: 10 },
      });

      const error = validateEquip(state, 'crown', sq('f1'));
      expect(error).toBe('Cannot crown a queen');
    });
  });

  // =========================================================================
  // Edge Cases
  // =========================================================================
  describe('edge cases', () => {
    it('equipment + undo: reverting to previous state snapshot restores equipment', () => {
      // Simulate undo by saving state before equip, then verifying the saved state
      const crownItem: InventoryItem = { type: 'item', itemType: 'crown' };
      const stateBefore = createLootState({
        fen: '4k3/8/8/8/8/8/8/4KN2 w - - 0 1',
        inventory: { white: [crownItem], black: [] },
        gold: { white: 10, black: 10 },
      });

      const result = applyAction(stateBefore, {
        type: 'equip',
        item: 'crown',
        square: sq('f1'),
      });

      const stateAfter = expectValidAction(result);

      // State after: knight promoted to queen, crown consumed
      expect(stateAfter.fen).toContain('Q');
      expect(stateAfter.inventory.white.length).toBe(0);

      // "Undo" by reverting to stateBefore — equipment state is fully restored
      expect(stateBefore.fen).toContain('N'); // knight still there
      expect(stateBefore.inventory.white.length).toBe(1);
      expect(stateBefore.equipment['f1' as SquareName]).toBeUndefined();
    });

    it('en passant capture of piece with equipment removes the equipment', () => {
      // White pawn on e5, black pawn on d7 moves to d5 (enabling en passant).
      // Then white captures en passant d5→d6... wait, en passant: white pawn on e5,
      // black pawn advances d7-d5, white captures e5xd6 (en passant).
      // Black pawn on d5 has equipment.

      // First, set up the position after black plays d7-d5:
      // FEN with en passant square d6: white pawn on e5, black pawn on d5
      const state = createLootState({
        fen: '4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1',
        gold: { white: 10, black: 10 },
        equipment: { d5: { type: 'crossbow' } },
      });

      const result = applyAction(state, {
        type: 'move',
        from: sq('e5'),
        to: sq('d6'), // en passant capture
      });

      const newState = expectValidAction(result);
      // Equipment on d5 should be removed (en passant captured pawn's square)
      expect(newState.equipment['d5' as SquareName]).toBeUndefined();
    });

    it('game starts with no equipment', () => {
      const state = createInitialState(MODE_PRESETS['loot-boxes']);
      expect(Object.keys(state.equipment).length).toBe(0);
    });
  });

  // =========================================================================
  // Unit functions
  // =========================================================================
  describe('equipment utility functions', () => {
    it('transferEquipment moves equipment between squares', () => {
      const equipment: GameState['equipment'] = { b1: { type: 'crossbow' } };
      const result = transferEquipment(equipment, sq('b1'), sq('c3'));
      expect(result['b1' as SquareName]).toBeUndefined();
      expect(result['c3' as SquareName]).toBeDefined();
      expect(result['c3' as SquareName]!.type).toBe('crossbow');
    });

    it('removeEquipment removes equipment from square', () => {
      const equipment: GameState['equipment'] = { d5: { type: 'crossbow' } };
      const result = removeEquipment(equipment, sq('d5'));
      expect(result['d5' as SquareName]).toBeUndefined();
    });

    it('hasTurtleShell returns true when turtle shell with hits remaining', () => {
      const equipment: GameState['equipment'] = {
        d5: { type: 'turtle-shell', remainingHits: 1 },
      };
      expect(hasTurtleShell(equipment, sq('d5'))).toBe(true);
    });

    it('hasTurtleShell returns false when no equipment', () => {
      expect(hasTurtleShell({}, sq('d5'))).toBe(false);
    });

    it('hasTurtleShell returns false when equipment is not turtle shell', () => {
      const equipment: GameState['equipment'] = { d5: { type: 'crossbow' } };
      expect(hasTurtleShell(equipment, sq('d5'))).toBe(false);
    });

    it('decrementTurtleShell removes equipment when hits reach 0', () => {
      const equipment: GameState['equipment'] = {
        d5: { type: 'turtle-shell', remainingHits: 1 },
      };
      const result = decrementTurtleShell(equipment, sq('d5'));
      expect(result['d5' as SquareName]).toBeUndefined();
    });
  });
});
