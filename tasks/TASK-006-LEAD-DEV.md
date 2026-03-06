# Task 006 — Lead Developer

## UI Foundation: React Shell + Chessground Board

### Objective

Build the foundational UI layer for Chess Gold. This is the start of Phase 1's **UI stage** — wiring the completed game engine to a playable browser interface.

This task delivers a working board with piece movement. No shop or placement UI yet — just the board, game state hook, and the ability to move pieces.

### Prerequisites

- All 100 engine tests passing (`npx vitest run`)
- Read `ARCHITECTURE.md` sections 5 (UI Architecture) and 6 (Project Structure)
- Read `AGENT-LEAD-DEVELOPER.md` — Chessground integration notes
- Install Chessground: `npm install chessground`
- Install Chessground CSS assets (board + piece themes)

### Deliverables

#### 1. Game State Hook (`src/ui/hooks/useGame.ts`)

A React hook that wraps the game engine:

```typescript
function useGame(modeConfig?: GameModeConfig): {
  state: GameState;
  dispatch: (action: GameAction) => void;
  error: GameError | null;
  resetGame: () => void;
}
```

- Uses `useReducer` internally, wrapping `applyAction` from the engine
- `dispatch` calls `applyAction`. If it returns a `GameError`, stores it in `error` state (clears on next successful action)
- `resetGame` calls `createInitialState` and resets to the initial state
- No external state library — pure React

#### 2. Game Context (`src/ui/context/GameContext.tsx`)

React Context that provides the game state and dispatch to all child components:

```typescript
const GameContext = createContext<ReturnType<typeof useGame> | null>(null);

function GameProvider({ children }: { children: React.ReactNode }) {
  const game = useGame();
  return <GameContext.Provider value={game}>{children}</GameContext.Provider>;
}

function useGameContext() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGameContext must be used within GameProvider');
  return ctx;
}
```

#### 3. Chessground Board Component (`src/ui/components/Board.tsx`)

Wrap Chessground as a React component following the pattern in AGENT-LEAD-DEVELOPER.md:

- Create Chessground instance in `useEffect`, destroy on unmount
- Sync engine state to Chessground via `cgRef.current.set()` on state changes
- Convert `getLegalMoves` output to Chessground's `dests` format (`Map<Key, Key[]>` using algebraic notation like `'e2'` not numeric squares)
- Handle the `move` event: convert Chessground's algebraic move to engine's `MoveAction` and dispatch
- Board dimensions: 8x8, standard orientation (white on bottom)
- Import Chessground CSS (board theme + piece theme)

**Key conversion:** Chessground uses string keys (`'a1'`, `'e4'`) while the engine uses numeric `Square` (0-63). You'll need helpers to convert between them.

#### 4. Minimal App Shell (`src/ui/App.tsx` + `src/main.tsx`)

- `App.tsx`: Wraps everything in `GameProvider`, renders the board and minimal status info
- Show whose turn it is (text above or below the board)
- Show both players' gold (simple text display — not styled yet)
- `main.tsx`: Renders `<App />` into the DOM
- `index.html`: Standard Vite HTML entry point with a root div

#### 5. Basic Styling (`src/styles/main.css`)

- Import Chessground's base CSS
- Center the board on the page
- Set board dimensions (e.g., 480px × 480px or responsive)
- Minimal layout — this gets polished later

### What This Task Does NOT Include

- Shop / piece purchase UI (Task 007)
- Placement mode (Task 007)
- Gold display component (Task 007)
- Game over dialog (Task 007)
- Action history panel (Task 007)
- Responsive design (Phase 2)
- Sound effects (Phase 2)

### Testing

- Verify the app starts with `npm run dev` and the board renders
- Verify the board shows two kings (white e1, black e8)
- Verify you can drag/click the white king to a legal square and the turn switches
- Verify illegal moves are rejected (Chessground should only allow legal destinations)
- The engine unit tests still pass (`npx vitest run`)

### Constraints

- Chessground is imperative — wrap it, don't fight it
- The board component must NOT import engine internals directly. It receives state and callbacks via context/props.
- Keep it simple — this is the scaffold. Visual polish comes in Phase 2.

### Done When

**Status: COMPLETE**

- [x] `npm run dev` starts the app and renders a chess board
- [x] Board shows kings-only starting position
- [x] Pieces can be moved by clicking/dragging
- [x] Only legal moves are allowed
- [x] Turn alternates after each move
- [x] Gold display shows current gold for both players (plain text is fine)
- [x] Turn indicator shows whose turn it is
- [x] `npx vitest run` — all engine tests still pass
- [x] Commit and push
