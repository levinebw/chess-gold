# TASK-025: Add Resign and Draw Buttons

**Assigned to:** Lead Developer
**Priority:** Medium
**Phase:** v0.2
**Source:** Playtester feedback (user-bug-list-mar-6.md, enhancement reference), game design spec (Layout section)

## Summary

Add Resign and Draw offer buttons to the game screen. Players currently have no way to end a game early — they must play to checkmate or close the tab.

## Requirements

### Resign
- A **"Resign"** button visible during an active game
- Clicking it shows a **confirmation dialog** ("Are you sure you want to resign?") to prevent accidental clicks
- On confirm: game ends immediately, the resigning player loses, opponent wins
- Game Over dialog shows: "White resigned. Black wins!" (or vice versa)
- Works in both local 2-player and online multiplayer

### Draw
- A **"Draw"** button visible during an active game
- **Local (pass-and-play):** Clicking it shows a confirmation ("Agree to a draw?"). Since both players are on the same device, a single confirmation is fine.
- **Online multiplayer:** Clicking it sends a draw offer to the opponent. Opponent sees "Your opponent offers a draw — Accept / Decline". If accepted, game ends as a draw. If declined, play continues. Only one active draw offer at a time (can't spam).
- Game Over dialog shows: "Game drawn by agreement."

### Button Placement
- Place below the board or in the header bar near the Undo button
- Keep them visually subdued (not the same prominence as the shop) — these are safety valves, not primary actions
- Disable both buttons when the game is already over

## Game State Changes

Add to `GameState.status`:
- `'resigned'` — game ended by resignation
- `'draw-agreed'` — game ended by mutual agreement

Add to `GameAction`:
- `{ type: 'resign' }`
- `{ type: 'offer-draw' }` (online only)
- `{ type: 'accept-draw' }` (online only)

## Test Cases

1. Resign mid-game → correct winner declared, game over dialog shows
2. Resign on turn 1 → works (edge case)
3. Draw in local mode → confirmation → game ends as draw
4. Draw in online mode → offer sent → opponent accepts → game ends
5. Draw in online mode → offer sent → opponent declines → play continues
6. Buttons disabled after game over
7. Resign confirmation → cancel → game continues (no effect)
