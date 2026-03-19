# TASK-054: Flashlight Engine — No-Check Mode + King-Captured Win Condition

**Role:** Lead Developer
**Phase:** 11A — Flashlight Core Rules
**Status:** TODO
**Priority:** High
**Dependencies:** None

## Context

Flashlight modes (7 and 8) have a fundamental rule change: **check does not exist**. Kings can move into danger and be captured like any other piece. This replaces the standard checkmate win condition with king capture. This task implements the no-check rule override and the `king-captured` win condition — the foundation that both Flashlight and Flashlight Gold build on.

The `noCheck: true` flag already exists in `GameModeConfig` and the game reducer already skips checkmate detection when it's set (`game.ts` line ~200). However, chessops still filters out moves that leave the king in check — that filtering must be bypassed.

### Prerequisites

- Read `ARCHITECTURE.md` sections 3.3 (flashlight presets), 7 (Phase 11), 11 (OQ-3)
- Read `CONCEPT-CHESS-GOLD.md` (Flashlight description)
- Read `src/engine/position.ts` (chessops wrapper, `getLegalMoves`, how `pos.dests()` works)
- Read `src/engine/game.ts` (existing `noCheck` handling at line ~200)
- Read `src/engine/win-conditions.ts`
- Read chessops source: how `Position.dests()` filters for king safety

### Design Note

OQ-3 is partially resolved. Core mechanic confirmed: no check, king capture = win. Pending details (visibility scope, placement in fog) are addressed in Tasks 055-056, not here.

## Deliverables

### 1. Override chessops king-safety filtering

- [ ] When `modeConfig.noCheck` is `true`, legal move generation must NOT filter out moves that leave the own king in check
- [ ] Approach options (evaluate and choose):
  - **Option A:** Use chessops `pos.allDests()` or generate pseudo-legal moves, then manually filter only for board-boundary and piece-collision rules (skip king-safety filter)
  - **Option B:** Temporarily remove the king from the board when computing dests, then restore it (tricks chessops into not filtering)
  - **Option C:** Post-process `pos.dests()` and add back any moves that were filtered for king-safety reasons
  - Recommend Option A if chessops exposes pseudo-legal generation; otherwise Option B
- [ ] Result: `getLegalMoves(state)` returns a superset of normal legal moves when `noCheck` is active — includes moves that would normally be "illegal" because they leave the king in check

### 2. Allow king capture as a legal move

- [ ] In standard chess, you can never move to a square occupied by a king (because check rules prevent this). With `noCheck: true`, capturing an enemy king must be a valid move.
- [ ] Verify that chessops allows generating moves that capture the king when king-safety filtering is bypassed
- [ ] If chessops explicitly prevents king capture, add custom logic to include king-capture moves in the destination map

### 3. Implement `king-captured` win condition

- [ ] Add `checkKingCaptured(state: GameState): Color | null` in `src/engine/win-conditions.ts`
- [ ] After each move, check if the opponent's king is no longer on the board (was captured)
- [ ] The capturing player wins
- [ ] Register in `evaluateWinConditions`

### 4. Disable check/checkmate/stalemate detection when `noCheck` is true

- [ ] Current code skips checkmate detection — verify stalemate is also skipped
- [ ] The `status` field should never be `'check'` in no-check mode
- [ ] Stalemate: in no-check mode, a player with no legal moves should still lose (they can't avoid king capture). OR: treat as draw. Clarify with designer — default to draw for now, matching standard stalemate rules.

### 5. Handle edge cases

- [ ] Player moves king adjacent to enemy piece — legal in no-check mode
- [ ] Player moves king onto a square attacked by enemy — legal
- [ ] Both kings adjacent to each other — both can capture the other on their turn
- [ ] En passant that exposes king — legal in no-check mode
- [ ] Castling: still requires king not passing through attacked squares? In no-check mode, castling restrictions related to check should be relaxed — king can castle through/into "check" since check doesn't exist

## Files

**Modify:**
- `src/engine/position.ts` (bypass king-safety filtering when `noCheck`)
- `src/engine/win-conditions.ts` (add `checkKingCaptured`)
- `src/engine/game.ts` (ensure check/checkmate/stalemate logic skipped for `noCheck`)

## Acceptance Criteria

- [ ] `noCheck` mode: player can move king into a square attacked by enemy
- [ ] `noCheck` mode: player can make a move that exposes their king to capture
- [ ] `noCheck` mode: capturing the enemy king is a legal move
- [ ] `checkKingCaptured` returns the winner when a king is captured
- [ ] `checkKingCaptured` returns `null` when both kings are on the board
- [ ] Game status is never `'check'` in no-check mode
- [ ] Castling through attacked squares is permitted in no-check mode
- [ ] Standard chess modes are completely unaffected (king-safety filtering still active)
- [ ] `npx vitest run` — all existing tests pass
