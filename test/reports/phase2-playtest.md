# Phase 2 Regression Playtest Report

Date: 2026-03-06
Tester: QA Agent
Method: Playwright E2E browser automation (Chromium) + visual screenshot verification
Commit: `f3989c2` (Phase 2 polish: CI tests, visual feedback, rules dialog, sound effects)

## Test Environment

- Vite dev server on port 5199
- Playwright 1.58.2 with Chromium
- Engine unit tests: 134/134 passing (8 test files)
- Phase 2 regression E2E tests: 17/17 passing
- Existing E2E tests: 6 passed + 1 skipped (game-flow.spec.ts) + 3 passed (playtest.spec.ts)

---

## Game 1: Visual Feedback Focus

### Tests Performed

1. **Last Move Highlighting**
   - Moved white king e1-d1
   - Verified 2 squares with `last-move` class appear (from + to squares)
   - Chessground's built-in yellow/green highlighting visible on d1 and e1
   - Result: PASS

2. **Check Highlight (Red Glow)**
   - Played a sequence to deliver check: W placed rook on a1, both sides maneuvered kings, then Ra1-a8+ checking black king on f8
   - Screenshot confirms: red glow on black king at f8, rook on a8
   - Chessground `check` property correctly set based on `isInCheck(state)`
   - Result: PASS

3. **Gold Pulse Animation**
   - Made move Ke1-d1 (triggers +1 gold income)
   - Gold display changed from 3g to 4g with `.gold-changed` CSS class applied
   - Animation: brief white flash + scale pulse (0.3s ease-out)
   - Result: PASS

4. **Turn Indicator Active Highlighting**
   - Initial state: White gold-player has `.active` class (gold colored text)
   - After Ke1-d1: Black gold-player has `.active`, White loses it
   - Clear visual distinction between active and inactive player
   - Result: PASS

### Game 1 Result: PASS

---

## Game 2: Rules Screen & Sound Effects

### Tests Performed

1. **Rules Button**
   - "?" button visible in game header, circular with border
   - Result: PASS

2. **Rules Dialog Content**
   - Opened via "?" button click
   - Title: "How to Play Chess Gold"
   - All sections present and correct:
     - Goal: "Checkmate your opponent's king"
     - Starting Position: "only a king and 3 gold"
     - On Your Turn: Move (free) OR place (costs gold), +1 gold income
     - Placement: First 3 rows, pawns on rows 2-3 only
     - Captures & Promotion: Capturing earns gold (half price), promotion costs 3 gold
     - Piece Prices table: Pawn 1g, Knight 3g, Bishop 3g, Rook 5g, Queen 8g
   - Screenshot verified: clean layout, gold-colored headings, readable text
   - Result: PASS

3. **Rules Dialog Close — Button**
   - Clicked "Got it" button at bottom of dialog
   - Dialog dismissed correctly
   - Result: PASS

4. **Rules Dialog Close — Overlay Click**
   - Clicked outside the dialog on the dark overlay
   - Dialog dismissed correctly (stopPropagation on inner div prevents clicks inside from closing)
   - Result: PASS

5. **Mute Toggle Button**
   - Mute button visible in header (speaker icon)
   - Click toggles between muted (speaker-off icon) and unmuted (speaker icon)
   - Toggle is reversible
   - Note: Sound playback cannot be verified in headless Playwright, but `playSound` function is called at correct integration points (confirmed via code review)
   - Result: PASS

6. **Undo Button**
   - Undo button visible, initially disabled (no history)
   - After Ke1-d1, button becomes enabled
   - Clicking Undo reverts: turn returns to "White to move", board state restored
   - Result: PASS

### Sound Integration Points (Code Review)

Board.tsx plays sounds via `useEffect` watching `state.actionHistory.length`:
- `place` action -> `playSound('place')`
- `move` action + check -> `playSound('check')`
- `move` action without check -> `playSound('move')`
- Game over -> `playSound('gameOver')`

Sound files present: `move.mp3`, `capture.mp3`, `check.mp3`, `gameOver.mp3`, `place.mp3`, `purchase.mp3`
Mute persists via `localStorage` key `chess-gold-muted`.

Note: `capture` sound is not played separately from `move` in the current implementation. Board.tsx detects check vs non-check moves but does not distinguish captures. This is a minor gap — the move sound plays for all non-check moves including captures.

### Game 2 Result: PASS

---

## Phase 1 Regression

### Tests Performed

1. **Initial State**
   - Gold: WHITE 3g / BLACK 3g
   - Turn: "White to move, Turn 1"
   - Board: Two kings (Ke1, Ke8)
   - Result: PASS

2. **Shop Affordability**
   - Queen (8g) disabled at start (4g available after income < 8g)
   - Pawn (1g) enabled (4g >= 1g)
   - Rook (5g) disabled (4g < 5g) — confirmed via screenshot
   - Result: PASS

3. **Piece Movement**
   - Ke1-d1: Turn switches to Black, gold 4g (3 + 1 income)
   - Ke8-d8: Turn switches to White, gold 4g
   - Result: PASS

4. **Placement Mode Cancel**
   - Click Pawn -> placement hint visible, green circles appear
   - Press Escape -> hint disappears, still White's turn
   - Result: PASS

### Regression Result: PASS — All Phase 1 functionality intact

---

## Mobile Viewport Tests (iPhone SE: 375x667)

### Tests Performed

1. **Board Scaling**
   - Board wrapper renders within 375px width
   - Board is a reasonable size (> 200px wide), fills available width
   - Aspect ratio maintained (1:1 square board)
   - Screenshot confirms: both kings visible, board usable
   - Result: PASS

2. **Side Panel Below Board**
   - `.game-content` switches to `flex-direction: column` at <= 740px
   - Shop visible below board after scrolling
   - All 5 pieces listed with prices, affordability correctly shown
   - `.side-panel` width: 100% (fills viewport)
   - Result: PASS

3. **Rules Dialog on Mobile**
   - Dialog fits within 375px viewport
   - Content is scrollable (max-height: 80vh)
   - "Got it" button visible and reachable after scrolling
   - All sections readable, no text overflow
   - Closes correctly on button click
   - Result: PASS

4. **Header on Mobile**
   - "Chess Gold" title, "?" rules button, Undo button, mute icon, turn indicator all visible
   - Title wraps to two lines ("Chess" / "Gold") at 375px — acceptable
   - Result: PASS

### Mobile Result: PASS

---

## Bugs Found

### QA-BUG-004: Capture sound not distinct from move sound

**Severity:** Low (cosmetic/polish)
**Module:** `src/ui/components/Board.tsx` (sound integration, lines 128-137)

**Description:** The sound integration in Board.tsx only distinguishes between:
- check moves -> `playSound('check')`
- non-check moves -> `playSound('move')`
- placements -> `playSound('place')`
- game over -> `playSound('gameOver')`

There is no detection of captures, so `capture.mp3` is never played. All non-check moves play `move.mp3`. The `purchase.mp3` sound is also not triggered (no integration point for shop purchases — only placements trigger `place` sound).

**Expected:** Captures play `capture.mp3`, shop purchases play `purchase.mp3`.
**Actual:** All non-check moves play `move.mp3`, purchases play `place.mp3`.

**Impact:** Minor — sounds work correctly for the primary flow (moves, checks, game over). The distinction between move/capture and place/purchase is a polish detail.

---

## Test Summary

| Category | Count | Status |
|----------|-------|--------|
| Engine unit tests | 134 | ALL PASS |
| Phase 2 regression E2E | 17 | ALL PASS |
| Existing E2E (game-flow) | 6 + 1 skipped | PASS |
| Existing E2E (playtest) | 3 | PASS |
| Visual feedback checks | 4 | ALL PASS |
| Rules dialog checks | 4 | ALL PASS |
| Phase 1 regression | 4 | ALL PASS |
| Mobile viewport | 4 | ALL PASS |
| Bugs found | 1 (Low severity) | Documented |

## Screenshots

- `test/reports/screenshots/phase2-check-highlight.png` — Red glow on checked king
- `test/reports/screenshots/phase2-gold-pulse.png` — Gold display after move
- `test/reports/screenshots/phase2-rules-dialog.png` — Rules dialog on desktop
- `test/reports/screenshots/phase2-mobile-board.png` — Board on iPhone SE viewport
- `test/reports/screenshots/phase2-mobile-shop.png` — Shop on mobile
- `test/reports/screenshots/phase2-mobile-rules.png` — Rules dialog on mobile

## Conclusion

Phase 2 polish features are fully functional:
- **Visual feedback:** Last-move highlights, check glow, gold pulse animation, active turn indicator all working
- **Rules screen:** Complete, readable, mobile-friendly, closes via button and overlay
- **Sound effects:** Integration points present, mute toggle works, localStorage persistence
- **Undo:** Working correctly
- **Mobile layout:** Board scales, content stacks vertically, all UI elements accessible
- **Phase 1 regression:** No regressions — movement, placement, shop affordability, escape cancel all intact

One low-severity bug found: capture and purchase sounds not triggered (sound files exist but integration missing).
