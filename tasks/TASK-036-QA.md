# Task 036 — QA Engineer

## Loot Box Mode Playtest

### Objective

Full browser playtest of the Loot Boxes game mode. Verify the complete loot box lifecycle works end-to-end in the browser, test all item effects, bot compatibility, and edge cases.

### Phase

v0.7 — Loot Boxes

### Prerequisites

- Task 031 (Loot Box Core Engine) complete
- Task 033 (Inventory + Equipment Engine) complete
- Task 035 (Loot Box Mode UI) complete

### Test Environment

- **URL:** https://levinebw.github.io/chess-gold/ (after deploy)
- **Browsers:** Chrome, Safari, Firefox (desktop + mobile)
- **Modes to test:** "Loot Boxes" mode from mode selector

### Test Plan

#### A. Core Loot Box Lifecycle

1. **Spawn timing** — Start a new Loot Boxes game. Play 4 turns. Verify a loot box appears on the board after the 4th turn.
2. **Spawn location** — Verify the loot box appears on an empty square, not on top of a piece.
3. **Visual clarity** — Loot box is clearly visible and distinguishable from chess pieces. Hit count badge is readable.
4. **Hit interaction** — Move a piece adjacent to a loot box. Hit the loot box. Verify hit count decrements.
5. **Three-hit open** — Hit with non-queen pieces 3 times. Verify box opens and reward displays.
6. **Queen instant open** — Move queen adjacent to loot box. Hit once. Verify immediate opening.
7. **Pawn free hit** — Hit with a pawn. Verify it's still the same player's turn after the hit.
8. **Non-pawn turn cost** — Hit with a knight/bishop/rook. Verify turn flips to opponent.
9. **Reward display** — When box opens, verify reward toast/modal shows correct reward type and amount.
10. **Reward applied** — Verify gold appears in balance, piece appears in inventory, or item appears in items panel.

#### B. Inventory System

11. **Place from inventory** — Receive a piece from loot box. Open inventory panel. Click piece. Place on valid square. Verify piece appears on board.
12. **Free placement** — Verify no gold deducted for inventory placement.
13. **Inventory updates** — After placing, piece is removed from inventory display.
14. **Multiple items** — Collect multiple pieces/items. Verify inventory shows all of them.

#### C. Equipment System

15. **Equip item** — Receive an item from loot box. Click item in inventory. Click a friendly piece. Verify equipment icon appears on the piece.
16. **Equip cost deducted** — Verify gold deducted per equip cost (crossbow 2g, turtle shell 2g, crown 3.5g).
17. **Equipment moves** — Move an equipped piece. Verify equipment icon follows to the new square.
18. **Crossbow ranged capture** — Equip crossbow. Use ranged capture on adjacent enemy. Verify enemy removed, crossbow piece stays.
19. **Turtle Shell absorb** — Equip turtle shell. Let opponent capture that piece. Verify piece survives, attacker returns to origin. Verify shell is consumed.
20. **Crown promotion** — Equip crown to a knight/bishop/rook. Verify piece promotes to queen. Verify crown is consumed (one-time use).

#### D. Win Condition

21. **Loot boxes collected counter** — Verify counter appears showing "X/6" for each player.
22. **Counter increments** — Open a loot box. Verify counter increments for the correct player.
23. **Win at 6** — Play until one player collects 6 loot boxes. Verify game ends with that player winning.
24. **Checkmate still works** — Verify checkmate also ends the game (dual win condition in loot-boxes mode).

#### E. Bot Compatibility

25. **Bot plays loot box mode** — Start bot game in Loot Boxes mode. Verify bot makes moves without errors.
26. **Bot doesn't crash on loot box** — Verify bot handles positions with loot boxes on the board (bot search may ignore them, that's OK).
27. **Bot hits loot boxes** — Ideally bot attempts to hit loot boxes when adjacent. If not implemented, verify bot at least doesn't crash.

#### F. Multiplayer Compatibility

28. **Online loot box game** — Create online room with Loot Boxes mode. Verify loot boxes sync between players.
29. **Hit action syncs** — One player hits loot box. Verify other player sees the hit count change.
30. **Reward only for opener** — Verify only the player who opened the box receives the reward.

#### G. Edge Cases

31. **Undo after hit** — Hit a loot box, then undo. Verify hit count is restored.
32. **Undo after opening** — Open a loot box, then undo. Verify loot box reappears with 0 hits remaining (or 1 if last hit is undone).
33. **Loot box + check** — Can you hit a loot box while in check? (Should be no — must resolve check first.)
34. **Full board** — With many pieces and a loot box, verify spawning finds an empty square or skips if board is full.
35. **Rapid clicking** — Rapidly click hit/equip buttons. Verify no double-actions or state corruption.

#### H. Mobile

36. **Touch hit interaction** — On mobile, tap to hit loot box works correctly.
37. **Inventory panel responsive** — Inventory panel doesn't overflow or overlap the board.
38. **Reward toast readable** — Reward notification is visible and readable on small screens.

### Bug Report Template

For each bug found, note:
- **Steps to reproduce** (exact click sequence)
- **Expected behavior**
- **Actual behavior**
- **Screenshot** (if visual)
- **Browser/device**
- **Severity:** Blocker / Major / Minor / Cosmetic

### Acceptance Criteria

- [ ] All 38 test scenarios executed
- [ ] No blocker or major bugs remaining
- [ ] Loot box lifecycle works end-to-end (spawn → hit → open → reward)
- [ ] All three equipment effects work correctly
- [ ] Win condition triggers properly
- [ ] Bot and multiplayer modes don't crash
- [ ] Mobile experience is usable
- [ ] Bug report filed for any issues found
