# TASK-055: Flashlight Engine — Fog of War Visibility Calculation

**Role:** Lead Developer
**Phase:** 11A — Flashlight Core Engine
**Status:** TODO
**Priority:** High
**Dependencies:** TASK-054

## Context

Fog of war is the defining feature of Flashlight modes. Each player can only see squares that their pieces can reach. All other squares are hidden. This task implements the visibility calculation engine — a pure function that takes the board state and a player color, and returns the set of visible squares.

### Prerequisites

- Read `ARCHITECTURE.md` sections 3.3 (flashlight/flashlight-gold presets), 7 (Phase 11), 11 (OQ-3)
- Read Task 054 deliverables (no-check move generation)
- Read `src/engine/position.ts` (move generation, piece iteration)

### Design Decisions

**Visibility scope** (designer recommendation, pending final confirmation — build this as the default):
- Squares your pieces occupy (own position)
- Squares your pieces can legally move to (reachable squares)
- Squares occupied by pieces that block your sliding pieces (blocking piece squares — you can see what's blocking you)

**What is hidden:**
- Empty squares not reachable by any of your pieces
- Opponent pieces on squares you can't see
- Loot boxes on hidden squares (Flashlight Gold, if loot boxes were combined — not currently planned but design defensively)

## Deliverables

### 1. Create `src/engine/visibility.ts`

- [ ] `calculateVisibility(state: GameState, color: Color): Set<Square>`
  - Returns the set of squares visible to the given player
  - Combines:
    - All squares occupied by the player's own pieces
    - All legal move destinations for the player's pieces (from `getLegalMoves`)
    - All squares occupied by pieces that block the player's sliding pieces along their attack lines

### 2. Blocking piece detection

- [ ] For each sliding piece (rook, bishop, queen), trace along its movement lines:
  - Each square along the line is visible
  - When a piece (friendly or enemy) is encountered, that square is visible (you can see the blocker)
  - Squares beyond the blocker are NOT visible (blocked line of sight)
- [ ] For knights: only the destination squares are visible (knights jump, no line-of-sight)
- [ ] For pawns: forward squares (move destinations) + diagonal attack squares are visible
- [ ] For king: all 8 adjacent squares are visible

### 3. Visibility for pieces not yet on board

- [ ] Only pieces currently on the board contribute to visibility
- [ ] Pieces in inventory (Flashlight Gold) do not grant visibility

### 4. Performance consideration

- [ ] Visibility is recalculated every time the UI renders and every time the server sends state
- [ ] Keep the calculation efficient — iterate pieces once, collect visible squares into a Set
- [ ] Consider caching: visibility only changes when pieces move, so cache per game state (optional optimization — implement if needed)

### 5. Flashlight Gold integration

- [ ] When `fogOfWar: true` AND `goldEconomy: true` (Flashlight Gold mode):
  - Placement squares: player should only be able to place on squares they can see that are within their placement zone
  - Designer question (OQ-3, still pending): "Can you place on squares you can't see?" Default answer: **no** — placement restricted to visible squares within the zone
  - Implement this restriction in `getPlacementSquares()` or as a filter on top of existing placement logic

## Files

**Create:**
- `src/engine/visibility.ts`

**Modify:**
- `src/engine/placement.ts` (filter placement squares by visibility in Flashlight Gold)

## Acceptance Criteria

- [ ] `calculateVisibility` returns own piece squares
- [ ] `calculateVisibility` returns legal move destinations
- [ ] `calculateVisibility` returns blocking piece squares for sliders
- [ ] Hidden squares (not in the returned set) are truly unreachable/unseen
- [ ] Knight visibility: only destination squares, no line-of-sight
- [ ] Pawn visibility: forward + diagonal attack squares
- [ ] King visibility: all 8 adjacent squares
- [ ] Flashlight Gold: placement restricted to visible squares within zone
- [ ] Non-fog-of-war modes: function not called (no overhead)
- [ ] `npx vitest run` — all existing tests pass
