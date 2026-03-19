# TASK-051: Siege Engine — Temporary Piece Upgrades + Custom Move Generation

**Role:** Lead Developer
**Phase:** 10A — Siege Core Engine
**Status:** TODO
**Priority:** High
**Dependencies:** TASK-050

## Context

This is the most technically complex task in Phase 10. Upgraded pieces have temporary move rules that chessops cannot generate natively. A custom move generation layer must check for active upgrades and produce the correct legal moves, falling back to chessops for non-upgraded pieces.

### Prerequisites

- Read Task 050 deliverables (siege state, `UpgradedPiece` type)
- Read `src/engine/position.ts` (current chessops wrapper, `getLegalMoves`)
- Read chessops API: `pos.dests()`, `pos.isLegal()`, move application

### Upgrade Rules (from ARCHITECTURE.md section 7, Phase 10)

| Piece | Upgrade Effect |
|-------|---------------|
| **Pawn** | King-like movement: move 1 square in any direction, capture in any direction |
| **Knight** | Double jump: two L-shaped moves in one turn |
| **Rook** | Can move through one friendly piece once along its line |
| **Bishop** | Can move through one friendly piece once along its diagonal |
| **Queen** | Can move through one friendly piece once along any line |

## Deliverables

### 1. Create `src/engine/siege.ts` — Siege move generation module

- [ ] `getSiegeUpgradedDests(state: GameState, square: Square): Map<Square, Square[]> | null`
  - Returns upgraded legal destinations for a piece on `square`, or `null` if the piece has no active upgrade
  - Each upgrade type generates destinations differently:

#### Pawn upgrade (king-like movement)
- [ ] Generate all 8 adjacent squares
- [ ] Filter: can move to empty squares in any direction, can capture enemy in any direction
- [ ] Standard legality: must not leave own king in check (use chessops to validate)

#### Knight upgrade (double jump)
- [ ] First jump: standard L-shaped destinations
- [ ] Second jump: from each first-jump destination, generate another set of L-shaped destinations
- [ ] The knight physically moves to the final square only (intermediate square is not occupied)
- [ ] Can capture on either the first or second jump — if capturing on the first, the move ends there
- [ ] Filter for legality (no self-check)

#### Rook/Bishop/Queen upgrade (pass through one friendly piece)
- [ ] Generate standard sliding moves along the piece's lines
- [ ] When a friendly piece is encountered along a line: continue generating squares beyond it (up to one pass-through per line)
- [ ] When an enemy piece is encountered: can capture it, but cannot continue past
- [ ] Cannot pass through two friendly pieces on the same line
- [ ] Filter for legality

### 2. Integrate with `getLegalMoves` in `position.ts`

- [ ] Modify `getLegalMoves(state)` to check for siege upgrades:
  - For each piece, if it has an active upgrade in `state.siege.upgradedPieces`:
    - Use `getSiegeUpgradedDests()` instead of chessops `pos.dests()`
  - For non-upgraded pieces: use chessops as before
- [ ] The combined result is a `Map<Square, Square[]>` mixing upgraded and standard moves

### 3. Move validation for upgraded moves

- [ ] In `applyAction` (game.ts), when a move is made by an upgraded piece:
  - Validate against the upgraded destinations (not standard chessops legality)
  - Apply the move to the chessops position
  - Mark the upgrade as used / remove it
- [ ] For knight double-jump:
  - The action is a single `move` from origin to final destination
  - The engine must recognize that intermediate squares are valid even if not a standard knight move
  - Consider: store knight double-jump as a `move` with a flag, or just validate against the pre-computed destinations

### 4. King safety validation

- [ ] All upgraded moves must still respect king safety — cannot leave own king in check
- [ ] For pass-through moves (rook/bishop/queen): after the move, verify the king isn't exposed along the line the friendly piece was blocking
- [ ] Use chessops position validation: apply the candidate move to a temporary position, check if own king is in check

## Files

**Create:**
- `src/engine/siege.ts` (siege move generation)

**Modify:**
- `src/engine/position.ts` (integrate siege destinations into `getLegalMoves`)
- `src/engine/game.ts` (validate upgraded moves, consume upgrades)

## Acceptance Criteria

- [ ] Upgraded pawn can move/capture in all 8 directions
- [ ] Upgraded knight can make two consecutive L-jumps in one move
- [ ] Upgraded knight can capture on the first jump and stop
- [ ] Upgraded rook/bishop/queen can slide through one friendly piece per line
- [ ] Upgraded slider cannot pass through two friendly pieces on the same line
- [ ] Upgraded slider cannot pass through enemy pieces (but can capture them)
- [ ] All upgraded moves respect king safety (no self-check)
- [ ] Non-upgraded pieces on the same board move normally via chessops
- [ ] After an upgraded piece moves, its upgrade is consumed
- [ ] `npx vitest run` — all existing tests pass
