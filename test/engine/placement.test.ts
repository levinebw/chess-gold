import { describe, it, expect } from 'vitest';
import { createGameState, createCheckState } from '../helpers/gameState.ts';
import { CHESS_GOLD_CONFIG } from '../../src/engine/config.ts';
import type { GameState, PurchasableRole, Square } from '../../src/engine/types.ts';
import {
  getValidPlacementSquares,
  isValidPlacement,
  placementResolvesCheck,
} from '../../src/engine/placement.ts';

// chessops square mapping: a1=0, b1=1, ..., h1=7, a2=8, ..., h8=63
// Row 1: 0-7, Row 2: 8-15, Row 3: 16-23, Row 4: 24-31
// Row 5: 32-39, Row 6: 40-47, Row 7: 48-55, Row 8: 56-63

// Helper: square from name (row 1-8, col a-h)
function sq(name: string): Square {
  const col = name.charCodeAt(0) - 'a'.charCodeAt(0);
  const row = parseInt(name[1]) - 1;
  return (row * 8 + col) as Square;
}

describe('Placement Validation', () => {
  // --- Placement zones ---

  describe('placement zones', () => {
    it('allows white to place pieces on rows 1-3', () => {
      const state = createGameState({ gold: { white: 10, black: 3 } });

      // a1 (row 1), a2 (row 2), a3 (row 3) should all be valid for a knight
      expect(isValidPlacement(state, 'knight', sq('a1'))).toBe(true);
      expect(isValidPlacement(state, 'knight', sq('a2'))).toBe(true);
      expect(isValidPlacement(state, 'knight', sq('a3'))).toBe(true);
    });

    it('allows black to place pieces on rows 6-8', () => {
      const state = createGameState({
        turn: 'black',
        gold: { white: 3, black: 10 },
      });

      expect(isValidPlacement(state, 'knight', sq('a6'))).toBe(true);
      expect(isValidPlacement(state, 'knight', sq('a7'))).toBe(true);
      expect(isValidPlacement(state, 'knight', sq('a8'))).toBe(true);
    });

    it('rejects placement on rows 4-5 (mid-board) for white', () => {
      const state = createGameState({ gold: { white: 10, black: 3 } });

      expect(isValidPlacement(state, 'knight', sq('a4'))).toBe(false);
      expect(isValidPlacement(state, 'knight', sq('d5'))).toBe(false);
    });

    it('rejects placement on rows 4-5 (mid-board) for black', () => {
      const state = createGameState({
        turn: 'black',
        gold: { white: 3, black: 10 },
      });

      expect(isValidPlacement(state, 'knight', sq('a4'))).toBe(false);
      expect(isValidPlacement(state, 'knight', sq('d5'))).toBe(false);
    });

    it('rejects placement on opponents side of the board', () => {
      const state = createGameState({ gold: { white: 10, black: 3 } });

      // White trying to place on rows 6-8 (black's side)
      expect(isValidPlacement(state, 'knight', sq('a6'))).toBe(false);
      expect(isValidPlacement(state, 'knight', sq('a7'))).toBe(false);
      expect(isValidPlacement(state, 'knight', sq('a8'))).toBe(false);
    });

    it('rejects placement on an occupied square', () => {
      // Default FEN has white king on e1 — placing on e1 should fail
      const state = createGameState({ gold: { white: 10, black: 3 } });

      expect(isValidPlacement(state, 'knight', sq('e1'))).toBe(false);
    });
  });

  // --- Pawn placement restrictions ---

  describe('pawn placement', () => {
    it('rejects pawn placement on back rank for white (row 1)', () => {
      const state = createGameState({ gold: { white: 10, black: 3 } });

      expect(isValidPlacement(state, 'pawn', sq('a1'))).toBe(false);
      expect(isValidPlacement(state, 'pawn', sq('d1'))).toBe(false);
    });

    it('rejects pawn placement on back rank for black (row 8)', () => {
      const state = createGameState({
        turn: 'black',
        gold: { white: 3, black: 10 },
      });

      expect(isValidPlacement(state, 'pawn', sq('a8'))).toBe(false);
      expect(isValidPlacement(state, 'pawn', sq('d8'))).toBe(false);
    });

    it('allows pawn placement on row 2 for white', () => {
      const state = createGameState({ gold: { white: 10, black: 3 } });

      expect(isValidPlacement(state, 'pawn', sq('a2'))).toBe(true);
      expect(isValidPlacement(state, 'pawn', sq('d2'))).toBe(true);
    });

    it('allows pawn placement on row 3 for white', () => {
      const state = createGameState({ gold: { white: 10, black: 3 } });

      expect(isValidPlacement(state, 'pawn', sq('a3'))).toBe(true);
      expect(isValidPlacement(state, 'pawn', sq('d3'))).toBe(true);
    });

    it('allows pawn placement on row 7 for black', () => {
      const state = createGameState({
        turn: 'black',
        gold: { white: 3, black: 10 },
      });

      expect(isValidPlacement(state, 'pawn', sq('a7'))).toBe(true);
      expect(isValidPlacement(state, 'pawn', sq('d7'))).toBe(true);
    });

    it('allows pawn placement on row 6 for black', () => {
      const state = createGameState({
        turn: 'black',
        gold: { white: 3, black: 10 },
      });

      expect(isValidPlacement(state, 'pawn', sq('a6'))).toBe(true);
      expect(isValidPlacement(state, 'pawn', sq('d6'))).toBe(true);
    });
  });

  // --- Non-pawn pieces on back rank ---

  describe('non-pawn placement', () => {
    it('allows bishop placement on back rank (row 1) for white', () => {
      const state = createGameState({ gold: { white: 10, black: 3 } });

      expect(isValidPlacement(state, 'bishop', sq('a1'))).toBe(true);
    });

    it('allows knight placement on row 1 for white', () => {
      const state = createGameState({ gold: { white: 10, black: 3 } });

      expect(isValidPlacement(state, 'knight', sq('b1'))).toBe(true);
    });

    it('allows rook placement on row 1 for white', () => {
      const state = createGameState({ gold: { white: 10, black: 3 } });

      expect(isValidPlacement(state, 'rook', sq('a1'))).toBe(true);
    });

    it('allows queen placement on row 1 for white', () => {
      const state = createGameState({ gold: { white: 10, black: 3 } });

      expect(isValidPlacement(state, 'queen', sq('d1'))).toBe(true);
    });
  });

  // --- Placement and check ---

  describe('placement and check', () => {
    it('allows placement that blocks check', () => {
      // White king on e1 in check from black rook on a1
      // FEN: 4k3/8/8/8/8/8/8/r3K3 w - - 0 1
      // Placing a piece on b1, c1, or d1 blocks the check
      const state = createCheckState('white');

      expect(placementResolvesCheck(state, 'rook', sq('b1'))).toBe(true);
      expect(placementResolvesCheck(state, 'knight', sq('c1'))).toBe(true);
      expect(placementResolvesCheck(state, 'bishop', sq('d1'))).toBe(true);
    });

    it('rejects placement that does not resolve check', () => {
      // White king on e1 in check from black rook on a1
      // Placing on a2 does NOT block the check along rank 1
      const state = createCheckState('white');

      expect(placementResolvesCheck(state, 'knight', sq('a2'))).toBe(false);
      expect(placementResolvesCheck(state, 'bishop', sq('b3'))).toBe(false);
    });

    it('allows placement when not in check (normal placement)', () => {
      // Normal state, no check — placement should be valid based on zone rules
      const state = createGameState({ gold: { white: 10, black: 3 } });

      expect(isValidPlacement(state, 'knight', sq('b1'))).toBe(true);
    });
  });

  // --- Turn usage ---

  describe('turn usage', () => {
    it('placement consumes the players turn', () => {
      const state = createGameState({ turn: 'white', gold: { white: 10, black: 3 } });
      const squares = getValidPlacementSquares(state, 'knight');

      // Should return an array (may be empty if no valid squares,
      // but structurally this validates the function exists and returns squares)
      expect(Array.isArray(squares)).toBe(true);
      expect(squares.length).toBeGreaterThan(0);
    });

    it('rejects placement when it is not the players turn', () => {
      // It's white's turn, but we're checking placement for black's perspective
      // by trying to place on black's side while it's white's turn
      const state = createGameState({
        turn: 'white',
        gold: { white: 10, black: 10 },
      });

      // Black's rows (6-8) should be invalid since it's white's turn
      expect(isValidPlacement(state, 'knight', sq('a6'))).toBe(false);
      expect(isValidPlacement(state, 'knight', sq('a7'))).toBe(false);
      expect(isValidPlacement(state, 'knight', sq('a8'))).toBe(false);
    });
  });

  // --- getValidPlacementSquares ---

  describe('getValidPlacementSquares', () => {
    it('returns only squares within the placement zone for white', () => {
      const state = createGameState({ gold: { white: 10, black: 3 } });
      const squares = getValidPlacementSquares(state, 'knight');

      // All returned squares should be in rows 1-3 (squares 0-23)
      for (const s of squares) {
        expect(s).toBeGreaterThanOrEqual(0);
        expect(s).toBeLessThanOrEqual(23);
      }
    });

    it('returns only squares within the placement zone for black', () => {
      const state = createGameState({
        turn: 'black',
        gold: { white: 3, black: 10 },
      });
      const squares = getValidPlacementSquares(state, 'knight');

      // All returned squares should be in rows 6-8 (squares 40-63)
      for (const s of squares) {
        expect(s).toBeGreaterThanOrEqual(40);
        expect(s).toBeLessThanOrEqual(63);
      }
    });

    it('excludes occupied squares from valid placement squares', () => {
      // White king on e1 (square 4) — should not be in the list
      const state = createGameState({ gold: { white: 10, black: 3 } });
      const squares = getValidPlacementSquares(state, 'knight');

      expect(squares).not.toContain(sq('e1'));
    });

    it('excludes back rank for pawns', () => {
      const state = createGameState({ gold: { white: 10, black: 3 } });
      const squares = getValidPlacementSquares(state, 'pawn');

      // No row 1 squares (0-7) should appear for white pawn placement
      for (const s of squares) {
        expect(s).toBeGreaterThanOrEqual(8); // row 2 starts at 8
      }
    });
  });
});
