# Task 003 — Lead Developer

## Implement Placement Validation Module (GREEN phase)

### Objective

Implement `src/engine/placement.ts` — make all 25 failing placement tests pass. This is the GREEN phase: the tests define the behavior, you write the code to satisfy them.

### Prerequisites

- Read the failing tests: `test/engine/placement.test.ts` — this is your specification
- Read `CONCEPT-CHESS-GOLD.md` — placement rules section
- Read `ARCHITECTURE.md` section 3.2 — placement config values
- Run `npx vitest run` to see the 25 failing tests and their expected behaviors
- Understand chessops board representation: `Square` is 0-63 where a1=0, b1=1, ..., h8=63. Row 1 = squares 0-7, row 2 = 8-15, etc.

### Deliverables

#### Implement `src/engine/placement.ts`

Export these three functions (signatures defined by test imports):

**`isValidPlacement(state: GameState, piece: PurchasableRole, square: Square): boolean`**
- Returns `true` if the piece can be placed on the given square
- Validates:
  - Square is within the active player's placement zone (rows 1-3 for white, rows 6-8 for black)
  - Square is not occupied (parse the FEN to check board state, or use chessops to read the board)
  - Pawns cannot be placed on the back rank (row 1 for white, row 8 for black)
- Uses placement config from `CHESS_GOLD_CONFIG.placement` for row boundaries
- Does NOT check gold affordability (that's `gold.ts`'s job)

**`getValidPlacementSquares(state: GameState, piece: PurchasableRole): Square[]`**
- Returns all squares where the given piece can be legally placed
- Filters by zone rules, occupied squares, and pawn restrictions
- Uses `isValidPlacement` internally (or shared logic)

**`placementResolvesCheck(state: GameState, piece: PurchasableRole, square: Square): boolean`**
- Returns `true` if placing this piece on this square would resolve the current check
- Use chessops to simulate the placement: set up the board with the new piece, then check if the king is still in check
- When the player is NOT in check, this should still return a meaningful value (the tests check normal placement too)

#### chessops Integration

This module is where chessops gets used for the first time. You need to:
1. Parse the FEN from `state.fen` to determine which squares are occupied
2. For `placementResolvesCheck`: create a chessops `Chess` position with the proposed piece added, then check if the player's king is still in check

Use composition (ADR-002): create a temporary chessops instance for validation, don't store it in the game state.

### Constraints

- **Pure functions** — no mutations, return new values
- **Read from config** — placement zone boundaries come from `CHESS_GOLD_CONFIG.placement`
- **Use chessops for board reading** — don't write a custom FEN parser if chessops provides one
- **No UI imports** — engine code only

### Done When

- [ ] `npx vitest run` — all 46 tests pass (21 gold + 25 placement)
- [ ] `placement.ts` exports exactly the three functions listed above
- [ ] Placement zones use config values, not hardcoded row numbers
- [ ] chessops is used for board state reading and check validation
- [ ] All functions are pure
- [ ] Commit and push
