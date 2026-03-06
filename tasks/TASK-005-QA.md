# Task 005 — QA Engineer

## Engine Hardening: Edge Case Tests + Coverage Review

### Objective

The engine is nearly complete. While the Lead Developer implements `game.ts` (the final module), your job is to harden the existing test suite with edge cases and prepare for the UI stage.

This task has two parts:
1. **Edge case tests** for the engine modules already implemented (gold, placement, position, promotion)
2. **Playwright infrastructure setup** for the upcoming E2E smoke tests

### Prerequisites

- Run `npx vitest run` to confirm baseline (72 pass, 28 fail — the 28 are game.test.ts waiting on Lead Dev)
- Review `AGENT-QA.md` for edge case categories
- Review all existing test files to identify coverage gaps

### Deliverables

#### 1. Edge Case Tests (`test/engine/edge-cases.test.ts`)

Write a new test file covering cross-module edge cases that don't fit neatly into a single module's test file. These test the engine modules in combination.

**Suggested test scenarios (pick the most valuable — aim for 10-15 tests):**

```typescript
describe('Edge Cases', () => {
  describe('gold arithmetic edge cases', () => {
    it('gold stays correct after multiple fractional captures (no floating point drift)')
    it('gold is exactly 0 after spending all gold')
    it('player can still move (free action) when gold is 0')
  })

  describe('placement + check interactions', () => {
    it('placement on a valid square is rejected if it does not resolve check')
    it('placement that blocks check is accepted')
    it('placement that interposes between attacker and king resolves check')
    it('player in check with no legal moves and no valid placements is checkmated')
  })

  describe('promotion edge cases', () => {
    it('pawn on last rank with exactly 1 gold can promote')
    it('pawn on last rank with 0 gold cannot promote (stuck pawn)')
    it('promoting does not affect the opponent gold')
    it('FEN is valid after promotion (only one piece changes)')
  })

  describe('position edge cases', () => {
    it('castling is available when king and rook are in starting position')
    it('castling is not available when king has moved')
    it('en passant is only available on the move immediately after the two-square advance')
    it('applyMove preserves gold values (no accidental reset)')
    it('multiple captures in sequence track gold correctly')
  })

  describe('king proximity', () => {
    it('kings cannot be placed adjacent to each other (illegal position)')
    // This tests that chessops rejects positions where kings are adjacent
  })
})
```

**Important:** These are tests for already-implemented modules. They should **pass** (GREEN). If any fail, file a bug report — don't fix the implementation.

#### 2. Playwright Setup

Set up the E2E testing infrastructure so it's ready when the UI is built:

- Install Playwright: add to `package.json` devDependencies
- Create `playwright.config.ts` with basic configuration:
  - Base URL: `http://localhost:5173` (Vite default)
  - Test directory: `test/e2e/`
  - Single browser (Chromium) for now
- Create `test/e2e/.gitkeep` (directory placeholder)
- Create a stub test file `test/e2e/game-flow.spec.ts` with placeholder tests (just `test.skip` stubs) based on the E2E test plan in AGENT-QA.md:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Chess Gold — E2E Smoke Tests', () => {
  test.skip('game starts with two kings and correct gold display', async ({ page }) => {
    // TODO: implement when UI is ready
  });

  test.skip('player can buy a piece from the shop', async ({ page }) => {
    // TODO: implement when UI is ready
  });

  test.skip('player can move a piece', async ({ page }) => {
    // TODO: implement when UI is ready
  });

  test.skip('capturing a piece awards gold', async ({ page }) => {
    // TODO: implement when UI is ready
  });

  test.skip('game ends on checkmate with correct winner', async ({ page }) => {
    // TODO: implement when UI is ready
  });

  test.skip('illegal actions are rejected with UI feedback', async ({ page }) => {
    // TODO: implement when UI is ready
  });
});
```

### Done When

**Status: COMPLETE**

- [x] `test/engine/edge-cases.test.ts` has 10-15 edge case tests
- [x] All edge case tests pass (these test existing implementation)
- [x] If any edge case test fails, a bug report is filed (not fixed by you)
- [x] Playwright is installed and configured
- [x] `test/e2e/game-flow.spec.ts` has stub tests matching the E2E plan
- [x] `npx vitest run` still passes all non-game.test.ts tests (no regressions)
- [x] Commit and push

### Notes

- The edge case tests validate existing code, so they should pass. If they don't, it's a bug discovery — good catch, file it.
- For Playwright install, run `npx playwright install chromium` after adding the dependency. This can be slow.
- Keep the Playwright config simple — we don't need cross-browser testing yet.
- The E2E stubs are placeholders. They'll be implemented in a future task once the UI exists.
