import { describe, it, expect } from 'vitest';
import { createGameState, createCheckState } from '../helpers/gameState.ts';
import { CHESS_GOLD_CONFIG } from '../../src/engine/config.ts';
import type { GameState, Square } from '../../src/engine/types.ts';
import {
  getLegalMoves,
  isInCheck,
  isCheckmate,
  isStalemate,
  applyMove,
} from '../../src/engine/position.ts';

function sq(name: string): Square {
  const col = name.charCodeAt(0) - 'a'.charCodeAt(0);
  const row = parseInt(name[1]) - 1;
  return (row * 8 + col) as Square;
}

describe('Position / Move Validation', () => {
  // --- Legal moves ---

  describe('legal moves', () => {
    it('returns legal moves for the active player', () => {
      // Kings-only starting position — white king on e1 has moves
      const state = createGameState();
      const moves = getLegalMoves(state);

      // King on e1 should have legal moves (d1, d2, e2, f1, f2)
      expect(moves.size).toBeGreaterThan(0);
      const kingMoves = moves.get(sq('e1'));
      expect(kingMoves).toBeDefined();
      expect(kingMoves!.length).toBeGreaterThan(0);
    });

    it('king can move to adjacent unattacked squares', () => {
      // White king on e1, black king on e8 — plenty of room
      const state = createGameState();
      const moves = getLegalMoves(state);
      const kingMoves = moves.get(sq('e1'))!;

      // e1 king should be able to go to d1, d2, e2, f1, f2
      expect(kingMoves).toContain(sq('d1'));
      expect(kingMoves).toContain(sq('d2'));
      expect(kingMoves).toContain(sq('e2'));
      expect(kingMoves).toContain(sq('f1'));
      expect(kingMoves).toContain(sq('f2'));
    });

    it('returns empty moves for pieces with no legal moves', () => {
      // White king boxed in by own pieces — construct a position
      // White king on a1, white pawns on a2 and b2, white rook on b1
      // King has no moves (all adjacent squares occupied by own pieces)
      const state = createGameState({
        fen: '4k3/8/8/8/8/8/PP6/KR6 w - - 0 1',
      });
      const moves = getLegalMoves(state);
      const kingMoves = moves.get(sq('a1'));

      // King on a1 is hemmed in by own pawn on a2, pawn on b2, rook on b1
      // No legal king moves (all adjacent squares occupied by friendly pieces)
      expect(kingMoves === undefined || kingMoves.length === 0).toBe(true);
    });
  });

  // --- Check detection ---

  describe('check detection', () => {
    it('detects when the king is in check', () => {
      // Black rook on a1 checks white king on e1
      const state = createCheckState('white');

      expect(isInCheck(state)).toBe(true);
    });

    it('returns false when the king is not in check', () => {
      const state = createGameState();

      expect(isInCheck(state)).toBe(false);
    });
  });

  // --- Checkmate detection ---

  describe('checkmate detection', () => {
    it('detects checkmate', () => {
      // Back-rank mate: white king on h1, black rook on a1, black queen on a2
      // White king is checkmated — no escape
      // FEN: 4k3/8/8/8/8/8/q7/7K w - - 0 1 -- not quite checkmate
      // Better: king on g1, black queen on a1, black rook on a2 — still tricky
      // Classic: Kh1, black Qg2 is checkmate (Qg2#)
      // FEN: 4k3/8/8/8/8/8/6q1/7K w - - 0 1
      const state = createGameState({
        fen: '4k3/8/8/8/8/8/6q1/7K w - - 0 1',
      });

      expect(isCheckmate(state)).toBe(true);
    });

    it('does not report checkmate when escape is possible', () => {
      // King in check but can move
      const state = createCheckState('white');

      // White king on e1, black rook on a1 — king can go to d2, e2, f2, f1
      expect(isCheckmate(state)).toBe(false);
    });
  });

  // --- Stalemate detection ---

  describe('stalemate detection', () => {
    it('detects stalemate (no legal moves, not in check)', () => {
      // Black king on a8, white king on b6, white queen on c7
      // Black to move — not in check but no legal moves
      // FEN: k7/2Q5/1K6/8/8/8/8/8 b - - 0 1
      const state = createGameState({
        fen: 'k7/2Q5/1K6/8/8/8/8/8 b - - 0 1',
        turn: 'black',
      });

      expect(isStalemate(state)).toBe(true);
    });
  });

  // --- Move application ---

  describe('move application', () => {
    it('updates FEN after a legal move', () => {
      const state = createGameState();
      const originalFen = state.fen;

      // Move white king from e1 to e2
      const result = applyMove(state, sq('e1'), sq('e2'));

      expect(result.fen).not.toBe(originalFen);
      // New FEN should have king on e2, not e1
      expect(result.fen).toContain('K');
    });

    it('switches the active turn after a move', () => {
      const state = createGameState({ turn: 'white' });

      const result = applyMove(state, sq('e1'), sq('e2'));

      expect(result.turn).toBe('black');
    });
  });

  // --- En passant ---

  describe('en passant', () => {
    it('en passant works normally for pawns that advance two squares', () => {
      // White pawn on e5, black pawn just advanced from d7 to d5
      // FEN has en passant square d6 set
      // FEN: 4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1
      const state = createGameState({
        fen: '4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1',
        turn: 'white',
      });

      const moves = getLegalMoves(state);
      const pawnMoves = moves.get(sq('e5'));

      // e5 pawn should be able to capture en passant on d6
      expect(pawnMoves).toBeDefined();
      expect(pawnMoves).toContain(sq('d6'));
    });

    it('en passant capture awards 0.5 gold', () => {
      // After en passant capture, the capturing player gets 0.5 gold (pawn capture reward)
      // Assumption: applyMove handles gold for captures internally,
      // or the caller uses awardCaptureReward separately. We test the
      // end result — after the en passant move, gold should increase by 0.5.
      const state = createGameState({
        fen: '4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1',
        turn: 'white',
        gold: { white: 3, black: 3 },
      });

      // Apply en passant: e5 captures d6
      const result = applyMove(state, sq('e5'), sq('d6'));

      expect(result.gold.white).toBe(3 + CHESS_GOLD_CONFIG.captureRewards.pawn);
    });
  });
});
