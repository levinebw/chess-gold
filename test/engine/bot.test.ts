import { describe, it, expect } from 'vitest';
import { createGameState } from '../helpers/gameState.ts';
import { createInitialState, applyAction } from '../../src/engine/game.ts';
import { MODE_PRESETS } from '../../src/engine/config.ts';
import { evaluatePosition, evaluateMaterial } from '../../src/engine/bot/evaluate.ts';
import { decideSpending } from '../../src/engine/bot/strategy.ts';
import { findBestMoves, findCheckmateInOne } from '../../src/engine/bot/search.ts';
import { chooseAction } from '../../src/engine/bot/bot.ts';
import { LIZZIE, MAXI, BOT_PERSONAS } from '../../src/engine/bot/personas.ts';
import type { BotPersona } from '../../src/engine/bot/types.ts';
import type { GameState, GameAction, GameError, Square } from '../../src/engine/types.ts';

function sq(name: string): Square {
  const col = name.charCodeAt(0) - 'a'.charCodeAt(0);
  const row = parseInt(name[1]) - 1;
  return (row * 8 + col) as Square;
}

/**
 * A deterministic persona for testing — zero randomness, moderate stats.
 */
const DETERMINISTIC_PERSONA: BotPersona = {
  id: 'test-bot',
  name: 'TestBot',
  description: 'Deterministic test persona',
  avatar: '',
  aggression: 0.5,
  greed: 0.3,
  riskTolerance: 0.5,
  piecePriority: { pawn: 1, knight: 2, bishop: 2, rook: 3, queen: 3 },
  searchDepth: 1,
  randomness: 0,
};

/**
 * An aggressive deterministic persona for comparison tests.
 */
const AGGRESSIVE_PERSONA: BotPersona = {
  id: 'aggro-bot',
  name: 'AggroBot',
  description: 'Aggressive test persona',
  avatar: '',
  aggression: 1.0,
  greed: 0.0,
  riskTolerance: 1.0,
  piecePriority: { pawn: 1, knight: 3, bishop: 1, rook: 2, queen: 3 },
  searchDepth: 1,
  randomness: 0,
};

/**
 * A defensive deterministic persona for comparison tests.
 */
const DEFENSIVE_PERSONA: BotPersona = {
  id: 'def-bot',
  name: 'DefBot',
  description: 'Defensive test persona',
  avatar: '',
  aggression: 0.0,
  greed: 0.8,
  riskTolerance: 0.0,
  piecePriority: { pawn: 3, knight: 2, bishop: 2, rook: 1, queen: 1 },
  searchDepth: 1,
  randomness: 0,
};

// ========================================================================
// evaluate.ts
// ========================================================================

describe('evaluate.ts', () => {
  it('material evaluation: white with more material scores higher than black', () => {
    // White has queen+king, black has only king
    const state = createGameState({
      fen: '4k3/8/8/8/8/8/8/3QK3 w - - 0 1',
      gold: { white: 3, black: 3 },
    });

    const whiteScore = evaluateMaterial(state, 'white');
    const blackScore = evaluateMaterial(state, 'black');

    expect(whiteScore).toBeGreaterThan(0);
    expect(blackScore).toBeLessThan(0);
    // White has +9 (queen), black has -9
    expect(whiteScore).toBe(9);
    expect(blackScore).toBe(-9);
  });

  it('material evaluation: equal material returns 0', () => {
    // Symmetric position: each side has a knight + king
    const state = createGameState({
      fen: '4k3/8/8/4n3/4N3/8/8/4K3 w - - 0 1',
      gold: { white: 3, black: 3 },
    });

    const whiteScore = evaluateMaterial(state, 'white');
    const blackScore = evaluateMaterial(state, 'black');

    expect(whiteScore).toBe(0);
    expect(blackScore).toBe(0);
  });

  it('position evaluation accounts for gold advantage', () => {
    // Same board, but white has more gold
    const richState = createGameState({
      fen: '4k3/8/8/8/8/8/8/4K3 w - - 0 1',
      gold: { white: 20, black: 3 },
    });

    const poorState = createGameState({
      fen: '4k3/8/8/8/8/8/8/4K3 w - - 0 1',
      gold: { white: 3, black: 3 },
    });

    const richScore = evaluatePosition(richState, 'white', DETERMINISTIC_PERSONA);
    const poorScore = evaluatePosition(poorState, 'white', DETERMINISTIC_PERSONA);

    // Having more gold should make the score higher
    expect(richScore).toBeGreaterThan(poorScore);
  });

  it('aggressive persona weights material higher than defensive persona', () => {
    // White has a queen advantage
    const state = createGameState({
      fen: '4k3/8/8/8/8/8/8/3QK3 w - - 0 1',
      gold: { white: 3, black: 3 },
    });

    const aggressiveScore = evaluatePosition(state, 'white', AGGRESSIVE_PERSONA);
    const defensiveScore = evaluatePosition(state, 'white', DEFENSIVE_PERSONA);

    // Aggressive persona has higher material weight (1.0 + aggression * 0.3)
    // plus trade bonus from riskTolerance, so same material advantage
    // should yield a higher score for the aggressive persona
    expect(aggressiveScore).toBeGreaterThan(defensiveScore);
  });

  it('evaluating a position with only kings returns ~0 material', () => {
    const state = createGameState({
      fen: '4k3/8/8/8/8/8/8/4K3 w - - 0 1',
      gold: { white: 3, black: 3 },
    });

    const whiteMaterial = evaluateMaterial(state, 'white');
    const blackMaterial = evaluateMaterial(state, 'black');

    expect(whiteMaterial).toBe(0);
    expect(blackMaterial).toBe(0);
  });
});

// ========================================================================
// strategy.ts
// ========================================================================

describe('strategy.ts', () => {
  it("returns 'save' when goldEconomy is false (Standard Chess mode)", () => {
    const state = createInitialState(MODE_PRESETS['standard']);

    const decision = decideSpending(state, DETERMINISTIC_PERSONA);

    expect(decision.action).toBe('save');
    expect(decision.piece).toBeUndefined();
    expect(decision.square).toBeUndefined();
  });

  it("returns 'buy' when gold is sufficient and greed is low", () => {
    // Lots of gold, low greed, few pieces (just kings) — should want to buy
    const state = createGameState({
      fen: '4k3/8/8/8/8/8/8/4K3 w - - 0 1',
      gold: { white: 20, black: 3 },
    });

    // Use a persona with very low greed
    const lowGreedPersona: BotPersona = {
      ...DETERMINISTIC_PERSONA,
      greed: 0,
    };

    const decision = decideSpending(state, lowGreedPersona);

    expect(decision.action).toBe('buy');
    expect(decision.piece).toBeDefined();
    expect(decision.square).toBeDefined();
  });

  it("returns 'save' when gold is insufficient for any piece", () => {
    // With 0 gold and +1 income = 1 gold total.
    // Cheapest piece is pawn at 1g. BUT kings-only means piece count < 2,
    // so it forces a buy of pawn if placement squares exist.
    // To truly test insufficient gold, we need even less.
    // Actually with goldPerTurn=1 and current gold=0, goldAfterIncome=1.
    // A pawn costs 1, so it's technically affordable. Let's use -1 gold
    // which after income = 0.
    // But gold can't go below 0 in practice. Let's use a state where
    // placement squares don't exist instead.
    // Actually the simplest: set gold to -2 so after +1 = -1, can't afford anything.
    const state = createGameState({
      fen: '4k3/8/8/8/8/8/8/4K3 w - - 0 1',
      gold: { white: -2, black: 3 },
    });

    const decision = decideSpending(state, DETERMINISTIC_PERSONA);

    expect(decision.action).toBe('save');
  });

  it('respects piece priority (aggressive bot prefers knights/queens over pawns)', () => {
    // Give enough gold to buy anything (queen costs 8, + 1 income = need at least 8 gold)
    const state = createGameState({
      fen: '4k3/8/8/8/8/8/8/4K3 w - - 0 1',
      gold: { white: 50, black: 3 },
    });

    // MAXI: piecePriority = { pawn: 1, knight: 3, bishop: 1, rook: 2, queen: 3 }
    const maxiDecision = decideSpending(state, { ...MAXI, randomness: 0 });

    // MAXI prefers knight and queen equally (priority 3), but knight is cheaper (3 vs 8).
    // The sort is by priority desc then price asc, so knight should come first.
    expect(maxiDecision.action).toBe('buy');
    expect(maxiDecision.piece).toBe('knight');
  });

  it('returns a valid placement square in the placement zone', () => {
    const state = createGameState({
      fen: '4k3/8/8/8/8/8/8/4K3 w - - 0 1',
      gold: { white: 50, black: 3 },
    });

    const decision = decideSpending(state, DETERMINISTIC_PERSONA);

    if (decision.action === 'buy' && decision.square !== undefined) {
      // White's placement zone: rows 1-3 (squares 0-23)
      const row = Math.floor(decision.square / 8) + 1;
      expect(row).toBeGreaterThanOrEqual(1);
      expect(row).toBeLessThanOrEqual(3);

      // If it's a pawn, it shouldn't be on row 1 (pawnMinRow = 2)
      if (decision.piece === 'pawn') {
        expect(row).toBeGreaterThanOrEqual(2);
      }
    } else {
      // Should be buying with 50 gold
      expect(decision.action).toBe('buy');
    }
  });
});

// ========================================================================
// search.ts
// ========================================================================

describe('search.ts', () => {
  it('findCheckmateInOne returns a move when mate-in-one exists', () => {
    // Back-rank mate: White rook on a1, black king on g8 with pawns f7/g7/h7
    // Ra1-a8# is checkmate
    const state = createGameState({
      fen: '6k1/5ppp/8/8/8/8/8/R3K3 w - - 0 1',
      gold: { white: 5, black: 5 },
    });

    const mateMove = findCheckmateInOne(state);

    expect(mateMove).not.toBeNull();
    expect(mateMove!.type).toBe('move');
    expect(mateMove!.to).toBe(sq('a8'));
  });

  it('findCheckmateInOne returns null when no mate-in-one', () => {
    // Starting position — no mate in one
    const state = createInitialState();

    const mateMove = findCheckmateInOne(state);

    expect(mateMove).toBeNull();
  });

  it('findBestMoves returns scored moves sorted by score (best first)', () => {
    // Standard chess starting position — many legal moves
    const state = createInitialState(MODE_PRESETS['standard']);

    const moves = findBestMoves(state, DETERMINISTIC_PERSONA);

    expect(moves.length).toBeGreaterThan(0);

    // Verify sorted descending by score
    for (let i = 1; i < moves.length; i++) {
      expect(moves[i - 1].score).toBeGreaterThanOrEqual(moves[i].score);
    }
  });

  it('bot prefers capturing a free piece over a quiet move', () => {
    // White knight on c3 can capture undefended black pawn on d5,
    // or make a quiet move. The capture should score higher.
    const state = createGameState({
      fen: '4k3/8/8/3p4/8/2N5/8/4K3 w - - 0 1',
      gold: { white: 5, black: 5 },
    });

    const moves = findBestMoves(state, DETERMINISTIC_PERSONA);

    expect(moves.length).toBeGreaterThan(0);

    // The best move should be the capture Nxd5
    const bestMove = moves[0];
    expect(bestMove.action.from).toBe(sq('c3'));
    expect(bestMove.action.to).toBe(sq('d5'));
  });

  it('findBestMoves handles positions with no legal moves gracefully', () => {
    // Stalemate position: black king on a8, white king on b6, white queen on c7
    // Black to move — no legal moves (stalemate)
    const state = createGameState({
      fen: 'k7/2Q5/1K6/8/8/8/8/8 b - - 0 1',
      turn: 'black',
      gold: { white: 5, black: 5 },
    });

    const moves = findBestMoves(state, DETERMINISTIC_PERSONA);

    expect(moves).toEqual([]);
  });
});

// ========================================================================
// bot.ts (integration)
// ========================================================================

describe('bot.ts (integration)', () => {
  it('chooseAction returns a valid GameAction for Chess Gold opening position', () => {
    const state = createInitialState(MODE_PRESETS['chess-gold'], 10);

    const action = chooseAction(state, DETERMINISTIC_PERSONA);

    expect(action).toBeDefined();
    expect(['move', 'place']).toContain(action.type);

    // Apply the action to verify it's valid
    const result = applyAction(state, action);
    expect(result).not.toHaveProperty('type', 'error');
  });

  it('chooseAction always takes checkmate-in-one when available', () => {
    // Back-rank mate available
    const state = createGameState({
      fen: '6k1/5ppp/8/8/8/8/8/R3K3 w - - 0 1',
      gold: { white: 5, black: 5 },
    });

    // Test with multiple personas — all should take mate-in-one
    for (const persona of [DETERMINISTIC_PERSONA, AGGRESSIVE_PERSONA, DEFENSIVE_PERSONA]) {
      const action = chooseAction(state, persona);
      expect(action.type).toBe('move');
      if (action.type === 'move') {
        expect(action.to).toBe(sq('a8'));
      }
    }

    // Also verify the result is actually checkmate
    const action = chooseAction(state, DETERMINISTIC_PERSONA);
    const result = applyAction(state, action) as GameState;
    expect(result.status).toBe('checkmate');
    expect(result.winner).toBe('white');
  });

  it('chooseAction works for Standard Chess mode (no gold economy)', () => {
    const state = createInitialState(MODE_PRESETS['standard']);

    const action = chooseAction(state, DETERMINISTIC_PERSONA);

    // In standard chess, actions should be moves (no placement possible)
    expect(action.type).toBe('move');

    // Verify it's a valid action
    const result = applyAction(state, action);
    expect(result).not.toHaveProperty('type', 'error');
  });

  it('chooseAction works with both LIZZIE and MAXI personas', () => {
    const state = createInitialState(MODE_PRESETS['chess-gold'], 10);

    for (const persona of BOT_PERSONAS) {
      const action = chooseAction(state, persona);
      expect(action).toBeDefined();
      expect(['move', 'place']).toContain(action.type);

      // Apply to verify validity
      const result = applyAction(state, action);
      expect(result).not.toHaveProperty('type', 'error');
    }
  });

  it('chooseAction never returns an invalid action (apply result, verify no error)', () => {
    // Test across several different game states and personas
    const testStates: GameState[] = [
      // Opening — kings only, Chess Gold
      createInitialState(MODE_PRESETS['chess-gold'], 5),
      // Opening — standard chess
      createInitialState(MODE_PRESETS['standard']),
      // Midgame-like position with some pieces
      createGameState({
        fen: '4k3/8/8/8/8/2N5/P7/4K3 w - - 0 5',
        gold: { white: 8, black: 8 },
        turnNumber: 5,
      }),
      // Rich position — lots of gold, should buy
      createGameState({
        fen: '4k3/8/8/8/8/8/8/4K3 w - - 0 1',
        gold: { white: 50, black: 50 },
      }),
      // Position with pieces in center
      createGameState({
        fen: 'r3k3/8/8/4N3/3n4/8/8/4K3 w - - 0 1',
        gold: { white: 5, black: 5 },
      }),
    ];

    const testPersonas: BotPersona[] = [
      DETERMINISTIC_PERSONA,
      AGGRESSIVE_PERSONA,
      DEFENSIVE_PERSONA,
    ];

    for (const state of testStates) {
      for (const persona of testPersonas) {
        const action = chooseAction(state, persona);
        expect(action).toBeDefined();
        expect(['move', 'place']).toContain(action.type);

        const result = applyAction(state, action);
        // The result should be a valid GameState, not an error
        const isError = typeof result === 'object' && 'type' in result && result.type === 'error';
        if (isError) {
          // Fail with a descriptive message
          const err = result as GameError;
          expect.fail(
            `Bot returned invalid action for FEN="${state.fen}" persona="${persona.id}": ` +
            `action=${JSON.stringify(action)}, error=${err.message}`
          );
        }
      }
    }
  });
});
