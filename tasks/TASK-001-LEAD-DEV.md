# Task 001 — Lead Developer

## Project Scaffolding + Foundation Types

### Objective

Initialize the Chess Gold project: create the Vite + React + TypeScript application, install all dependencies, configure tooling, and implement the two foundational engine files (`types.ts` and `config.ts`) that everything else builds on.

### Prerequisites

- Read `ARCHITECTURE.md` (full document)
- Read `CONCEPT-CHESS-GOLD.md` (game rules — source of truth)
- Read `AGENT-LEAD-DEVELOPER.md` (your role and constraints)

### Deliverables

#### 1. Project Initialization

```bash
npm create vite@latest . -- --template react-ts
npm install
```

Install dependencies:
- `chessops` — chess rules engine
- `chessground` — board UI

Dev dependencies:
- `vitest` — unit test runner
- `@testing-library/react` — component testing (will be used later)
- `playwright` — E2E testing (will be used later)

#### 2. Configure Tooling

- `tsconfig.json` — strict mode enabled
- `vite.config.ts` — standard React config
- `vitest.config.ts` — configure test runner, point at `test/` directory
- Verify `npm run dev`, `npm run build`, and `npx vitest run` all work (even if no tests exist yet)

#### 3. Create Directory Structure

```
src/
├── engine/
│   ├── types.ts
│   ├── config.ts
│   ├── gold.ts          (empty placeholder)
│   ├── placement.ts     (empty placeholder)
│   ├── position.ts      (empty placeholder)
│   ├── promotion.ts     (empty placeholder)
│   ├── win-conditions.ts (empty placeholder)
│   └── game.ts          (empty placeholder)
├── ui/
│   ├── components/
│   ├── hooks/
│   └── context/
├── styles/
├── main.tsx
└── vite-env.d.ts
test/
├── engine/
├── e2e/
├── helpers/
└── setup.ts
```

Empty placeholders should export nothing — they exist so QA can import from the correct paths when writing tests.

#### 4. Implement `src/engine/types.ts`

All TypeScript interfaces and types from ARCHITECTURE.md section 3.1:

- `GameState` — full game state interface
- `GameModeConfig` — feature flag interface
- `WinCondition` — union type
- `GameAction` — discriminated union (move, place, equip, hit-loot-box)
- `LootBox`, `Item`, `EquippedItem`, `InventoryItem` — supporting types
- `PiecePrices`, `CaptureRewards` — pricing interfaces
- `Color` (`'white' | 'black'`), `Square`, `PieceType` — basic types
- `GameError` — error type for invalid actions

Use chessops types where appropriate (e.g., `Square` from chessops if compatible, or define our own).

#### 5. Implement `src/engine/config.ts`

The `CHESS_GOLD_CONFIG` constant object from ARCHITECTURE.md section 3.2, plus the `MODE_PRESETS` record from section 3.3:

- Piece prices, capture rewards, starting gold, gold per turn, promotion cost
- Placement zone rules
- Loot box configuration (spawn interval, drop table, equip costs)
- All 9 named mode presets (chess-gold, loot-boxes, standard, etc.)

No logic — just constants and presets. Everything the engine needs to look up a value should be here.

### Done When

**Status: COMPLETE**

- [x] `npm run dev` starts a Vite dev server with the default React template
- [x] `npm run build` produces a production build without errors
- [x] `npx vitest run` executes (passes with 0 tests — no failures)
- [x] `src/engine/types.ts` exports all types listed above, compiles without errors
- [x] `src/engine/config.ts` exports `CHESS_GOLD_CONFIG` and `MODE_PRESETS`, compiles without errors
- [x] All empty engine module placeholders exist at the correct paths
- [x] Test directory structure exists
- [x] Commit and push

### Notes

- This is foundation work — no game logic yet. Types and config are the contract that QA will write tests against.
- QA is blocked until this task is complete (they need types to import and config to assert against).
- Follow the architectural constraints: serializable types only (no Map, no class instances), strict TypeScript.
