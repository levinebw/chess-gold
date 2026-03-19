# Task 029 — QA Engineer

## Bot Engine Unit Tests

### Objective

Write comprehensive tests for the bot AI modules (evaluate, strategy, search, bot). These tests validate that the bot produces legal, reasonable actions across various game states.

### Prerequisites

- Task 026 (Bot Engine) complete

### Deliverables

#### 1. Evaluation Tests: `test/engine/bot/evaluate.test.ts`

- Material advantage: position with extra queen scores higher than position without
- Gold advantage: more gold = higher score (weighted by persona greed)
- Symmetric start: equal position evaluates to ~0 for both sides
- Checkmate position: evaluates to extreme score (positive for winner, negative for loser)
- Persona influence: aggressive persona values attacking position higher than defensive persona

#### 2. Strategy Tests: `test/engine/bot/strategy.test.ts`

- Bot with 0 gold returns 'save' (can't buy anything)
- Bot with 1 gold can buy a pawn
- Bot with 8+ gold: greedy persona saves, generous persona buys queen
- Placement square is always valid (within placement zone, not occupied)
- Bot never tries to buy when `goldEconomy` is false

#### 3. Search Tests: `test/engine/bot/search.test.ts`

- Depth 1: captures hanging piece (free material)
- Depth 1: doesn't hang own piece for no reason
- Depth 2: finds capture-recapture (sees one move ahead)
- Checkmate in 1: always found regardless of depth
- Returns null when no legal moves (stalemate)
- All returned moves are legal (validate against `getLegalMoves`)

#### 4. Integration Tests: `test/engine/bot/bot.test.ts`

- `chooseAction` returns a valid action for opening position (only king + gold)
- `chooseAction` returns a valid action for mid-game position
- `chooseAction` never returns an action the engine would reject
- Full game simulation: bot vs. bot, play until game over (no crashes, no infinite loops)
- Bot handles promotion correctly (promotes pawns on last rank)
- Lizzie persona: plays with higher randomness (run multiple times, verify action variance)
- Maxi persona: plays more aggressively (average piece value purchased is higher)

#### 5. Regression: Run Full Test Suite

- `npx vitest run` — all existing + new tests pass
- No engine tests broken by bot module additions

### Constraints

- Tests must be deterministic where possible (seed randomness or test ranges)
- Bot-vs-bot simulation test should have a move limit (e.g., 200 half-moves) to prevent infinite games
- Use real `applyAction` for integration tests — no mocking the engine

### Done When

- [ ] 15+ test cases across the 4 test files
- [ ] All tests pass
- [ ] Bot-vs-bot simulation completes without crashes
- [ ] Edge cases covered: 0 gold, only king on board, checkmate-in-1, stalemate
- [ ] Commit and push
