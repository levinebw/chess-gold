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
  HitLootBoxAction,
  EquipAction,
  EquippedItem,
  PurchasableRole,
  Color,
  Role,
  Square,
  SquareName,
  WinCondition,
  WinConditionChecker,
  LootBox,
  LootBoxConfig,
  LootBoxDrop,
  InventoryItem,
  Item,
  ItemType,
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
export { isValidPlacement, getValidPlacementSquares, placementResolvesCheck, hasInInventory, removeFromInventory } from './placement.ts';

// Promotion
export { canPromote, applyPromotion } from './promotion.ts';

// Loot Boxes
export {
  shouldSpawnLootBox,
  spawnLootBox,
  validateHit,
  applyHit,
  rollDropTable,
} from './lootbox.ts';

// Equipment
export {
  validateEquip,
  applyEquip,
  transferEquipment,
  removeEquipment,
  hasTurtleShell,
  decrementTurtleShell,
  getCrossbowTargets,
} from './equipment.ts';

// Win Conditions
export { checkAllConverted, checkLootBoxesCollected } from './win-conditions.ts';
