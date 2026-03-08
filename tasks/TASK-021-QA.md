# Task 021 — QA Engineer

## Multiplayer Integration Testing

### Objective

Test the full multiplayer flow end-to-end: room creation, joining, gameplay, disconnection, and reconnection. Both locally (two browser tabs) and at the deployed URLs.

### Prerequisites

- Tasks 017-020 complete (server deployed, client connected)

### Deliverables

#### 1. Local Multi-Tab Testing

Using `npm run dev` (frontend) and `npm run dev:server` (backend):

**Test 1: Full game flow**
1. Open two browser tabs
2. Tab 1: Create online game → get room code
3. Tab 2: Join with room code
4. Play a complete game to checkmate
5. Verify: moves appear on both boards, gold syncs, game over shows for both

**Test 2: Turn enforcement**
1. Try to move when it's not your turn → verify nothing happens
2. Try to move the opponent's pieces → verify nothing happens

**Test 3: Disconnection**
1. Mid-game, close Tab 2
2. Tab 1 should show "Opponent disconnected"
3. Re-open Tab 2, rejoin the same room
4. Game state should be restored

**Test 4: Invalid room code**
1. Try to join with a non-existent room code
2. Verify error message is shown

**Test 5: Room full**
1. Two players join a room
2. Third player tries to join → verify rejection

#### 2. Production Testing

Repeat Test 1 at the deployed URLs (GitHub Pages + Cloud Run).

#### 3. Report

Write results to `test/reports/multiplayer-playtest.md`.

### Done When

**Status: COMPLETE**

- [x] All 5 local tests pass
- [x] Production test passes
- [x] Report written with detailed steps and observations
- [x] Any bugs filed with reproduction steps
- [x] Commit and push
