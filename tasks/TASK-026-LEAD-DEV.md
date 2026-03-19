# Task 026 — Lead Developer

## Bot Engine: Core AI Module

### Objective

Build the bot AI engine that can play Chess Gold. The bot must choose between moving an existing piece and spending gold to place a new piece. The engine is a pure function: given a `GameState`, return the best `GameAction`. No UI, no timers — just decision logic.

### Architecture

```
src/engine/bot/
├── types.ts         ← BotPersona, BotConfig, evaluation types
├── evaluate.ts      ← Board evaluation (material, position, king safety)
├── strategy.ts      ← Gold spending strategy (when to buy, what to buy)
├── search.ts        ← Move search (minimax or greedy with lookahead)
└── bot.ts           ← Top-level: chooseAction(state, persona) → GameAction
```

The bot module lives inside `src/engine/bot/` — it imports from the engine but the engine never imports from it. This keeps the dependency one-directional.

### Deliverables

#### 1. Bot Persona Type: `src/engine/bot/types.ts`

```typescript
export interface BotPersona {
  id: string;                    // e.g., 'lizzie', 'maxi'
  name: string;                  // Display name: 'Lizzie'
  description: string;           // Short flavor text
  avatar: string;                // Emoji or image path

  // Strategy weights (0.0 to 1.0)
  aggression: number;            // 0 = defensive, 1 = aggressive
  greed: number;                 // 0 = spends gold freely, 1 = hoards gold
  riskTolerance: number;         // 0 = avoids trades, 1 = seeks trades
  piecePriority: PiecePriority;  // Which pieces this bot prefers to buy

  // Search depth (controls difficulty)
  searchDepth: number;           // 1 = easy (greedy), 2-3 = medium
  randomness: number;            // 0 = deterministic, 0.3 = occasional suboptimal moves
}

export interface PiecePriority {
  pawn: number;     // Relative preference (higher = more likely to buy)
  knight: number;
  bishop: number;
  rook: number;
  queen: number;
}

export type EvaluationScore = number; // Positive = good for the evaluating side
```

#### 2. Board Evaluation: `src/engine/bot/evaluate.ts`

Score a position from the perspective of a given color. Factors:

| Factor | Weight | Notes |
|--------|--------|-------|
| Material count | High | Standard piece values (pawn=1, knight/bishop=3, rook=5, queen=9) |
| Gold advantage | Medium | More gold = more potential pieces |
| King safety | Medium | Pieces near the king, open files toward king |
| Center control | Low | Pieces/pawns controlling d4/d5/e4/e5 |
| Pawn structure | Low | Doubled/isolated pawns penalized lightly |

```typescript
export function evaluatePosition(state: GameState, color: Color, persona: BotPersona): EvaluationScore;
```

The persona's `aggression` weight adjusts how much value is placed on material advantage vs. king safety. Aggressive bots value attacks more; defensive bots value safe positions more.

#### 3. Gold Spending Strategy: `src/engine/bot/strategy.ts`

Decide whether to spend gold this turn and what to buy.

```typescript
export interface SpendingDecision {
  action: 'save' | 'buy';
  piece?: PurchasableRole;
  square?: Square;
}

export function decideSpending(state: GameState, persona: BotPersona): SpendingDecision;
```

Logic:
- **Should I buy?** Compare gold available vs. `persona.greed`. Low greed = spend when affordable. High greed = save for bigger pieces.
- **What to buy?** Weighted random selection from affordable pieces, biased by `persona.piecePriority`. Aggressive bots prefer knights/queens (attacking pieces). Defensive bots prefer pawns/bishops (structure pieces).
- **Where to place?** Pick the best valid placement square using a simplified positional score (center control, supporting existing pieces, not blocking own pawns).

#### 4. Move Search: `src/engine/bot/search.ts`

Find the best move from the current position.

```typescript
export function findBestMove(state: GameState, persona: BotPersona): MoveAction | null;
```

Implementation:
- **Depth 1 (easy):** Evaluate all legal moves, pick the best. Add `persona.randomness` noise to scores so the bot occasionally makes suboptimal moves.
- **Depth 2-3 (medium):** Simple minimax with alpha-beta pruning. Use `applyAction` from the engine to simulate moves, then evaluate resulting positions.
- For each legal move, apply it to get the new state, evaluate, track the best.
- Captures are always searched one extra ply (quiescence) to avoid horizon effects.

#### 5. Top-Level Bot: `src/engine/bot/bot.ts`

```typescript
export function chooseAction(state: GameState, persona: BotPersona): GameAction;
```

Decision flow:
1. Is there a checkmate-in-one? Take it immediately.
2. Evaluate the spending decision (buy vs. save).
3. Find the best move.
4. If buying, compare the expected value of placing a piece vs. making the best move.
5. Return the higher-value action.
6. Apply `persona.randomness` — occasionally pick the second-best option.

### Constraints

- Pure functions only — no side effects, no timers, no DOM
- Must work with the existing `applyAction` reducer (the bot generates actions, the engine processes them)
- Bot computation should be fast enough to feel responsive (<500ms for depth 2 on a typical mid-game position)
- Bot must handle all Chess Gold mechanics: gold income, placement zones, promotion costs, capture rewards
- No external chess engine or library — heuristic only

### Done When

- [ ] `chooseAction(state, persona)` returns a valid `GameAction` for any active game state
- [ ] Bot can play a complete game of Chess Gold (move pieces and buy/place pieces)
- [ ] Bot never crashes or returns invalid actions
- [ ] Bot makes reasonable moves (not random — captures when advantageous, develops pieces, avoids losing material)
- [ ] Gold spending works (bot buys pieces when it can afford them and they'd be useful)
- [ ] All existing tests pass
- [ ] New unit tests for evaluate, strategy, and search modules
- [ ] Commit and push
