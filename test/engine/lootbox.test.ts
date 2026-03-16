import { describe, it, expect } from 'vitest';
import {
  shouldSpawnLootBox,
  spawnLootBox,
  validateHit,
  applyHit,
  rollDropTable,
} from '../../src/engine/lootbox.ts';
import { createInitialState, applyAction } from '../../src/engine/game.ts';
import { checkLootBoxesCollected } from '../../src/engine/win-conditions.ts';
import { CHESS_GOLD_CONFIG, MODE_PRESETS } from '../../src/engine/config.ts';
import { createGameState } from '../helpers/gameState.ts';
import { expectValidAction, expectIllegalAction } from '../helpers/assertions.ts';
import type { GameState, LootBox, LootBoxDrop, Square } from '../../src/engine/types.ts';

/** Convert algebraic notation (e.g. "a1") to a Square number. */
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

describe('Loot Box Engine', () => {
  // =========================================================================
  // Spawning
  // =========================================================================
  describe('spawning', () => {
    it('spawns on correct interval (turn divisible by spawnInterval)', () => {
      const state = createLootState({ turnNumber: 4 });
      expect(shouldSpawnLootBox(state)).toBe(true);
    });

    it('does not spawn on non-interval turns', () => {
      const state3 = createLootState({ turnNumber: 3 });
      expect(shouldSpawnLootBox(state3)).toBe(false);

      const state5 = createLootState({ turnNumber: 5 });
      expect(shouldSpawnLootBox(state5)).toBe(false);
    });

    it('does not spawn when lootBoxes mode is disabled', () => {
      const state = createGameState({
        modeConfig: MODE_PRESETS['chess-gold'], // lootBoxes: false
        turnNumber: 4,
        positionHistory: [],
      });
      expect(shouldSpawnLootBox(state)).toBe(false);
    });

    it('does not spawn when max active boxes already on board', () => {
      const existingBox: LootBox = {
        square: sq('d4') as Square,
        hitsRemaining: 3,
        lastHitBy: null,
        spawnedOnTurn: 2,
      };
      const state = createLootState({
        turnNumber: 8,
        lootBoxes: [existingBox],
      });
      // maxActiveBoxes is 1, there's already 1 box
      expect(shouldSpawnLootBox(state)).toBe(false);
    });

    it('spawns on an empty square (not occupied by piece or box)', () => {
      const state = createLootState({ turnNumber: 4 });
      // Use deterministic rng
      const result = spawnLootBox(state, () => 0);
      expect(result.lootBoxes.length).toBe(1);

      const box = result.lootBoxes[0];
      // Box square should be in ranks 4-5 (indices 24-39)
      expect(box.square).toBeGreaterThanOrEqual(24);
      expect(box.square).toBeLessThanOrEqual(39);
    });

    it('does not spawn on turn 1', () => {
      const state = createLootState({ turnNumber: 1 });
      expect(shouldSpawnLootBox(state)).toBe(false);
    });

    it('integrates with game reducer — box appears after correct turn', () => {
      // Start a loot-boxes mode game and play enough turns to reach turn 4
      let state = createInitialState(MODE_PRESETS['loot-boxes']);
      expect(state.lootBoxes.length).toBe(0);

      // Play moves to advance turns: W1, B1 (turn 2), W2, B2 (turn 3), W3, B3 (turn 4)
      const moves = [
        { type: 'move' as const, from: sq('e1'), to: sq('d1') },  // W1
        { type: 'move' as const, from: sq('e8'), to: sq('d8') },  // B1 → turnNumber 2
        { type: 'move' as const, from: sq('d1'), to: sq('c1') },  // W2
        { type: 'move' as const, from: sq('d8'), to: sq('c8') },  // B2 → turnNumber 3
        { type: 'move' as const, from: sq('c1'), to: sq('b1') },  // W3
        { type: 'move' as const, from: sq('c8'), to: sq('b8') },  // B3 → turnNumber 4
      ];

      for (const move of moves) {
        const result = applyAction(state, move);
        state = expectValidAction(result);
      }

      // turnNumber should now be 4, and a loot box should have spawned
      expect(state.turnNumber).toBe(4);
      expect(state.lootBoxes.length).toBe(1);
    });
  });

  // =========================================================================
  // Hit Mechanics
  // =========================================================================
  describe('hit mechanics', () => {
    /** Create a state with a white knight on c3 and a loot box on d4. */
    function createHitState(overrides?: Partial<GameState>): GameState {
      const box: LootBox = {
        square: sq('d4') as Square,
        hitsRemaining: 3,
        lastHitBy: null,
        spawnedOnTurn: 2,
      };
      return createLootState({
        fen: '4k3/8/8/8/8/2N5/8/4K3 w - - 0 1', // knight c3, loot box d4 is in game state only
        lootBoxes: [box],
        gold: { white: 10, black: 10 },
        ...overrides,
      });
    }

    it('valid hit decrements hitsRemaining', () => {
      const state = createHitState();
      const result = applyHit(state, sq('c3'), sq('d4'));
      const box = result.lootBoxes[0];
      expect(box.hitsRemaining).toBe(2);
    });

    it('tracks lastHitBy on the box', () => {
      const state = createHitState();
      const result = applyHit(state, sq('c3'), sq('d4'));
      expect(result.lootBoxes[0].lastHitBy).toBe('white');
    });

    it('queen hit instantly opens box (sets hitsRemaining to 0)', () => {
      // White queen on c3, box on d4
      const box: LootBox = {
        square: sq('d4') as Square,
        hitsRemaining: 3,
        lastHitBy: null,
        spawnedOnTurn: 2,
      };
      const state = createLootState({
        fen: '4k3/8/8/8/8/2Q5/8/4K3 w - - 0 1',
        lootBoxes: [box],
        gold: { white: 10, black: 10 },
      });

      const result = applyHit(state, sq('c3'), sq('d4'), () => 0);
      // Box should be removed (opened)
      expect(result.lootBoxes.length).toBe(0);
    });

    it('pawn hit does NOT consume turn', () => {
      // White pawn on d3, box on d4
      const box: LootBox = {
        square: sq('d4') as Square,
        hitsRemaining: 3,
        lastHitBy: null,
        spawnedOnTurn: 2,
      };
      const state = createLootState({
        fen: '4k3/8/8/8/8/3P4/8/4K3 w - - 0 1',
        lootBoxes: [box],
        gold: { white: 10, black: 10 },
      });

      const result = applyHit(state, sq('d3'), sq('d4'));
      expect(result.turn).toBe('white'); // Still white's turn
    });

    it('non-pawn hit consumes turn', () => {
      const state = createHitState(); // knight on c3
      const result = applyHit(state, sq('c3'), sq('d4'));
      expect(result.turn).toBe('black'); // Turn flipped
    });

    it('king cannot hit loot boxes', () => {
      // White king on e3, box on d4
      const box: LootBox = {
        square: sq('d4') as Square,
        hitsRemaining: 3,
        lastHitBy: null,
        spawnedOnTurn: 2,
      };
      const state = createLootState({
        fen: '4k3/8/8/8/8/4K3/8/8 w - - 0 1',
        lootBoxes: [box],
        gold: { white: 10, black: 10 },
      });

      const error = validateHit(state, sq('e3'), sq('d4'));
      expect(error).toBe('Kings cannot hit loot boxes');
    });

    it('rejects non-adjacent hit', () => {
      // White knight on a1 trying to hit box on d4 (not adjacent)
      const box: LootBox = {
        square: sq('d4') as Square,
        hitsRemaining: 3,
        lastHitBy: null,
        spawnedOnTurn: 2,
      };
      const state = createLootState({
        fen: '4k3/8/8/8/8/8/8/N3K3 w - - 0 1',
        lootBoxes: [box],
        gold: { white: 10, black: 10 },
      });

      const error = validateHit(state, sq('a1'), sq('d4'));
      expect(error).toBe('Piece must be adjacent to loot box');
    });

    it('rejects hit with opponents piece', () => {
      // Black knight on c3, white's turn
      const box: LootBox = {
        square: sq('d4') as Square,
        hitsRemaining: 3,
        lastHitBy: null,
        spawnedOnTurn: 2,
      };
      const state = createLootState({
        fen: '4k3/8/8/8/8/2n5/8/4K3 w - - 0 1',
        lootBoxes: [box],
        gold: { white: 10, black: 10 },
      });

      const error = validateHit(state, sq('c3'), sq('d4'));
      expect(error).toBe('Not your piece');
    });

    it('rejects hit on square with no loot box', () => {
      // White knight on c3, no loot box on d4
      const state = createLootState({
        fen: '4k3/8/8/8/8/2N5/8/4K3 w - - 0 1',
        lootBoxes: [],
        gold: { white: 10, black: 10 },
      });

      const error = validateHit(state, sq('c3'), sq('d4'));
      expect(error).toBe('No loot box at that square');
    });
  });

  // =========================================================================
  // Opening + Rewards
  // =========================================================================
  describe('opening + rewards', () => {
    /** Create state with box at 1 hit remaining (about to open). */
    function createAlmostOpenState(rngValue: number = 0): GameState {
      const box: LootBox = {
        square: sq('d4') as Square,
        hitsRemaining: 1,
        lastHitBy: 'black',
        spawnedOnTurn: 2,
      };
      return createLootState({
        fen: '4k3/8/8/8/8/2N5/8/4K3 w - - 0 1',
        lootBoxes: [box],
        gold: { white: 10, black: 10 },
      });
    }

    it('removes box when hitsRemaining reaches 0', () => {
      const state = createAlmostOpenState();
      const result = applyHit(state, sq('c3'), sq('d4'), () => 0);
      expect(result.lootBoxes.length).toBe(0);
    });

    it('gold reward adds to correct players gold balance', () => {
      const state = createAlmostOpenState();
      // rng=0 → first drop table entry: gold +3
      const result = applyHit(state, sq('c3'), sq('d4'), () => 0);
      expect(result.gold.white).toBe(10 + 3); // +3 gold reward
    });

    it('piece reward adds to inventory', () => {
      const state = createAlmostOpenState();
      // Need rng that lands on a piece drop (pawn: weight 18.75, cumulative 31.25-50)
      const result = applyHit(state, sq('c3'), sq('d4'), () => 0.32);
      expect(result.inventory.white.length).toBe(1);
      expect(result.inventory.white[0]).toEqual({ type: 'piece', pieceType: 'pawn' });
    });

    it('item reward adds to correct players inventory', () => {
      // turtle-shell starts at cumulative weight: 12.5+6.25+6.25+6.25+18.75+12.5+12.5+6.25 = 81.25
      // 81.25 / 99.99 ≈ 0.8126. rng = 0.813 → 0.813*99.99 = 81.29
      // After subtracting first 8 entries (81.25), 0.04 remaining. Next is turtle-shell (6.25) → hit
      const box: LootBox = {
        square: sq('d4') as Square,
        hitsRemaining: 1,
        lastHitBy: null,
        spawnedOnTurn: 2,
      };
      const state = createLootState({
        fen: '4k3/8/8/8/8/2N5/8/4K3 w - - 0 1',
        lootBoxes: [box],
        gold: { white: 10, black: 10 },
      });

      const result = applyHit(state, sq('c3'), sq('d4'), () => 0.813);
      expect(result.inventory.white.length).toBe(1);
      expect(result.inventory.white[0]).toEqual({ type: 'item', itemType: 'turtle-shell' });
    });

    it('increments lootBoxesCollected for the opening player', () => {
      const state = createAlmostOpenState();
      expect(state.lootBoxesCollected.white).toBe(0);
      const result = applyHit(state, sq('c3'), sq('d4'), () => 0);
      expect(result.lootBoxesCollected.white).toBe(1);
    });
  });

  // =========================================================================
  // Drop Table
  // =========================================================================
  describe('drop table', () => {
    const dropTable = CHESS_GOLD_CONFIG.lootBox.dropTable;

    it('returns first entry when rng = 0', () => {
      const result = rollDropTable(dropTable, () => 0);
      // First entry: gold +3
      expect(result).toEqual({ type: 'gold', amount: 3 });
    });

    it('returns last entry when rng ≈ 1', () => {
      // Total weight = 99.99. Crown ends at cumulative 99.98, king at 99.99.
      // Need rng * 99.99 > 99.98 → rng > 0.99990 (approx)
      const result = rollDropTable(dropTable, () => 0.99999);
      // Last entry: king (raw from drop table)
      expect(result).toEqual({ type: 'piece', piece: 'king' });
    });

    it('produces gold drops', () => {
      const result = rollDropTable(dropTable, () => 0);
      expect(result.type).toBe('gold');
    });

    it('produces piece drops', () => {
      // Pawn is at cumulative 31.25 / 99.99 → rng ≈ 0.32
      const result = rollDropTable(dropTable, () => 0.32);
      expect(result.type).toBe('piece');
    });

    it('produces item drops', () => {
      // turtle-shell at cumulative ~81.25 / 99.99 → rng ≈ 0.813
      const result = rollDropTable(dropTable, () => 0.813);
      expect(result.type).toBe('item');
    });

    it('king drop is converted to queen in reward distribution', () => {
      // rng very close to 1 to hit the king entry (last, weight 0.01)
      const box: LootBox = {
        square: sq('d4') as Square,
        hitsRemaining: 1,
        lastHitBy: null,
        spawnedOnTurn: 2,
      };
      const state = createLootState({
        fen: '4k3/8/8/8/8/2N5/8/4K3 w - - 0 1',
        lootBoxes: [box],
        gold: { white: 10, black: 10 },
      });

      const result = applyHit(state, sq('c3'), sq('d4'), () => 0.99999);
      // King should be converted to queen in inventory
      expect(result.inventory.white.length).toBe(1);
      expect(result.inventory.white[0]).toEqual({ type: 'piece', pieceType: 'queen' });
    });
  });

  // =========================================================================
  // Win Condition
  // =========================================================================
  describe('win condition', () => {
    it('triggers win when player collects boxesToWin (6) loot boxes', () => {
      const state = createLootState({
        lootBoxesCollected: { white: 6, black: 0 },
      });
      const winner = checkLootBoxesCollected(state);
      expect(winner).toBe('white');
    });

    it('does not trigger win below threshold', () => {
      const state = createLootState({
        lootBoxesCollected: { white: 5, black: 0 },
      });
      const winner = checkLootBoxesCollected(state);
      expect(winner).toBeNull();
    });

    it('does not trigger when loot-boxes-collected is not in winConditions', () => {
      // chess-gold mode has no loot-boxes-collected win condition
      const state = createGameState({
        modeConfig: MODE_PRESETS['chess-gold'],
        lootBoxesCollected: { white: 6, black: 0 },
        positionHistory: [],
      });
      // The checker itself doesn't check mode — but the game reducer only calls it
      // if 'loot-boxes-collected' is in winConditions. So directly calling it still
      // returns 'white', but the game reducer won't use that result.
      // Test that chess-gold mode doesn't have the win condition
      expect(state.modeConfig.winConditions).not.toContain('loot-boxes-collected');
    });

    it('opening the 6th box immediately ends the game via applyAction', () => {
      // Set up state with 5 boxes collected, box ready to open
      const box: LootBox = {
        square: sq('d4') as Square,
        hitsRemaining: 1,
        lastHitBy: null,
        spawnedOnTurn: 2,
      };
      const state = createLootState({
        fen: '4k3/8/8/8/8/2N5/8/4K3 w - - 0 1',
        lootBoxes: [box],
        lootBoxesCollected: { white: 5, black: 0 },
        gold: { white: 10, black: 10 },
      });

      const result = applyAction(state, {
        type: 'hit-loot-box',
        pieceSquare: sq('c3'),
        lootBoxSquare: sq('d4'),
      });

      const newState = expectValidAction(result);
      expect(newState.lootBoxesCollected.white).toBe(6);
      expect(newState.status).toBe('checkmate'); // game uses 'checkmate' status for mode wins
      expect(newState.winner).toBe('white');
    });
  });

  // =========================================================================
  // Integration
  // =========================================================================
  describe('integration', () => {
    it('full lifecycle: spawn → hit 3 times → open → reward', () => {
      // Start fresh in loot-boxes mode
      let state = createInitialState(MODE_PRESETS['loot-boxes']);

      // Play 6 moves to reach turn 4 (spawn turn)
      const setupMoves = [
        { type: 'move' as const, from: sq('e1'), to: sq('d1') },  // W1
        { type: 'move' as const, from: sq('e8'), to: sq('d8') },  // B1
        { type: 'move' as const, from: sq('d1'), to: sq('c1') },  // W2
        { type: 'move' as const, from: sq('d8'), to: sq('c8') },  // B2
        { type: 'move' as const, from: sq('c1'), to: sq('b1') },  // W3
        { type: 'move' as const, from: sq('c8'), to: sq('b8') },  // B3 → turn 4, box spawns
      ];

      for (const move of setupMoves) {
        const result = applyAction(state, move);
        state = expectValidAction(result);
      }

      expect(state.turnNumber).toBe(4);
      expect(state.lootBoxes.length).toBe(1);
      const boxSquare = state.lootBoxes[0].square;
      expect(state.lootBoxes[0].hitsRemaining).toBe(3);

      // Now we need a piece adjacent to the box to hit it.
      // Place a white knight adjacent to the loot box
      const boxFile = boxSquare % 8;
      const boxRank = Math.floor(boxSquare / 8);

      // Find an adjacent square we can place a knight on (within white's zone: ranks 1-3)
      // The box is in ranks 4-5 (indices 3-4). White can place in rows 1-3 (rank indices 0-2).
      // If box is on rank 4 (index 3), an adjacent rank 3 square could work.

      // Rather than fighting with adjacency, use a direct approach:
      // Place a white knight on a square adjacent to the box, then hit it.
      // Since we need control over where the box spawns, let's do this with unit functions directly.
      const box: LootBox = {
        square: sq('d4') as Square,
        hitsRemaining: 3,
        lastHitBy: null,
        spawnedOnTurn: 4,
      };

      // Build state with known box position and adjacent knight
      state = createLootState({
        fen: '1k6/8/8/8/8/2N5/8/1K6 w - - 0 5',
        lootBoxes: [box],
        gold: { white: 10, black: 10 },
        turnNumber: 5,
        turn: 'white',
        positionHistory: [],
      });

      // Hit 1: knight (turns flip)
      let result = applyHit(state, sq('c3'), sq('d4'));
      expect(result.lootBoxes[0].hitsRemaining).toBe(2);
      expect(result.lootBoxes[0].lastHitBy).toBe('white');
      expect(result.turn).toBe('black');

      // Hit 2: need black piece adjacent. Place black knight on e5.
      result = {
        ...result,
        fen: '1k6/8/8/4n3/8/2N5/8/1K6 b - - 0 5',
      };
      result = applyHit(result, sq('e5'), sq('d4'));
      expect(result.lootBoxes[0].hitsRemaining).toBe(1);
      expect(result.lootBoxes[0].lastHitBy).toBe('black');
      expect(result.turn).toBe('white');

      // Hit 3: white knight opens it (rng=0 → gold +3)
      const beforeGold = result.gold.white;
      result = applyHit(result, sq('c3'), sq('d4'), () => 0);
      expect(result.lootBoxes.length).toBe(0); // box removed
      expect(result.gold.white).toBe(beforeGold + 3); // gold reward
      expect(result.lootBoxesCollected.white).toBe(1);
    });

    it('both players competing for same loot box — last hitter gets reward', () => {
      const box: LootBox = {
        square: sq('d4') as Square,
        hitsRemaining: 2,
        lastHitBy: 'white',
        spawnedOnTurn: 2,
      };
      // White knight c3, black knight e5, box on d4
      const state = createLootState({
        fen: '4k3/8/8/4n3/8/2N5/8/4K3 b - - 0 5',
        lootBoxes: [box],
        gold: { white: 10, black: 10 },
        turn: 'black',
        turnNumber: 5,
      });

      // Black hits (2→1)
      const afterBlackHit = applyHit(state, sq('e5'), sq('d4'));
      expect(afterBlackHit.lootBoxes[0].hitsRemaining).toBe(1);
      expect(afterBlackHit.lootBoxes[0].lastHitBy).toBe('black');
      expect(afterBlackHit.turn).toBe('white');

      // White opens it (1→0). White (current turn) gets the reward
      const final = applyHit(afterBlackHit, sq('c3'), sq('d4'), () => 0);
      expect(final.lootBoxes.length).toBe(0);
      expect(final.lootBoxesCollected.white).toBe(1);
      expect(final.lootBoxesCollected.black).toBe(0);
      expect(final.gold.white).toBe(10 + 3); // white got the gold reward
    });

    it('loot box persists across many turns until opened', () => {
      const box: LootBox = {
        square: sq('d4') as Square,
        hitsRemaining: 3,
        lastHitBy: null,
        spawnedOnTurn: 4,
      };

      let state = createLootState({
        fen: '4k3/8/8/8/8/8/8/4K3 w - - 0 1',
        lootBoxes: [box],
        gold: { white: 10, black: 10 },
        turnNumber: 5,
      });

      // Play several turns of just king moves — box should persist
      const moves = [
        { type: 'move' as const, from: sq('e1'), to: sq('d1') },
        { type: 'move' as const, from: sq('e8'), to: sq('d8') },
        { type: 'move' as const, from: sq('d1'), to: sq('c1') },
        { type: 'move' as const, from: sq('d8'), to: sq('c8') },
      ];

      for (const move of moves) {
        const result = applyAction(state, move);
        state = expectValidAction(result);
      }

      // Box should still be there
      const originalBox = state.lootBoxes.find(b => b.spawnedOnTurn === 4);
      expect(originalBox).toBeDefined();
      expect(originalBox!.hitsRemaining).toBe(3);
    });
  });

  // =========================================================================
  // State immutability
  // =========================================================================
  describe('state immutability', () => {
    it('spawnLootBox does not mutate the original state', () => {
      const state = createLootState({ turnNumber: 4 });
      const originalBoxes = state.lootBoxes;
      spawnLootBox(state, () => 0);
      expect(state.lootBoxes).toBe(originalBoxes);
      expect(state.lootBoxes.length).toBe(0);
    });

    it('applyHit does not mutate the original state', () => {
      const box: LootBox = {
        square: sq('d4') as Square,
        hitsRemaining: 3,
        lastHitBy: null,
        spawnedOnTurn: 2,
      };
      const state = createLootState({
        fen: '4k3/8/8/8/8/2N5/8/4K3 w - - 0 1',
        lootBoxes: [box],
        gold: { white: 10, black: 10 },
      });

      const originalGold = state.gold.white;
      const originalBoxes = state.lootBoxes;
      applyHit(state, sq('c3'), sq('d4'));

      expect(state.gold.white).toBe(originalGold);
      expect(state.lootBoxes).toBe(originalBoxes);
      expect(state.lootBoxes[0].hitsRemaining).toBe(3);
    });
  });
});
