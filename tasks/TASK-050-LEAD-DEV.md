# TASK-050: Siege Engine — Center Pulse System + State Extensions

**Role:** Lead Developer
**Phase:** 10A — Siege Core Engine
**Status:** TODO
**Priority:** High
**Dependencies:** None

## Context

Siege (mode 6) introduces a center pulse mechanic: every 5 moves, the four center squares (d4, d5, e4, e5) pulse. Any piece on a center square during a pulse receives a temporary one-move upgrade. This task builds the pulse timing system and the state tracking needed for temporary upgrades. The actual upgrade move generation is Task 051.

### Prerequisites

- Read `ARCHITECTURE.md` sections 3.3 (siege preset), 7 (Phase 10), 11 (OQ-2)
- Read `CONCEPT-CHESS-GOLD.md` (mode 6 description — minimal)
- Read `src/engine/game.ts` (game reducer, turn advancement)
- Read `src/engine/types.ts` (GameState, GameModeConfig)
- Read `src/engine/config.ts` (siege preset)

### Design Note

OQ-2 (Siege) is mostly resolved. One pending clarification: "Does the upgrade persist for one move or until the next pulse?" Designer's read is **one move only**. Build for one-move upgrades. If this changes, it's a config tweak, not a rewrite.

## Deliverables

### 1. Extend GameState for Siege

- [ ] Add to `GameState` in `src/engine/types.ts`:
  ```typescript
  // Siege mode state
  siege: {
    movesSincePulse: number;       // Counts up to pulseInterval (5), resets on pulse
    upgradedPieces: UpgradedPiece[]; // Pieces with active temporary upgrades
  } | null;                         // null when centerPulse mode is inactive
  ```
- [ ] Define `UpgradedPiece` type:
  ```typescript
  interface UpgradedPiece {
    square: Square;                // Square the piece was on when pulsed
    pieceType: PieceType;          // Original piece type (determines upgrade)
    color: Color;
    upgradeUsed: boolean;          // Becomes true after the piece makes its upgraded move
  }
  ```

### 2. Pulse timing system

- [ ] Add siege config to `CHESS_GOLD_CONFIG` in `config.ts`:
  ```typescript
  siege: {
    pulseInterval: 5,              // Pulse every 5 half-moves
    centerSquares: ['d4', 'd5', 'e4', 'e5'],
  }
  ```
- [ ] In game reducer (`game.ts`), after each action completes:
  - If `modeConfig.centerPulse` is true, increment `siege.movesSincePulse`
  - When `movesSincePulse >= pulseInterval`:
    - Reset counter to 0
    - Scan center squares for pieces
    - Add each piece found to `upgradedPieces` with `upgradeUsed: false`
    - Clear any previous upgrades (old upgrades that weren't used expire)

### 3. Upgrade expiry

- [ ] When an upgraded piece moves (action type `'move'`, from square matches an upgraded piece):
  - Mark `upgradeUsed: true`
  - Remove the upgrade entry after the move resolves
- [ ] Upgrades from a previous pulse are cleared when the next pulse fires
- [ ] If an upgraded piece is captured before using its upgrade, remove the entry

### 4. Initialize siege state

- [ ] In `createInitialState()`: set `siege` to `{ movesSincePulse: 0, upgradedPieces: [] }` when `modeConfig.centerPulse` is true, `null` otherwise
- [ ] Siege uses `standardStart: true` — verify standard starting position works with the siege state

## Files

**Modify:**
- `src/engine/types.ts` (add `siege` state, `UpgradedPiece` type)
- `src/engine/game.ts` (pulse timing, upgrade tracking, expiry)
- `src/engine/config.ts` (siege config constants)

## Acceptance Criteria

- [ ] Siege state initializes correctly when `centerPulse` is true
- [ ] Non-siege modes have `siege: null` (no overhead)
- [ ] Pulse fires every 5 half-moves
- [ ] Pieces on d4/d5/e4/e5 during pulse receive upgrade entries
- [ ] Empty center squares during pulse produce no upgrades
- [ ] Upgraded piece that moves: upgrade consumed and removed
- [ ] Upgraded piece that is captured: upgrade entry cleaned up
- [ ] Previous pulse upgrades cleared when new pulse fires
- [ ] `npx vitest run` — all existing tests pass
