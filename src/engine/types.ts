import type { Color, Role, Square, SquareName } from 'chessops';

// Re-export chessops types used throughout the engine
export type { Color, Role, Square, SquareName };

// Purchasable piece types (everything except king)
export type PurchasableRole = Exclude<Role, 'king'>;

// --- Game State ---

export interface GameState {
  fen: string;

  turn: Color;
  turnNumber: number;
  halfMoveCount: number;

  gold: Record<Color, number>;

  inventory: Record<Color, InventoryItem[]>;

  items: Record<Color, Item[]>;

  // Equipment keyed by square name for JSON serializability.
  // Migrates to piece-ID-based tracking in Phase 7.
  equipment: Partial<Record<SquareName, EquippedItem>>;

  lootBoxes: LootBox[];
  lootBoxesCollected: Record<Color, number>;
  lastLootBoxReward: LootBoxReward | null;
  pendingLootPiece: { player: Color; piece: PurchasableRole } | null;

  status: GameStatus;
  winner: Color | null;
  winReason: WinReason | null;

  actionHistory: GameAction[];

  positionHistory: string[];

  modeConfig: GameModeConfig;
}

export type GameStatus = 'active' | 'check' | 'checkmate' | 'stalemate' | 'draw';

export type WinReason = 'checkmate' | 'all-converted' | 'loot-boxes-collected' | 'resign';

// --- Game Mode System (ADR-005) ---

export interface GameModeConfig {
  name: string;
  goldEconomy: boolean;
  lootBoxes: boolean;
  pieceConversion: boolean;
  placementThrottle: boolean;
  fogOfWar: boolean;
  noCheck: boolean;
  centerPulse: boolean;
  standardStart: boolean;
  winConditions: WinCondition[];
}

export type WinCondition =
  | 'checkmate'
  | 'king-captured'
  | 'all-converted'
  | 'loot-boxes-collected'
  | 'center-occupied'
  | 'all-eliminated';

// --- Actions ---

export type GameAction =
  | MoveAction
  | PlaceAction
  | EquipAction
  | HitLootBoxAction
  | ResignAction;

export interface MoveAction {
  type: 'move';
  from: Square;
  to: Square;
  promotion?: Role;
}

export interface PlaceAction {
  type: 'place';
  piece: PurchasableRole;
  square: Square;
  fromInventory: boolean;
}

export interface EquipAction {
  type: 'equip';
  item: ItemType;
  square: Square;
}

export interface HitLootBoxAction {
  type: 'hit-loot-box';
  pieceSquare: Square;
  lootBoxSquare: Square;
}

export interface ResignAction {
  type: 'resign';
}

// --- Pricing ---

export type PiecePrices = Record<PurchasableRole, number>;

export type CaptureRewards = Record<PurchasableRole, number>;

// --- Loot Boxes ---

export interface LootBox {
  square: Square;
  hitsRemaining: number;
  lastHitBy: Color | null;
  spawnedOnTurn: number;
}

// --- Items ---

export type ItemType = 'crossbow' | 'turtle-shell' | 'crown';

export interface Item {
  type: ItemType;
}

export interface EquippedItem {
  type: ItemType;
  remainingHits?: number;
}

export interface InventoryItem {
  type: 'piece' | 'item';
  pieceType?: Role;
  itemType?: ItemType;
}

// --- Loot Box Drop Table ---

export type LootBoxDrop =
  | { contents: { type: 'gold'; amount: number }; weight: number }
  | { contents: { type: 'piece'; piece: Role }; weight: number }
  | { contents: { type: 'item'; item: ItemType }; weight: number };

export interface LootBoxReward {
  player: Color;
  reward: LootBoxDrop['contents'];
}

// --- Game Configuration ---

export interface PlacementConfig {
  maxRow: number;
  pawnMinRow: number;
}

export interface LootBoxConfig {
  spawnInterval: number;
  maxActiveBoxes: number;
  boxesToWin: number;
  hitsToOpen: number;
  queenHitsToOpen: number;
  pawnHitsWithoutMoving: boolean;
  equipCosts: Record<ItemType, number>;
  dropTable: LootBoxDrop[];
}

export interface GameConfig {
  startingGold: number;
  goldPerTurn: number;
  promotionCost: number;
  piecePrices: PiecePrices;
  captureRewards: CaptureRewards;
  placement: PlacementConfig;
  lootBox: LootBoxConfig;
}

// --- Errors ---

export interface GameError {
  type: 'error';
  code: GameErrorCode;
  message: string;
}

export type GameErrorCode =
  | 'INVALID_ACTION'
  | 'NOT_YOUR_TURN'
  | 'INSUFFICIENT_GOLD'
  | 'INVALID_PLACEMENT'
  | 'ILLEGAL_MOVE'
  | 'GAME_OVER'
  | 'INVALID_SQUARE'
  | 'NO_PIECE_AT_SQUARE'
  | 'CANNOT_PROMOTE';

// --- Win Condition Checker ---

export type WinConditionChecker = (state: GameState) => Color | null;
