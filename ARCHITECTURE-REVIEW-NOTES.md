# Architecture Review Notes — From Game Designer

> Review of ARCHITECTURE.md v1 by the Game Designer role.
> These items should be addressed in the next revision of ARCHITECTURE.md.

---

## Must Update (design spec has changed)

### 1. Missing Game Modes 6–9

The `GameMode` type only covers modes 1–5. The kids added four more:

- **Mode 6 — Siege**: Standard chess + center square pulse every 5 moves with piece upgrades. Win by checkmate or occupying all 4 center squares.
- **Mode 7 — Flashlight**: Fog of war — you only see squares your pieces can legally move to. King capture possible.
- **Mode 8 — Flashlight Gold**: Flashlight + Chess Gold combined.
- **Mode 9 — Chess**: Standard chess (baseline mode).

These need to be reflected in the `GameMode` type and the phase breakdown.

### 2. Loot Box Spawn Interval

Config currently has `spawnIntervalMin: 3, spawnIntervalMax: 5`. The kids' latest update fixed this to **every 4 rounds** (not a range). Also missing from config: **"only one loot box can be on the board at a time."**

### 3. Loot Box Alternate Win Condition (Mode 2)

Mode 2 can now be won by **obtaining 6 loot boxes** OR standard checkmate. `GameState` needs a `lootBoxesCollected` counter per player (e.g., `lootBoxesCollected: { white: number; black: number }`).

### 4. Two Kings Rule

If a player obtains a king from a loot box, **both kings must be checkmated** to win. This is a significant change to checkmate detection logic. The engine needs to handle:
- Tracking multiple kings per player
- Checking if ALL of a player's kings are in checkmate (not just one)
- How check works with two kings (is it check if only one king is threatened?)

### 5. Pawn Loot Box Interaction

Pawns can "attack" a loot box **without actually moving** — they register a hit but stay on their current square. This is a special case for the `hit-loot-box` action that the engine must handle differently from other pieces.

---

## Design Observations (should be addressed in architecture)

### 6. Equipment Tracking by Square vs. Piece Identity

Current design: `Map<Square, EquippedItem>` — equipment is keyed by square. This means every time a piece moves, the equipment map must be updated to follow. Consider whether tracking by piece identity would be more robust. Tradeoff: chessops doesn't natively assign piece IDs, so a custom identity layer would be needed.

### 7. Game Mode Combining

The kids explicitly want to mix-and-match modes (e.g., "combining loot boxes and gold mine for infinite coins"). A single `GameMode` string enum won't support this.

Suggested approach: Define modes as a **set of feature flags** rather than a single enum. Example:

```typescript
interface GameModeConfig {
  goldEconomy: boolean;      // Chess Gold economy (buy/place pieces)
  lootBoxes: boolean;        // Loot box spawning + items
  pieceConversion: boolean;  // Captured pieces change color (Conqueror)
  placementThrottle: boolean; // Place only every other turn (King's Chess)
  centerPulse: boolean;      // Siege center square mechanic
  fogOfWar: boolean;         // Flashlight visibility rules
  unrestricted: boolean;     // Gold Mine (no restrictions)
}
```

Named modes would be presets of these flags. Custom/combined modes would set flags individually.

### 8. Win Conditions as Pluggable Logic

Different modes have different win conditions:
- Checkmate (all modes)
- All pieces converted to your color (Conqueror, King's Chess)
- Obtain 6 loot boxes (Loot Boxes mode)
- Occupy all 4 center squares (Siege)
- Eliminate all opponent pieces (Gold Mine)

Hardcoding these in the engine will get messy. Consider a configurable win condition system — an array of win-check functions evaluated each turn. Each game mode config specifies which win conditions are active.

---

## Looks Great As-Is (no changes needed)

- 4-layer architecture with engine having zero UI dependencies
- Composition over inheritance for chessops (ADR-002)
- Reducer pattern for game engine (ADR-003)
- Config-driven tuning values (easy balance tweaks)
- MVP test scenario list
- Phase breakdown and team sizing
- React + Vite + Vitest stack selection

---

*These notes should be incorporated into the next revision of ARCHITECTURE.md by the Principal Architect.*
