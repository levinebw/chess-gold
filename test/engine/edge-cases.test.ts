import { describe, it, expect } from 'vitest';
import { createGameState, createCheckState } from '../helpers/gameState.ts';
import { CHESS_GOLD_CONFIG } from '../../src/engine/config.ts';
import type { Square } from '../../src/engine/types.ts';
import { awardCaptureReward, canAffordPiece, deductPurchaseCost, awardTurnIncome } from '../../src/engine/gold.ts';
import { isValidPlacement, placementResolvesCheck, getValidPlacementSquares } from '../../src/engine/placement.ts';
import { canPromote, applyPromotion } from '../../src/engine/promotion.ts';
import { getLegalMoves, applyMove, isInCheck } from '../../src/engine/position.ts';

function sq(name: string): Square {
  const col = name.charCodeAt(0) - 'a'.charCodeAt(0);
  const row = parseInt(name[1]) - 1;
  return (row * 8 + col) as Square;
}

describe('Edge Cases', () => {
  // --- Gold arithmetic edge cases ---

  describe('gold arithmetic edge cases', () => {
    it('gold stays correct after multiple fractional captures (no floating point drift)', () => {
      // 0.5 * 7 = 3.5 — a classic floating point trouble spot
      let state = createGameState({ gold: { white: 0, black: 0 } });
      for (let i = 0; i < 7; i++) {
        state = awardCaptureReward(state, 'pawn'); // +0.5 each
      }
      expect(state.gold.white).toBe(3.5);
    });

    it('gold is exactly 0 after spending all gold', () => {
      // Start with exactly 1, buy a pawn (costs 1)
      const state = createGameState({ gold: { white: 1, black: 3 } });
      const result = deductPurchaseCost(state, 'pawn');
      expect(result.gold.white).toBe(0);
    });

    it('deductPurchaseCost does not affect opponent gold', () => {
      const state = createGameState({ gold: { white: 10, black: 7 } });
      const result = deductPurchaseCost(state, 'queen');
      expect(result.gold.black).toBe(7);
    });

    it('awardTurnIncome does not affect opponent gold', () => {
      const state = createGameState({ gold: { white: 3, black: 5 } });
      const result = awardTurnIncome(state);
      expect(result.gold.black).toBe(5);
    });
  });

  // --- Placement + check interactions ---

  describe('placement + check interactions', () => {
    it('placement on a valid square is rejected if it does not resolve check', () => {
      // White king on e1 in check from black rook on a1
      // Placing a knight on b3 is a valid zone square but doesn't block the check
      const state = createCheckState('white');
      expect(placementResolvesCheck(state, 'knight', sq('b3'))).toBe(false);
    });

    it('placement that interposes between attacker and king resolves check', () => {
      // White king e1, black rook a1. Place a rook on c1 to block.
      const state = createCheckState('white');
      expect(placementResolvesCheck(state, 'rook', sq('c1'))).toBe(true);
    });

    it('all valid placement squares are within the correct zone', () => {
      // Verify getValidPlacementSquares never returns out-of-zone squares
      const state = createGameState({
        turn: 'black',
        gold: { white: 3, black: 10 },
      });
      const squares = getValidPlacementSquares(state, 'rook');
      for (const s of squares) {
        const row = Math.floor(s / 8) + 1;
        expect(row).toBeGreaterThanOrEqual(6);
        expect(row).toBeLessThanOrEqual(8);
      }
    });

    it('cannot place on a square occupied by own king', () => {
      // White king on e1 — can't place a piece on e1
      const state = createGameState({ gold: { white: 10, black: 3 } });
      expect(isValidPlacement(state, 'rook', sq('e1'))).toBe(false);
    });
  });

  // --- Promotion edge cases ---

  describe('promotion edge cases', () => {
    it('pawn on last rank with exactly 1 gold can promote', () => {
      const state = createGameState({
        fen: '4Pk2/8/8/8/8/8/8/4K3 w - - 0 1',
        gold: { white: 1, black: 3 },
      });
      expect(canPromote(state, sq('e8'))).toBe(true);
      const result = applyPromotion(state, sq('e8'), 'queen');
      expect(result.gold.white).toBe(0);
    });

    it('pawn on last rank with 0 gold cannot promote (stuck pawn)', () => {
      const state = createGameState({
        fen: '4Pk2/8/8/8/8/8/8/4K3 w - - 0 1',
        gold: { white: 0, black: 3 },
      });
      expect(canPromote(state, sq('e8'))).toBe(false);
    });

    it('promoting does not affect opponent gold', () => {
      const state = createGameState({
        fen: '4Pk2/8/8/8/8/8/8/4K3 w - - 0 1',
        gold: { white: 5, black: 7 },
      });
      const result = applyPromotion(state, sq('e8'), 'queen');
      expect(result.gold.black).toBe(7);
    });

    it('invalid promotion target returns unchanged state', () => {
      const state = createGameState({
        fen: '4Pk2/8/8/8/8/8/8/4K3 w - - 0 1',
        gold: { white: 5, black: 3 },
      });
      // 'pawn' is not a valid promotion target
      const result = applyPromotion(state, sq('e8'), 'pawn');
      expect(result.fen).toBe(state.fen);
      expect(result.gold.white).toBe(state.gold.white);
    });
  });

  // --- Position edge cases ---

  describe('position edge cases', () => {
    it('en passant is only available on the move immediately after the two-square advance', () => {
      // FEN with en passant square set: white pawn e5, black pawn d5 just advanced
      const stateWithEp = createGameState({
        fen: '4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1',
      });
      const moves = getLegalMoves(stateWithEp);
      const pawnMoves = moves.get(sq('e5'));
      expect(pawnMoves).toContain(sq('d6'));

      // Same position but WITHOUT en passant square — capture not available
      const stateNoEp = createGameState({
        fen: '4k3/8/8/3pP3/8/8/8/4K3 w - - 0 1',
      });
      const movesNoEp = getLegalMoves(stateNoEp);
      const pawnMovesNoEp = movesNoEp.get(sq('e5'));
      // Without en passant, pawn on e5 can only go to e6
      if (pawnMovesNoEp) {
        expect(pawnMovesNoEp).not.toContain(sq('d6'));
      }
    });

    it('applyMove preserves gold values (no accidental reset)', () => {
      const state = createGameState({
        gold: { white: 7.5, black: 4.5 },
      });
      // Move king e1 to d1 (non-capture)
      const result = applyMove(state, sq('e1'), sq('d1'));
      expect(result.gold.white).toBe(7.5);
      expect(result.gold.black).toBe(4.5);
    });

    it('multiple captures in sequence track gold correctly', () => {
      // White knight captures black pawn on d5, then from the resulting state
      // we verify gold accumulated correctly
      const state = createGameState({
        fen: '4k3/8/8/3p4/8/2N5/8/4K3 w - - 0 1',
        gold: { white: 3, black: 3 },
      });
      const after1 = applyMove(state, sq('c3'), sq('d5')); // capture pawn +0.5
      expect(after1.gold.white).toBe(3.5);

      // Now set up another capture from the new state
      // Black knight captures white knight on d5
      const state2 = createGameState({
        ...after1,
        fen: '4k3/8/8/3N4/2n5/8/8/4K3 b - - 0 1',
        turn: 'black',
        gold: { white: 3.5, black: 3 },
      });
      const after2 = applyMove(state2, sq('c4'), sq('d5')); // black captures knight +1.5
      expect(after2.gold.black).toBe(4.5);
    });

    it('king cannot move into check', () => {
      // White king on e1, black rook on a2. King should not be able to move to d2.
      // d2 is on rank 2, attacked by Ra2.
      const state = createGameState({
        fen: '4k3/8/8/8/8/8/r7/4K3 w - - 0 1',
      });
      const moves = getLegalMoves(state);
      const kingMoves = moves.get(sq('e1'));
      // d2 is attacked by the rook on a2 (rank 2)
      expect(kingMoves).not.toContain(sq('d2'));
      expect(kingMoves).not.toContain(sq('e2'));
      expect(kingMoves).not.toContain(sq('f2'));
      // d1 and f1 should still be legal
      expect(kingMoves).toContain(sq('d1'));
      expect(kingMoves).toContain(sq('f1'));
    });
  });

  // --- Cross-module interactions ---

  describe('cross-module interactions', () => {
    it('player can still move (free action) when gold is 0', () => {
      const state = createGameState({ gold: { white: 0, black: 0 } });
      // King should have legal moves even with 0 gold
      const moves = getLegalMoves(state);
      expect(moves.size).toBeGreaterThan(0);
    });

    it('canAffordPiece returns false for all pieces when gold is 0', () => {
      const state = createGameState({ gold: { white: 0, black: 0 } });
      expect(canAffordPiece(state, 'pawn')).toBe(false);
      expect(canAffordPiece(state, 'knight')).toBe(false);
      expect(canAffordPiece(state, 'bishop')).toBe(false);
      expect(canAffordPiece(state, 'rook')).toBe(false);
      expect(canAffordPiece(state, 'queen')).toBe(false);
    });
  });
});
