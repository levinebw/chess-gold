# Project Brief — Phase 6: Game Mode Selector + Conqueror Chess + Standard Chess

## Goal

Add a game mode selector to Chess Gold so players can choose between three modes:
1. **Chess Gold** (existing default — no changes needed)
2. **Standard Chess** (normal chess, no gold economy)
3. **Conqueror Chess** (captures convert pieces to your color, win by converting all)

## Context

Chess Gold is a browser-based chess variant built with React + TypeScript + Vite + chessops + Chessground. It currently only runs in Chess Gold mode (gold economy, piece shop, placement). The mode config system already exists — `GameModeConfig` in `src/engine/types.ts` has flags for all features, and `MODE_PRESETS` in `src/engine/config.ts` already defines presets for `chess-gold`, `standard`, and `conqueror`. The engine (`useGame` hook) already accepts a `modeConfig` parameter.

What's missing:
1. **Mode selector UI** — No way for users to pick a mode. The game always starts in Chess Gold mode.
2. **Standard Chess support** — The engine should already work with `standardStart: true` and `goldEconomy: false`, but it hasn't been tested or wired up.
3. **Piece conversion engine logic** — When `pieceConversion: true`, capturing a piece should change it to the capturer's color instead of removing it. This logic does not exist yet.
4. **"All converted" win condition** — When `all-converted` is in `winConditions`, the game should end when all pieces on the board belong to one player. This check does not exist yet.

## Key Files

| File | Purpose |
|------|---------|
| `src/engine/types.ts` | `GameModeConfig`, `WinCondition`, `GameAction` types |
| `src/engine/config.ts` | `MODE_PRESETS` with all 9 mode configs, `CHESS_GOLD_CONFIG` |
| `src/engine/game.ts` | `createInitialState()`, `applyAction()` — the game reducer |
| `src/engine/position.ts` | `applyMove()`, `getLegalMoves()`, `isInCheck()`, `isCheckmate()`, `isStalemate()` |
| `src/ui/hooks/useGame.ts` | React hook wrapping the engine. Accepts `modeConfig` param. |
| `src/ui/App.tsx` | Top-level app component |
| `src/ui/components/Board.tsx` | Chessground board wrapper |
| `src/ui/components/Shop.tsx` | Piece shop (should be hidden when `goldEconomy: false`) |
| `src/styles/main.css` | All CSS styles |
| `ARCHITECTURE.md` | Full system architecture (read Section 7, Phase 6) |
| `CONCEPT-CHESS-GOLD.md` | Game rules spec (read "4th Gamemode — Conqueror Chess") |

## Deliverables

### 1. Mode Selector Screen

A menu screen shown before the game starts where the player picks a mode:
- **Chess Gold** — "Start with a king and gold. Buy pieces from the shop."
- **Standard Chess** — "Classic chess with standard starting positions."
- **Conqueror Chess** — "Captured pieces switch sides. Convert all pieces to win."

After selecting a mode, the game starts with that mode's config. A "Back to Menu" or "Change Mode" button should allow returning to the selector.

### 2. Standard Chess Mode

Wire up the `standard` preset from `MODE_PRESETS`. When `goldEconomy: false` and `standardStart: true`:
- Board starts with the standard chess starting position (full 16 pieces per side)
- Shop is hidden (no gold, no purchasing)
- Gold display is hidden
- Game plays as normal chess (move pieces, check, checkmate, stalemate)
- Win by checkmate

### 3. Piece Conversion Engine Logic (Conqueror)

When `modeConfig.pieceConversion` is `true` and a capture occurs:
- The captured piece is NOT removed from the board
- Instead, it changes to the capturing player's color and remains on the square where the capture happened
- The capturing piece moves to the capture square as normal
- **Result:** The captured piece respawns as the capturer's piece on its original square

Implementation: In `position.ts:applyMove()` or `game.ts:applyAction()`, after a capture with `pieceConversion` enabled:
1. Note the captured piece's role and square before the move
2. Apply the move normally (captures the piece)
3. Place the captured piece back on its original square, but in the capturer's color
4. Update the FEN accordingly

Edge cases:
- A pawn captured on its starting rank stays as a pawn in the new color
- A promoted piece (queen from pawn) that gets captured becomes a queen of the capturer's color
- Kings cannot be captured in standard rules (check/checkmate still applies)

### 4. "All Converted" Win Condition

When `all-converted` is in `winConditions`, after each move check:
- Are ALL non-king pieces on the board the same color?
- If yes, that player wins

Note: Kings are excluded from this check (both players always have a king). The condition triggers when one side has converted every enemy non-king piece.

### 5. Hide Shop/Gold in Non-Economy Modes

When `goldEconomy: false`:
- Don't render the Shop component
- Don't render the GoldDisplay component
- Don't show starting gold selector
- Layout adjusts cleanly (board can be wider or centered)

## Constraints

- Do NOT modify existing Chess Gold mode behavior
- All existing tests must continue to pass (`npx vitest run`)
- Use the existing `MODE_PRESETS` from `config.ts` — don't create new config objects
- Follow existing code patterns (pure reducer, serializable state, no DOM in engine)
- CSS should match existing game aesthetic (dark theme, gold accents)
- Mobile responsive (mode selector works on phone screens)
- No new dependencies

## Done When

- [ ] Mode selector screen appears on launch with 3 mode options
- [ ] Selecting "Chess Gold" starts the existing game (no regression)
- [ ] Selecting "Standard Chess" starts a game with full starting position, no shop/gold
- [ ] Standard Chess plays to checkmate/stalemate correctly
- [ ] Selecting "Conqueror Chess" starts with full starting position, no shop/gold
- [ ] Captures in Conqueror convert pieces to capturer's color
- [ ] Conqueror game ends when all non-king pieces are one color
- [ ] "Back to Menu" returns to mode selector
- [ ] Shop and gold display hidden in non-economy modes
- [ ] All existing tests pass
- [ ] New tests cover: mode selection, piece conversion, all-converted win condition
- [ ] Works on mobile
