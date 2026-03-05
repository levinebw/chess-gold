# Task 001 — QA Engineer

## Test Infrastructure + Gold Economy Tests (RED phase)

### Objective

Set up the test infrastructure (helpers, factories, config) and write the first batch of failing tests for the gold economy module. These tests define the expected behavior from the game spec — they should all **fail** initially since `gold.ts` has no implementation yet. This is the RED phase of TDD.

### Prerequisites

- Read `AGENT-QA.md` (your role, test standards, full Phase 1 test plan)
- Read `CONCEPT-CHESS-GOLD.md` (game rules — the test oracle)
- Read `ARCHITECTURE.md` sections 3.1-3.4 (data model, config, types)
- **Blocked by:** Task 001 Lead Dev (need project scaffolding, `types.ts`, and `config.ts` to exist before writing tests that import them)

### Deliverables

#### 1. Test Helpers (`test/helpers/`)

Create reusable test utilities:

**`test/helpers/gameState.ts`**
- `createGameState(overrides?: Partial<GameState>): GameState` — builds a valid default GameState (Chess Gold mode, turn 1, 3 gold each, empty board except kings on e1/e8, status active). Overrides replace any field.
- `createGoldState(white: number, black: number): Pick<GameState, 'gold'>` — shorthand for gold-specific tests

**`test/helpers/assertions.ts`**
- `expectValidAction(result: GameState | GameError)` — asserts result is a GameState, not an error
- `expectIllegalAction(result: GameState | GameError, errorContains?: string)` — asserts result is a GameError

**`test/setup.ts`**
- Any global test configuration needed for Vitest

#### 2. Gold Economy Tests (`test/engine/gold.test.ts`)

Write tests for every gold-related rule in the spec. Each test should follow Arrange-Act-Assert. All tests should **fail** (RED) since `gold.ts` is an empty placeholder.

**Starting gold:**
```typescript
it('starts both players with 3 gold')
```

**Gold income:**
```typescript
it('awards +1 gold to the active player at the start of their turn')
it('does not award gold to the non-active player')
```

**Purchase costs:**
```typescript
it('deducts 1 gold when placing a pawn')
it('deducts 3 gold when placing a bishop')
it('deducts 3 gold when placing a knight')
it('deducts 5 gold when placing a rook')
it('deducts 8 gold when placing a queen')
```

**Purchase validation:**
```typescript
it('rejects placement when player cannot afford the piece')
it('rejects placement when gold is exactly 0')
it('allows placement when gold exactly equals piece cost')
```

**Capture rewards:**
```typescript
it('awards 0.5 gold when capturing a pawn')
it('awards 1.5 gold when capturing a bishop')
it('awards 1.5 gold when capturing a knight')
it('awards 2.5 gold when capturing a rook')
it('awards 4 gold when capturing a queen')
```

**Fractional gold:**
```typescript
it('tracks fractional gold values correctly (0.5 increments)')
it('handles gold arithmetic without floating point errors')
// e.g., 3 + 0.5 + 0.5 + 0.5 should equal 4.5, not 4.499999...
```

**Invariants:**
```typescript
it('never allows gold to go below 0')
it('reads piece costs from config, not hardcoded values')
it('reads capture rewards from config, not hardcoded values')
```

#### 3. Verify Tests Fail

Run `npx vitest run` and confirm:
- All tests are discovered
- All tests **fail** (expected — no implementation exists)
- No tests are skipped or errored due to import/syntax issues
- The test output clearly shows what each test expects

This validates that the tests are correctly written and will pass once the implementation is built.

### Done When

- [ ] `test/helpers/gameState.ts` exports `createGameState()` with sensible defaults
- [ ] `test/helpers/assertions.ts` exports helper assertion functions
- [ ] `test/engine/gold.test.ts` contains 15+ tests covering all gold economy rules
- [ ] `npx vitest run` discovers and runs all tests
- [ ] All tests fail with clear assertion messages (RED phase complete)
- [ ] No import errors or syntax errors — tests are structurally correct
- [ ] Commit and push

### Notes

- **Do not write implementation code.** You own tests, the developer owns implementation.
- Test names must be descriptive: `it('awards 0.5 gold when capturing a pawn')` not `it('capture test')`.
- Use `createGameState()` for every test — no shared mutable state between tests.
- Assert against values from `CHESS_GOLD_CONFIG` where appropriate (e.g., `expect(result.gold.white).toBe(state.gold.white - CHESS_GOLD_CONFIG.piecePrices.knight)`).
- If any type definition in `types.ts` doesn't support what you need for a test, flag it to the Lead Developer — don't work around it.
