# TASK-041: Resign Action

**Role:** Lead Developer
**Phase:** 8C — Elo Rating System
**Status:** TODO
**Priority:** High
**Dependencies:** TASK-040

## Context

There is no way for a player to voluntarily end a game. Resign is required for Elo since games must reach a definitive end to record a result. Either player can resign at any time — opponent wins immediately.

## Deliverables

### 1. Engine types (`src/engine/types.ts`)
- [ ] Add `'resign'` to `WinReason` type
- [ ] Add `ResignAction`: `{ type: 'resign' }`
- [ ] Add `'resign'` to `GameAction` union

### 2. Engine logic (`src/engine/game.ts`)
- [ ] Handle `action.type === 'resign'` in `applyAction`:
  - Set `status: 'checkmate'` (reuses existing game-over flow)
  - Set `winner` to opponent of `state.turn`
  - Set `winReason: 'resign'`
  - Record in `actionHistory`
  - Return immediately (no position/counter updates needed)

### 3. Server validation (`src/server/validation.ts`)
- [ ] Add `ResignActionSchema = z.object({ type: z.literal('resign') })`
- [ ] Add to `GameActionSchema` discriminated union

### 4. Server action handler (`src/server/index.ts`)
- [ ] Allow resign regardless of whose turn it is
- [ ] If `action.type === 'resign'`, inject resigning player's color as `turn` before calling `applyAction`

### 5. Online game UI (`src/ui/components/OnlineGameView.tsx`)
- [ ] Add "Resign" button in online status bar (visible only during active games)
- [ ] Confirmation dialog: "Are you sure you want to resign?" with Cancel/Resign
- [ ] On confirm: dispatch `{ type: 'resign' }`

### 6. Game over dialog (`src/ui/components/GameOverDialog.tsx`)
- [ ] Handle `winReason === 'resign'`: "{Color} resigned. {Winner} wins!"

### 7. Tests
- [ ] Engine tests: resign during white's turn, black's turn
- [ ] Resign rejected when game is already over
- [ ] Resign sets correct winner (opponent of resigner)

## Files

**Modify:**
- `src/engine/types.ts`
- `src/engine/game.ts`
- `src/server/validation.ts`
- `src/server/index.ts`
- `src/ui/components/OnlineGameView.tsx`
- `src/ui/components/GameOverDialog.tsx`

## Acceptance Criteria

- [ ] Either player can resign at any point during an active online game
- [ ] Resign immediately ends the game; opponent wins
- [ ] Confirmation dialog prevents accidental clicks
- [ ] Resign button only shows during active online games (not local/bot, not after game over)
- [ ] `winReason: 'resign'` displays correctly in GameOverDialog
- [ ] Resign action recorded in `actionHistory`
- [ ] All existing engine tests pass
- [ ] New engine tests cover resign scenarios
