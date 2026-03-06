# Task 007 — Lead Developer

## Game Controls: Shop, Placement, and Game Over

### Objective

Complete the MVP UI. Add the piece shop, placement mode, gold display component, action history, and game over dialog. After this task, Chess Gold is fully playable in the browser.

### Prerequisites

- Task 006 complete (board renders, pieces move via Chessground)
- Read `ARCHITECTURE.md` section 5 (UI Architecture) — component tree and placement flow
- Read `CONCEPT-CHESS-GOLD.md` for piece prices and placement rules

### Deliverables

#### 1. Shop Component (`src/ui/components/Shop.tsx`)

Displays purchasable pieces with their gold costs. Allows the active player to buy a piece.

- Show all 5 piece types with prices: Pawn (1), Bishop (3), Knight (3), Rook (5), Queen (8)
- Use piece icons or text labels (visual polish later)
- Pieces the player can't afford are visually disabled
- Clicking an affordable piece enters **placement mode**
- Only visible/interactive for the active player's side

#### 2. Placement Mode

When a player selects a piece from the shop:

1. Chessground highlights valid placement squares (use `getValidPlacementSquares` from the engine)
2. Player clicks a highlighted square
3. Engine validates and applies the `PlaceAction`
4. Board updates, gold deducted, turn passes
5. Cancel placement by clicking the shop piece again or pressing Escape

Implementation options:
- Use Chessground's `drawable` API to highlight valid squares
- Or overlay a custom click handler on the board during placement mode
- Track placement mode in a local UI state (not in engine state)

#### 3. Gold Display Component (`src/ui/components/GoldDisplay.tsx`)

- Shows gold for both players
- Clearly indicates which is white's and which is black's
- Updates after every action (income, purchase, capture reward)
- Supports fractional display (e.g., "3.5g")

#### 4. Turn Indicator Component (`src/ui/components/TurnIndicator.tsx`)

- Shows whose turn it is (White / Black)
- Shows the turn number
- Visually distinct from the rest of the UI

#### 5. Action History Component (`src/ui/components/ActionHistory.tsx`)

- Lists recent actions (moves and placements)
- For moves: show algebraic notation or "Ke1→e2" style
- For placements: show "Placed Knight on b1"
- Scrollable if list grows long
- Keep it simple — no fancy notation parsing needed

#### 6. Game Over Dialog (`src/ui/components/GameOverDialog.tsx`)

- Appears as a modal/overlay when `state.status` is `checkmate` or `stalemate`
- Shows the result: "Checkmate! White wins" or "Stalemate — Draw"
- Has a "New Game" button that calls `resetGame()`
- Prevents further interaction with the board while shown

#### 7. Wire Everything Together (`src/ui/App.tsx`)

Update the App component to render all components in the layout from ARCHITECTURE.md:

```
<GameHeader>         ← Turn indicator, game mode label
<GameLayout>         ← Flexbox: board + sidebar
  <BoardPanel>
    <Board>          ← Chessground
  <SidePanel>
    <GoldDisplay>
    <Shop>
    <ActionHistory>
<GameOverDialog>     ← Conditional modal
```

### Testing

- Run the app and play a full game to checkmate
- Verify all gold transactions are correct (income, purchases, captures)
- Verify placement works: buy piece → select square → piece appears
- Verify placement zones are enforced (can't place on opponent's side or mid-board)
- Verify insufficient gold prevents purchase
- Verify game over dialog appears and "New Game" works

### Constraints

- Components get state and dispatch via `useGameContext()` — no prop drilling of engine state
- Components must NOT import engine modules directly (except type imports). Use the context.
- Keep styling minimal but functional — clean layout, readable text, usable buttons
- No responsive design yet — target desktop first

### Done When

**Status: COMPLETE**

- [x] A full game of Chess Gold can be played from start to checkmate
- [x] Shop shows all pieces with correct prices
- [x] Pieces can be purchased and placed on valid squares
- [x] Placement on invalid squares is rejected
- [x] Insufficient gold prevents purchase (pieces show as disabled)
- [x] Gold display updates correctly throughout the game
- [x] Turn indicator is accurate
- [x] Action history shows moves and placements
- [x] Game over dialog appears on checkmate/stalemate with correct result
- [x] "New Game" button works
- [x] `npx vitest run` — all tests still pass
- [x] Commit and push

### Notes

- This is the biggest UI task. Take it component by component.
- Start with Shop + placement mode (most complex), then Gold Display, then the simpler components.
- If Chessground's API is tricky for placement highlighting, a simpler approach (CSS overlay with click handlers) is acceptable for MVP.
- This task completes the **playable MVP**. After this, QA runs E2E tests and we move to Phase 2 (polish).
