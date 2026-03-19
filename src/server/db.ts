import { Firestore, Timestamp } from '@google-cloud/firestore';
import { randomBytes, createHash } from 'node:crypto';

// --- Lazy Firestore client ---
// Deferred initialization so the server can start without Firestore credentials.
// All CRUD functions check availability and throw/return null gracefully.

let _firestore: Firestore | null = null;
let _initAttempted = false;

function getFirestore(): Firestore | null {
  if (!_initAttempted) {
    _initAttempted = true;
    try {
      _firestore = new Firestore({
        projectId: process.env.FIRESTORE_PROJECT_ID ?? process.env.GOOGLE_CLOUD_PROJECT,
      });
      console.log('Firestore client initialized');
    } catch (err) {
      console.warn('Firestore unavailable — player identity and ratings disabled:', (err as Error).message);
      _firestore = null;
    }
  }
  return _firestore;
}

function playersCol() {
  const fs = getFirestore();
  if (!fs) throw new Error('Firestore not available');
  return fs.collection('players');
}

function matchesCol() {
  const fs = getFirestore();
  if (!fs) throw new Error('Firestore not available');
  return fs.collection('matches');
}

// --- Document interfaces ---

export interface PlayerDoc {
  displayName: string;
  playerToken: string; // SHA-256 hash of raw token
  createdAt: Timestamp;
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  rating: number;
  ratingDeviation: number;
  lastGameAt: Timestamp | null;
}

export interface MatchDoc {
  roomId: string;
  mode: string;
  white: MatchPlayer;
  black: MatchPlayer;
  result: 'white' | 'black' | 'draw';
  winReason: string | null;
  rated: boolean;
  turnCount: number;
  startedAt: Timestamp;
  endedAt: Timestamp;
}

export interface MatchPlayer {
  playerId: string;
  displayName: string;
  ratingBefore: number;
  ratingAfter: number;
}

// --- Token helpers ---

function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

// --- CRUD functions ---

const DEFAULT_RATING = 1200;
const DEFAULT_RATING_DEVIATION = 350;

export async function createPlayer(
  displayName: string,
): Promise<{ playerId: string; playerToken: string }> {
  const rawToken = randomBytes(32).toString('hex');
  const hashedToken = hashToken(rawToken);

  const doc = playersCol().doc();
  const now = Timestamp.now();

  const player: PlayerDoc = {
    displayName,
    playerToken: hashedToken,
    createdAt: now,
    gamesPlayed: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    rating: DEFAULT_RATING,
    ratingDeviation: DEFAULT_RATING_DEVIATION,
    lastGameAt: null,
  };

  await doc.set(player);

  return { playerId: doc.id, playerToken: rawToken };
}

export async function getPlayer(playerId: string): Promise<PlayerDoc | null> {
  const snap = await playersCol().doc(playerId).get();
  if (!snap.exists) return null;
  return snap.data() as PlayerDoc;
}

export async function getPlayerByToken(
  rawToken: string,
): Promise<{ playerId: string; player: PlayerDoc } | null> {
  const hashed = hashToken(rawToken);
  const snap = await playersCol().where('playerToken', '==', hashed).limit(1).get();
  if (snap.empty) return null;
  const doc = snap.docs[0];
  return { playerId: doc.id, player: doc.data() as PlayerDoc };
}

export async function updatePlayerStats(
  playerId: string,
  updates: Partial<Pick<PlayerDoc, 'gamesPlayed' | 'wins' | 'losses' | 'draws' | 'rating' | 'ratingDeviation' | 'lastGameAt' | 'displayName'>>,
): Promise<void> {
  await playersCol().doc(playerId).update(updates);
}

export async function recordMatch(matchData: MatchDoc): Promise<string> {
  const doc = matchesCol().doc();
  await doc.set(matchData);
  return doc.id;
}

export async function getPlayerMatches(
  playerId: string,
  limit: number = 20,
): Promise<MatchDoc[]> {
  const [asWhite, asBlack] = await Promise.all([
    matchesCol()
      .where('white.playerId', '==', playerId)
      .orderBy('endedAt', 'desc')
      .limit(limit)
      .get(),
    matchesCol()
      .where('black.playerId', '==', playerId)
      .orderBy('endedAt', 'desc')
      .limit(limit)
      .get(),
  ]);

  const matches: Array<{ id: string; data: MatchDoc }> = [];
  for (const doc of asWhite.docs) {
    matches.push({ id: doc.id, data: doc.data() as MatchDoc });
  }
  for (const doc of asBlack.docs) {
    if (!matches.some((m) => m.id === doc.id)) {
      matches.push({ id: doc.id, data: doc.data() as MatchDoc });
    }
  }

  matches.sort((a, b) => {
    const aTime = a.data.endedAt.toMillis();
    const bTime = b.data.endedAt.toMillis();
    return bTime - aTime;
  });

  return matches.slice(0, limit).map((m) => m.data);
}

export async function getLeaderboard(
  limit: number = 20,
): Promise<Array<{ playerId: string; displayName: string; rating: number; gamesPlayed: number; wins: number }>> {
  const snap = await playersCol()
    .orderBy('rating', 'desc')
    .limit(limit)
    .get();

  return snap.docs.map((doc) => {
    const data = doc.data() as PlayerDoc;
    return {
      playerId: doc.id,
      displayName: data.displayName,
      rating: data.rating,
      gamesPlayed: data.gamesPlayed,
      wins: data.wins,
    };
  });
}

// Re-export Timestamp for callers constructing MatchDoc
export { Timestamp };

// Exported for testing
export { hashToken as _hashToken, _firestore };
