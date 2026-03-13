# Task 034 — QA Engineer

## Inventory + Equipment Tests

### Objective

Write comprehensive unit tests for the inventory system (placing loot box reward pieces) and the equipment system (equipping items, equipment effects, equipment lifecycle).

### Phase

v0.7 — Loot Boxes

### Prerequisites

- Task 031 (Loot Box Core Engine) complete
- Task 033 (Inventory + Equipment Engine) complete

### Test File

`test/engine/equipment.test.ts` — new file

### Test Cases

#### Inventory — Place from Inventory

1. **Place piece from inventory** — piece in inventory can be placed on valid square for free
2. **No gold deducted** — placing from inventory doesn't deduct gold
3. **Piece removed from inventory** — inventory item removed after placement
4. **Invalid: piece not in inventory** — error when placing a piece type not in inventory
5. **Valid placement rules apply** — from-inventory placements follow same square restrictions as bought pieces
6. **Placement resolves check** — from-inventory placement can block check
7. **Multiple inventory items** — placing one piece doesn't affect other inventory items

#### Equip Action — Validation

8. **Valid equip** — equip item to friendly piece, deducts gold, moves item to equipment
9. **Wrong player's item** — error when equipping item you don't own
10. **No piece at square** — error when equipping to empty square
11. **Enemy piece at square** — error when equipping to opponent's piece
12. **Already equipped** — error when piece already has equipment
13. **Insufficient gold** — error when can't afford equip cost
14. **Cannot equip king** — error when targeting king
15. **Equip doesn't end turn** — after equipping, it's still the same player's turn

#### Equipment Movement

16. **Equipment moves with piece** — after a normal move, equipment transfers to new square
17. **Equipment destroyed on capture** — when equipped piece is captured (no turtle shell), equipment is removed
18. **Attacker keeps equipment** — when piece with equipment captures, equipment moves to capture square

#### Crossbow Effect

19. **Ranged capture without moving** — crossbow piece captures adjacent enemy without changing square
20. **Captured piece removed** — ranged capture target is removed from board
21. **Capture reward awarded** — gold awarded for crossbow ranged capture
22. **Invalid ranged target** — error when targeting non-adjacent or friendly piece
23. **Crossbow persists** — crossbow equipment remains after ranged capture

#### Turtle Shell Effect

24. **Absorb capture** — when turtle-shelled piece is captured, it survives; attacker returns to origin
25. **Shell consumed** — after absorbing capture, turtle shell `remainingHits` decrements to 0 and is removed
26. **Normal capture after shell broken** — piece without remaining shell hits can be captured normally
27. **Attacker not harmed** — attacker returns to origin square unharmed after bouncing off shell

#### Crown Effect

28. **Promotes to queen** — equipping crown changes piece role to queen on the board
29. **Crown consumed** — crown is not persistent equipment; removed from equipment after use
30. **Cannot crown king** — error when trying to crown a king
31. **Cannot crown queen** — error when trying to crown an already-queen piece

#### Edge Cases

32. **Equipment + undo** — undo restores equipment state (consumed crown returns, broken shell restores)
33. **Equipment + en passant** — en passant capture of piece with equipment removes the equipment
34. **Equipment in opening FEN** — game starts with no equipment (clean state)

### Testing Strategy

- Use `createInitialState()` with `'loot-boxes'` mode preset
- Manually inject inventory items and equipment into state for targeted testing
- Use `applyAction` for full reducer integration
- Verify equipment map consistency after every operation

### Acceptance Criteria

- [ ] 34 test cases written and passing
- [ ] All inventory operations tested
- [ ] All equip validation rules tested
- [ ] All three equipment effects tested
- [ ] Equipment movement lifecycle tested
- [ ] Edge cases (undo, en passant) covered
