# Task 004 — Lead Developer

## Implement Position + Promotion Modules (GREEN phase)

### Objective

Implement `src/engine/position.ts` and `src/engine/promotion.ts` — make all 25 failing tests pass. This is the GREEN phase for both modules.

These two modules are related: `position.ts` wraps chessops for move generation, check/checkmate/stalemate detection, and move application. `promotion.ts` handles pawn promotion with gold cost. Position is the heavier lift.

### Prerequisites

- Read the failing tests:
  - `test/engine/position.test.ts` — 13 tests
  - `test/engine/promotion.test.ts` — 12 tests
- Run `npx vitest run` to see all 25 failures and expected behaviors
- Review chessops API: `Chess.fromSetup()`, `pos.dests()`, `pos.isCheck()`, `pos.isCheckmate()`, `pos.isStalemate()`, `pos.play()`
- Note: the en passant gold test expects `applyMove` to award capture gold automatically. This means `applyMove` must detect captures (including en passant) and call the gold logic.

### Deliverables

#### 1. Implement `src/engine/position.ts`

Export these five functions (signatures defined by test imports):

**`getLegalMoves(state: GameState): Map<Square, Square[]>`**
- Parse FEN, create chessops `Chess` position
- Return `pos.dests()` or equivalent — a map from each piece square to its legal destination squares
- Only returns moves for the active player

**`isInCheck(state: GameState): boolean`**
- Returns `true` if the active player's king is in check

**`isCheckmate(state: GameState): boolean`**
- Returns `true` if the active player is checkmated (in check + no legal moves)

**`isStalemate(state: GameState): boolean`**
- Returns `true` if the active player is stalemated (not in check + no legal moves)

**`applyMove(state: GameState, from: Square, to: Square, promotion?: Role): GameState`**
- Apply the move using chessops, produce new FEN
- Switch the active turn
- **Handle captures**: if the move captures a piece, award the capture gold reward to the moving player (use `awardCaptureReward` from `gold.ts` or inline the logic)
- **Handle en passant**: en passant is a capture — must detect it and award pawn capture gold (0.5)
- Return a new GameState with updated FEN, turn, and gold

**Important:** The tests expect `applyMove` to handle gold for captures. This couples position and gold logic — that's acceptable since captures are inherently part of move resolution. Import from `gold.ts` as needed.

#### 2. Implement `src/engine/promotion.ts`

Export these two functions (signatures defined by test imports):

**`canPromote(state: GameState, square: Square): boolean`**
- Returns `true` if there is a pawn of the active player's color on the given square AND the square is on the last rank AND the player has enough gold (`>= CHESS_GOLD_CONFIG.promotionCost`)
- Returns `false` for non-pawns, wrong rank, or insufficient gold

**`applyPromotion(state: GameState, square: Square, promoteTo: PurchasableRole): GameState`**
- Replaces the pawn on the given square with the requested piece
- Deducts `CHESS_GOLD_CONFIG.promotionCost` from the active player's gold
- Updates the FEN
- Must reject promotion to `'king'` or `'pawn'` — return the state unchanged if invalid
- Use chessops to modify the board and regenerate the FEN

### Constraints

- **Pure functions** — no mutations, return new state objects
- **Use chessops** — don't write custom move generation or check detection
- **Import from gold.ts** — reuse `awardCaptureReward` for capture gold in `applyMove`
- **Read from config** — promotion cost comes from config

### Done When

- [ ] `npx vitest run` — all 72 tests pass (47 existing + 25 new)
- [ ] `position.ts` exports exactly the five functions listed above
- [ ] `promotion.ts` exports exactly the two functions listed above
- [ ] En passant captures award 0.5 gold
- [ ] Promotion rejects king and pawn as targets
- [ ] All functions are pure
- [ ] Commit and push
