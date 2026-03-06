# Task 012 — Lead Developer

## Rules / How-to-Play Screen

### Objective

Add a rules screen that explains Chess Gold to new players. Accessible from the game header. Should cover the core mechanics concisely — gold economy, piece placement, turn structure, and win condition.

### Deliverables

#### 1. New component: `src/ui/components/RulesDialog.tsx`

A modal dialog (similar to GameOverDialog) with:

- **Title:** "How to Play Chess Gold"
- **Sections:**
  - **Goal:** Checkmate your opponent's king
  - **Starting position:** Both players start with only a king and 3 gold
  - **On your turn:** Move a piece (free) OR place a new piece from the shop (costs gold)
  - **Gold income:** +1 gold at the start of each turn
  - **Capture rewards:** Capturing enemy pieces earns gold (half their purchase price)
  - **Placement zones:** Pieces can be placed on your first 3 rows. Pawns only on rows 2-3.
  - **Promotion:** Moving a pawn to the last rank costs 1 gold to promote
  - **Piece prices:** Table showing pawn (1g), bishop (3g), knight (3g), rook (5g), queen (8g)
- **Close button** at the bottom

#### 2. Update `src/ui/App.tsx`

- Add a "Rules" or "?" button in the game header
- Toggle the RulesDialog visibility on click

#### 3. CSS styles

- Reuse `.game-over-overlay` / `.game-over-dialog` pattern for the modal
- Add specific styles for rules content (section headings, price table)

### Constraints

- Keep the text concise — players should be able to scan it in 30 seconds
- Mobile-friendly (scrollable if content overflows)
- No changes to engine code

### Done When

- [ ] Rules button visible in game header
- [ ] Clicking it opens a modal with game rules
- [ ] Rules cover all core mechanics (gold, placement, promotion, capture rewards)
- [ ] Modal closes on button click or outside click
- [ ] Works on mobile (scrollable)
- [ ] `npx vitest run` — all tests pass
- [ ] Commit and push
