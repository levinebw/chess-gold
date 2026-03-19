# TASK-048: Phase 9 UI — Mode Selector + Rules Dialog

**Role:** Lead Developer
**Phase:** 9B — UI Integration
**Status:** TODO
**Priority:** Medium
**Dependencies:** TASK-046, TASK-047

## Context

King's Chess and Gold Mine engine logic is complete. This task wires them into the UI: mode selector buttons, rules dialog entries, and any mode-specific UI behavior (e.g., placement throttle indicator, unrestricted placement highlighting).

### Prerequisites

- Read `src/ui/components/ModeSelector.tsx` (current mode selector)
- Read `src/ui/components/RulesDialog.tsx` (current rules dialog)
- Read `src/ui/components/Shop.tsx` (placement UI)
- Read `src/ui/hooks/useGame.ts` (game state hook)

## Deliverables

### 1. Add King's Chess to ModeSelector

- [ ] Add "King's Chess" option to `ModeSelector.tsx`
- [ ] Mode description: "Chess Gold + piece conversion. Captured pieces join your army. Place pieces every other turn. Win by converting all opponent pieces."
- [ ] Use `MODE_PRESETS['kings-chess']` config

### 2. Add Gold Mine to ModeSelector

- [ ] Add "Gold Mine" option to `ModeSelector.tsx`
- [ ] Mode description: "Anything goes. Unlimited gold. Place anywhere. One action per turn. Eliminate all opponent pieces or checkmate to win."
- [ ] Use `MODE_PRESETS['gold-mine']` config

### 3. Update Rules Dialog

- [ ] Add King's Chess rules section to `RulesDialog.tsx`:
  - Piece conversion: captured pieces change to your color
  - Placement throttle: can only place a piece every other turn
  - Win condition: convert all opponent pieces to your color
  - Gold economy applies (same prices as Chess Gold)
- [ ] Add Gold Mine rules section:
  - Unlimited gold — buy any piece at any time
  - Place on any unoccupied square (pawns excluded from back rank)
  - One action per turn: move or place
  - Win by eliminating all opponent pieces or checkmate

### 4. Placement throttle UI feedback

- [ ] When `placementThrottle` is active and the player cannot place this turn:
  - Grey out / disable the shop's buy buttons
  - Show a brief tooltip or message: "Placement available next turn"
- [ ] Use `canPlaceThisTurn()` from `placement.ts` (Task 046) to determine state

### 5. Gold Mine placement highlighting

- [ ] When in Gold Mine mode and entering placement mode, highlight all unoccupied squares (not just rows 1-3)
- [ ] Verify the board overlay handles full-board highlighting without performance issues

### 6. Bot compatibility

- [ ] Verify bot AI can play King's Chess (piece conversion + placement throttle)
- [ ] Verify bot AI can play Gold Mine (unrestricted placement)
- [ ] Bot's placement logic should respect throttle and expanded zones
- [ ] If bot crashes or plays illegal moves, file bugs but don't block this task

## Files

**Modify:**
- `src/ui/components/ModeSelector.tsx`
- `src/ui/components/RulesDialog.tsx`
- `src/ui/components/Shop.tsx` (throttle disable state)
- `src/ui/hooks/useGame.ts` (expose `canPlaceThisTurn`)

## Acceptance Criteria

- [ ] King's Chess and Gold Mine appear in the mode selector
- [ ] Selecting either mode starts a game with the correct config
- [ ] Rules dialog shows correct rules for each mode
- [ ] King's Chess: shop disabled on turns where placement is throttled
- [ ] Gold Mine: placement mode highlights all valid squares (full board minus occupied and pawn-on-back-rank)
- [ ] Online multiplayer: both modes selectable when creating a room
- [ ] Bot: can play both modes without crashing (correctness is best-effort)
- [ ] `npx vitest run` — all existing tests pass
