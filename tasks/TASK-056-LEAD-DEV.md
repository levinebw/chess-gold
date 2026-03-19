# TASK-056: Flashlight UI — Board Visibility Masking + Mode Integration

**Role:** Lead Developer
**Phase:** 11B — Flashlight UI
**Status:** TODO
**Priority:** High
**Dependencies:** TASK-054, TASK-055

## Context

The fog of war engine is in place. This task builds the visual layer: hiding squares the active player can't see, showing/hiding pieces, and integrating both Flashlight modes into the mode selector and rules dialog.

### Prerequisites

- Read Task 054 and 055 deliverables
- Read `src/ui/components/Board.tsx` (Chessground wrapper, overlay patterns)
- Read `src/ui/components/ModeSelector.tsx`
- Read `src/ui/components/RulesDialog.tsx`
- Read `src/styles/main.css` (existing board styles)

### Local 2-Player Consideration

Flashlight mode on a shared screen is inherently trust-based ("don't look at opponent's screen"). For local play, the board shows the active player's visibility only, and switches on turn change. A brief "hand off" screen between turns can prevent accidental visibility leaks.

## Deliverables

### 1. Board visibility masking

- [ ] Use `calculateVisibility(state, currentTurnColor)` to get visible squares
- [ ] Apply a dark overlay / fog effect to all squares NOT in the visible set:
  - Hidden squares: dark semi-transparent overlay (e.g., rgba(0,0,0,0.85))
  - Hidden pieces: completely invisible (not rendered or fully obscured)
  - Visible squares: rendered normally
- [ ] Implementation approach — choose one:
  - **CSS overlay divs:** Generate 64 small overlay divs, toggle opacity based on visibility
  - **Chessground custom rendering:** Use Chessground's ability to add/remove pieces and apply custom square styles
  - **Canvas overlay:** Draw fog layer on top of Chessground (may interfere with interaction)
  - Recommend CSS overlay approach (consistent with existing placement overlay pattern in Board.tsx)

### 2. Turn handoff screen (local play)

- [ ] Between turns, show a full-screen overlay: "[Color]'s turn — Click to reveal"
- [ ] Prevents the incoming player from seeing the outgoing player's board
- [ ] Only active when `fogOfWar: true` AND game mode is local (not online — online has server-authoritative visibility)
- [ ] Player clicks/taps to dismiss and see their board

### 3. Interaction filtering

- [ ] Hidden squares should not be interactive (no clicks, no highlighting)
- [ ] Placement mode (Flashlight Gold): only show placement highlights on visible squares
- [ ] Legal move highlights: only show for the active player's pieces (already the case, but verify with fog)

### 4. Add Flashlight modes to ModeSelector

- [ ] Add "Flashlight" option:
  - Description: "Fog of war — you can only see what your pieces can reach. No check. Capture the king to win."
  - Use `MODE_PRESETS['flashlight']` config
- [ ] Add "Flashlight Gold" option:
  - Description: "Flashlight + Chess Gold combined. Fog of war with gold economy and piece placement. Capture the king to win."
  - Use `MODE_PRESETS['flashlight-gold']` config

### 5. Update Rules Dialog

- [ ] Add Flashlight rules section:
  - Fog of war: you can only see squares your pieces can move to, plus squares occupied by blocking pieces
  - No check: check does not exist in this mode — kings can move into danger
  - King capture: capturing the enemy king wins the game
  - Castling: king can castle through attacked squares (no check restrictions)
  - Standard starting positions, no gold economy
- [ ] Add Flashlight Gold rules section:
  - All Flashlight rules apply
  - Gold economy active (same as Chess Gold)
  - Piece placement: can only place on visible squares within your placement zone
  - Kings-only start (not standard)

### 6. Visual polish

- [ ] Fog edge effect: squares at the boundary of visibility could have a subtle gradient/glow to distinguish "edge of vision" from "deep fog" (optional — implement if time permits)
- [ ] Piece visibility transitions: when a square becomes visible/hidden on turn change, use a brief fade (not instant snap)
- [ ] Ensure fog doesn't interfere with existing visual feedback (last move highlight, check glow should still work on visible squares)

## Files

**Modify:**
- `src/ui/components/Board.tsx` (fog overlay, visibility masking)
- `src/ui/components/ModeSelector.tsx` (add Flashlight, Flashlight Gold)
- `src/ui/components/RulesDialog.tsx` (add Flashlight rules)
- `src/styles/main.css` (fog overlay styles, turn handoff screen)

**Possibly create:**
- `src/ui/components/TurnHandoff.tsx` (turn handoff overlay for local Flashlight)

## Acceptance Criteria

- [ ] Hidden squares are visually obscured (dark overlay)
- [ ] Hidden pieces are not visible
- [ ] Visible squares render normally with full interactivity
- [ ] Turn handoff screen appears between turns in local Flashlight games
- [ ] Flashlight and Flashlight Gold appear in mode selector
- [ ] Rules dialog has complete rules for both modes
- [ ] Placement mode (Flashlight Gold): only visible squares highlighted
- [ ] Fog does not interfere with legal move highlights or last-move indicator
- [ ] No-economy UI (shop/gold hidden) in Flashlight mode; shown in Flashlight Gold
- [ ] Mobile: fog overlay renders correctly at 375px and 480px
- [ ] `npx vitest run` — all existing tests pass
