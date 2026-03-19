# TASK-043: Post-Game Rating Display & Rated/Casual UI

**Role:** Lead Developer
**Phase:** 8C — Elo Rating System
**Status:** TODO
**Priority:** Medium
**Dependencies:** TASK-042

## Context

The Elo backend is in place but the client doesn't display ratings or let players choose rated/casual. This task wires the Elo system into the client UI.

## Deliverables

### 1. Lobby: Rated/Casual toggle (`src/ui/components/Lobby.tsx`)
- [ ] Add checkbox/toggle: "Rated game" (default checked when player is registered)
- [ ] Pass `rated` flag in `create-room` opts
- [ ] In open rooms list, show badge: "Rated" or "Casual"
- [ ] Show host's rating next to display name in room list

### 2. Lobby: Player rating display
- [ ] Show current player's rating next to display name at top of lobby
- [ ] Format: "Alice (1200)"

### 3. Post-game rating change (`src/ui/components/GameOverDialog.tsx`)
- [ ] Display rating change: "+12" (green) or "-8" (red) next to each player
- [ ] Show new rating: "Your rating: 1212"
- [ ] For casual games: "Casual game — ratings unchanged"

### 4. Online status bar (`src/ui/components/OnlineGameView.tsx`)
- [ ] Show ratings next to player names: "Alice (1200) vs Bob (1150)"

### 5. useOnlineGame additions (`src/ui/hooks/useOnlineGame.ts`)
- [ ] Add `gameResult` state
- [ ] Listen for `game-result` event, store result
- [ ] Expose `gameResult` in return object
- [ ] Clear `gameResult` on rematch

### 6. Styling (`src/styles/main.css`)
- [ ] Rating change colors: green for positive, red for negative
- [ ] Rated/casual badge styling
- [ ] Mobile-responsive rating display

## Files

**Modify:**
- `src/ui/components/Lobby.tsx`
- `src/ui/components/GameOverDialog.tsx`
- `src/ui/components/OnlineGameView.tsx`
- `src/ui/hooks/useOnlineGame.ts`
- `src/styles/main.css`

## Acceptance Criteria

- [ ] Rated/casual toggle visible when creating online rooms
- [ ] Room list shows rated/casual badge and host rating
- [ ] Post-game dialog shows rating change with green (+) / red (-) coloring
- [ ] Casual games show "Casual game — ratings unchanged"
- [ ] Player rating visible next to name in lobby and during game
- [ ] Rating change clears on rematch
- [ ] Mobile layout handles rating display without overflow
- [ ] All existing tests pass
