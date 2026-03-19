# Task 027 — Game Designer

## Bot Personas: Lizzie, Maxi, and Friends

### Objective

Define the bot persona roster — the characters players compete against. Each bot has a distinct personality, play style, and visual identity. Personas are data-driven (config objects), not code — they tune the same underlying AI engine to produce different behaviors.

### Persona Roster

#### Lizzie 🐕

**Tagline:** "A small friendly dog that enjoys playing."

**Personality:** Cheerful, encouraging, makes the game feel welcoming. Good for beginners or casual play.

**Play Style:** Balanced — plays sound chess without being punishing. Develops pieces evenly, doesn't over-commit to attacks or turtle defensively. Makes occasional "friendly" mistakes (higher randomness) so the game stays fun.

```typescript
{
  id: 'lizzie',
  name: 'Lizzie',
  description: 'A friendly pup who loves a good game. Plays fair and square!',
  avatar: '🐕',
  aggression: 0.4,
  greed: 0.4,
  riskTolerance: 0.3,
  piecePriority: { pawn: 3, knight: 2, bishop: 2, rook: 1, queen: 1 },
  searchDepth: 1,
  randomness: 0.25,
}
```

**Behavioral notes:**
- Prefers building a solid pawn structure before buying big pieces
- Balanced gold spending — buys when useful, saves when ahead
- Moderate randomness makes her beatable but not a pushover
- Low search depth keeps games fast and friendly

---

#### Maxi 🐺

**Tagline:** "A small dog with a big attitude. Plays to win."

**Personality:** Competitive, aggressive, always looking for an attack. Pushes tempo, sacrifices material for initiative. Doesn't back down from trades.

**Play Style:** Highly aggressive — rushes to buy knights and queens, launches early attacks, seeks captures and checks. Spends gold aggressively. Lower randomness — Maxi plays near-optimally within the aggression framework.

```typescript
{
  id: 'maxi',
  name: 'Maxi',
  description: 'Small but fierce! Maxi plays to win and never backs down.',
  avatar: '🐺',
  aggression: 0.85,
  greed: 0.2,
  riskTolerance: 0.8,
  piecePriority: { pawn: 1, knight: 3, bishop: 1, rook: 2, queen: 3 },
  searchDepth: 2,
  randomness: 0.1,
}
```

**Behavioral notes:**
- Buys knights and queens early — wants attacking pieces on the board fast
- Low greed means gold gets spent quickly
- High risk tolerance = willing to trade pieces, gamble on tactics
- Depth 2 search makes Maxi significantly harder than Lizzie
- Low randomness — plays the best move almost always

---

#### Future Personas (not for Phase 5, but design-ready)

These are stretch goals or Phase 8+ additions. Document the design but don't implement yet.

**Sheldon 🐢** — "Slow and steady wins the race."
- Ultra-defensive. Builds fortress positions. Hoards gold. Only attacks when overwhelmingly ahead.
- `aggression: 0.15, greed: 0.8, riskTolerance: 0.1, searchDepth: 2`

**Pepper 🐈** — "Unpredictable and full of surprises."
- Chaotic play style. High randomness makes moves hard to predict. Sometimes brilliant, sometimes baffling.
- `aggression: 0.5, greed: 0.5, riskTolerance: 0.5, searchDepth: 1, randomness: 0.45`

**Rex 🦁** — "The king of the board."
- Strongest bot. Deep search, minimal randomness, balanced aggression. The challenge mode.
- `aggression: 0.6, greed: 0.5, riskTolerance: 0.5, searchDepth: 3, randomness: 0.05`

### Deliverables

1. **Persona config file:** `src/engine/bot/personas.ts` with `LIZZIE` and `MAXI` exported as `BotPersona` constants
2. **Future personas section** in comments or a separate design doc for Sheldon, Pepper, Rex
3. **Verify persona values** produce intended behavior by playtesting against the bot engine (Task 026 must be complete first)

### Constraints

- Personas are pure data — no behavior code, just config objects
- Avatar field uses emoji for MVP (image assets can come later)
- Persona values may need tuning after playtesting — these are starting points, not final

### Done When

- [ ] `LIZZIE` and `MAXI` persona configs defined in `src/engine/bot/personas.ts`
- [ ] Future personas documented
- [ ] Playtested: Lizzie feels friendly/balanced, Maxi feels aggressive/challenging
- [ ] Commit and push
