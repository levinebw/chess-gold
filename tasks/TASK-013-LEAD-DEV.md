# Task 013 — Lead Developer

## Visual Feedback Improvements

### Objective

Improve the visual feedback so players can better understand what's happening. The current UI lacks key visual cues that standard chess interfaces provide.

### Deliverables

#### 1. Last Move Highlight

Configure Chessground to show the last move (highlight the from/to squares):

```typescript
cgRef.current.set({
  lastMove: [squareToKey(lastFrom), squareToKey(lastTo)],
});
```

Extract the last move from `state.actionHistory` in the sync effect. Chessground has built-in last-move highlighting CSS.

#### 2. Check Highlight

When a player is in check, highlight their king square:

```typescript
cgRef.current.set({
  check: isInCheck(state) ? state.turn : undefined,
});
```

Chessground renders a red glow on the checked king. Import `isInCheck` from position.ts (already exported).

#### 3. Gold Change Indicator

When gold changes (purchase, capture, income), briefly flash the gold amount in the GoldDisplay:

- Add a CSS animation class (e.g., `.gold-changed`) that triggers a brief color pulse
- Apply it when the gold value changes between renders
- Use `useRef` to track previous gold and compare

#### 4. Turn Change Indicator

Make the turn indicator more visible:
- Bold/highlight the active player's name
- Subtle transition when turn switches

### Constraints

- No engine changes — all visual-only
- Keep animations subtle (150-300ms) — don't slow down gameplay
- Chessground handles last-move and check highlights natively — use its built-in support

### Done When

- [ ] Last move squares highlighted after each move
- [ ] King glows red when in check
- [ ] Gold display pulses when gold changes
- [ ] Turn indicator clearly shows whose turn it is
- [ ] All tests pass
- [ ] Commit and push
