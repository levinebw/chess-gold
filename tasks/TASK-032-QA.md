# Task 032 — QA Engineer

## Loot Box Core Engine Tests

### Objective

Write comprehensive unit tests for the loot box core engine: spawning, hit mechanics, opening, drop table, reward distribution, and the `loot-boxes-collected` win condition.

### Phase

v0.7 — Loot Boxes

### Prerequisites

- Task 031 (Loot Box Core Engine) complete

### Test File

`test/engine/lootbox.test.ts` — new file

### Test Cases

#### Spawning

1. **Spawn on correct interval** — loot box appears after `spawnInterval` turns (4) when `lootBoxes` mode is enabled
2. **No spawn when disabled** — no loot box spawns when `modeConfig.lootBoxes === false`
3. **No spawn when max active** — no new box if `maxActiveBoxes` already on board
4. **Spawn on empty square** — spawned box is not on a square occupied by a piece
5. **No spawn on turn 1** — first spawn happens on turn 5 (after 4 intervals), not turn 1
6. **Spawn integrates with game reducer** — after a move on the correct turn, state includes a new loot box

#### Hit Mechanics

7. **Valid hit decrements** — hitting a loot box with an adjacent piece decrements `hitsRemaining`
8. **Last hit by tracked** — `lastHitBy` is set to the hitting player's color
9. **Queen instant open** — queen hit sets `hitsRemaining` to 0 (opens in 1 hit)
10. **Pawn hit doesn't end turn** — after a pawn hit, it's still the same player's turn
11. **Non-pawn hit ends turn** — after a knight/bishop/rook/queen hit, turn flips
12. **King cannot hit** — hitting with king returns an error
13. **Non-adjacent rejects** — hitting from more than 1 square away returns an error
14. **Wrong player rejects** — hitting with opponent's piece returns an error
15. **No loot box rejects** — hitting a square with no loot box returns an error

#### Opening + Rewards

16. **Box opens at 0 hits** — when `hitsRemaining` reaches 0, box is removed from state
17. **Gold reward** — gold drop adds to the correct player's gold balance
18. **Piece reward** — piece drop adds to the correct player's inventory
19. **Item reward** — item drop adds to the correct player's items list
20. **Collection count incremented** — `lootBoxesCollected` increments for the opening player

#### Drop Table

21. **Weighted selection** — mock `Math.random` to verify specific drops (e.g., random=0 → first entry, random=0.99 → last entry)
22. **All drop types work** — verify gold, piece, and item drops each produce correct reward structure
23. **King drop treated as queen** — king entry in drop table produces queen piece in inventory

#### Win Condition

24. **Win at threshold** — player with 6 collected loot boxes triggers `loot-boxes-collected` win
25. **No win below threshold** — 5 collected does not trigger win
26. **Win condition only in loot-boxes mode** — `loot-boxes-collected` doesn't trigger when not in win conditions list
27. **Win checked after opening** — opening the 6th box immediately ends the game

#### Integration

28. **Full lifecycle** — spawn → hit 3 times → open → reward → verify complete state transition
29. **Multiple players competing** — both players hitting same loot box, last hitter gets reward
30. **Loot box survives across turns** — box persists until opened, even after many turns

### Testing Strategy

- Use `createInitialState()` with the `'loot-boxes'` mode preset
- Mock `Math.random` for deterministic drop table rolls and spawn placement
- Use `applyAction` from game.ts for full integration testing
- Verify state immutability (no mutation of input state)

### Acceptance Criteria

- [ ] 30 test cases written and passing
- [ ] All spawning edge cases covered
- [ ] All hit validation rules tested
- [ ] All reward types verified
- [ ] Win condition threshold tested
- [ ] Full lifecycle integration test passes
