import { describe, it, expect } from 'vitest';
import { createGameState } from '../helpers/gameState.ts';
import { expectValidAction, expectIllegalAction } from '../helpers/assertions.ts';
import { CHESS_GOLD_CONFIG } from '../../src/engine/config.ts';
import type { GameAction, Square } from '../../src/engine/types.ts';
import { applyAction } from '../../src/engine/game.ts';

function sq(name: string): Square {
  const col = name.charCodeAt(0) - 'a'.charCodeAt(0);
  const row = parseInt(name[1]) - 1;
  return (row * 8 + col) as Square;
}

// White pawn on e7, black king on h8, white king on e1.
// Pawn can advance to e8 (promotion).
const PROMO_FEN_WHITE = '7k/4P3/8/8/8/8/8/4K3 w - - 0 1';

describe('Promotion via applyAction', () => {
  describe('gold deduction', () => {
    it('deducts promotion cost when promoting a pawn', () => {
      // White has 3g, gets +1 income = 4g, then -1g promotion cost = 3g
      const state = createGameState({
        fen: PROMO_FEN_WHITE,
        gold: { white: 3, black: 3 },
      });

      const result = applyAction(state, {
        type: 'move',
        from: sq('e7'),
        to: sq('e8'),
        promotion: 'queen',
      });

      const newState = expectValidAction(result);
      expect(newState.gold.white).toBe(
        3 + CHESS_GOLD_CONFIG.goldPerTurn - CHESS_GOLD_CONFIG.promotionCost,
      );
    });

    it('allows promotion when gold after income exactly equals promotion cost', () => {
      // White has 0g, gets +1 income = 1g, promotion costs 1g → 0g remaining
      const state = createGameState({
        fen: PROMO_FEN_WHITE,
        gold: { white: 0, black: 3 },
      });

      const result = applyAction(state, {
        type: 'move',
        from: sq('e7'),
        to: sq('e8'),
        promotion: 'queen',
      });

      const newState = expectValidAction(result);
      expect(newState.gold.white).toBe(0);
    });

    it('deducts promotion cost for black promotions', () => {
      // Black pawn on e2, black king on e8, white king on a1.
      // Pawn can advance to e1 (promotion).
      const state = createGameState({
        fen: '4k3/8/8/8/8/8/4p3/K7 b - - 0 1',
        gold: { white: 3, black: 5 },
      });

      const result = applyAction(state, {
        type: 'move',
        from: sq('e2'),
        to: sq('e1'),
        promotion: 'queen',
      });

      const newState = expectValidAction(result);
      expect(newState.gold.black).toBe(
        5 + CHESS_GOLD_CONFIG.goldPerTurn - CHESS_GOLD_CONFIG.promotionCost,
      );
    });
  });

  describe('insufficient gold rejection', () => {
    it('rejects promotion when gold after income is less than promotion cost', () => {
      // White has -0.5g, gets +1 income = 0.5g < 1g promotion cost
      const state = createGameState({
        fen: PROMO_FEN_WHITE,
        gold: { white: -0.5, black: 3 },
      });

      const result = applyAction(state, {
        type: 'move',
        from: sq('e7'),
        to: sq('e8'),
        promotion: 'queen',
      });

      const error = expectIllegalAction(result);
      expect(error.code).toBe('INSUFFICIENT_GOLD');
    });
  });

  describe('correct promoted piece in FEN', () => {
    const promotionChoices = [
      { role: 'queen' as const, fenChar: 'Q' },
      { role: 'rook' as const, fenChar: 'R' },
      { role: 'bishop' as const, fenChar: 'B' },
      { role: 'knight' as const, fenChar: 'N' },
    ];

    for (const { role, fenChar } of promotionChoices) {
      it(`promotes to ${role} and FEN contains ${fenChar}`, () => {
        const state = createGameState({
          fen: PROMO_FEN_WHITE,
          gold: { white: 5, black: 3 },
        });

        const result = applyAction(state, {
          type: 'move',
          from: sq('e7'),
          to: sq('e8'),
          promotion: role,
        });

        const newState = expectValidAction(result);
        // The FEN rank 8 portion should contain the promoted piece
        const rank8 = newState.fen.split('/')[0];
        expect(rank8).toContain(fenChar);
        // Original pawn should no longer be in rank 7
        const rank7 = newState.fen.split('/')[1];
        expect(rank7).not.toContain('P');
      });
    }
  });

  describe('config usage', () => {
    it('uses CHESS_GOLD_CONFIG.promotionCost (not a hardcoded value)', () => {
      // Verify the config value is what we expect (1g)
      expect(CHESS_GOLD_CONFIG.promotionCost).toBe(1);

      // The gold deduction should match the config value exactly
      const state = createGameState({
        fen: PROMO_FEN_WHITE,
        gold: { white: 10, black: 3 },
      });

      const result = applyAction(state, {
        type: 'move',
        from: sq('e7'),
        to: sq('e8'),
        promotion: 'queen',
      });

      const newState = expectValidAction(result);
      // 10 + goldPerTurn - promotionCost
      expect(newState.gold.white).toBe(
        10 + CHESS_GOLD_CONFIG.goldPerTurn - CHESS_GOLD_CONFIG.promotionCost,
      );
    });
  });

  describe('non-promotion moves unaffected', () => {
    it('does not deduct promotion cost for a normal king move', () => {
      const state = createGameState({
        fen: PROMO_FEN_WHITE,
        gold: { white: 3, black: 3 },
      });

      // Move king instead of promoting pawn
      const result = applyAction(state, {
        type: 'move',
        from: sq('e1'),
        to: sq('d1'),
      });

      const newState = expectValidAction(result);
      // Only income applied: 3 + 1 = 4g (no promotion deduction)
      expect(newState.gold.white).toBe(3 + CHESS_GOLD_CONFIG.goldPerTurn);
    });

    it('does not deduct promotion cost for a pawn move that is not to the last rank', () => {
      // White pawn on e2 moves to e3 — not a promotion
      const state = createGameState({
        fen: '4k3/8/8/8/8/8/4P3/4K3 w - - 0 1',
        gold: { white: 3, black: 3 },
      });

      const result = applyAction(state, {
        type: 'move',
        from: sq('e2'),
        to: sq('e3'),
      });

      const newState = expectValidAction(result);
      expect(newState.gold.white).toBe(3 + CHESS_GOLD_CONFIG.goldPerTurn);
    });
  });
});
