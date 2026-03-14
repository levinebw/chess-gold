import type { GameState, GameAction, GameError, Color } from '../../src/engine/types.ts';
import { CHESS_GOLD_CONFIG, MODE_PRESETS } from '../../src/engine/config.ts';

// Kings-only starting FEN: white king on e1, black king on e8
const KINGS_ONLY_FEN = '4k3/8/8/8/8/8/8/4K3 w - - 0 1';

const DEFAULT_STATE: GameState = {
  fen: KINGS_ONLY_FEN,

  turn: 'white',
  turnNumber: 1,
  halfMoveCount: 0,

  gold: {
    white: CHESS_GOLD_CONFIG.startingGold,
    black: CHESS_GOLD_CONFIG.startingGold,
  },

  inventory: { white: [], black: [] },
  items: { white: [], black: [] },
  equipment: {},

  lootBoxes: [],
  lootBoxesCollected: { white: 0, black: 0 },
  lastLootBoxReward: null,
  pendingLootPiece: null,

  status: 'active',
  winner: null,

  actionHistory: [],

  modeConfig: MODE_PRESETS['chess-gold'],
};

/**
 * Creates a valid GameState with sensible defaults (Chess Gold mode,
 * turn 1, 3 gold each, kings-only board, status active).
 * Any field can be overridden via the `overrides` parameter.
 */
export function createGameState(overrides?: Partial<GameState>): GameState {
  const base: GameState = {
    ...DEFAULT_STATE,
    ...overrides,
    gold: { ...DEFAULT_STATE.gold, ...overrides?.gold },
    inventory: {
      white: [...(overrides?.inventory?.white ?? DEFAULT_STATE.inventory.white)],
      black: [...(overrides?.inventory?.black ?? DEFAULT_STATE.inventory.black)],
    },
    items: {
      white: [...(overrides?.items?.white ?? DEFAULT_STATE.items.white)],
      black: [...(overrides?.items?.black ?? DEFAULT_STATE.items.black)],
    },
    equipment: { ...DEFAULT_STATE.equipment, ...overrides?.equipment },
    lootBoxes: [...(overrides?.lootBoxes ?? DEFAULT_STATE.lootBoxes)],
    lootBoxesCollected: {
      ...DEFAULT_STATE.lootBoxesCollected,
      ...overrides?.lootBoxesCollected,
    },
    actionHistory: [...(overrides?.actionHistory ?? DEFAULT_STATE.actionHistory)],
    modeConfig: { ...DEFAULT_STATE.modeConfig, ...overrides?.modeConfig },
  };
  return base;
}

/**
 * Shorthand for creating a state with specific gold values.
 */
export function createGoldState(
  white: number,
  black: number,
): Pick<GameState, 'gold'> {
  return { gold: { white, black } };
}

/**
 * Creates a state where the specified player's king is in check.
 * Uses realistic FEN positions with an attacking piece.
 */
export function createCheckState(color: Color): GameState {
  if (color === 'white') {
    // Black rook on a1 checks white king on e1 (white to move)
    return createGameState({
      fen: '4k3/8/8/8/8/8/8/r3K3 w - - 0 1',
      turn: 'white',
      status: 'check',
      gold: { white: 10, black: 3 },
    });
  }
  // White rook on a8 checks black king on e8 (black to move)
  return createGameState({
    fen: 'R3k3/8/8/8/8/8/8/4K3 b - - 0 1',
    turn: 'black',
    status: 'check',
    gold: { white: 3, black: 10 },
  });
}

/**
 * Applies a sequence of actions to a game state.
 * Requires an applyAction function as parameter to avoid circular imports.
 * Throws if any action returns a GameError.
 */
export function applyActions(
  state: GameState,
  actions: GameAction[],
  applyAction: (s: GameState, a: GameAction) => GameState | GameError,
): GameState {
  let current = state;
  for (let i = 0; i < actions.length; i++) {
    const result = applyAction(current, actions[i]);
    if ('type' in result && result.type === 'error') {
      throw new Error(
        `Action ${i} failed: ${(result as GameError).message} ` +
        `(action: ${JSON.stringify(actions[i])})`,
      );
    }
    current = result as GameState;
  }
  return current;
}
