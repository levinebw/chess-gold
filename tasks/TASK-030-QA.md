# Task 030 — QA Engineer

## Bot Playtest: Full Integration Testing

### Objective

Playtest the bot in the browser to verify the full experience — lobby selection, bot turns, undo, game over, persona differences. Test both locally and at the deployed URL.

### Prerequisites

- Tasks 026-028 complete (bot engine + personas + UI integration)

### Deliverables

#### 1. Lobby Flow Tests

- [ ] Bot selection cards appear in lobby
- [ ] Both Lizzie and Maxi are selectable
- [ ] Clicking a bot starts a game (no crash, board renders)
- [ ] "Back to Lobby" returns to lobby cleanly

#### 2. Gameplay Tests (per bot)

Play at least 1 full game against each bot (Lizzie and Maxi):

**Lizzie game:**
- [ ] Bot responds after player moves (with visible thinking delay)
- [ ] Moves are legal (pieces move correctly, no glitches)
- [ ] Bot buys pieces from the shop (gold decreases, pieces appear)
- [ ] Bot places pieces in valid squares (rows 6-8 for black)
- [ ] Game feels balanced — Lizzie doesn't crush instantly or play randomly
- [ ] Game reaches a conclusion (checkmate or long game)

**Maxi game:**
- [ ] Bot responds noticeably faster than Lizzie
- [ ] Bot plays more aggressively (buys bigger pieces earlier, seeks captures)
- [ ] Bot is harder to beat than Lizzie
- [ ] Game reaches a conclusion

#### 3. Feature Tests

- [ ] Turn indicator shows bot name and avatar (e.g., "🐺 Maxi is thinking...")
- [ ] Board is disabled during bot's turn (can't move pieces or use shop)
- [ ] Undo takes back both player's move and bot's response
- [ ] Multiple undos work (can undo back to game start)
- [ ] New Game resets correctly (player goes first, bot waiting)
- [ ] Sounds play for bot's moves (move, capture, check sounds)
- [ ] Promotion: if bot pushes a pawn to rank 1, it auto-promotes (no dialog — bot chooses)
- [ ] Game Over dialog shows correctly when bot checkmates player (or vice versa)

#### 4. Edge Case Tests

- [ ] Bot handles being in check (moves out of check or blocks)
- [ ] Bot handles having no legal moves (stalemate detected)
- [ ] Rapid clicking during bot's thinking time doesn't break anything
- [ ] Mobile: bot cards in lobby are tappable, game plays correctly on phone

#### 5. Report

Write results to `test/reports/bot-playtest.md` with:
- Steps taken per test
- Observations about bot behavior (does Lizzie feel friendly? Does Maxi feel aggressive?)
- Any bugs found with reproduction steps
- Subjective quality notes (is it fun? is the difficulty right?)

### Done When

- [ ] 2 full games played (1 per bot)
- [ ] All feature tests checked
- [ ] All edge case tests checked
- [ ] Mobile tested
- [ ] Report written
- [ ] Any bugs filed with reproduction steps
- [ ] Commit and push
