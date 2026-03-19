# Task 028 — Lead Developer

## Bot Game Mode: UI Integration

### Objective

Wire the bot engine into the UI so players can start a game against a bot persona from the lobby. The bot takes its turn automatically after the player moves.

### Deliverables

#### 1. Update Lobby with "Play vs Bot" Section

Add a new section to `Lobby.tsx` between "Local Game" and "Play Online":

```
┌──────────────────────────┐
│   Local Game (Pass & Play)│
├──────────────────────────┤
│   Play vs Bot             │
│   ┌────────┐ ┌────────┐  │
│   │ 🐕     │ │ 🐺     │  │
│   │ Lizzie │ │ Maxi   │  │
│   │Friendly│ │Fierce  │  │
│   └────────┘ └────────┘  │
├──────────────────────────┤
│   or play online          │
│   ...                     │
└──────────────────────────┘
```

Each bot is a clickable card showing avatar, name, and short description. Clicking starts the game against that bot.

#### 2. Update App Screen State

Add a new screen type:

```typescript
type AppScreen =
  | { type: 'lobby' }
  | { type: 'local' }
  | { type: 'bot'; persona: BotPersona }
  | { type: 'online'; ... };
```

#### 3. Bot Game Hook: `src/ui/hooks/useBotGame.ts`

A wrapper around `useGame` that adds bot turn logic:

```typescript
export function useBotGame(persona: BotPersona) {
  const game = useGame();

  useEffect(() => {
    // After player moves, if it's the bot's turn, schedule bot move
    if (game.state.turn === 'black' && game.state.status === 'active') {
      const timer = setTimeout(() => {
        const action = chooseAction(game.state, persona);
        game.dispatch(action);
      }, thinkingDelay(persona));
      return () => clearTimeout(timer);
    }
  }, [game.state.turn, game.state.halfMoveCount]);

  return {
    ...game,
    isBotTurn: game.state.turn === 'black' && game.state.status === 'active',
    botPersona: persona,
  };
}
```

**Thinking delay:** Add a short artificial delay (500-1500ms) so the bot's move doesn't feel instant. Vary by persona — Lizzie thinks a bit longer (feels thoughtful), Maxi responds quickly (feels aggressive). The delay is cosmetic, not computational.

```typescript
function thinkingDelay(persona: BotPersona): number {
  const base = 600;
  const variance = 400;
  // Aggressive bots play faster
  const personalityFactor = 1 - persona.aggression * 0.5;
  return base * personalityFactor + Math.random() * variance;
}
```

#### 4. Bot Game Provider

Create a `BotGameProvider` similar to `GameProvider` but using `useBotGame`:

```tsx
function BotGameWrapper({ persona, onLeave }: { persona: BotPersona; onLeave: () => void }) {
  return (
    <BotGameProvider persona={persona}>
      <GameView isOnline={false} isBotGame onLeave={onLeave} />
    </BotGameProvider>
  );
}
```

#### 5. UI Adjustments for Bot Games

- **Board orientation:** Player is always white (bottom). Board is not flippable in bot mode (or flippable but starts as white).
- **Turn indicator:** Show bot persona name and avatar instead of "Black". E.g., "🐺 Maxi is thinking..." during bot turn.
- **Undo:** Undo in bot mode should undo TWO half-moves (player's move + bot's response) so the player gets back to their own turn.
- **Disable interaction during bot turn:** While the bot is "thinking," disable piece movement and shop purchases. Show a subtle thinking indicator.
- **New Game:** Works as normal — resets and player goes first.
- **Shop/Gold:** Visible as normal (bot games use Chess Gold mode with gold economy).

#### 6. Bot Thinking Indicator

Show a subtle visual cue while the bot is processing:

- Pulsing bot avatar or "thinking..." text near the turn indicator
- Board pieces not draggable during bot turn
- CSS animation (reuse the gold pulse pattern, applied to the turn indicator)

### Constraints

- Bot always plays black (player is always white) for Phase 5
- Bot uses the same `dispatch` mechanism as regular play — no special engine paths
- Bot game state is fully undo-able (undo pops both bot response and player move)
- No new dependencies
- Must work on mobile

### Done When

- [ ] Bot selection cards visible in lobby
- [ ] Clicking a bot starts a game with that persona
- [ ] Bot makes moves automatically after player moves
- [ ] Thinking delay feels natural (not instant, not too slow)
- [ ] Turn indicator shows bot name/avatar
- [ ] Undo takes back both player move and bot response
- [ ] Board is disabled during bot's turn
- [ ] New Game resets correctly
- [ ] All existing tests pass
- [ ] Commit and push
