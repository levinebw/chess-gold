import { useGameContext } from '../context/GameContext.tsx';

export function GameOverDialog() {
  const ctx = useGameContext();
  const { state, resetGame } = ctx;

  // Online-specific fields (only present in online game context)
  const isOnline = 'roomId' in ctx && !!ctx.roomId;
  const rematchRequested = 'rematchRequested' in ctx ? ctx.rematchRequested : false;
  const opponentWantsRematch = 'opponentWantsRematch' in ctx ? ctx.opponentWantsRematch : false;

  if (state.status !== 'checkmate' && state.status !== 'stalemate') {
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
    <div className="game-over-overlay">
      <div className="game-over-dialog">
        <h2>Game Over</h2>
        <p className="game-over-result">
          {state.status === 'checkmate'
            ? `Checkmate! ${state.winner === 'white' ? 'White' : 'Black'} wins!`
            : 'Stalemate — Draw'}
        </p>
        <button
          className="new-game-button"
          onClick={resetGame}
          disabled={isOnline && rematchRequested && !opponentWantsRematch}
        >
          {buttonLabel}
        </button>
      </div>
    </div>
  );
}
