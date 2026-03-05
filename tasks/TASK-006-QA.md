# Task 006 — QA Engineer

## Manual UI Smoke Test + Component Test Scaffolding

### Objective

The Lead Developer is building the first UI. Your job is to:
1. Perform a manual smoke test of the board once it's running
2. Set up component testing infrastructure (React Testing Library)
3. Write basic component tests for the game hook

This task runs **after** Lead Dev completes Task 006 (the board must render first).

### Prerequisites

- Lead Dev has completed Task 006 (board renders, pieces move)
- `npm run dev` starts the app successfully
- All engine tests still pass

### Deliverables

#### 1. Manual Smoke Test Checklist

Run the app (`npm run dev`) and verify each item. Report any failures as bug reports.

- [ ] Board renders at a reasonable size
- [ ] Two kings visible (white on e1, black on e8)
- [ ] White king can be moved (drag or click) to adjacent squares
- [ ] After white moves, it's black's turn (turn indicator updates)
- [ ] Black king can be moved
- [ ] Illegal moves are prevented (king can't move to attacked squares)
- [ ] Gold display shows 3 for both players at game start
- [ ] Gold increases by 1 after each move (turn income)
- [ ] Board orientation is correct (white on bottom)

#### 2. Component Test Setup

Install React Testing Library if not already present:

```bash
npm install -D @testing-library/react @testing-library/jest-dom jsdom
```

Update `vitest.config.ts` (or create `vitest.setup.ts`) to include jsdom environment for UI tests.

Create `test/ui/` directory.

#### 3. Game Hook Tests (`test/ui/useGame.test.ts`)

Write tests for the `useGame` hook using `renderHook` from React Testing Library:

```typescript
describe('useGame hook', () => {
  it('initializes with correct default state')
  it('dispatches a move action and updates state')
  it('returns an error for illegal moves')
  it('clears error on next successful action')
  it('resets game to initial state')
})
```

These test the React integration layer — ensuring the hook correctly wraps the engine. They should pass since the engine is tested and the hook is a thin wrapper.

### Done When

- [ ] Manual smoke test completed, bugs reported if any
- [ ] React Testing Library installed and configured
- [ ] `test/ui/useGame.test.ts` has 5+ tests, all passing
- [ ] `npx vitest run` — all tests pass (engine + UI hook tests)
- [ ] Commit and push
