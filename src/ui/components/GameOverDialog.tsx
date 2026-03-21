import { useGameContext } from '../context/GameContext.tsx';
import type { Color, WinReason } from '../../engine/types.ts';
import type { GameResult } from '../../server/protocol.ts';

function winMessage(winner: Color, reason: WinReason | null): string {
  const name = winner === 'white' ? 'White' : 'Black';
  const loser = winner === 'white' ? 'Black' : 'White';
  switch (reason) {
    case 'resign':
      return `${loser} resigned. ${name} wins!`;
    case 'loot-boxes-collected':
      return `${name} collected all the loot boxes and wins!`;
    case 'all-converted':
      return `${name} conquered all pieces and wins!`;
    case 'all-eliminated':
      return `${name} eliminated all opponents and wins!`;
    default:
      return `Checkmate! ${name} wins!`;
  }
}

function RatingChange({ change }: { change: number }) {
  if (change === 0) return null;
  const sign = change > 0 ? '+' : '';
  const className = change > 0 ? 'rating-positive' : 'rating-negative';
  return <span className={className}>{sign}{change}</span>;
}

export function GameOverDialog({ onLeave }: { onLeave?: () => void }) {
  const ctx = useGameContext();
  const { state, resetGame } = ctx;

  // Online-specific fields (only present in online game context)
  const isOnline = 'roomId' in ctx && !!ctx.roomId;
  const rematchRequested = 'rematchRequested' in ctx ? ctx.rematchRequested : false;
  const opponentWantsRematch = 'opponentWantsRematch' in ctx ? ctx.opponentWantsRematch : false;
  const myColor = 'myColor' in ctx ? (ctx.myColor as Color) : null;
  const gameResult = 'gameResult' in ctx ? (ctx.gameResult as GameResult | null) : null;

  if (state.status !== 'checkmate' && state.status !== 'stalemate' && state.status !== 'draw') {
    return null;
  }

  let buttonLabel = 'New Game';
  if (isOnline) {
    if (rematchRequested && !opponentWantsRematch) {
      buttonLabel = 'Waiting for opponent...';
    } else if (opponentWantsRematch && !rematchRequested) {
      buttonLabel = 'Accept Rematch';
    } else {
      buttonLabel = 'Rematch';
    }
  }

  return (
    <div className="game-over-overlay" role="dialog" aria-label="Game Over" aria-modal="true">
      <div className="game-over-dialog">
        <h2>Game Over</h2>
        <p className="game-over-result">
          {state.status === 'checkmate'
            ? winMessage(state.winner!, state.winReason)
            : state.status === 'draw'
            ? 'Draw — Threefold Repetition'
            : 'Stalemate — Draw'}
        </p>
        {isOnline && gameResult && (
          <div className="game-over-rating">
            {gameResult.rated ? (
              <>
                <p>Your rating: <strong>{myColor ? gameResult.newRating[myColor] : '—'}</strong> <RatingChange change={myColor ? gameResult.ratingChange[myColor] : 0} /></p>
              </>
            ) : (
              <p className="rating-casual">Casual game — ratings unchanged</p>
            )}
          </div>
        )}
        <div className="game-over-actions">
          <button
            className="new-game-button"
            onClick={resetGame}
            disabled={isOnline && rematchRequested && !opponentWantsRematch}
          >
            {buttonLabel}
          </button>
          {isOnline && onLeave && (
            <button className="lobby-button secondary" onClick={onLeave}>
              Leave
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
