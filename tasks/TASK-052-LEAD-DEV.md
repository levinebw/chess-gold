# TASK-052: Siege — Win Condition + UI Integration

**Role:** Lead Developer
**Phase:** 10B — Siege UI + Win Condition
**Status:** TODO
**Priority:** High
**Dependencies:** TASK-050, TASK-051

## Context

With the pulse system and upgrade move generation in place, this task completes Siege mode: the `center-occupied` win condition, mode selector entry, rules dialog, and visual feedback for pulses and upgrades.

### Prerequisites

- Read Task 050 and 051 deliverables
- Read `src/engine/win-conditions.ts`
- Read `src/ui/components/ModeSelector.tsx`
- Read `src/ui/components/RulesDialog.tsx`
- Read `src/ui/components/Board.tsx` (for visual overlay patterns)

## Deliverables

### 1. Implement `center-occupied` win condition

- [ ] Add `checkCenterOccupied(state: GameState): Color | null` in `src/engine/win-conditions.ts`
- [ ] A player wins if all 4 center squares (d4, d5, e4, e5) are simultaneously occupied by their pieces
- [ ] Check at end of each action (standard win condition flow)
- [ ] Register in `evaluateWinConditions`

### 2. Add Siege to ModeSelector

- [ ] Add "Siege" option to `ModeSelector.tsx`
- [ ] Mode description: "Standard chess with center pulses. Every 5 moves, center squares power up your pieces with temporary upgrades. Hold all 4 center squares to win."
- [ ] Use `MODE_PRESETS['siege']` config

### 3. Update Rules Dialog

- [ ] Add Siege rules section to `RulesDialog.tsx`:
  - Standard chess starting positions, no gold economy
  - Center pulse: every 5 moves, d4/d5/e4/e5 pulse
  - Pieces on center squares during a pulse get a temporary one-move upgrade
  - Upgrade table: pawn (king-like movement), knight (double jump), rook/bishop/queen (pass through one friendly piece)
  - Upgrades expire after one move or when the next pulse fires
  - Win by occupying all 4 center squares simultaneously OR checkmate

### 4. Pulse visual feedback

- [ ] On pulse trigger, apply a visual effect to center squares:
  - Brief glow/flash animation on d4/d5/e4/e5 (CSS animation, ~1s)
  - Upgraded pieces get a visual indicator (colored border, subtle icon overlay, or square highlight)
- [ ] Show a pulse countdown or "Next pulse in X moves" indicator somewhere visible (sidebar or board margin)
- [ ] Remove visual indicator when upgrade is consumed or expires

### 5. Center occupation progress indicator

- [ ] Show how many center squares each player occupies (e.g., "Center: White 2/4, Black 1/4")
- [ ] Position in sidebar or below the board
- [ ] Highlight when a player reaches 4/4 (game over)

### 6. No-economy UI mode

- [ ] Siege has `goldEconomy: false` — verify shop and gold display are hidden (already handled for Standard/Conqueror, confirm it works for Siege)

### 7. Bot compatibility

- [ ] Verify bot AI can play Siege mode
- [ ] Bot should value center squares higher when `centerPulse` is active
- [ ] If bot struggles with upgraded moves, note for future bot improvement — don't block this task

## Files

**Modify:**
- `src/engine/win-conditions.ts` (add `checkCenterOccupied`)
- `src/ui/components/ModeSelector.tsx` (add Siege)
- `src/ui/components/RulesDialog.tsx` (add Siege rules)
- `src/ui/components/Board.tsx` (pulse visuals, upgrade indicators)
- `src/styles/main.css` (pulse animation, center occupation styles)

**Possibly modify:**
- `src/ui/App.tsx` or sidebar component (center occupation counter, pulse countdown)

## Acceptance Criteria

- [ ] `checkCenterOccupied` returns winner when all 4 center squares occupied by one color
- [ ] `checkCenterOccupied` returns `null` otherwise
- [ ] Siege appears in mode selector with correct description
- [ ] Rules dialog has complete Siege rules including upgrade table
- [ ] Center squares flash/glow on pulse
- [ ] Upgraded pieces have visible indicator
- [ ] Center occupation counter visible during Siege games
- [ ] Shop/gold UI hidden in Siege mode
- [ ] Bot can play Siege without crashing
- [ ] `npx vitest run` — all existing tests pass
