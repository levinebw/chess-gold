# TASK-047: Gold Mine — Unrestricted Placement + All-Eliminated Win Condition

**Role:** Lead Developer
**Phase:** 9A — Gold Mine
**Status:** TODO
**Priority:** High
**Dependencies:** None

## Context

Gold Mine (mode 3) is the "anything goes" mode: one action per turn, minimal restrictions. The mode preset is already defined in `config.ts` but the engine logic is not implemented.

**Design status:** OQ-4 is still pending final confirmation, but the tentative design (approved by designer) is clear enough to build:
- Infinite gold (or functionally unlimited — e.g., 9999 starting gold, +1/turn)
- Place on **any unoccupied square** (no zone restriction)
- One action per turn (already enforced by the turn system)
- Win by checkmate OR elimination of all opponent pieces

### Prerequisites

- Read `ARCHITECTURE.md` sections 3.3 (gold-mine preset), 7 (Phase 9), 11 (OQ-4)
- Read `CONCEPT-CHESS-GOLD.md` (mode 3 rules)
- Read `src/engine/placement.ts` (current zone validation)
- Read `src/engine/win-conditions.ts` (existing checkers)

## Deliverables

### 1. Implement `all-eliminated` win condition

- [ ] Add `checkAllEliminated(state: GameState): Color | null` in `src/engine/win-conditions.ts`
- [ ] A player wins if the opponent has zero pieces on the board (including king)
- [ ] Note: this differs from checkmate — a player could capture every piece including the king (since Gold Mine can use `noCheck: false`, the king must still be checkmated normally unless eliminated through captures)
- [ ] Register in `evaluateWinConditions` alongside existing checkers

### 2. Unrestricted placement

- [ ] In `src/engine/placement.ts`, when determining valid placement squares:
  - If mode has **no zone restriction** (Gold Mine), return all unoccupied squares
  - Current behavior: restrict to first 3 rows. Need a way to toggle this.
- [ ] Approach: check a config flag or mode-specific override. Options:
  - Add `unrestrictedPlacement: boolean` to `GameModeConfig` (cleanest — new flag)
  - OR check if mode is Gold Mine specifically (not extensible — avoid)
- [ ] Pawn restriction (no back rank) should still apply even in Gold Mine — a pawn on the back rank can't move

### 3. Gold Mine economy

- [ ] Set Gold Mine starting gold high enough to be functionally infinite (e.g., 9999)
- [ ] Update `CHESS_GOLD_CONFIG` or add a Gold Mine-specific config override in `config.ts`
- [ ] Gold per turn still +1 (irrelevant given infinite starting gold, but consistent)
- [ ] Piece prices remain standard (pawn 1g, knight 3g, etc.) — just effectively free given budget

### 4. Update `GameModeConfig` type if adding new flag

- [ ] If `unrestrictedPlacement` flag is added to `GameModeConfig`:
  - Add to interface in `types.ts`
  - Set to `true` in `gold-mine` preset
  - Set to `false` in all other presets
  - Update `ModeSelector` or any UI that reads mode config

## Files

**Modify:**
- `src/engine/win-conditions.ts` (add `checkAllEliminated`)
- `src/engine/placement.ts` (support unrestricted placement zones)
- `src/engine/types.ts` (add `unrestrictedPlacement` to `GameModeConfig` if chosen)
- `src/engine/config.ts` (Gold Mine starting gold, flag values)

## Acceptance Criteria

- [ ] `checkAllEliminated` returns the winner when opponent has no pieces remaining
- [ ] `checkAllEliminated` returns `null` when both players have pieces
- [ ] Gold Mine: pieces can be placed on any unoccupied square (not just rows 1-3)
- [ ] Gold Mine: pawn placement still excludes back rank (row 1/row 8)
- [ ] Gold Mine: starting gold is effectively unlimited
- [ ] Other modes are unaffected (placement zones, gold economy unchanged)
- [ ] `npx vitest run` — all existing tests pass
