# Task 008 — Lead Developer

## Fix Placement Mode UI Bugs

### Objective

Fix three related bugs discovered during real-user playtesting. All bugs are in the UI layer — the engine is working correctly. The placement mode interaction between Chessground and React click handling is broken.

### Prerequisites

- Run `npm run dev` and try the following: click "Pawn" in the shop, then click a valid square on the board. Observe the bugs described below.

### Bugs to Fix

#### BUG-A: Kings disappear when clicking the board during placement mode

**Root cause:** `Board.tsx` has Chessground `movable` still active during placement mode. When the user clicks the board intending to place a piece, Chessground interprets the click as a piece selection — "picking up" the king and making it visually vanish.

**Fix:** When `placingPiece` is set (placement mode active), disable Chessground's movable:

```typescript
// In the state sync useEffect:
cgRef.current.set({
  fen: state.fen,
  turnColor: state.turn,
  movable: {
    free: false,
    color: placingPiece ? undefined : (isGameOver ? undefined : state.turn),
    dests: placingPiece ? new Map() : (isGameOver ? new Map() : legalDestsToChessground(legalDests)),
  },
});
```

Add `placingPiece` to the dependency array of this effect.

#### BUG-B: Only 2 highlighted squares instead of the expected ~16

**Root cause:** The Chessground auto-shapes (green circles) may be rendering but are visually overlapped or replaced by Chessground's own move highlighting (from BUG-A — piece selection shows destination dots). Once BUG-A is fixed (movable disabled during placement), the correct placement highlights should be visible.

**Verify after fixing BUG-A:** At game start, selecting Pawn should highlight 16 squares (rows 2-3, all empty). If still wrong, debug the `placementSquares` computation — add a `console.log(placementSquares.length)` and verify.

#### BUG-C: Cannot complete a placement (click doesn't register)

**Root cause:** The React `onClick` handler on the board div (`handleBoardClick`, Board.tsx:93) conflicts with Chessground's internal event handling. Chessground captures mousedown/mouseup events on the board, which may prevent the React click from firing. The coordinate-based square calculation (Board.tsx:99-104) is also fragile.

**Fix options (choose one):**

**Option 1 (Recommended): Use Chessground's own event system.** Instead of a React `onClick` handler, use Chessground's `events.select` callback which fires when a square is clicked:

```typescript
// In the create effect and/or state sync:
cgRef.current.set({
  events: {
    move: (orig, dest) => { /* existing move handler */ },
    select: (key: Key) => {
      // This fires when placement mode is active and user clicks a square
      // You need to check if we're in placement mode and if the square is valid
    },
  },
});
```

The challenge is that Chessground's `select` callback doesn't have access to React state directly. You may need a ref to track the current `placingPiece` and `placementSquares`:

```typescript
const placingPieceRef = useRef(placingPiece);
const placementSquaresRef = useRef(placementSquares);
useEffect(() => {
  placingPieceRef.current = placingPiece;
  placementSquaresRef.current = placementSquares;
}, [placingPiece, placementSquares]);
```

Then in the Chessground `select` event:
```typescript
select: (key: Key) => {
  if (placingPieceRef.current) {
    const sq = keyToSquare(key);
    if (placementSquaresRef.current.includes(sq)) {
      dispatch({
        type: 'place',
        piece: placingPieceRef.current,
        square: sq,
        fromInventory: false,
      });
    }
  }
},
```

**Option 2: Overlay a transparent click-catcher div.** During placement mode, render a transparent div on top of Chessground that captures clicks. This avoids fighting Chessground's event system but requires careful z-index management.

### Testing

After fixing, manually verify each scenario:

1. **Placement flow:**
   - Start game → click Pawn → see 16 highlighted squares → click a valid square → pawn appears on board → gold deducted → turn passes

2. **Kings stay visible:**
   - Enter placement mode → kings remain visible on the board
   - Click anywhere on the board → kings do not disappear

3. **Placement zone enforcement:**
   - Select Pawn → only rows 2-3 highlighted (for white)
   - Select Knight → rows 1-3 highlighted (minus e1 where king is)
   - Click a non-highlighted square → nothing happens

4. **Cancel placement:**
   - Click the same shop piece again → placement mode cancels
   - Press Escape → placement mode cancels

5. **Normal moves still work:**
   - Without entering placement mode, click-drag a king → move works normally
   - After placement, king can be moved on the next non-placement turn

6. **Full game:**
   - Play a full game using both moves and placements to verify nothing else broke

### Constraints

- Do not change engine code — these are UI-only bugs
- Keep Chessground as the primary board renderer — don't replace it
- All existing tests must still pass

### Done When

**Status: COMPLETE**

- [x] Placement mode: clicking a shop piece highlights correct squares (16 for pawn at start)
- [x] Kings remain visible at all times during placement mode
- [x] Clicking a valid highlighted square places the piece
- [x] Gold deducted, turn passes after placement
- [x] Normal moves work when not in placement mode
- [x] Escape/re-click cancels placement
- [x] Full game can be played with mixed moves and placements
- [x] `npx vitest run` — all tests still pass
- [x] Commit and push
