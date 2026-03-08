# TASK-024: Last Move Highlight for Piece Placements

**Assigned to:** Lead Developer
**Priority:** Medium
**Phase:** v0.2
**Source:** Playtester feedback

## Summary

When a piece is placed from the shop, the target square should highlight with the same yellow/green last-move indicator that Chessground uses for normal moves. Currently, placements show no visual trace — the piece just appears.

## Current Behavior

- **Moves:** Chessground highlights from-square and to-square (yellow/green). Works correctly.
- **Placements:** No highlight. The piece appears on the board with no visual feedback showing which square just changed.

## Expected Behavior

After a placement, highlight the **target square only** (single square, since there's no origin) using the same last-move highlight style. The highlight should persist until the next action (same as move highlights).

## Implementation

Chessground's `set()` API accepts a `lastMove` property — an array of squares. For a normal move it's `[from, to]`. For a placement, pass `[targetSquare]` (single element) or `[targetSquare, targetSquare]` if Chessground requires two values.

This should be a small change in `Board.tsx` or `useGame.ts` — after a placement action resolves, sync the lastMove to Chessground with the placement square.

## Test

1. Open a game, buy a pawn from the shop, place it on a2
2. After placement, a2 should show the yellow/green highlight
3. Opponent makes a move — the highlight shifts to their move's from/to squares
4. Verify normal move highlights still work as before
