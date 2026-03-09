import { z } from 'zod';
import type { GameAction } from '../engine/index.ts';
import type { CreateRoomOpts } from './protocol.ts';

// --- Schemas ---

const ModeConfigSchema = z.object({
  name: z.string().max(50),
  goldEconomy: z.boolean(),
  lootBoxes: z.boolean(),
  pieceConversion: z.boolean(),
  placementThrottle: z.boolean(),
  fogOfWar: z.boolean(),
  noCheck: z.boolean(),
  centerPulse: z.boolean(),
  standardStart: z.boolean(),
  winConditions: z.array(
    z.enum([
      'checkmate',
      'king-captured',
      'all-converted',
      'loot-boxes-collected',
      'center-occupied',
      'all-eliminated',
    ])
  ),
});

const CreateRoomOptsSchema = z
  .object({
    startingGold: z.number().int().min(1).max(1000).optional(),
    modeConfig: ModeConfigSchema.optional(),
  })
  .optional();

const RoomIdSchema = z.string().min(1).max(20);

const MoveActionSchema = z.object({
  type: z.literal('move'),
  from: z.number().int().min(0).max(63),
  to: z.number().int().min(0).max(63),
  promotion: z
    .enum(['queen', 'rook', 'bishop', 'knight', 'pawn', 'king'])
    .optional(),
});

const PlaceActionSchema = z.object({
  type: z.literal('place'),
  piece: z.enum(['pawn', 'knight', 'bishop', 'rook', 'queen']),
  square: z.number().int().min(0).max(63),
  fromInventory: z.boolean(),
});

const EquipActionSchema = z.object({
  type: z.literal('equip'),
  item: z.enum(['crossbow', 'turtle-shell', 'crown']),
  square: z.number().int().min(0).max(63),
});

const HitLootBoxActionSchema = z.object({
  type: z.literal('hit-loot-box'),
  pieceSquare: z.number().int().min(0).max(63),
  lootBoxSquare: z.number().int().min(0).max(63),
});

const GameActionSchema = z.discriminatedUnion('type', [
  MoveActionSchema,
  PlaceActionSchema,
  EquipActionSchema,
  HitLootBoxActionSchema,
]);

// --- Validation helpers ---

export function validateAction(data: unknown): GameAction | null {
  const result = GameActionSchema.safeParse(data);
  return result.success ? (result.data as GameAction) : null;
}

export function validateRoomId(data: unknown): string | null {
  const result = RoomIdSchema.safeParse(data);
  return result.success ? result.data : null;
}

export function validateCreateRoomOpts(data: unknown): CreateRoomOpts | null {
  const result = CreateRoomOptsSchema.safeParse(data);
  if (!result.success) return null;
  // safeParse of z.optional() returns undefined when data is undefined,
  // which is a valid CreateRoomOpts value (the whole opts object is optional)
  return (result.data ?? undefined) as CreateRoomOpts | null;
}

// Re-export schemas for testing
export {
  GameActionSchema,
  RoomIdSchema,
  CreateRoomOptsSchema,
  ModeConfigSchema,
};
