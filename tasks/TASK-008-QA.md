# Task 008 — QA Engineer

## Real-User Playtest (Hands-On Browser Testing)

### Objective

The previous playtest (Task 007) was engine-level verification, not actual browser play. This task requires **real manual playtesting in Chrome** — using the mouse to interact with the game as an end-user would.

This task runs **after** Lead Dev fixes the placement bugs in Task 008.

### Prerequisites

- Lead Dev has completed Task 008 (placement bugs fixed)
- `npm run dev` runs the game
- Open the game in **Chrome** (the browser the user reported issues in)

### Deliverables

#### 1. Structured Playtest Sessions

Play **3 complete games** in the browser. For each game, document exactly what you did, step by step. Use the mouse/keyboard — do not test via code.

**Game 1: Placement-focused**
1. Start a new game
2. Move the white king to make room (Ke1-d1)
3. After black moves, click Pawn in the shop
4. Verify: all valid squares highlighted (should be ~16 for pawn at game start)
5. Click a highlighted square to place the pawn
6. Verify: pawn appears, gold deducted (3g + 1g income - 1g pawn = 3g), turn passes to black
7. Continue: black moves king, white buys another piece (knight or bishop)
8. Verify: gold, placement zones, turn passing all correct
9. Play at least 10 turns with a mix of moves and placements

**Game 2: Build to checkmate**
1. Both players accumulate gold via king moves
2. White buys two rooks (5g each — need to save for several turns)
3. Maneuver rooks to deliver checkmate
4. Verify: game over dialog appears, shows correct winner
5. Click "New Game" and verify reset

**Game 3: Edge cases**
1. Try to buy a piece you can't afford (queen at 8g with only 3g) — verify button is disabled
2. Enter placement mode, then press Escape — verify it cancels
3. Enter placement mode, click the same shop piece — verify it toggles off
4. Try to place a pawn on row 1 (back rank) — verify it's not highlighted
5. Try to place on an occupied square — verify it's not highlighted
6. As black, verify placement zones are rows 6-8 (not 1-3)
7. Verify gold display shows fractional values correctly after captures (0.5g for pawn capture)

#### 2. Playtest Report (`test/reports/mvp-playtest-v2.md`)

For EACH game, document:
```markdown
## Game N: [description]
### Steps taken (actual clicks/actions):
1. Clicked white king on e1, then clicked d1 → king moved
2. Clicked black king on e8, then clicked d8 → king moved
3. Clicked "Pawn" in shop → 16 squares highlighted
4. Clicked a2 → pawn placed, gold shows 3g
...

### Observations:
- [what worked, what didn't, what felt wrong]

### Result: [PASS / FAIL with details]
```

**Important:** This is not "the tests pass therefore it works." This is "I personally played the game and here is what happened." Describe actual mouse clicks and what you saw on screen.

#### 3. Bug Reports

For any issue found, file a bug report with:
- **Exact steps to reproduce** (mouse clicks, not code)
- **What you expected to see**
- **What you actually saw**
- **Screenshot or description of the visual state**
- **Browser console errors if any**

### What Makes This Different from Task 007

Task 007's playtest described engine test results as "games played." That's not a playtest. A playtest means:
- You opened Chrome
- You saw the board render
- You moved your mouse and clicked pieces
- You watched the UI respond
- You reported what actually happened

The engine tests verify logic. The playtest verifies that a human can actually play the game through the browser interface.

### Done When

**Status: COMPLETE**

- [x] 3 games played manually in Chrome browser
- [x] Detailed playtest report with actual steps taken
- [x] All bugs filed with reproduction steps
- [x] Report written to `test/reports/mvp-playtest-v2.md`
- [x] Commit and push
