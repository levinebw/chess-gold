/**
 * Multiplayer Integration Tests — Task 021
 *
 * Programmatic Socket.IO tests simulating two browser clients.
 * Run with: node test/multiplayer-integration.mjs
 * Requires: server running on localhost:3001
 */

import { io } from 'socket.io-client';

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3001';
const TIMEOUT = 10000;

// chessops square encoding: file + 8 * rank
// file: a=0, b=1, c=2, d=3, e=4, f=5, g=6, h=7
// rank: 1=0, 2=1, 3=2, 4=3, 5=4, 6=5, 7=6, 8=7
function sq(name) {
  const file = name.charCodeAt(0) - 'a'.charCodeAt(0);
  const rank = name.charCodeAt(1) - '1'.charCodeAt(0);
  return file + 8 * rank;
}

function createClient() {
  return new Promise((resolve) => {
    const socket = io(SERVER_URL, { transports: ['websocket'] });
    socket.on('connect', () => resolve(socket));
  });
}

function waitForEvent(socket, event, timeout = TIMEOUT) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timeout waiting for '${event}'`)), timeout);
    socket.once(event, (data) => {
      clearTimeout(timer);
      resolve(data);
    });
  });
}

function createRoom(socket, startingGold = 3) {
  return new Promise((resolve) => {
    socket.emit('create-room', { startingGold }, (res) => resolve(res));
  });
}

function joinRoom(socket, roomId) {
  return new Promise((resolve) => {
    socket.emit('join-room', roomId, (res) => resolve(res));
  });
}

function listRooms(socket) {
  return new Promise((resolve) => {
    socket.emit('list-rooms', (rooms) => resolve(rooms));
  });
}

function sendAction(socket, roomId, action) {
  socket.emit('action', roomId, action);
}

let passed = 0;
let failed = 0;
let bugs = [];

function assert(condition, message) {
  if (!condition) {
    console.log(`    ❌ FAIL: ${message}`);
    failed++;
    return false;
  }
  console.log(`    ✅ PASS: ${message}`);
  passed++;
  return true;
}

function reportBug(title, severity, module, steps, expected, actual, specRef) {
  bugs.push({ title, severity, module, steps, expected, actual, specRef });
}

// ========================================
// TEST 1: Full Game Flow
// ========================================
async function test1_fullGameFlow() {
  console.log('\n📋 TEST 1: Full Game Flow');
  console.log('  Creating two clients...');

  const white = await createClient();
  const black = await createClient();

  // Create room
  const createRes = await createRoom(white, 3);
  assert(!!createRes.roomId, `Room created with ID: ${createRes.roomId}`);
  assert(createRes.color === 'white', `Creator assigned white`);
  const roomId = createRes.roomId;

  // Join room
  const joinedPromise = waitForEvent(white, 'player-joined');
  const joinRes = await joinRoom(black, roomId);
  assert(!joinRes.error, `Joiner accepted (no error)`);
  assert(joinRes.color === 'black', `Joiner assigned black`);
  assert(!!joinRes.state, `Joiner received game state`);

  const joinedData = await joinedPromise;
  assert(joinedData === 'black', `White notified of black joining`);

  // Verify initial state
  const initialState = joinRes.state;
  assert(initialState.turn === 'white', `Initial turn is white`);
  assert(initialState.gold.white === 3, `White starts with 3 gold`);
  assert(initialState.gold.black === 3, `Black starts with 3 gold`);
  assert(initialState.status === 'active', `Game status is active`);

  // White places a pawn on a2 (costs 1 gold)
  console.log('  White places pawn on a2...');
  const state1bPromise = waitForEvent(black, 'game-state');
  const state1wPromise = waitForEvent(white, 'game-state');
  sendAction(white, roomId, { type: 'place', piece: 'pawn', square: sq('a2'), fromInventory: false });
  const [state1b, state1w] = await Promise.all([state1bPromise, state1wPromise]);

  assert(state1b.turn === 'black', `Turn passed to black after placement`);
  assert(state1w.turn === 'black', `Both clients see same turn`);
  assert(state1b.gold.white === 3, `White gold after pawn placement (3 - 1 + 1 income = 3)`);

  // Black places a pawn on g7
  console.log('  Black places pawn on g7...');
  const state2wPromise = waitForEvent(white, 'game-state');
  const state2bPromise = waitForEvent(black, 'game-state');
  sendAction(black, roomId, { type: 'place', piece: 'pawn', square: sq('g7'), fromInventory: false });
  const [state2w, state2b] = await Promise.all([state2wPromise, state2bPromise]);

  assert(state2w.turn === 'white', `Turn passed back to white`);
  assert(state2b.gold.black === 3, `Black gold after pawn placement (3 - 1 + 1 income = 3)`);

  // White places another pawn
  console.log('  White places pawn on b2...');
  const state3wPromise = waitForEvent(white, 'game-state');
  const state3bPromise = waitForEvent(black, 'game-state');
  sendAction(white, roomId, { type: 'place', piece: 'pawn', square: sq('b2'), fromInventory: false });
  const [state3w, state3b] = await Promise.all([state3wPromise, state3bPromise]);
  assert(state3b.turn === 'black', `Turn alternates correctly`);

  console.log('  Game flow test: moves sync between both clients ✓');

  white.disconnect();
  black.disconnect();

  return true;
}

// ========================================
// TEST 2: Turn Enforcement
// ========================================
async function test2_turnEnforcement() {
  console.log('\n📋 TEST 2: Turn Enforcement');

  const white = await createClient();
  const black = await createClient();

  const createRes = await createRoom(white, 3);
  const roomId = createRes.roomId;
  const joinedPromise = waitForEvent(white, 'player-joined');
  await joinRoom(black, roomId);
  await joinedPromise;

  // Black tries to act on white's turn
  console.log('  Black tries to place on white\'s turn...');
  const errorPromise = waitForEvent(black, 'action-error', 3000).catch(() => null);
  sendAction(black, roomId, { type: 'place', piece: 'pawn', square: sq('g7'), fromInventory: false });
  const error = await errorPromise;

  assert(!!error, `Server rejects action when not your turn`);
  if (error) {
    assert(error.code === 'NOT_YOUR_TURN', `Error code is NOT_YOUR_TURN`);
  }

  // White makes a valid move first
  console.log('  White places pawn (valid)...');
  const statePromise = waitForEvent(white, 'game-state');
  const stateBPromise = waitForEvent(black, 'game-state');
  sendAction(white, roomId, { type: 'place', piece: 'pawn', square: sq('a2'), fromInventory: false });
  await Promise.all([statePromise, stateBPromise]);

  // Now white tries to go again
  console.log('  White tries to go again on black\'s turn...');
  const error2Promise = waitForEvent(white, 'action-error', 3000).catch(() => null);
  sendAction(white, roomId, { type: 'place', piece: 'pawn', square: sq('b2'), fromInventory: false });
  const error2 = await error2Promise;

  assert(!!error2, `Server rejects white acting on black's turn`);
  if (error2) {
    assert(error2.code === 'NOT_YOUR_TURN', `Error code is NOT_YOUR_TURN for white out-of-turn`);
  }

  white.disconnect();
  black.disconnect();

  return true;
}

// ========================================
// TEST 3: Disconnection & Reconnection
// ========================================
async function test3_disconnection() {
  console.log('\n📋 TEST 3: Disconnection & Reconnection');

  const white = await createClient();
  let black = await createClient();

  const createRes = await createRoom(white, 3);
  const roomId = createRes.roomId;
  const joinedPromise3 = waitForEvent(white, 'player-joined');
  await joinRoom(black, roomId);
  await joinedPromise3;

  // White places a pawn (create some state)
  console.log('  White places pawn to create game state...');
  const stateAfterMoveW = waitForEvent(white, 'game-state');
  const stateAfterMoveB = waitForEvent(black, 'game-state');
  sendAction(white, roomId, { type: 'place', piece: 'pawn', square: sq('a2'), fromInventory: false });
  await Promise.all([stateAfterMoveW, stateAfterMoveB]);

  // Black disconnects
  console.log('  Black disconnects...');
  const disconnectPromise = waitForEvent(white, 'player-disconnected');
  black.disconnect();
  const disconnectedColor = await disconnectPromise;

  assert(disconnectedColor === 'black', `White notified that black disconnected`);

  // Black reconnects by creating a new socket and joining the same room
  console.log('  Black reconnects...');
  const black2 = await createClient();
  const reconnectPromise = waitForEvent(white, 'player-reconnected');
  const rejoinRes = await joinRoom(black2, roomId);

  assert(!rejoinRes.error, `Reconnection accepted`);
  assert(rejoinRes.color === 'black', `Reconnected as black`);
  assert(!!rejoinRes.state, `Received current game state on reconnect`);

  const reconnectedColor = await reconnectPromise;
  assert(reconnectedColor === 'black', `White notified of black reconnection`);

  // Verify game state was preserved
  if (rejoinRes.state) {
    assert(rejoinRes.state.turn === 'black', `Game state preserved — it's still black's turn`);
    assert(rejoinRes.state.actionHistory.length > 0, `Action history preserved`);
  }

  // Black can continue playing
  console.log('  Black continues playing after reconnect...');
  const stateAfterReconnect = waitForEvent(white, 'game-state');
  sendAction(black2, roomId, { type: 'place', piece: 'pawn', square: sq('g7'), fromInventory: false });
  const newState = await stateAfterReconnect;
  assert(newState.turn === 'white', `Game continues after reconnection`);

  white.disconnect();
  black2.disconnect();

  return true;
}

// ========================================
// TEST 4: Invalid Room Code
// ========================================
async function test4_invalidRoom() {
  console.log('\n📋 TEST 4: Invalid Room Code');

  const client = await createClient();

  console.log('  Joining non-existent room...');
  const res = await joinRoom(client, 'zzzzzz');

  assert(!!res.error, `Error returned for invalid room`);
  assert(res.error === 'Room not found', `Error message: "${res.error}"`);

  client.disconnect();

  return true;
}

// ========================================
// TEST 5: Room Full
// ========================================
async function test5_roomFull() {
  console.log('\n📋 TEST 5: Room Full');

  const p1 = await createClient();
  const p2 = await createClient();
  const p3 = await createClient();

  const createRes = await createRoom(p1, 3);
  const roomId = createRes.roomId;

  // Second player joins
  const joinedPromise5 = waitForEvent(p1, 'player-joined');
  const joinRes = await joinRoom(p2, roomId);
  assert(!joinRes.error, `Player 2 joins successfully`);
  await joinedPromise5;

  // Third player tries to join
  console.log('  Third player tries to join full room...');
  const thirdRes = await joinRoom(p3, roomId);

  assert(!!thirdRes.error, `Third player rejected`);
  assert(thirdRes.error === 'Room is full', `Error message: "${thirdRes.error}"`);

  p1.disconnect();
  p2.disconnect();
  p3.disconnect();

  return true;
}

// ========================================
// BONUS: Room Listing
// ========================================
async function testBonus_roomListing() {
  console.log('\n📋 BONUS: Room Listing');

  const p1 = await createClient();
  const p2 = await createClient();

  // Create a room
  const createRes = await createRoom(p1, 5);
  const roomId = createRes.roomId;

  // List rooms — should show the waiting room
  const rooms = await listRooms(p2);
  const found = rooms.find(r => r.id === roomId);

  assert(!!found, `Waiting room appears in listing`);
  if (found) {
    assert(found.players === 1, `Shows 1 player`);
    assert(found.status === 'waiting', `Status is 'waiting'`);
    assert(found.startingGold === 5, `Starting gold shown correctly`);
  }

  // Join the room
  const joinedPromiseL = waitForEvent(p1, 'player-joined');
  await joinRoom(p2, roomId);
  await joinedPromiseL;

  // List rooms again — full room should not appear
  const p3 = await createClient();
  const rooms2 = await listRooms(p3);
  const found2 = rooms2.find(r => r.id === roomId);
  assert(!found2, `Full room no longer in waiting list`);

  p1.disconnect();
  p2.disconnect();
  p3.disconnect();

  return true;
}

// ========================================
// BONUS: Rematch Flow
// ========================================
async function testBonus_rematch() {
  console.log('\n📋 BONUS: Rematch Flow');

  const white = await createClient();
  const black = await createClient();

  const createRes = await createRoom(white, 3);
  const roomId = createRes.roomId;
  const joinedPromiseR = waitForEvent(white, 'player-joined');
  await joinRoom(black, roomId);
  await joinedPromiseR;

  // White requests rematch
  console.log('  White requests rematch...');
  const rematchPromise = waitForEvent(black, 'rematch-requested');
  white.emit('request-rematch', roomId);
  const reqBy = await rematchPromise;

  assert(reqBy === 'white', `Black notified that white requested rematch`);

  // Black accepts (requests too)
  console.log('  Black accepts rematch...');
  const acceptPromise = waitForEvent(white, 'rematch-accepted');
  const acceptPromise2 = waitForEvent(black, 'rematch-accepted');
  black.emit('request-rematch', roomId);

  const newState = await acceptPromise;
  assert(!!newState, `Both receive new game state`);
  assert(newState.turn === 'white', `New game starts with white's turn`);
  assert(newState.gold.white === 3, `Gold reset to 3`);
  assert(newState.actionHistory.length === 0, `Action history cleared`);

  white.disconnect();
  black.disconnect();

  return true;
}

// ========================================
// Run all tests
// ========================================
async function runAll() {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  Chess Gold — Multiplayer Integration Tests`);
  console.log(`  Server: ${SERVER_URL}`);
  console.log(`${'='.repeat(60)}`);

  try {
    await test1_fullGameFlow();
    await test2_turnEnforcement();
    await test3_disconnection();
    await test4_invalidRoom();
    await test5_roomFull();
    await testBonus_roomListing();
    await testBonus_rematch();
  } catch (err) {
    console.log(`\n💥 UNEXPECTED ERROR: ${err.message}`);
    console.log(err.stack);
    failed++;
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`  RESULTS: ${passed} passed, ${failed} failed`);
  if (bugs.length > 0) {
    console.log(`  BUGS FOUND: ${bugs.length}`);
    for (const bug of bugs) {
      console.log(`    - [${bug.severity}] ${bug.title}`);
    }
  }
  console.log(`${'='.repeat(60)}\n`);

  // Output machine-readable results for the report
  console.log('__RESULTS_JSON__');
  console.log(JSON.stringify({ passed, failed, bugs, server: SERVER_URL }));

  process.exit(failed > 0 ? 1 : 0);
}

runAll();
