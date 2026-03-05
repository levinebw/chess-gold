import { describe, it, expect } from 'vitest';
import { createGameState } from '../helpers/gameState.ts';
import { CHESS_GOLD_CONFIG } from '../../src/engine/config.ts';
import type { GameState, PurchasableRole, Square } from '../../src/engine/types.ts';
import { canPromote, applyPromotion } from '../../src/engine/promotion.ts';

// chessops squares: a1=0, row N = (N-1)*8 .. (N-1)*8+7
// Row 8: 56-63, Row 7: 48-55, Row 1: 0-7, Row 2: 8-15
function sq(name: string): Square {
  const col = name.charCodeAt(0) - 'a'.charCodeAt(0);
  const row = parseInt(name[1]) - 1;
  return (row * 8 + col) as Square;
}

describe('Pawn Promotion', () => {
  // --- Promotion eligibility ---

  describe('promotion eligibility', () => {
    it('allows promotion when pawn reaches the last rank and player has 1+ gold', () => {
      // White pawn on e8 (last rank for white), white has gold
      // FEN: 4Pk2/8/8/8/8/8/8/4K3 w - - 0 1
      // (white pawn on e8, black king on f8, white king on e1)
      const state = createGameState({
        fen: '4Pk2/8/8/8/8/8/8/4K3 w - - 0 1',
        gold: { white: 3, black: 3 },
      });

      expect(canPromote(state, sq('e8'))).toBe(true);
    });

    it('rejects promotion when gold is less than 1', () => {
      const state = createGameState({
        fen: '4Pk2/8/8/8/8/8/8/4K3 w - - 0 1',
        gold: { white: 0.5, black: 3 },
      });

      expect(canPromote(state, sq('e8'))).toBe(false);
    });

    it('rejects promotion when pawn is not on the last rank', () => {
      // White pawn on e7 — not yet on last rank
      const state = createGameState({
        fen: '4k3/4P3/8/8/8/8/8/4K3 w - - 0 1',
        gold: { white: 3, black: 3 },
      });

      expect(canPromote(state, sq('e7'))).toBe(false);
    });

    it('rejects promotion of a piece that is not a pawn', () => {
      // White rook on e8 — not a pawn, can't promote
      const state = createGameState({
        fen: '4Rk2/8/8/8/8/8/8/4K3 w - - 0 1',
        gold: { white: 3, black: 3 },
      });

      expect(canPromote(state, sq('e8'))).toBe(false);
    });
  });

  // --- Promotion cost ---

  describe('promotion cost', () => {
    it('deducts 1 gold for promotion', () => {
      const state = createGameState({
        fen: '4Pk2/8/8/8/8/8/8/4K3 w - - 0 1',
        gold: { white: 3, black: 3 },
      });

      const result = applyPromotion(state, sq('e8'), 'queen');
      expect(result.gold.white).toBe(3 - CHESS_GOLD_CONFIG.promotionCost);
    });

    it('reads promotion cost from config', () => {
      expect(CHESS_GOLD_CONFIG.promotionCost).toBe(1);
    });

    it('allows promotion when gold is exactly 1', () => {
      const state = createGameState({
        fen: '4Pk2/8/8/8/8/8/8/4K3 w - - 0 1',
        gold: { white: 1, black: 3 },
      });

      expect(canPromote(state, sq('e8'))).toBe(true);

      const result = applyPromotion(state, sq('e8'), 'queen');
      expect(result.gold.white).toBe(0);
    });
  });

  // --- Promotion choices ---

  describe('promotion choices', () => {
    const baseFen = '4Pk2/8/8/8/8/8/8/4K3 w - - 0 1';

    it('can promote to a queen', () => {
      const state = createGameState({ fen: baseFen, gold: { white: 5, black: 3 } });
      const result = applyPromotion(state, sq('e8'), 'queen');

      // FEN should now have a queen on e8 instead of a pawn
      expect(result.fen).toContain('Q');
    });

    it('can promote to a rook', () => {
      const state = createGameState({ fen: baseFen, gold: { white: 5, black: 3 } });
      const result = applyPromotion(state, sq('e8'), 'rook');

      expect(result.fen).toContain('R');
    });

    it('can promote to a bishop', () => {
      const state = createGameState({ fen: baseFen, gold: { white: 5, black: 3 } });
      const result = applyPromotion(state, sq('e8'), 'bishop');

      expect(result.fen).toContain('B');
    });

    it('can promote to a knight', () => {
      const state = createGameState({ fen: baseFen, gold: { white: 5, black: 3 } });
      const result = applyPromotion(state, sq('e8'), 'knight');

      expect(result.fen).toContain('N');
    });

    it('cannot promote to a king', () => {
      const state = createGameState({ fen: baseFen, gold: { white: 5, black: 3 } });

      // 'king' is not a PurchasableRole, so this should be rejected at runtime.
      // The implementation must guard against this — we test the specific error.
      const result = applyPromotion(state, sq('e8'), 'king' as PurchasableRole);
      // Should either throw or return error state — either way, the FEN
      // should NOT contain a second king for white
      expect(result.fen).not.toMatch(/K.*K/);
    });

    it('cannot promote to a pawn', () => {
      const state = createGameState({ fen: baseFen, gold: { white: 5, black: 3 } });

      const result = applyPromotion(state, sq('e8'), 'pawn');
      // Should not allow pawn-to-pawn "promotion"
      // The pawn on e8 should remain unchanged
      expect(result.fen).toBe(baseFen);
    });
  });

  // --- Stuck pawn ---

  describe('stuck pawn', () => {
    it('pawn remains on last rank when player cannot afford promotion', () => {
      // White pawn on e8 but 0 gold — pawn stays
      const state = createGameState({
        fen: '4Pk2/8/8/8/8/8/8/4K3 w - - 0 1',
        gold: { white: 0, black: 3 },
      });

      expect(canPromote(state, sq('e8'))).toBe(false);

      // The pawn should still be on e8 in the FEN — no forced promotion
      expect(state.fen).toContain('P');
    });
  });
});
