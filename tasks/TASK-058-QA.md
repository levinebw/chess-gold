# TASK-058: Flashlight Modes Tests + Playtest

**Role:** QA Engineer
**Phase:** 11D — Testing
**Status:** TODO
**Priority:** High
**Dependencies:** TASK-054, TASK-055, TASK-056, TASK-057

## Context

Flashlight modes are the most architecturally significant addition since multiplayer. The no-check rules fundamentally change legal move generation, and fog of war introduces a visibility layer that touches the engine, UI, and server. Thorough testing is critical — especially for edge cases around king safety removal and information leakage in multiplayer.

## Test Scenarios

### No-Check Legal Moves

- [ ] King can move to a square attacked by enemy piece → legal
- [ ] King can stay on a square attacked by enemy piece (other piece moves) → legal
- [ ] Move that exposes own king to attack → legal (not filtered)
- [ ] Capturing the enemy king → legal move, game ends
- [ ] En passant that exposes king → legal in no-check mode
- [ ] Castling through attacked squares → legal in no-check mode
- [ ] Castling into attacked square → legal in no-check mode
- [ ] Pin: piece that was pinned to king can move freely (pin concept doesn't apply)
- [ ] Both kings adjacent: both can capture the other on their turn

### King-Captured Win Condition

- [ ] Capture enemy king with any piece → winner declared
- [ ] King still on board → no winner
- [ ] Game status never shows 'check' in no-check mode
- [ ] Game status never shows 'checkmate' in no-check mode
- [ ] Stalemate handling: player with no legal moves → draw (not loss)

### Fog of War Visibility

- [ ] Own pieces always visible
- [ ] Squares own pieces can move to are visible
- [ ] Blocking pieces (first piece along a slider's line) are visible
- [ ] Squares beyond a blocking piece are hidden
- [ ] Knight destinations visible (no line of sight, jump-based)
- [ ] Pawn: forward + diagonal attack squares visible
- [ ] King: all 8 adjacent squares visible
- [ ] Empty squares not reachable by any piece → hidden
- [ ] Opponent pieces on hidden squares → not visible
- [ ] Opponent pieces on visible squares → visible

### Visibility Edge Cases

- [ ] Piece on edge/corner of board: visibility doesn't wrap around
- [ ] Multiple pieces with overlapping visibility: union of all visible squares
- [ ] After capturing a piece: visibility recalculated (capturer may see new squares from new position)
- [ ] Pawn promotion: visibility changes to promoted piece's movement pattern
- [ ] No pieces except king: visibility is just adjacent squares

### Flashlight Gold Specific

- [ ] Fog of war + gold economy both active
- [ ] Placement restricted to visible squares within placement zone
- [ ] Placement on hidden square within zone → rejected
- [ ] Shop functions normally (buy pieces, gold tracking)
- [ ] Placed piece immediately contributes to visibility on next turn
- [ ] Income (+1 gold/turn) works normally

### UI — Board Masking

- [ ] Hidden squares have dark overlay
- [ ] Hidden pieces not visible through overlay
- [ ] Visible squares render normally
- [ ] Legal move highlights only on visible squares
- [ ] Last-move indicator works on visible squares
- [ ] Fog transitions on turn change (pieces appear/disappear smoothly)

### UI — Turn Handoff (Local Play)

- [ ] Handoff screen appears between turns in local Flashlight
- [ ] Shows correct player color ("White's turn" / "Black's turn")
- [ ] Board is hidden until player clicks/taps to reveal
- [ ] Handoff does NOT appear in online mode
- [ ] Handoff does NOT appear in non-Flashlight modes

### Multiplayer — Visibility Filtering

- [ ] Client receives only visible pieces (check WebSocket messages)
- [ ] Hidden opponent pieces NOT in client state
- [ ] Piece appears when it enters visible square
- [ ] Piece disappears when it leaves visible squares
- [ ] Server validates moves against full state (not filtered)
- [ ] Reconnection: filtered state sent correctly
- [ ] Non-fog modes: full state sent (no filtering regression)
- [ ] Cannot deduce hidden piece positions from any client-visible data

### Bot Compatibility

- [ ] Bot can play Flashlight mode (bot uses full state since it's local — no fog for bot)
- [ ] Bot can play Flashlight Gold mode
- [ ] Bot makes legal moves in no-check mode (doesn't crash on king-exposure moves)
- [ ] Bot can capture the king when given the opportunity

### Regression

- [ ] Chess Gold (mode 1): no changes
- [ ] Loot Boxes (mode 2): no changes
- [ ] Standard Chess (mode 9): no changes
- [ ] Conqueror (mode 4): no changes
- [ ] King's Chess (mode 5): no changes
- [ ] Gold Mine (mode 3): no changes
- [ ] Siege (mode 6): no changes
- [ ] All bot personas work across all modes
- [ ] Online multiplayer: all modes functional
- [ ] Mobile: fog overlay renders correctly at 375px and 480px

## Output

- [ ] `test/engine/flashlight.test.ts` — no-check moves, king capture, visibility calculation
- [ ] `test/engine/visibility.test.ts` — visibility edge cases
- [ ] `test/server/visibility-filter.test.ts` — server-side state filtering
- [ ] `test/reports/phase11-qa-report.md` — full test checklist with pass/fail and bug list

## Acceptance Criteria

- [ ] All unit tests pass (target 40+ test cases across flashlight mechanics)
- [ ] All manual test scenarios verified
- [ ] No P0 or P1 bugs remaining
- [ ] No information leakage in multiplayer (hidden pieces never sent to client)
- [ ] Regression: all existing modes work unchanged
- [ ] `npx vitest run` — all tests pass
