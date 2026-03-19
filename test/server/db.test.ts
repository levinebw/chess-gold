import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createHash } from 'node:crypto';

// --- Hoisted mock state (available to vi.mock factory) ---

const { store, autoIdCounter, MockTimestamp } = vi.hoisted(() => {
  const store = { value: {} as Record<string, Record<string, Record<string, unknown>>> };
  const autoIdCounter = { value: 0 };
  const MockTimestamp = {
    now: () => ({ toMillis: () => Date.now(), _seconds: Math.floor(Date.now() / 1000), _nanoseconds: 0 }),
    fromMillis: (ms: number) => ({ toMillis: () => ms, _seconds: Math.floor(ms / 1000), _nanoseconds: 0 }),
  };
  return { store, autoIdCounter, MockTimestamp };
});

// --- Mock Firestore helpers ---

interface Filter { field: string; op: string; value: unknown }

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((o, k) => (o as Record<string, unknown>)?.[k], obj);
}

function getFilteredDocs(
  collection: string,
  filters: Filter[],
  orderBy?: { field: string; dir: string },
  limit?: number,
) {
  const all = store.value[collection] ?? {};
  let entries = Object.entries(all);

  for (const f of filters) {
    entries = entries.filter(([, data]) => {
      const val = getNestedValue(data, f.field);
      if (f.op === '==') return val === f.value;
      return false;
    });
  }

  if (orderBy) {
    entries.sort((a, b) => {
      const aVal = getNestedValue(a[1], orderBy.field);
      const bVal = getNestedValue(b[1], orderBy.field);
      const aNum = typeof aVal === 'number' ? aVal : (aVal as { toMillis: () => number })?.toMillis?.() ?? 0;
      const bNum = typeof bVal === 'number' ? bVal : (bVal as { toMillis: () => number })?.toMillis?.() ?? 0;
      return orderBy.dir === 'desc' ? bNum - aNum : aNum - bNum;
    });
  }

  if (limit) entries = entries.slice(0, limit);

  return entries.map(([id, data]) => ({
    id,
    data: () => ({ ...data }),
  }));
}

function makeQuery(
  collection: string,
  filters: Filter[] = [],
  orderBy?: { field: string; dir: string },
): Record<string, unknown> {
  return {
    where: vi.fn((field: string, op: string, value: unknown) => {
      return makeQuery(collection, [...filters, { field, op, value }], orderBy);
    }),
    orderBy: vi.fn((field: string, dir?: string) => {
      return makeQuery(collection, filters, { field, dir: dir ?? 'asc' });
    }),
    limit: vi.fn((_n: number) => ({
      get: vi.fn(async () => {
        const docs = getFilteredDocs(collection, filters, orderBy, _n);
        return { empty: docs.length === 0, docs };
      }),
    })),
    get: vi.fn(async () => {
      const docs = getFilteredDocs(collection, filters, orderBy);
      return { empty: docs.length === 0, docs };
    }),
  };
}

function makeDocRef(collection: string, id?: string) {
  const docId = id ?? `auto-${++autoIdCounter.value}`;
  return {
    id: docId,
    set: vi.fn(async (data: Record<string, unknown>) => {
      store.value[collection] ??= {};
      store.value[collection][docId] = { ...data };
    }),
    get: vi.fn(async () => {
      const data = store.value[collection]?.[docId];
      return {
        exists: !!data,
        id: docId,
        data: () => (data ? { ...data } : undefined),
      };
    }),
    update: vi.fn(async (updates: Record<string, unknown>) => {
      if (!store.value[collection]?.[docId]) throw new Error('NOT_FOUND');
      Object.assign(store.value[collection][docId], updates);
    }),
  };
}

function makeCollectionRef(name: string) {
  return {
    doc: vi.fn((id?: string) => makeDocRef(name, id)),
    where: vi.fn((field: string, op: string, value: unknown) => {
      return makeQuery(name, [{ field, op, value }]);
    }),
    orderBy: vi.fn((field: string, dir?: string) => {
      return makeQuery(name, [], { field, dir: dir ?? 'asc' });
    }),
  };
}

// --- vi.mock (hoisted to top, uses hoisted state) ---

vi.mock('@google-cloud/firestore', () => {
  class MockFirestore {
    collection(name: string) { return makeCollectionRef(name); }
  }
  return {
    Firestore: MockFirestore,
    Timestamp: MockTimestamp,
  };
});

// Import AFTER mock
import {
  createPlayer,
  getPlayer,
  getPlayerByToken,
  updatePlayerStats,
  recordMatch,
  getPlayerMatches,
  getLeaderboard,
  _hashToken,
} from '../../src/server/db.ts';

// --- Tests ---

beforeEach(() => {
  store.value = {};
  autoIdCounter.value = 0;
  vi.clearAllMocks();
});

describe('hashToken', () => {
  it('returns SHA-256 hex digest', () => {
    const raw = 'test-token-123';
    const expected = createHash('sha256').update(raw).digest('hex');
    expect(_hashToken(raw)).toBe(expected);
  });

  it('produces different hashes for different inputs', () => {
    expect(_hashToken('token-a')).not.toBe(_hashToken('token-b'));
  });

  it('produces consistent hashes for the same input', () => {
    expect(_hashToken('same')).toBe(_hashToken('same'));
  });
});

describe('createPlayer', () => {
  it('returns a playerId and raw playerToken', async () => {
    const result = await createPlayer('Alice');
    expect(result.playerId).toBeTruthy();
    expect(result.playerToken).toBeTruthy();
    expect(result.playerToken).toHaveLength(64); // 32 bytes hex
  });

  it('stores hashed token in Firestore, not raw', async () => {
    const result = await createPlayer('Bob');
    const stored = store.value['players']?.[result.playerId];
    expect(stored).toBeDefined();
    expect(stored['playerToken']).not.toBe(result.playerToken);
    const expectedHash = createHash('sha256').update(result.playerToken).digest('hex');
    expect(stored['playerToken']).toBe(expectedHash);
  });

  it('sets default rating to 1200', async () => {
    const result = await createPlayer('Carol');
    const stored = store.value['players']?.[result.playerId];
    expect(stored['rating']).toBe(1200);
  });

  it('sets default ratingDeviation to 350', async () => {
    const result = await createPlayer('Dave');
    const stored = store.value['players']?.[result.playerId];
    expect(stored['ratingDeviation']).toBe(350);
  });

  it('initializes stats to zero', async () => {
    const result = await createPlayer('Eve');
    const stored = store.value['players']?.[result.playerId];
    expect(stored['gamesPlayed']).toBe(0);
    expect(stored['wins']).toBe(0);
    expect(stored['losses']).toBe(0);
    expect(stored['draws']).toBe(0);
  });

  it('sets lastGameAt to null', async () => {
    const result = await createPlayer('Frank');
    const stored = store.value['players']?.[result.playerId];
    expect(stored['lastGameAt']).toBeNull();
  });

  it('stores the displayName', async () => {
    const result = await createPlayer('Grace');
    const stored = store.value['players']?.[result.playerId];
    expect(stored['displayName']).toBe('Grace');
  });
});

describe('getPlayer', () => {
  it('returns player data for existing player', async () => {
    const { playerId } = await createPlayer('Heidi');
    const player = await getPlayer(playerId);
    expect(player).not.toBeNull();
    expect(player!.displayName).toBe('Heidi');
    expect(player!.rating).toBe(1200);
  });

  it('returns null for non-existent player', async () => {
    const player = await getPlayer('nonexistent-id');
    expect(player).toBeNull();
  });
});

describe('getPlayerByToken', () => {
  it('finds player with valid raw token', async () => {
    const { playerToken } = await createPlayer('Ivan');
    const result = await getPlayerByToken(playerToken);
    expect(result).not.toBeNull();
    expect(result!.player.displayName).toBe('Ivan');
  });

  it('returns null for invalid token', async () => {
    await createPlayer('Judy');
    const result = await getPlayerByToken('wrong-token');
    expect(result).toBeNull();
  });

  it('returns playerId alongside player data', async () => {
    const { playerId, playerToken } = await createPlayer('Karl');
    const result = await getPlayerByToken(playerToken);
    expect(result!.playerId).toBe(playerId);
  });
});

describe('updatePlayerStats', () => {
  it('updates specified fields', async () => {
    const { playerId } = await createPlayer('Liam');
    await updatePlayerStats(playerId, { wins: 5, gamesPlayed: 10, rating: 1350 });
    const player = await getPlayer(playerId);
    expect(player!.wins).toBe(5);
    expect(player!.gamesPlayed).toBe(10);
    expect(player!.rating).toBe(1350);
  });

  it('does not modify unspecified fields', async () => {
    const { playerId } = await createPlayer('Mia');
    await updatePlayerStats(playerId, { wins: 1 });
    const player = await getPlayer(playerId);
    expect(player!.losses).toBe(0);
    expect(player!.displayName).toBe('Mia');
  });

  it('throws for non-existent player', async () => {
    await expect(updatePlayerStats('fake-id', { wins: 1 })).rejects.toThrow();
  });
});

describe('recordMatch', () => {
  it('returns a match ID', async () => {
    const matchId = await recordMatch({
      roomId: 'room-1',
      mode: 'chess-gold',
      white: { playerId: 'w1', displayName: 'Alice', ratingBefore: 1200, ratingAfter: 1216 },
      black: { playerId: 'b1', displayName: 'Bob', ratingBefore: 1200, ratingAfter: 1184 },
      result: 'white',
      winReason: 'checkmate',
      rated: true,
      turnCount: 42,
      startedAt: MockTimestamp.fromMillis(1000) as never,
      endedAt: MockTimestamp.fromMillis(2000) as never,
    });
    expect(matchId).toBeTruthy();
  });

  it('stores match data in Firestore', async () => {
    const matchId = await recordMatch({
      roomId: 'room-2',
      mode: 'standard',
      white: { playerId: 'w2', displayName: 'Carol', ratingBefore: 1300, ratingAfter: 1290 },
      black: { playerId: 'b2', displayName: 'Dave', ratingBefore: 1100, ratingAfter: 1110 },
      result: 'black',
      winReason: 'checkmate',
      rated: true,
      turnCount: 30,
      startedAt: MockTimestamp.fromMillis(1000) as never,
      endedAt: MockTimestamp.fromMillis(3000) as never,
    });
    const stored = store.value['matches']?.[matchId];
    expect(stored).toBeDefined();
    expect(stored['roomId']).toBe('room-2');
    expect(stored['result']).toBe('black');
  });
});

describe('getPlayerMatches', () => {
  it('returns matches where player was white or black', async () => {
    store.value['matches'] = {
      'm1': {
        roomId: 'r1', mode: 'chess-gold',
        white: { playerId: 'p1', displayName: 'A', ratingBefore: 1200, ratingAfter: 1216 },
        black: { playerId: 'p2', displayName: 'B', ratingBefore: 1200, ratingAfter: 1184 },
        result: 'white', winReason: 'checkmate', rated: true, turnCount: 20,
        startedAt: { toMillis: () => 1000 }, endedAt: { toMillis: () => 2000 },
      },
      'm2': {
        roomId: 'r2', mode: 'chess-gold',
        white: { playerId: 'p3', displayName: 'C', ratingBefore: 1200, ratingAfter: 1184 },
        black: { playerId: 'p1', displayName: 'A', ratingBefore: 1216, ratingAfter: 1232 },
        result: 'black', winReason: 'checkmate', rated: true, turnCount: 30,
        startedAt: { toMillis: () => 3000 }, endedAt: { toMillis: () => 4000 },
      },
      'm3': {
        roomId: 'r3', mode: 'chess-gold',
        white: { playerId: 'p2', displayName: 'B', ratingBefore: 1184, ratingAfter: 1200 },
        black: { playerId: 'p3', displayName: 'C', ratingBefore: 1184, ratingAfter: 1168 },
        result: 'white', winReason: 'checkmate', rated: true, turnCount: 25,
        startedAt: { toMillis: () => 5000 }, endedAt: { toMillis: () => 6000 },
      },
    };

    const matches = await getPlayerMatches('p1');
    expect(matches).toHaveLength(2);
  });

  it('returns matches sorted by endedAt descending', async () => {
    store.value['matches'] = {
      'm1': {
        roomId: 'r1', mode: 'chess-gold',
        white: { playerId: 'p1', displayName: 'A', ratingBefore: 1200, ratingAfter: 1216 },
        black: { playerId: 'p2', displayName: 'B', ratingBefore: 1200, ratingAfter: 1184 },
        result: 'white', winReason: 'checkmate', rated: true, turnCount: 20,
        startedAt: { toMillis: () => 1000 }, endedAt: { toMillis: () => 2000 },
      },
      'm2': {
        roomId: 'r2', mode: 'chess-gold',
        white: { playerId: 'p1', displayName: 'A', ratingBefore: 1216, ratingAfter: 1232 },
        black: { playerId: 'p3', displayName: 'C', ratingBefore: 1200, ratingAfter: 1184 },
        result: 'white', winReason: 'checkmate', rated: true, turnCount: 30,
        startedAt: { toMillis: () => 3000 }, endedAt: { toMillis: () => 5000 },
      },
    };

    const matches = await getPlayerMatches('p1');
    expect(matches).toHaveLength(2);
    expect(matches[0].roomId).toBe('r2');
    expect(matches[1].roomId).toBe('r1');
  });

  it('respects the limit parameter', async () => {
    store.value['matches'] = {};
    for (let i = 0; i < 5; i++) {
      store.value['matches'][`m${i}`] = {
        roomId: `r${i}`, mode: 'chess-gold',
        white: { playerId: 'p1', displayName: 'A', ratingBefore: 1200, ratingAfter: 1200 },
        black: { playerId: 'p2', displayName: 'B', ratingBefore: 1200, ratingAfter: 1200 },
        result: 'draw', winReason: null, rated: false, turnCount: 10,
        startedAt: { toMillis: () => i * 1000 }, endedAt: { toMillis: () => i * 1000 + 500 },
      };
    }

    const matches = await getPlayerMatches('p1', 2);
    expect(matches.length).toBeLessThanOrEqual(2);
  });

  it('returns empty array when player has no matches', async () => {
    const matches = await getPlayerMatches('nonexistent');
    expect(matches).toEqual([]);
  });
});

describe('getLeaderboard', () => {
  it('returns players sorted by rating descending', async () => {
    store.value['players'] = {
      'p1': { displayName: 'Low', rating: 900, gamesPlayed: 10, wins: 2, losses: 8, draws: 0, playerToken: 'h1', ratingDeviation: 200, createdAt: {}, lastGameAt: null },
      'p2': { displayName: 'High', rating: 1500, gamesPlayed: 20, wins: 15, losses: 5, draws: 0, playerToken: 'h2', ratingDeviation: 100, createdAt: {}, lastGameAt: null },
      'p3': { displayName: 'Mid', rating: 1200, gamesPlayed: 5, wins: 3, losses: 2, draws: 0, playerToken: 'h3', ratingDeviation: 300, createdAt: {}, lastGameAt: null },
    };

    const lb = await getLeaderboard(10);
    expect(lb).toHaveLength(3);
    expect(lb[0].displayName).toBe('High');
    expect(lb[0].rating).toBe(1500);
    expect(lb[1].displayName).toBe('Mid');
    expect(lb[2].displayName).toBe('Low');
  });

  it('respects the limit parameter', async () => {
    store.value['players'] = {
      'p1': { displayName: 'A', rating: 1400, gamesPlayed: 10, wins: 7, losses: 3, draws: 0, playerToken: 'h1', ratingDeviation: 200, createdAt: {}, lastGameAt: null },
      'p2': { displayName: 'B', rating: 1300, gamesPlayed: 8, wins: 5, losses: 3, draws: 0, playerToken: 'h2', ratingDeviation: 200, createdAt: {}, lastGameAt: null },
      'p3': { displayName: 'C', rating: 1200, gamesPlayed: 6, wins: 3, losses: 3, draws: 0, playerToken: 'h3', ratingDeviation: 200, createdAt: {}, lastGameAt: null },
    };

    const lb = await getLeaderboard(2);
    expect(lb).toHaveLength(2);
    expect(lb[0].displayName).toBe('A');
    expect(lb[1].displayName).toBe('B');
  });

  it('returns only playerId, displayName, rating, gamesPlayed, wins', async () => {
    store.value['players'] = {
      'p1': { displayName: 'Solo', rating: 1100, gamesPlayed: 1, wins: 1, losses: 0, draws: 0, playerToken: 'secret', ratingDeviation: 350, createdAt: {}, lastGameAt: null },
    };

    const lb = await getLeaderboard(10);
    expect(lb[0]).toEqual({
      playerId: 'p1',
      displayName: 'Solo',
      rating: 1100,
      gamesPlayed: 1,
      wins: 1,
    });
    // Ensure sensitive fields are NOT leaked
    expect(lb[0]).not.toHaveProperty('playerToken');
    expect(lb[0]).not.toHaveProperty('ratingDeviation');
  });

  it('returns empty array when no players exist', async () => {
    const lb = await getLeaderboard(10);
    expect(lb).toEqual([]);
  });
});
