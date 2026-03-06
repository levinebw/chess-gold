# Task 016 — Lead Developer

## Undo Move

### Objective

Add an undo button that lets players take back their last move. Since this is local 2-player (hot-seat), both players can see the board — undo is a convenience feature, not a competitive concern. Undo will need to be removed or restricted when online multiplayer is added (Phase 4).

### Design

The game state is fully serializable and the engine is a pure reducer. Undo = restore the previous state from a history stack.

### Deliverables

#### 1. State History in `src/ui/hooks/useGame.ts`

Add a state history stack:

```typescript
const [stateHistory, setStateHistory] = useState<GameState[]>([]);
```

Before each successful dispatch, push the current state onto the stack:

```typescript
const dispatch = useCallback((action: GameAction) => {
  setState(prev => {
    const result = applyAction(prev, action);
    if ('type' in result && result.type === 'error') {
      setError(result as GameError);
      return prev;
    }
    setError(null);
    setStateHistory(h => [...h, prev]); // Save previous state
    return result as GameState;
  });
  setPlacingPiece(null);
}, []);
```

Add an undo function:

```typescript
const undo = useCallback(() => {
  setStateHistory(h => {
    if (h.length === 0) return h;
    const previous = h[h.length - 1];
    setState(previous);
    setError(null);
    setPlacingPiece(null);
    return h.slice(0, -1);
  });
}, []);

const canUndo = stateHistory.length > 0;
```

Expose `undo` and `canUndo` from the hook and context.

#### 2. Undo Button in `src/ui/App.tsx`

Add an "Undo" button in the game header (next to "Rules" button from Task 012):

```tsx
<button onClick={undo} disabled={!canUndo} className="undo-button">
  Undo
</button>
```

#### 3. Reset clears history

Update `resetGame` to also clear the history stack:

```typescript
const resetGame = useCallback(() => {
  setState(createInitialState(modeConfig));
  setStateHistory([]);
  setError(null);
  setPlacingPiece(null);
}, [modeConfig]);
```

#### 4. CSS

Add `.undo-button` styles matching the game header aesthetic. Disabled state should be visually muted.

### Constraints

- No engine changes — undo is purely a UI/hook concern
- History stack is unbounded for now (a typical game is <100 moves, memory is not a concern)
- Undo restores the full previous state (gold, FEN, turn, action history — everything)
- Will need to be disabled/removed for online multiplayer (Phase 4)

### Done When

- [ ] Undo button visible in game header
- [ ] Clicking undo restores the previous game state
- [ ] Multiple undos work (can undo back to game start)
- [ ] Undo is disabled when there's nothing to undo
- [ ] New Game resets the undo history
- [ ] All tests pass
- [ ] Commit and push
