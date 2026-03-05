import type { GameState, PurchasableRole } from './types.ts';
import { CHESS_GOLD_CONFIG } from './config.ts';

export function awardTurnIncome(state: GameState): GameState {
  return {
    ...state,
    gold: {
      ...state.gold,
      [state.turn]: state.gold[state.turn] + CHESS_GOLD_CONFIG.goldPerTurn,
    },
  };
}

export function deductPurchaseCost(state: GameState, piece: PurchasableRole): GameState {
  const cost = CHESS_GOLD_CONFIG.piecePrices[piece];
  const newGold = Math.max(0, state.gold[state.turn] - cost);
  return {
    ...state,
    gold: {
      ...state.gold,
      [state.turn]: newGold,
    },
  };
}

export function canAffordPiece(state: GameState, piece: PurchasableRole): boolean {
  return state.gold[state.turn] >= CHESS_GOLD_CONFIG.piecePrices[piece];
}

export function awardCaptureReward(state: GameState, capturedPiece: PurchasableRole): GameState {
  const reward = CHESS_GOLD_CONFIG.captureRewards[capturedPiece];
  return {
    ...state,
    gold: {
      ...state.gold,
      [state.turn]: state.gold[state.turn] + reward,
    },
  };
}
