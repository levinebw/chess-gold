# Chess Gold — System Architecture

> Living document. Updated as decisions are made and phases progress.

---

## 1. System Overview

Chess Gold is a browser-based chess variant where players start with only a king and spend gold to recruit pieces. The system has four logical layers:

```
┌─────────────────────────────────────────────────────┐
│                    UI Layer                          │
│  React + Chessground + Game Panels (shop, gold, etc)│
├─────────────────────────────────────────────────────┤
│                  Game Engine                         │
│  Turn state machine, gold economy, placement,       │
│  items, loot boxes, game mode rules                 │
├─────────────────────────────────────────────────────┤
│                 Chess Rules                          │
│  chessops (move generation, check/checkmate,        │
│  board representation) — extended for Chess Gold    │
├─────────────────────────────────────────────────────┤
│              Network Layer (future)                  │
│  WebSocket client/server, room management,          │
│  matchmaking, Elo — added in v0.4                   │
└─────────────────────────────────────────────────────┘
```

**Key architectural principle:** The Game Engine is a standalone module with **zero UI dependencies**. It receives commands, validates them, produces new state, and emits events. Today it runs in-browser; tomorrow it runs on a server with no code changes to the engine itself.

---

## 2. Tech Stack

| Layer | Technology | Justification |
|-------|-----------|---------------|
| **Language** | TypeScript (strict mode) | Type safety is critical for game rule correctness. chessops is TS-native. |
| **Build tool** | Vite | Fast dev server, zero-config TS/React support, optimized production builds |
| **Chess rules** | [chessops](https://github.com/niklasf/chessops) | Variant-aware architecture, Crazyhouse piece-drop as head start, battle-tested (powers lichess) |
| **Board UI** | [Chessground](https://github.com/lichess-org/chessground) | 10KB gzipped, variant-agnostic, drag-and-drop, animations, built-in chessops integration |
| **UI framework** | React 18+ | Component model suits the game panels (shop, gold display, inventory). Largest ecosystem for future UI needs (lobbies, matchmaking, settings). |
| **State management** | React useReducer + Context | Game engine is already a reducer (`(state, action) => state`). No external state library needed for MVP. |
| **Unit testing** | Vitest | Vite-native test runner, fast, compatible with the build config |
| **E2E testing** | Playwright | Real browser testing against the actual UI. Smoke tests from late Phase 1. |
| **Linting** | ESLint + Prettier | Standard code quality tooling |
| **Hosting (MVP)** | Vercel or GitHub Pages | Free static hosting. No backend needed for local 2-player. |
| **Hosting (v0.4+)** | Vercel (frontend) + Fly.io or Railway (WebSocket server) | Scalable, affordable backend hosting for multiplayer |

### License Note

chessops and Chessground are **GPL-3.0**. This means Chess Gold's source code must be GPL-3.0 compatible. For a browser game where JS source is inherently visible, this is acceptable. If closed-source distribution is ever needed, these libraries would need to be replaced or relicensed.

---

## 3. Data Model

### 3.1 Game State (fully serializable)

All game state is plain data — no class instances, no functions, no DOM references. This enables save/load, undo/redo, network sync, replay, and headless testing.

```typescript
// Core game state — serializable to JSON
interface GameState {
  // Board state (derived from chessops, stored as FEN + extensions)
  fen: string;                    // Standard FEN for piece positions

  // Turn management
  turn: 'white' | 'black';
  turnNumber: number;             // Increments each full round (both players moved)
  halfMoveCount: number;          // Total half-moves taken

  // Gold economy
  gold: {
    white: number;                // Supports 0.5 increments
    black: number;
  };

  // Inventory (pieces from loot boxes — free to place)
  inventory: {
    white: InventoryItem[];
    black: InventoryItem[];
  };

  // Items (from loot boxes — can be equipped)
  items: {
    white: Item[];
    black: Item[];
  };

  // Equipment (items attached to pieces on the board)
  // Keyed by square for MVP. See "Piece Identity" in section 10 for
  // the planned migration to piece-ID-based tracking in Phase 7.
  equipment: Record<Square, EquippedItem>;

  // Loot boxes (when lootBoxes feature flag is active)
  lootBoxes: LootBox[];
  lootBoxesCollected: {           // Track per-player for alternate win condition
    white: number;
    black: number;
  };

  // Game status
  status: 'active' | 'check' | 'checkmate' | 'stalemate' | 'draw';
  winner: 'white' | 'black' | null;

  // History
  actionHistory: GameAction[];

  // Configuration
  modeConfig: GameModeConfig;     // Feature flags — see section 3.3
}

// --- Game Mode System (ADR-005) ---
// Modes are defined as feature flag combinations, not a flat enum.
// Named modes are presets. Custom/combined modes set flags individually.

interface GameModeConfig {
  name: string;                    // Display name (e.g., "Chess Gold", "Flashlight Gold")
  goldEconomy: boolean;            // Buy/place pieces with gold, +1 gold/turn, capture rewards
  lootBoxes: boolean;              // Loot box spawning, items, equipment
  pieceConversion: boolean;        // Captured pieces change to your color (Conqueror/King's Chess)
  placementThrottle: boolean;      // Can only place pieces every other turn (King's Chess)
  fogOfWar: boolean;               // Only see squares your pieces can move to (Flashlight)
  noCheck: boolean;                // Check doesn't exist; kings can be captured directly (Flashlight)
  centerPulse: boolean;            // Siege center-square mechanic + temporary piece upgrades
  standardStart: boolean;          // Standard chess starting position (vs. kings-only start)
  winConditions: WinCondition[];   // Which win conditions are active (see section 3.4)
}

type WinCondition =
  | 'checkmate'                    // Standard: checkmate opponent's king(s)
  | 'king-captured'               // King is captured directly — used when noCheck is true (Flashlight)
  | 'all-converted'               // All opponent pieces are your color (Conqueror, King's Chess)
  | 'loot-boxes-collected'        // Collect 6 loot boxes (Loot Boxes mode)
  | 'center-occupied'             // Occupy all 4 center squares simultaneously (Siege)
  | 'all-eliminated';             // Eliminate all opponent pieces (Gold Mine)

// --- Two Kings Rule (not a mode flag — a game rule) ---
// When a player has 2+ kings (from a loot box), special rules activate:
// - Check is not mandatory to resolve (kings CAN be captured)
// - Losing a king = losing a "life" (king is removed from the board)
// - When down to 1 king, normal chess rules resume (must escape check)
// - You lose when your last king is captured
// This applies in ANY mode that has loot boxes (since that's how you get a 2nd king).

// Actions a player can take on their turn
type GameAction =
  | { type: 'move'; from: Square; to: Square; promotion?: PieceType }
  | { type: 'place'; piece: PieceType; square: Square; fromInventory: boolean }
  | { type: 'equip'; item: ItemType; square: Square }
  | { type: 'hit-loot-box'; pieceSquare: Square; lootBoxSquare: Square };

// Piece pricing (configurable, not hardcoded)
interface PiecePrices {
  pawn: number;
  bishop: number;
  knight: number;
  rook: number;
  queen: number;
}

// Capture rewards
interface CaptureRewards {
  pawn: number;
  bishop: number;
  knight: number;
  rook: number;
  queen: number;
}

// Loot box
interface LootBox {
  square: Square;
  hitsRemaining: number;       // Starts at 3, decremented on hit
  lastHitBy: 'white' | 'black' | null;
  spawnedOnTurn: number;
}

// Items
type ItemType = 'crossbow' | 'turtle-shell' | 'crown';

interface Item {
  type: ItemType;
}

interface EquippedItem {
  type: ItemType;
  // Turtle shell: tracks remaining hits
  remainingHits?: number;
}

interface InventoryItem {
  type: 'piece' | 'item';
  pieceType?: PieceType;
  itemType?: ItemType;
}
```

### 3.2 Game Configuration

All tuning values live in a configuration object, not buried in logic:

```typescript
const CHESS_GOLD_CONFIG = {
  startingGold: 3,
  goldPerTurn: 1,
  promotionCost: 1,

  piecePrices: {
    pawn: 1, bishop: 3, knight: 3, rook: 5, queen: 8
  },

  captureRewards: {
    pawn: 0.5, bishop: 1.5, knight: 1.5, rook: 2.5, queen: 4
  },

  placement: {
    maxRow: 3,          // Can place on rows 1-3 from your side
    pawnMinRow: 2,      // Pawns can only go on rows 2-3
  },

  lootBox: {
    spawnInterval: 4,             // Fixed: every 4 rounds
    maxActiveBoxes: 1,            // Only one loot box on the board at a time
    boxesToWin: 6,                // Alternate win condition (when loot-boxes-collected is active)
    hitsToOpen: 3,
    queenHitsToOpen: 1,
    pawnHitsWithoutMoving: true,  // Pawns can hit adjacent loot boxes without moving
    equipCosts: { crossbow: 2, 'turtle-shell': 2, crown: 3.5 },
    dropTable: [
      { contents: { type: 'gold', amount: 3 }, weight: 12.5 },
      { contents: { type: 'gold', amount: 4 }, weight: 6.25 },
      { contents: { type: 'gold', amount: 5 }, weight: 6.25 },
      { contents: { type: 'gold', amount: 6 }, weight: 6.25 },
      { contents: { type: 'piece', piece: 'pawn' }, weight: 18.75 },
      { contents: { type: 'piece', piece: 'bishop' }, weight: 12.5 },
      { contents: { type: 'piece', piece: 'knight' }, weight: 12.5 },
      { contents: { type: 'piece', piece: 'rook' }, weight: 6.25 },
      { contents: { type: 'item', item: 'turtle-shell' }, weight: 6.25 },
      { contents: { type: 'item', item: 'crossbow' }, weight: 6.25 },
      { contents: { type: 'item', item: 'crown' }, weight: 6.24 },
      { contents: { type: 'piece', piece: 'king' }, weight: 0.01 },
    ],
  },
};
```

### 3.3 Game Mode Presets

Named modes are preset configurations of the feature flags defined in `GameModeConfig`. Custom/combined modes (e.g., "Loot Boxes + Gold Mine") set flags individually.

```typescript
const MODE_PRESETS: Record<string, GameModeConfig> = {
  'chess-gold': {
    name: 'Chess Gold',
    goldEconomy: true,
    lootBoxes: false,
    pieceConversion: false,
    placementThrottle: false,
    fogOfWar: false,
    noCheck: false,
    centerPulse: false,
    standardStart: false,
    winConditions: ['checkmate'],
  },
  'loot-boxes': {
    name: 'Loot Boxes',
    goldEconomy: true,
    lootBoxes: true,
    pieceConversion: false,
    placementThrottle: false,
    fogOfWar: false,
    noCheck: false,            // Check exists normally; Two Kings rule activates only if 2nd king obtained
    centerPulse: false,
    standardStart: false,
    winConditions: ['checkmate', 'loot-boxes-collected'],
  },
  'gold-mine': {
    name: 'Gold Mine',
    goldEconomy: true,         // Tentative: infinite gold / everything free (pending confirmation)
    lootBoxes: false,
    pieceConversion: false,
    placementThrottle: false,
    fogOfWar: false,
    noCheck: false,
    centerPulse: false,
    standardStart: false,
    winConditions: ['checkmate', 'all-eliminated'],
  },
  'conqueror': {
    name: 'Conqueror Chess',
    goldEconomy: false,
    lootBoxes: false,
    pieceConversion: true,
    placementThrottle: false,
    fogOfWar: false,
    noCheck: false,
    centerPulse: false,
    standardStart: true,
    winConditions: ['all-converted'],
  },
  'kings-chess': {
    name: "King's Chess",
    goldEconomy: true,
    lootBoxes: false,
    pieceConversion: true,
    placementThrottle: true,
    fogOfWar: false,
    noCheck: false,
    centerPulse: false,
    standardStart: false,
    winConditions: ['all-converted'],
  },
  'siege': {
    name: 'Siege',
    goldEconomy: false,
    lootBoxes: false,
    pieceConversion: false,
    placementThrottle: false,
    fogOfWar: false,
    noCheck: false,
    centerPulse: true,
    standardStart: true,
    winConditions: ['checkmate', 'center-occupied'],
  },
  'flashlight': {
    name: 'Flashlight',
    goldEconomy: false,
    lootBoxes: false,
    pieceConversion: false,
    placementThrottle: false,
    fogOfWar: true,
    noCheck: true,             // No check — king capture replaces checkmate
    centerPulse: false,
    standardStart: true,
    winConditions: ['king-captured'],
  },
  'flashlight-gold': {
    name: 'Flashlight Gold',
    goldEconomy: true,
    lootBoxes: false,
    pieceConversion: false,
    placementThrottle: false,
    fogOfWar: true,
    noCheck: true,             // No check — king capture replaces checkmate
    centerPulse: false,
    standardStart: false,
    winConditions: ['king-captured'],
  },
  'standard': {
    name: 'Standard Chess',
    goldEconomy: false,
    lootBoxes: false,
    pieceConversion: false,
    placementThrottle: false,
    fogOfWar: false,
    noCheck: false,
    centerPulse: false,
    standardStart: true,
    winConditions: ['checkmate'],
  },
};
```

### 3.4 Win Condition System

Win conditions are evaluated by the engine at the end of each action. Each mode config declares which conditions are active. The engine checks them in order and declares a winner when any condition is met.

```typescript
// Each win condition is a pure function: state → winner or null
type WinConditionChecker = (state: GameState) => 'white' | 'black' | null;

// Registry of win condition implementations
const WIN_CONDITION_CHECKERS: Record<WinCondition, WinConditionChecker> = {
  'checkmate': checkForCheckmate,
  'king-captured': checkKingCaptured,       // Used when noCheck is true (Flashlight modes)
  'all-converted': checkAllConverted,
  'loot-boxes-collected': checkLootBoxCount,
  'center-occupied': checkCenterOccupied,
  'all-eliminated': checkAllEliminated,
};

// Called at end of each action
function evaluateWinConditions(state: GameState): 'white' | 'black' | null {
  for (const condition of state.modeConfig.winConditions) {
    const winner = WIN_CONDITION_CHECKERS[condition](state);
    if (winner) return winner;
  }
  return null;
}
```

For MVP, only `checkForCheckmate` is implemented. Others are defined as types and stubs, built when their modes are implemented.

---

## 4. Game Engine Architecture

The engine follows a **command pattern / reducer model**:

```
UI dispatches action → Engine validates → Engine produces new state → UI re-renders
```

```typescript
// The core engine function — pure, testable, no side effects
function applyAction(state: GameState, action: GameAction): GameState | GameError {
  // 1. Validate the action is legal
  // 2. Apply the action to produce new state
  // 3. Check for check/checkmate/stalemate
  // 4. Advance turn, award gold income
  // 5. Return new state (or error if invalid)
}
```

### 4.1 Engine Modules

| Module | Responsibility |
|--------|---------------|
| `engine/game.ts` | Top-level game reducer, turn management, game-over detection |
| `engine/gold.ts` | Gold balance tracking, purchase validation, capture reward calculation |
| `engine/placement.ts` | Placement zone validation, pawn row rules, check-blocking via placement |
| `engine/position.ts` | chessops integration — wraps/extends chessops for move generation and board state |
| `engine/promotion.ts` | Pawn promotion with gold cost, stuck-pawn handling |
| `engine/win-conditions.ts` | Pluggable win condition checkers, evaluated per turn per mode config |
| `engine/config.ts` | All game constants, tuning values, and mode presets |
| `engine/types.ts` | TypeScript type definitions for game state, actions, and mode config |

### 4.2 chessops Integration Strategy

chessops provides:
- Legal move generation (`pos.dests()`)
- Check/checkmate/stalemate detection
- Board representation and FEN conversion

Chess Gold extends this by:
- Using chessops's `Chess` position for standard move validation
- Adding a **placement layer** on top — placement is validated by custom code, then the resulting board position is verified through chessops (to ensure placement doesn't leave own king in check, or to confirm it resolves check)
- The game engine coordinates between chessops and custom placement logic

We do **not** subclass chessops's `Position`. Instead, we compose:
- Maintain a chessops `Chess` instance internally
- Sync it with our game state after each action
- Query it for legal moves and game status

This avoids deep coupling to chessops internals and makes replacement easier if needed.

### 4.3 Turn State Machine

```
┌─────────┐
│  START   │  Player's turn begins
│  OF TURN │  +1 gold awarded
└────┬─────┘
     │
     ▼
┌──────────┐     ┌──────────────┐
│  CHOOSE  │────►│  PLACE PIECE │──► Turn ends
│  ACTION  │     │  (costs gold)│
└────┬─────┘     └──────────────┘
     │
     ├──────────►┌──────────────┐
     │           │  MOVE PIECE  │──► Turn ends
     │           │  (free)      │
     │           └──────────────┘
     │
     │  (Loot Box mode only)
     ├──────────►┌──────────────┐
     │           │ HIT LOOT BOX │──► Turn ends
     │           └──────────────┘
     │
     │  (Items: does NOT end turn)
     └──────────►┌──────────────┐
                 │  EQUIP ITEM  │──► Back to CHOOSE ACTION
                 │  (costs gold)│
                 └──────────────┘
```

---

## 5. UI Architecture

### 5.1 Component Tree (MVP)

```
<App>
  <GameProvider>              ← React Context with useReducer
    <GameHeader>              ← Turn indicator, game mode label
    <GameLayout>              ← Flexbox: board + sidebar
      <BoardPanel>
        <ChessgroundWrapper>  ← Imperative Chessground in useEffect
      <SidePanel>
        <GoldDisplay>         ← Both players' gold
        <Shop>                ← Available pieces with prices, buy buttons
        <ActionHistory>       ← Recent moves/placements
    <GameOverDialog>          ← Modal on checkmate/stalemate
  </GameProvider>
</App>
```

### 5.2 Chessground Integration

Chessground is an imperative library (not React). It's wrapped in a React component:

```typescript
function ChessgroundWrapper({ state, onMove, onPlacement }: Props) {
  const boardRef = useRef<HTMLDivElement>(null);
  const cgRef = useRef<Api | null>(null);

  // Create instance once
  useEffect(() => {
    cgRef.current = Chessground(boardRef.current!, { /* initial config */ });
    return () => cgRef.current?.destroy();
  }, []);

  // Sync state changes to Chessground
  useEffect(() => {
    cgRef.current?.set({
      fen: state.fen,
      turnColor: state.turn,
      movable: { dests: getLegalMoves(state) },
      // ...
    });
  }, [state]);

  return <div ref={boardRef} />;
}
```

### 5.3 Placement UI Flow

When a player wants to place a piece:
1. Player clicks a piece in the Shop
2. UI enters "placement mode" — eligible squares are highlighted on the board
3. Player clicks an eligible square
4. Engine validates and applies the placement
5. Board updates, gold deducted, turn passes

This uses Chessground's custom event handling — we highlight valid squares and listen for click events during placement mode.

---

## 6. Project Structure

```
chess-gold/
├── src/
│   ├── engine/                # Game logic — ZERO UI dependencies
│   │   ├── game.ts            # Game state reducer, turn management
│   │   ├── gold.ts            # Gold economy (balance, purchases, rewards)
│   │   ├── placement.ts       # Placement validation (zones, pawn rules)
│   │   ├── position.ts        # chessops wrapper (legal moves, check detection)
│   │   ├── promotion.ts       # Pawn promotion with gold cost
│   │   ├── win-conditions.ts  # Pluggable win condition checkers
│   │   ├── config.ts          # All game constants, tuning values, mode presets
│   │   └── types.ts           # TypeScript interfaces and types
│   ├── ui/
│   │   ├── App.tsx            # Root component
│   │   ├── components/
│   │   │   ├── Board.tsx      # Chessground wrapper component
│   │   │   ├── Shop.tsx       # Piece shop with prices and buy buttons
│   │   │   ├── GoldDisplay.tsx
│   │   │   ├── TurnIndicator.tsx
│   │   │   ├── ActionHistory.tsx
│   │   │   └── GameOverDialog.tsx
│   │   ├── hooks/
│   │   │   └── useGame.ts     # Game state hook (useReducer + engine)
│   │   └── context/
│   │       └── GameContext.tsx # React context for game state
│   ├── styles/
│   │   └── main.css           # Global styles + Chessground theme overrides
│   ├── main.tsx               # Entry point
│   └── vite-env.d.ts
├── test/
│   ├── engine/                # Pure logic tests — fast, no DOM
│   │   ├── game.test.ts
│   │   ├── gold.test.ts
│   │   ├── placement.test.ts
│   │   └── promotion.test.ts
│   ├── e2e/                   # Playwright E2E smoke tests
│   │   └── game-flow.spec.ts
│   ├── helpers/               # Test factories and utilities
│   │   └── gameState.ts       # createGameState(), createBoardWithPieces()
│   └── setup.ts               # Test configuration
├── public/
│   └── favicon.ico
├── index.html                 # Vite entry HTML
├── package.json
├── tsconfig.json
├── vite.config.ts
├── vitest.config.ts
├── ARCHITECTURE.md            # This file
├── CONCEPT-CHESS-GOLD.md      # Game design spec
├── RESEARCH-CHESS-ENGINES.md  # Library research
├── AGENT-PRINCIPAL-ARCHITECT.md
├── AGENT-LEAD-DEVELOPER.md
└── .gitignore
```

---

## 7. Phase Breakdown

### Phase 1 — MVP: Local 2-Player Chess Gold

**Scope:**
- Full Chess Gold rules (gamemode 1) enforced correctly
- Playable in browser on one device (hot-seat / pass-and-play)
- Board rendering with Chessground
- Piece shop UI with gold tracking
- Placement system with zone validation
- Pawn promotion with gold cost
- Capture rewards
- +1 gold/turn income
- Check, checkmate, stalemate detection
- Turn indicator and gold display

**Explicitly out of scope:**
- Loot boxes, items (gamemode 2)
- Other game modes (3, 4, 5)
- Sound, animations beyond Chessground defaults
- Tutorial / rules screen
- Online multiplayer
- Bot opponents
- Mobile-optimized layout

**Phase 1 has two stages:**
1. **Engine + unit tests** — Build all `src/engine/` modules with QA writing tests in parallel (TDD). No UI yet.
2. **UI integration + E2E smoke tests** — Wire engine to React/Chessground UI. Once playable in-browser, QA writes Playwright E2E tests verifying critical user flows (start game, buy piece, move, capture, checkmate). This ensures the real user interface works, not just the headless engine.

**Entry criteria:** ARCHITECTURE.md approved, dev environment set up
**Exit criteria:** Two players can play a complete game of Chess Gold with all rules correctly enforced. Engine has >90% test coverage.

**Dependencies:** None (first phase)

**Risks:**
- chessops integration complexity — *mitigation: spike the position wrapper early, validate that legal moves + check detection work with custom piece placement before building the full game*
- Placement-resolves-check edge case — *mitigation: explicit test cases for this scenario*

**Team:** Lead Developer + QA Engineer (working in parallel — see below)

**QA in Phase 1:** The QA Engineer works alongside the Lead Developer from day one. As the developer builds each engine module (`gold.ts`, `placement.ts`, etc.), the QA agent writes tests against it in `test/engine/`. This is a tight feedback loop:
1. Developer builds module → QA writes tests → failures surface immediately → developer fixes before moving on.
2. QA also writes spec-derived test cases ahead of implementation where the rules are unambiguous (e.g., "buying a knight costs 3 gold" can be tested before the gold module exists — the test simply fails until it's built).
3. The developer works in `src/`. The QA agent works in `test/`. No file conflicts.
4. Full test plan for Phase 1 is defined in `AGENT-QA.md`.

---

### Phase 2 — v0.2: UI/UX Polish

**Scope:**
- Rules / how-to-play screen
- Sound effects (piece move, capture, check, purchase, game over)
- Visual feedback improvements (last move highlight, check highlight, gold change animation)
- Move history panel with notation
- Responsive layout for desktop and tablet

**Team:** Lead Developer + QA Engineer

---

### Phase 3 — v0.3: Web Deployment

**Scope:**
- Deploy to Vercel (or GitHub Pages)
- Shareable URL
- PWA manifest (optional — installable on mobile)
- Basic analytics (page views, games started/completed)

**Team:** Lead Developer (DevOps tasks are minimal for static deploy)

---

### Phase 4 — v0.4: Online Multiplayer

**Scope:**
- WebSocket server (Node.js + ws or Socket.IO)
- Server-authoritative game engine (same engine code runs on server)
- Game rooms (create, join, spectate)
- Basic matchmaking (random pairing)
- Reconnection handling
- Anti-cheat: server validates all moves

**Architecture change:** The game engine module moves to a shared package imported by both client and server. The client becomes a thin renderer that sends actions to the server and renders the state it receives back.

**Team:** Lead Developer + Backend Developer agent

**Risks:**
- State synchronization bugs — *mitigation: the engine is already a pure reducer; server sends full state snapshots on reconnect*
- Latency — *mitigation: optimistic updates on client, server confirms or rolls back*

---

### Phase 5 — v0.5: Bot Opponent

**Scope:**
- Heuristic AI (not strong, just functional)
- Material evaluation + simple lookahead
- Gold spending strategy (when to buy, what to buy)
- Difficulty levels (easy / medium)

**Team:** Lead Developer or dedicated Game/Logic Engineer

---

### Phase 6 — v0.6: Conqueror Chess + Standard Chess (Modes 4, 9)

**Scope:**
- Game mode selector in UI
- **Standard Chess (mode 9)**: Trivially supported — all custom feature flags off, `standardStart: true`. This is the baseline "just play chess" mode.
- **Conqueror Chess (mode 4)**: Standard starting positions, no gold economy. Captured pieces change color. Win condition: `all-converted`.
- Piece conversion engine logic (reusable for King's Chess later)

**Team:** Lead Developer + QA Engineer

---

### Phase 7 — v0.7: Loot Boxes (Mode 2)

**Scope:**
- Loot box spawning (fixed every 4 rounds, max 1 on board)
- Hitting mechanics (3 hits to open, 1 for queen, pawns hit without moving)
- Opening and reward distribution (weighted drop table)
- Item system (Crossbow, Turtle Shell, Crown) and equipment mechanics
- **Piece identity layer** — assign unique IDs to pieces at placement/game-start. Equipment tracked by piece ID instead of square. Also required for Two Kings rule (see Open Questions).
- Inventory management UI
- Equipment UI
- Alternate win condition: collect 6 loot boxes
- Two Kings rule (if a player gets a king from loot box — pending spec clarification, see Open Questions)

**Team:** Lead Developer + QA Engineer

---

### Phase 8 — v1.0: Full Platform

**Scope:**
- Lobbies
- Elo rating system
- Rated vs. casual games
- Player profiles
- Game history / replay
- Database (PostgreSQL or SQLite for ratings and game records)

**Team:** Lead Developer + Backend Developer + QA Engineer

---

### Phase 9 — v1.1: King's Chess + Gold Mine (Modes 5, 3)

**Scope:**
- **King's Chess (mode 5)**: Chess Gold + piece conversion (reuses Phase 6 logic) + placement throttle (every other turn only). Win condition: `all-converted`.
- **Gold Mine (mode 3)**: Requires design clarification first (starting gold? placement rules? — see Open Questions). Win condition: `all-eliminated` or `checkmate`.

**Team:** Lead Developer + QA Engineer

---

### Phase 10 — v1.2: Siege (Mode 6)

**Scope:**
- **Center square pulse:** Every 5 moves, d4/d5/e4/e5 pulse. Any piece on a center square during a pulse receives a temporary one-move upgrade.
- **Temporary upgrade system:** Upgrades last for the piece's next move only, then revert. Upgrades by piece type:
  - Pawn: move 1 square in any direction, capture in any direction (king-like movement)
  - Knight: double jump (two L-moves in one turn)
  - Rook/Bishop/Queen: can move through one friendly piece once
- **Custom move generation:** Upgraded pieces need temporary move-rule overrides. chessops can't handle this natively — requires a custom move generation layer that checks for active upgrades before delegating to chessops.
- **Win condition:** `center-occupied` (all 4 center squares simultaneously occupied by your pieces) OR `checkmate`
- Standard starting positions, no gold economy

**One remaining clarification:** Does the upgrade persist for exactly one move after the pulse, or until the next pulse? Designer's read is one move only.

**Team:** Lead Developer + QA Engineer

---

### Phase 11 — v1.3: Flashlight Modes (Modes 7, 8)

**Scope:**
- **Flashlight (mode 7)**: Fog of war — players only see squares their pieces can legally move to (+ own square + blocking pieces). **No check exists.** King capture replaces checkmate as the win condition (`noCheck: true`, `winConditions: ['king-captured']`). You CAN move your king into danger. Standard starting positions.
- **Flashlight Gold (mode 8)**: Flashlight + Chess Gold combined. Fog of war + gold economy + piece placement. Same no-check / king-capture rules.
- **Engine changes:** When `noCheck: true`, the legal move generator must NOT filter out moves that leave the king in check (chessops does this by default — need to override or bypass). King becomes a capturable piece.
- **UI changes:** Board rendering must show/hide squares per player's visibility. Significant Chessground customization or overlay system needed (darken/hide non-visible squares).
- **Multiplayer consideration:** Fog of war requires server-authoritative visibility (client can't know hidden state). This mode should only ship after Phase 4 (multiplayer) is complete, or be local-only initially with a trust-based "don't look at the opponent's screen" model.

**Still pending from designer:**
- Exact visibility scope (designer recommends: own square + legal move destinations + squares occupied by blocking pieces)
- Placement in fog (Flashlight Gold): can you place on squares you can't see?

**Team:** Lead Developer + QA Engineer

---

## 8. Testing Strategy

### Methodology: TDD with Parallel QA Agent

The project follows **Test-Driven Development** with the QA Engineer writing tests alongside (and often ahead of) the Lead Developer's implementation. This is mandatory, not optional.

**Workflow per module:**
1. **RED:** QA writes failing tests derived from the game spec
2. **GREEN:** Developer writes minimal code to make tests pass
3. **REFACTOR:** Both review — developer cleans code, QA checks coverage gaps

**Before starting any new work**, run the full test suite to confirm baseline is clean:
```bash
npx vitest run
```

**Every engine module must have corresponding tests.** Code without tests is flagged by the QA agent. Tests without passing code are expected (RED phase) and tracked.

### Unit Tests (from MVP onward)

**What:** Game engine logic — gold economy, placement validation, turn state, promotion, check/checkmate with placed pieces.

**How:** Vitest, running against `src/engine/` with no DOM or UI dependencies.

**Coverage target:** 90%+ for `src/engine/`.

**Owned by:** QA Engineer (see `AGENT-QA.md` for the full Phase 1 test plan with 40+ specific test scenarios).

**Test file structure mirrors source:**

| Source | Test |
|--------|------|
| `src/engine/gold.ts` | `test/engine/gold.test.ts` |
| `src/engine/placement.ts` | `test/engine/placement.test.ts` |
| `src/engine/promotion.ts` | `test/engine/promotion.test.ts` |
| `src/engine/game.ts` | `test/engine/game.test.ts` |
| `src/engine/position.ts` | `test/engine/position.test.ts` |
| `src/engine/win-conditions.ts` | `test/engine/win-conditions.test.ts` |

**Test standards (enforced by QA agent):**
- Descriptive names: `it('awards 1.5 gold when capturing a bishop')`
- Arrange-Act-Assert structure in every test
- Independent tests — no shared mutable state
- Factory functions for game state setup (`createGameState(overrides)`)
- Both positive and negative cases (rule works + rule is enforced)

### Testing Requirements by Change Type

| Change Type | Required Tests | Location |
|-------------|---------------|----------|
| New engine module | Unit tests covering all public functions | `test/engine/` |
| New game rule | Rule enforcement + violation tests | `test/engine/` |
| Bug fix | Regression test that catches the bug | `test/engine/` |
| UI component (v0.2+) | React Testing Library tests | `test/ui/` |
| E2E flow (v0.3+) | Playwright test | `test/e2e/` |

### Integration Tests (v0.2+)

**What:** UI + engine interaction — game flows from start to end.

**How:** React Testing Library + Vitest, testing component interactions.

### E2E Smoke Tests (late Phase 1, expanded in v0.3+)

**What:** Playwright tests against the real browser UI — verifying that a user can start a game, buy pieces, move, capture, and reach checkmate through the actual interface.

**How:** Playwright. Tests in `test/e2e/`.

**Phase 1 scope:** 5-6 smoke tests covering critical user flows (see `AGENT-QA.md` for the specific scenarios). These run against `vite dev` locally.

**v0.3+ scope:** Expanded to cover deployed app, additional game flows, visual regression baselines.

### Manual QA / Playtesting

**What:** Game feel, UX clarity, edge case discovery.

**When:** Every phase, before release.

---

## 9. Architecture Decision Records

### ADR-001: chessops + Chessground over chess.js + react-chessboard

**Context:** Need a chess rules library and board UI for a variant game.

**Decision:** Use chessops + Chessground (GPL-3.0).

**Alternatives considered:**
- chess.js + react-chessboard (MIT/BSD) — permissive license but no variant support, requires heavier forking, no built-in integration.
- Custom from scratch — too much work to reimplement move generation and check detection.

**Consequences:**
- (+) Variant-aware architecture gives head start on placement system
- (+) Battle-tested at scale (lichess)
- (+) Chessground handles all board rendering complexity
- (-) GPL-3.0 requires source availability (acceptable for browser game)
- (-) Chessground is imperative, requires wrapper for React

---

### ADR-002: Composition over inheritance for chessops integration

**Context:** chessops provides an abstract `Position` class that can be extended. We need custom placement rules.

**Decision:** Compose rather than subclass. Maintain a chessops `Chess` instance internally and sync state, rather than extending the `Position` class.

**Alternatives considered:**
- Subclass `Position` to create `ChessGoldPosition` — deep coupling to chessops internals, fragile across version updates.

**Consequences:**
- (+) Loose coupling — chessops is an implementation detail, replaceable
- (+) Clear boundary between "chess rules" and "Chess Gold rules"
- (-) Manual state sync between our game state and chessops position
- (-) Slight overhead vs. direct extension

---

### ADR-003: Reducer pattern for game engine

**Context:** Need a state management approach for game logic that works now (local) and later (networked).

**Decision:** Pure function reducer: `(state, action) => state`. No mutations, no side effects in the engine.

**Alternatives considered:**
- Mutable game object with methods — harder to network, test, and replay.
- Event sourcing — good fit but overkill for MVP.

**Consequences:**
- (+) Trivially testable — pass in state and action, assert output
- (+) Natural fit for React's useReducer
- (+) Serializable state enables save/load, replay, and network sync
- (+) Server-authoritative multiplayer is just "run the reducer on the server"
- (-) Immutable updates can be verbose (mitigated by spread syntax or Immer if needed)

---

### ADR-004: React for UI framework

**Context:** Need a UI framework for game panels (shop, gold display, inventory, dialogs, future lobbies).

**Decision:** React 18+.

**Alternatives considered:**
- Vanilla TypeScript — minimal overhead but state management becomes manual as UI complexity grows
- Svelte — smaller bundles, reactive, but smaller ecosystem and less familiar to most developers
- Preact — lighter React alternative, good option but ecosystem gaps

**Consequences:**
- (+) Largest ecosystem, extensive community resources
- (+) Component model suits game UI panels well
- (+) useReducer maps directly to game engine reducer
- (-) Chessground requires imperative wrapper (manageable)
- (-) Larger bundle than Svelte/Preact (acceptable — game is not bundle-sensitive)

---

### ADR-005: Feature flags over enum for game modes

**Context:** The game has 9+ modes, and players want to combine modes (e.g., "Flashlight + Gold economy"). A flat `GameMode` enum can't express combinations.

**Decision:** Define modes as a set of feature flags (`GameModeConfig`). Named modes (Chess Gold, Conqueror, etc.) are preset configurations. Custom/combined modes set flags individually.

**Alternatives considered:**
- String enum (`type GameMode = 'chess-gold' | ...`) — can't express combinations without exponential growth.
- Bitfield — compact but opaque, harder to extend, no named properties.

**Consequences:**
- (+) Naturally supports mode combining (Flashlight Gold = `fogOfWar: true` + `goldEconomy: true`)
- (+) Adding a new mode is just a new preset, not a code change in the engine
- (+) Engine logic reads flags (`if (state.modeConfig.goldEconomy)`) — clear and self-documenting
- (-) Slightly more complex than a simple enum for MVP (mitigated: MVP only uses one preset)
- (-) Some flag combinations may be nonsensical — need validation

---

### ADR-006: Pluggable win conditions

**Context:** Different modes have different win conditions (checkmate, all-converted, 6 loot boxes, center occupied, all eliminated). Hardcoding these in the engine creates a growing if/else chain.

**Decision:** Win conditions are an array of checker functions declared per mode config. The engine evaluates them in order at the end of each action. First satisfied condition declares the winner.

**Alternatives considered:**
- Single hardcoded `checkGameOver()` function with mode-specific branches — works but doesn't scale, and combined modes make the branching complex.

**Consequences:**
- (+) Each win condition is a small, testable, independent function
- (+) Mode presets declare exactly which conditions apply — no implicit coupling
- (+) Combined modes naturally support multiple win conditions
- (-) Slightly more indirection than a monolithic check (acceptable)

---

## 10. Future Considerations (not designed now, noted for awareness)

### Piece Identity Layer (planned for Phase 7)

chessops tracks pieces by type and square, not by identity. Chess Gold needs piece identity for:
- **Equipment tracking** — items must follow a specific piece when it moves (square-based tracking is fragile)
- **Two Kings rule** — need to distinguish which king is which
- **Future replay/analytics** — "this specific knight captured 3 pieces" requires identity

**Planned approach:** Assign a unique `PieceId` (incrementing integer) to each piece at placement or game start. Maintain a parallel map `Record<Square, PieceId>` alongside the chessops board. When a piece moves, update the map. Equipment is then `Record<PieceId, EquippedItem>` instead of `Record<Square, EquippedItem>`.

This is not needed for MVP (no equipment, no loot boxes). Built in Phase 7 when items are introduced. The MVP's `Record<Square, EquippedItem>` in the type definition is a placeholder that gets replaced.

### Other Future Items

- **Replay system** — Serializable state + action history makes this straightforward when needed
- **Spectator mode** — Server broadcasts state to spectator clients (v0.4 architecture supports this)
- **Mobile app** — React Native or Capacitor wrapping the web app (if demand exists)
- **Monetization** — Cosmetic piece skins, board themes (no pay-to-win). GPL-3.0 doesn't prevent monetization, just requires source availability.
- **Accessibility** — Keyboard navigation, screen reader support for board state. Worth designing from v0.2.
- **Internationalization** — Text externalization. Not needed for MVP but easier to add early.

---

## 11. Open Questions for Game Designer

Status tracker for spec clarifications. See `OQ-RESPONSES.md` for full designer responses.

### OQ-1: Two Kings Rule — RESOLVED

**Decision: King capture model ("two lives").**
- With two kings, kings CAN be captured. Check is not mandatory to resolve.
- Losing a king = losing a "life" (king removed from board).
- Down to one king = normal chess rules resume (must escape check).
- You lose when your last king is captured.

**Status:** Approved by designer. Pending final sign-off from end-users before Phase 7. Encoded in architecture (see Two Kings Rule note in section 3.1).

### OQ-2: Siege Mode — MOSTLY RESOLVED

**Answered:**
- Pulse trigger: every 5 moves, center squares (d4/d5/e4/e5) pulse.
- Pieces on center squares during pulse get a temporary one-move upgrade.
- Upgrades: Pawns get king-like movement, Knights get double-jump, Rooks/Bishops/Queens can pass through one friendly piece.
- Win by occupation: all 4 center squares simultaneously occupied by your pieces.

**Still pending:** Does the upgrade persist for exactly one move after the pulse, or until the next pulse? Designer's read is one move only — awaiting confirmation.

**Status:** Detailed enough to design. Final detail needed before Phase 10 implementation.

### OQ-3: Flashlight Mode — PARTIALLY RESOLVED

**Answered:**
- **No check.** King capture replaces checkmate entirely. `noCheck: true`, `winConditions: ['king-captured']`.
- If you move your king into danger and the opponent captures it, you lose.

**Still pending:**
- Exact visibility scope (designer recommends: own square + legal move destinations + blocking piece squares)
- Placement in fog (Flashlight Gold): can you place on squares you can't see?

**Status:** Core mechanic confirmed. Visibility details needed before Phase 11 implementation.

### OQ-4: Gold Mine — PENDING

**Designer's tentative interpretation:**
- Infinite gold / everything free (no economy constraint)
- Place anywhere on the board (no zone restriction)
- One action per turn (the only rule)
- Win by elimination or checkmate

**Status:** Awaiting confirmation from end-users. Needed before Phase 9.
