import { describe, it, expect } from 'vitest';
import { createGameState, applyActions } from '../helpers/gameState.ts';
import { expectValidAction, expectIllegalAction } from '../helpers/assertions.ts';
import { CHESS_GOLD_CONFIG, MODE_PRESETS } from '../../src/engine/config.ts';
import type { GameState, GameAction, GameError, Square } from '../../src/engine/types.ts';
import { createInitialState, applyAction } from '../../src/engine/game.ts';

function sq(name: string): Square {
  const col = name.charCodeAt(0) - 'a'.charCodeAt(0);
  const row = parseInt(name[1]) - 1;
  return (row * 8 + col) as Square;
}

describe('Game Reducer', () => {
  // --- Game initialization ---

  describe('game initialization', () => {
    it('creates a game with only kings on the board (e1 and e8)', () => {
      const state = createInitialState();
      // FEN should have kings on e1 and e8, everything else empty
      expect(state.fen).toContain('K');
      expect(state.fen).toContain('k');
      expect(state.fen).toBe('4k3/8/8/8/8/8/8/4K3 w - - 0 1');
    });

    it('starts with white to move', () => {
      const state = createInitialState();
      expect(state.turn).toBe('white');
    });

    it('starts with 3 gold for each player', () => {
      const state = createInitialState();
      expect(state.gold.white).toBe(CHESS_GOLD_CONFIG.startingGold);
      expect(state.gold.black).toBe(CHESS_GOLD_CONFIG.startingGold);
    });

    it('starts with turn number 1', () => {
      const state = createInitialState();
      expect(state.turnNumber).toBe(1);
    });

    it('starts with status active', () => {
      const state = createInitialState();
      expect(state.status).toBe('active');
    });

    it('uses Chess Gold mode config by default', () => {
      const state = createInitialState();
      expect(state.modeConfig.name).toBe('Chess Gold');
      expect(state.modeConfig.goldEconomy).toBe(true);
    });
  });

  // --- Turn management ---

  describe('turn management', () => {
    it('awards +1 gold to the active player at the start of their turn', () => {
      const state = createInitialState();
      // White's first action: should receive +1 gold before move is processed
      // Move king e1 to d1
      const result = applyAction(state, {
        type: 'move',
        from: sq('e1'),
        to: sq('d1'),
      });

      const newState = expectValidAction(result);
      // White started with 3, got +1 income = 4, move is free = 4
      expect(newState.gold.white).toBe(CHESS_GOLD_CONFIG.startingGold + CHESS_GOLD_CONFIG.goldPerTurn);
    });

    it('switches turn from white to black after a move action', () => {
      const state = createInitialState();
      const result = applyAction(state, {
        type: 'move',
        from: sq('e1'),
        to: sq('d1'),
      });

      const newState = expectValidAction(result);
      expect(newState.turn).toBe('black');
    });

    it('switches turn from white to black after a place action', () => {
      const state = createGameState({ gold: { white: 10, black: 3 } });
      const result = applyAction(state, {
        type: 'place',
        piece: 'pawn',
        square: sq('a2'),
        fromInventory: false,
      });

      const newState = expectValidAction(result);
      expect(newState.turn).toBe('black');
    });

    it('increments halfMoveCount after each action', () => {
      const state = createInitialState();
      expect(state.halfMoveCount).toBe(0);

      const result = applyAction(state, {
        type: 'move',
        from: sq('e1'),
        to: sq('d1'),
      });

      const newState = expectValidAction(result);
      expect(newState.halfMoveCount).toBe(1);
    });

    it('increments turnNumber after both players have moved', () => {
      const state = createInitialState();
      expect(state.turnNumber).toBe(1);

      // White moves
      const afterWhite = expectValidAction(applyAction(state, {
        type: 'move',
        from: sq('e1'),
        to: sq('d1'),
      }));
      expect(afterWhite.turnNumber).toBe(1); // Still turn 1

      // Black moves
      const afterBlack = expectValidAction(applyAction(afterWhite, {
        type: 'move',
        from: sq('e8'),
        to: sq('d8'),
      }));
      expect(afterBlack.turnNumber).toBe(2); // Now turn 2
    });

    it('rejects actions when it is not the players turn', () => {
      const state = createInitialState(); // White's turn

      // Try to move black's king on white's turn
      const result = applyAction(state, {
        type: 'move',
        from: sq('e8'),
        to: sq('d8'),
      });

      expectIllegalAction(result);
    });
  });

  // --- Move actions ---

  describe('move actions', () => {
    it('applies a legal move and updates the board', () => {
      const state = createInitialState();
      const result = applyAction(state, {
        type: 'move',
        from: sq('e1'),
        to: sq('d2'),
      });

      const newState = expectValidAction(result);
      // FEN should reflect king moved from e1 to d2
      expect(newState.fen).not.toBe(state.fen);
    });

    it('rejects an illegal move', () => {
      const state = createInitialState();
      // Try to move king from e1 to e3 (2 squares — illegal for king)
      const result = applyAction(state, {
        type: 'move',
        from: sq('e1'),
        to: sq('e3'),
      });

      expectIllegalAction(result);
    });

    it('awards capture gold when a piece is captured', () => {
      // Set up a board where white can capture a black pawn
      // White king e1, white knight c3, black pawn d5 — knight can capture pawn
      const state = createGameState({
        fen: '4k3/8/8/3p4/8/2N5/8/4K3 w - - 0 1',
        gold: { white: 5, black: 5 },
      });

      const result = applyAction(state, {
        type: 'move',
        from: sq('c3'),
        to: sq('d5'),
      });

      const newState = expectValidAction(result);
      // White gets +1 income + 0.5 capture reward for pawn
      expect(newState.gold.white).toBe(
        5 + CHESS_GOLD_CONFIG.goldPerTurn + CHESS_GOLD_CONFIG.captureRewards.pawn,
      );
    });

    it('records the action in actionHistory', () => {
      const state = createInitialState();
      const action: GameAction = {
        type: 'move',
        from: sq('e1'),
        to: sq('d1'),
      };

      const result = applyAction(state, action);
      const newState = expectValidAction(result);

      expect(newState.actionHistory.length).toBe(1);
      expect(newState.actionHistory[0]).toMatchObject({
        type: 'move',
        from: sq('e1'),
        to: sq('d1'),
      });
    });
  });

  // --- Place actions ---

  describe('place actions', () => {
    it('places a piece on a valid square and deducts gold', () => {
      const state = createGameState({ gold: { white: 10, black: 3 } });
      const result = applyAction(state, {
        type: 'place',
        piece: 'knight',
        square: sq('b1'),
        fromInventory: false,
      });

      const newState = expectValidAction(result);
      // Gold: 10 + 1 income - 3 knight cost = 8
      expect(newState.gold.white).toBe(
        10 + CHESS_GOLD_CONFIG.goldPerTurn - CHESS_GOLD_CONFIG.piecePrices.knight,
      );
    });

    it('rejects placement with insufficient gold', () => {
      const state = createGameState({ gold: { white: 0, black: 3 } });
      // Even with +1 income, white has 1g — can't afford knight (3g)
      const result = applyAction(state, {
        type: 'place',
        piece: 'knight',
        square: sq('b1'),
        fromInventory: false,
      });

      expectIllegalAction(result);
    });

    it('rejects placement on an invalid square', () => {
      const state = createGameState({ gold: { white: 10, black: 3 } });
      // Row 5 is mid-board — invalid for placement
      const result = applyAction(state, {
        type: 'place',
        piece: 'knight',
        square: sq('a5'),
        fromInventory: false,
      });

      expectIllegalAction(result);
    });

    it('rejects placement of a piece outside the placement zone', () => {
      const state = createGameState({ gold: { white: 10, black: 3 } });
      // White placing on row 7 — black's side
      const result = applyAction(state, {
        type: 'place',
        piece: 'knight',
        square: sq('a7'),
        fromInventory: false,
      });

      expectIllegalAction(result);
    });

    it('updates the FEN after placement', () => {
      const state = createGameState({ gold: { white: 10, black: 3 } });
      const result = applyAction(state, {
        type: 'place',
        piece: 'knight',
        square: sq('b1'),
        fromInventory: false,
      });

      const newState = expectValidAction(result);
      // FEN should now contain a white knight (N)
      expect(newState.fen).toContain('N');
    });

    it('records the action in actionHistory', () => {
      const state = createGameState({ gold: { white: 10, black: 3 } });
      const action: GameAction = {
        type: 'place',
        piece: 'pawn',
        square: sq('a2'),
        fromInventory: false,
      };

      const result = applyAction(state, action);
      const newState = expectValidAction(result);

      expect(newState.actionHistory.length).toBe(1);
      expect(newState.actionHistory[0]).toMatchObject({
        type: 'place',
        piece: 'pawn',
        square: sq('a2'),
      });
    });
  });

  // --- Game over detection ---

  describe('game over detection', () => {
    it('detects checkmate and sets status to checkmate', () => {
      // White queen on g2 checkmates black king on h1
      // FEN: 4k3/8/8/8/8/8/6q1/7K w - - 0 1
      // Wait — this is checkmate for white (white is mated).
      // Black already delivered mate. So status should be checkmate.
      // Actually, applyAction should detect this AFTER a move is made.
      // Let me set up a position where white's move delivers checkmate.

      // Black king on h8, white queen on g6, white king on f6 (not adjacent to h8).
      // Wait, Kf6 and Kg6 queens... Let me think.
      // Simple back-rank: Black king h8, white rook on a8 delivers mate.
      // But need to get rook there via a move.

      // Setup: White rook on a1, white king on f6, black king on h8.
      // White moves Ra1-a8#.
      // Is this checkmate? Kh8, Ra8. h8 adjacent: g7(Kf6 controls g7!), g8(Ra8 rank 8!), h7(not attacked... wait Kf6 controls e5,e6,e7,f5,f7,g5,g6,g7. h7 not controlled. Ra8: rank 8, a-file. h7 not on those.) So h7 is safe. NOT checkmate.

      // Better: add another piece. White Kf6, Rg1. Black Kh8.
      // Rg1-g8#. g8 is rank 8. Kh8 adjacent: g7(Kf6 controls), g8(rook), h7(not attacked).
      // h7 still safe. Not mate.

      // Need to cover h7. White Kf6, Rf1, Rg1. Nah too complex to set up.

      // Simplest: two rooks, ladder mate final position.
      // White Ra7, Rh6, Ka5. Black Kg8.
      // White plays Rh6-h8#. h8: rank 8. Kg8 adjacent:
      //   f7(Ra7 rank 7!), f8(Rh8 rank 8!), g7(Ra7 rank 7!), h7(Rh8 h-file... wait
      //   Rh8 is on h8. Controls h-file and rank 8. h7 on h-file: attacked!).
      //   Also g8(where king is).
      // ALL adjacent attacked! Checkmate!

      // FEN before move: Black Kg8, White Ka5, Ra7, Rh6
      const state = createGameState({
        fen: '6k1/R7/7R/K7/8/8/8/8 w - - 0 1',
        gold: { white: 5, black: 5 },
      });

      const result = applyAction(state, {
        type: 'move',
        from: sq('h6'),
        to: sq('h8'),
      });

      const newState = expectValidAction(result);
      expect(newState.status).toBe('checkmate');
    });

    it('detects stalemate and sets status to stalemate', () => {
      // Black king on a8, white king on b6, white queen on c7.
      // It's black's turn: not in check, but no legal moves = stalemate.
      // But applyAction needs a move that RESULTS in stalemate.
      // So white moves queen to c7, creating stalemate for black.

      // Before: Ka8(b), Kb6(w), Qb7... no.
      // Setup: Black Ka8, White Kb6. White queen on d7.
      // White plays Qd7-c7. After: Ka8, Kb6, Qc7.
      // Black to move: a8 adjacent = a7(Qc7 rank 7? yes!), b8(Kb6 controls? b6 adj: a5,a6,a7,b5,b7,c5,c6,c7. b8 not adjacent to b6? b6 to b8 is 2 rows, not adjacent. Is b8 attacked by Qc7? c7 rank 7(b8 not rank 7), c-file(b8 not c-file), diag(d8,e9 and b8!). b8 IS on Qc7 diagonal (c7 down-left: b8? No wait, c7 up-left: b8. Yes! Diagonal from c7: up-left is b8. So b8 attacked.).
      // So a7 attacked (rank 7), b7 attacked (Kb6 adjacent), b8 attacked (Qc7 diagonal). That's all adjacent squares for Ka8. Stalemate!

      // Wait, but Ka8 is not in check. Let me verify: Qc7 attacks... c-file, rank 7, diags. a8 not on c-file, not rank 7. Diagonal from c7: b8, a9(off) and d8, e9(off) and b6(king there), a5 and d6, e5, f4, g3, h2. a8 NOT on any diagonal. So Ka8 not in check. ✓ Stalemate.

      const state = createGameState({
        fen: 'k7/3Q4/1K6/8/8/8/8/8 w - - 0 1',
        gold: { white: 5, black: 5 },
      });

      const result = applyAction(state, {
        type: 'move',
        from: sq('d7'),
        to: sq('c7'),
      });

      const newState = expectValidAction(result);
      expect(newState.status).toBe('stalemate');
    });

    it('sets the winner when checkmate occurs', () => {
      const state = createGameState({
        fen: '6k1/R7/7R/K7/8/8/8/8 w - - 0 1',
        gold: { white: 5, black: 5 },
      });

      const result = applyAction(state, {
        type: 'move',
        from: sq('h6'),
        to: sq('h8'),
      });

      const newState = expectValidAction(result);
      expect(newState.winner).toBe('white');
    });

    it('does not set a winner on stalemate', () => {
      const state = createGameState({
        fen: 'k7/3Q4/1K6/8/8/8/8/8 w - - 0 1',
        gold: { white: 5, black: 5 },
      });

      const result = applyAction(state, {
        type: 'move',
        from: sq('d7'),
        to: sq('c7'),
      });

      const newState = expectValidAction(result);
      expect(newState.winner).toBeNull();
    });

    it('rejects actions after game is over', () => {
      const state = createGameState({
        status: 'checkmate',
        winner: 'white',
      });

      const result = applyAction(state, {
        type: 'move',
        from: sq('e1'),
        to: sq('d1'),
      });

      expectIllegalAction(result);
    });
  });

  // --- Full game integration ---

  describe('full game flow', () => {
    it('can play a sequence of moves and placements to reach checkmate', () => {
      // Strategy: both players save gold by moving kings, white buys two rooks
      // (5g each), then delivers ladder mate.
      //
      // Gold tracking (income +1 at start of each player's action):
      // W1: 3+1=4g, move (free) → 4g
      // B1: 3+1=4g, move (free) → 4g
      // W2: 4+1=5g, place rook (-5g) → 0g
      // B2: 4+1=5g, move → 5g
      // W3: 0+1=1g, move → 1g
      // B3: 5+1=6g, move → 6g
      // W4: 1+1=2g, move → 2g
      // B4: 6+1=7g, move → 7g
      // W5: 2+1=3g, move → 3g
      // B5: 7+1=8g, move → 8g
      // W6: 3+1=4g, move → 4g
      // B6: 8+1=9g, move → 9g
      // W7: 4+1=5g, place rook (-5g) → 0g
      // B7: 9+1=10g, move → 10g
      // W8: 0+1=1g, move Ra1-a6+ → 1g
      // B8: 10+1=11g, move Kg6-g7 → 11g
      // W9: 1+1=2g, move Rh1-h7+ → 2g
      // B9: 11+1=12g, move Kg7-g8 → 12g
      // W10: 2+1=3g, move Ra6-a8# → 3g (CHECKMATE)

      const actions: GameAction[] = [
        // Phase 1: Save gold, maneuver kings
        { type: 'move', from: sq('e1'), to: sq('d1') },   // W1: Ke1-d1
        { type: 'move', from: sq('e8'), to: sq('e7') },   // B1: Ke8-e7

        // Phase 2: White places first rook
        { type: 'place', piece: 'rook', square: sq('a1'), fromInventory: false }, // W2: place Ra1 (5g)
        { type: 'move', from: sq('e7'), to: sq('e6') },   // B2: Ke7-e6

        // Phase 3: Continue saving, kings maneuver
        { type: 'move', from: sq('d1'), to: sq('c2') },   // W3: Kd1-c2
        { type: 'move', from: sq('e6'), to: sq('e5') },   // B3: Ke6-e5
        { type: 'move', from: sq('c2'), to: sq('b3') },   // W4: Kc2-b3
        { type: 'move', from: sq('e5'), to: sq('d4') },   // B4: Ke5-d4
        { type: 'move', from: sq('b3'), to: sq('b4') },   // W5: Kb3-b4
        { type: 'move', from: sq('d4'), to: sq('e5') },   // B5: Kd4-e5
        { type: 'move', from: sq('b4'), to: sq('b5') },   // W6: Kb4-b5
        { type: 'move', from: sq('e5'), to: sq('f5') },   // B6: Ke5-f5

        // Phase 4: White places second rook
        { type: 'place', piece: 'rook', square: sq('h1'), fromInventory: false }, // W7: place Rh1 (5g)
        { type: 'move', from: sq('f5'), to: sq('g6') },   // B7: Kf5-g6

        // Phase 5: Ladder mate
        { type: 'move', from: sq('a1'), to: sq('a6') },   // W8: Ra1-a6+ (check!)
        { type: 'move', from: sq('g6'), to: sq('g7') },   // B8: Kg6-g7
        { type: 'move', from: sq('h1'), to: sq('h7') },   // W9: Rh1-h7+ (check!)
        { type: 'move', from: sq('g7'), to: sq('g8') },   // B9: Kg7-g8
        { type: 'move', from: sq('a6'), to: sq('a8') },   // W10: Ra6-a8# (CHECKMATE!)
      ];

      const state = createInitialState();
      const finalState = applyActions(state, actions, applyAction);

      expect(finalState.status).toBe('checkmate');
      expect(finalState.winner).toBe('white');
      expect(finalState.actionHistory.length).toBe(19);
    });
  });
});
