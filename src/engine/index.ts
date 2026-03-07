// Barrel export for shared engine — used by both client and server

// Types
export type {
  GameState,
  GameAction,
  GameError,
  GameErrorCode,
  GameConfig,
  GameModeConfig,
  GameStatus,
  MoveAction,
  PlaceAction,
  PurchasableRole,
  Color,
  Role,
  Square,
  SquareName,
  WinCondition,
  WinConditionChecker,
} from './types.ts';

// Config
export { CHESS_GOLD_CONFIG, MODE_PRESETS } from './config.ts';

// Game (core action loop)
export { createInitialState, applyAction } from './game.ts';

// Gold
export { awardTurnIncome, deductPurchaseCost, canAffordPiece, awardCaptureReward } from './gold.ts';

// Position
export { getLegalMoves, isInCheck, isCheckmate, isStalemate, applyMove } from './position.ts';

// Placement
export { isValidPlacement, getValidPlacementSquares, placementResolvesCheck } from './placement.ts';

// Promotion
export { canPromote, applyPromotion } from './promotion.ts';
