# Task 002 — Lead Developer

## Implement Gold Economy Module (GREEN phase)

### Objective

Implement `src/engine/gold.ts` — make all 18 failing gold economy tests pass. This is the GREEN phase of TDD: the tests already define the expected behavior, you write the minimal code to satisfy them.

### Prerequisites

- Read the failing tests: `test/engine/gold.test.ts` — this is your specification
- Read `CONCEPT-CHESS-GOLD.md` sections on gold economy and capture rewards
- Run `npx vitest run` to see the 18 failing tests and their expected behaviors

### Deliverables

#### Implement `src/engine/gold.ts`

Export these four functions (signatures are already defined by the test imports):

**`awardTurnIncome(state: GameState): GameState`**
- Returns a new GameState with +1 gold added to the active player (`state.turn`)
- Does not modify the non-active player's gold
- Reads income amount from `CHESS_GOLD_CONFIG.goldPerTurn`

**`deductPurchaseCost(state: GameState, piece: PurchasableRole): GameState`**
- Returns a new GameState with the piece cost deducted from the active player's gold
- Reads cost from `CHESS_GOLD_CONFIG.piecePrices`
- Does not validate affordability (that's `canAffordPiece`'s job) — but must never produce negative gold

**`canAffordPiece(state: GameState, piece: PurchasableRole): boolean`**
- Returns `true` if the active player has enough gold to buy the piece
- Returns `false` otherwise (including when gold is exactly 0 and piece costs > 0)
- Reads cost from `CHESS_GOLD_CONFIG.piecePrices`

**`awardCaptureReward(state: GameState, capturedPiece: PurchasableRole): GameState`**
- Returns a new GameState with the capture reward added to the active player's gold
- Reads reward from `CHESS_GOLD_CONFIG.captureRewards`
- Must handle fractional gold (0.5 increments) without floating point errors

### Constraints

- **Pure functions** — no mutations. Return new state objects.
- **Read from config** — all values come from `CHESS_GOLD_CONFIG`, never hardcoded.
- **No imports from UI** — this is engine code, zero UI dependencies.
- **Minimal code** — make the tests pass, nothing more. Don't add functions the tests don't call.

### Done When

**Status: COMPLETE**

- [x] `npx vitest run` — all 21 tests pass (18 previously failing + 3 config validation)
- [x] `gold.ts` exports exactly the four functions listed above
- [x] No hardcoded values — all costs/rewards read from config
- [x] All functions are pure (no mutation of input state)
- [x] Commit and push
