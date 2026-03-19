/**
 * Standard Elo rating calculation.
 *
 * K-factor: 32 for players with < 30 games, 16 otherwise.
 * Rating floor: 100.
 */

function kFactor(gamesPlayed: number): number {
  return gamesPlayed < 30 ? 32 : 16;
}

function expectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

export function calculateElo(
  ratingA: number,
  ratingB: number,
  scoreA: number,
  gamesPlayedA: number,
  gamesPlayedB: number,
): { newRatingA: number; newRatingB: number } {
  const scoreB = 1 - scoreA;

  const eA = expectedScore(ratingA, ratingB);
  const eB = expectedScore(ratingB, ratingA);

  const kA = kFactor(gamesPlayedA);
  const kB = kFactor(gamesPlayedB);

  const newRatingA = Math.max(100, Math.round(ratingA + kA * (scoreA - eA)));
  const newRatingB = Math.max(100, Math.round(ratingB + kB * (scoreB - eB)));

  return { newRatingA, newRatingB };
}
