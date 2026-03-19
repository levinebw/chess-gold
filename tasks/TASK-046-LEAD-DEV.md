# TASK-046: King's Chess — Placement Throttle Engine

**Role:** Lead Developer
**Phase:** 9A — King's Chess
**Status:** TODO
**Priority:** High
**Dependencies:** None (piece conversion + all-converted win condition already implemented in Phase 6)

## Context

King's Chess (mode 5) combines Chess Gold's gold economy with Conqueror's piece conversion, plus one new mechanic: **placement throttle** — players can only place a piece every other turn. The `pieceConversion` and `all-converted` win condition are already implemented. This task adds the placement throttle enforcement.

### Prerequisites

- Read `ARCHITECTURE.md` sections 3.3 (King's Chess preset) and 7 (Phase 9)
- Read `CONCEPT-CHESS-GOLD.md` (mode 5 rules)
- Read `src/engine/game.ts` (current action validation flow)
- Read `src/engine/types.ts` (GameState, GameModeConfig)

## Deliverables

### 1. Extend GameState for placement tracking

- [ ] Add `lastPlacementTurn` field to `GameState` in `src/engine/types.ts`:
  ```typescript
  lastPlacementTurn: {
    white: number | null;  // turnNumber when last placement occurred
    black: number | null;
  };
  ```
- [ ] Initialize to `{ white: null, black: null }` in `createInitialState()` in `src/engine/game.ts`
- [ ] Update `lastPlacementTurn[color]` when a placement action succeeds

### 2. Enforce placement throttle in game reducer

- [ ] In `applyAction` (game.ts), when action is `'place'` and `state.modeConfig.placementThrottle` is `true`:
  - Check if `lastPlacementTurn[currentPlayer]` is non-null AND `turnNumber - lastPlacementTurn[currentPlayer] < 2`
  - If so, return error: `"Placement throttle: you can only place a piece every other turn"`
- [ ] Placement throttle does NOT apply to inventory items (free loot-box pieces) — only shop purchases. Clarify: in King's Chess, `lootBoxes` is `false`, so this edge case doesn't apply, but code defensively.

### 3. Expose throttle status to UI

- [ ] Add helper: `canPlaceThisTurn(state: GameState, color: Color): boolean` in `src/engine/placement.ts`
- [ ] Returns `true` if `placementThrottle` is `false`, OR if enough turns have passed since last placement

### 4. Verify piece conversion + all-converted work with gold economy

- [ ] King's Chess has both `goldEconomy: true` AND `pieceConversion: true` — this combination hasn't been tested yet (Conqueror has `goldEconomy: false`)
- [ ] When a piece is captured and converted, verify the capturer still receives gold reward (gold economy active) AND the captured piece changes color (piece conversion active)
- [ ] Converted piece retains its type but switches to the attacker's color (already implemented — verify)

## Files

**Modify:**
- `src/engine/types.ts` (add `lastPlacementTurn`)
- `src/engine/game.ts` (enforce throttle, update tracking)
- `src/engine/placement.ts` (add `canPlaceThisTurn` helper)

## Acceptance Criteria

- [ ] King's Chess mode: placing a piece records the turn number
- [ ] Attempting to place on the immediately following turn returns an error
- [ ] Placing on the turn after that succeeds (every other turn)
- [ ] Moving pieces is unaffected by the throttle
- [ ] Piece conversion + gold economy work together (capture = gold + color switch)
- [ ] `canPlaceThisTurn()` returns correct values for UI consumption
- [ ] `npx vitest run` — all existing tests pass
