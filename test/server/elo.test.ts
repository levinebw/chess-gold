import { describe, it, expect } from 'vitest';
import { calculateElo } from '../../src/server/elo.ts';

describe('calculateElo', () => {
  it('equal ratings: winner gains, loser loses symmetrically with same K', () => {
    const { newRatingA, newRatingB } = calculateElo(1200, 1200, 1, 10, 10);
    // Both have K=32, expected = 0.5, so change = 32 * 0.5 = 16
    expect(newRatingA).toBe(1216);
    expect(newRatingB).toBe(1184);
  });

  it('higher rated player gains less for a win', () => {
    const { newRatingA, newRatingB } = calculateElo(1400, 1000, 1, 10, 10);
    // A expected ~0.91, gains less
    expect(newRatingA).toBeGreaterThan(1400);
    expect(newRatingA - 1400).toBeLessThan(10);
    expect(newRatingB).toBeLessThan(1000);
  });

  it('lower rated player gains more for an upset win', () => {
    const { newRatingA, newRatingB } = calculateElo(1000, 1400, 1, 10, 10);
    // A expected ~0.09, gains more
    expect(newRatingA - 1000).toBeGreaterThan(20);
    expect(1400 - newRatingB).toBeGreaterThan(20);
  });

  it('K=32 for new player (< 30 games) vs K=16 for experienced', () => {
    // Player A is new (5 games), player B is experienced (50 games)
    const { newRatingA, newRatingB } = calculateElo(1200, 1200, 1, 5, 50);
    // A uses K=32: change = 32 * 0.5 = 16
    expect(newRatingA).toBe(1216);
    // B uses K=16: change = 16 * -0.5 = -8
    expect(newRatingB).toBe(1192);
  });

  it('draw produces smaller changes than win/loss', () => {
    const win = calculateElo(1200, 1200, 1, 10, 10);
    const draw = calculateElo(1200, 1200, 0.5, 10, 10);

    // Draw with equal ratings → no change
    expect(draw.newRatingA).toBe(1200);
    expect(draw.newRatingB).toBe(1200);

    // Win produces larger change
    expect(Math.abs(win.newRatingA - 1200)).toBeGreaterThan(Math.abs(draw.newRatingA - 1200));
  });

  it('draw favors lower rated player', () => {
    const { newRatingA, newRatingB } = calculateElo(1000, 1400, 0.5, 10, 10);
    // Lower rated player draws higher rated → gains some
    expect(newRatingA).toBeGreaterThan(1000);
    expect(newRatingB).toBeLessThan(1400);
  });

  it('rating cannot drop below 100', () => {
    const { newRatingB } = calculateElo(1200, 100, 1, 10, 10);
    expect(newRatingB).toBe(100);
  });

  it('very low rated player does not go below 100 on loss', () => {
    const { newRatingA } = calculateElo(105, 1500, 0, 10, 10);
    expect(newRatingA).toBeGreaterThanOrEqual(100);
  });
});
