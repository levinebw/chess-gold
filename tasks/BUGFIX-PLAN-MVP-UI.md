# Fix Plan: Chess Gold MVP UI Bugs

## Context

The user playtested the MVP in Chrome and found it "buggy AF" — even after Lead Dev's Task 8 fix attempt. Three categories of bugs need to be fixed:

1. **Game freezes after ~2 moves** — Critical engine bug
2. **Placement mode doesn't work** — Kings disappear, can't click to place pieces
3. **Visual layout instability** — Board jumps, shop gets wider when interacting

## Root Cause Analysis

### Bug 1: Game freezes (CRITICAL)

**File:** `src/engine/position.ts:40-41`

```typescript
export function isStalemate(state: GameState): boolean {
  const pos = createPosition(state.fen);
  return !pos.isCheck() && pos.isEnd();  // BUG: pos.isEnd() includes insufficient material
}
```

`pos.isEnd()` (chessops line 343) returns `this.isInsufficientMaterial() || !this.hasDests()`. With K vs K (Chess Gold's starting position), both sides have only a king → `isInsufficientMaterial()` returns true → `isEnd()` returns true → our `isStalemate()` returns true → game declares stalemate after the first move.

**Fix:** Use `pos.isStalemate()` (chessops line 349-351: `!ctx.variantEnd && ctx.checkers.isEmpty() && !this.hasDests(ctx)`) which only checks for no legal moves, NOT insufficient material.

```typescript
export function isStalemate(state: GameState): boolean {
  const pos = createPosition(state.fen);
  return pos.isStalemate();
}
```

### Bug 2: Placement mode broken

**File:** `src/ui/components/Board.tsx`

The current approach uses Chessground's `events.select` callback for placement clicks. While investigation confirmed this event does fire (it's the first line in `selectSquare`), there are multiple interaction issues:
- Chessground still processes the click internally (selecting/deselecting pieces), causing visual glitches (kings appearing selected or disappearing)
- The `setTimeout(1)` wrapper around the callback creates timing fragility
- Setting `movable.color: undefined` disables piece selection but Chessground may still show visual artifacts

**Fix:** Replace the `select` event approach with a **transparent overlay div** that sits on top of the Chessground board during placement mode:
- Overlay renders only when `placingPiece` is set
- Overlay captures all clicks, preventing Chessground from processing them
- Click handler converts mouse coordinates to board squares
- If the clicked square is valid, dispatch the place action
- When not in placement mode, overlay is removed and Chessground handles events normally

Also: after a rejected `dispatch` (error), Chessground may show a desynchronized visual state (it animated a move that the engine rejected). Add an explicit re-sync after error.

### Bug 3: Layout instability

**File:** `src/styles/main.css`

Board jumps and shop width changes suggest CSS layout shifts when state changes. Likely causes:
- `.board-container` has fixed dimensions but the wrapper might not
- `.placement-mode` class might affect layout flow
- Shop button width changes when `selected`/`disabled` classes toggle
- Missing `min-width`/`min-height` constraints on dynamic elements

**Fix:**
- Wrap the board in a container with fixed dimensions
- Ensure shop buttons have consistent widths regardless of state
- Use `visibility` or `opacity` instead of conditional rendering where it causes layout shifts
- Fix `.board-container` to always maintain its dimensions

## Files to Modify

1. **`src/engine/position.ts`** — Fix `isStalemate` to use `pos.isStalemate()` (1 line)
2. **`src/ui/components/Board.tsx`** — Replace `select` event with overlay div approach
3. **`src/styles/main.css`** — Fix layout stability (board wrapper, shop widths)
4. **`src/ui/hooks/useGame.ts`** — Add explicit Chessground re-sync mechanism for rejected actions

## Implementation Steps

### Step 1: Fix stalemate detection (engine)
- Change `position.ts` line 40-41 from `!pos.isCheck() && pos.isEnd()` to `pos.isStalemate()`
- Verify existing stalemate test still passes (it sets up a real stalemate, not K vs K)

### Step 2: Fix Board.tsx placement interaction
- Remove `events.select` handler from Chessground init
- Remove `placingPieceRef` and `placementSquaresRef` (no longer needed)
- Add a wrapper div around the board container
- Render a transparent overlay div inside the wrapper, conditionally during placement mode
- Overlay has `position: absolute; inset: 0; z-index: 10; cursor: crosshair`
- Overlay onClick: calculate square from mouse coordinates, validate against placementSquares, dispatch place action
- Keep auto-shapes for visual highlighting (works independently of click handling)
- Add explicit Chessground re-sync when error state changes

### Step 3: Fix CSS layout stability
- `.board-wrapper`: `position: relative; width: 480px; height: 480px; flex-shrink: 0`
- `.board-container`: `width: 100%; height: 100%` (fills wrapper)
- `.placement-overlay`: `position: absolute; inset: 0; z-index: 10; cursor: crosshair`
- `.shop-piece`: add `min-width` to prevent width changes on state toggle
- Remove `.placement-mode` class from board-container (no longer needed, overlay handles it)

### Step 4: Test
- `npx vitest run` — all 123 tests pass (stalemate test uses real stalemate, should still pass)
- Manual test in Chrome:
  - Start game → board shows 2 kings → white can move
  - Move white king → turn passes to black → black can move → game continues (NOT stalemate)
  - Play several turns with only king moves → game does NOT freeze
  - Click Pawn in shop → 16 green circles appear on rows 2-3 → kings remain visible
  - Click a highlighted square → pawn placed, gold deducted, turn passes
  - Board doesn't jump or shift during any interaction
  - Shop button widths stay consistent
  - Play to completion (moves + placements mixed)

## Verification

1. Run `npx vitest run` — all tests pass
2. Run `npm run dev` in Chrome
3. Play 3+ turns with only king moves — game continues, no stalemate
4. Buy and place a pawn — full placement flow works
5. Board layout is stable throughout (no jumping, no width changes)
6. Play a full game to checkmate
