import { useGameContext } from '../context/GameContext.tsx';
import type { Color, WinReason } from '../../engine/types.ts';

function winMessage(winner: Color, reason: WinReason | null): string {
  const name = winner === 'white' ? 'White' : 'Black';
  switch (reason) {
    case 'loot-boxes-collected':
      return `${name} collected all the loot boxes and wins!`;
    case 'all-converted':
      return `${name} conquered all pieces and wins!`;
    default:
      return `Checkmate! ${name} wins!`;
  }
}

export function GameOverDialog() {
  const ctx = useGameContext();
  const { state, resetGame } = ctx;

  // Online-specific fields (only present in online game context)
  const isOnline = 'roomId' in ctx && !!ctx.roomId;
  const rematchRequested = 'rematchRequested' in ctx ? ctx.rematchRequested : false;
  const opponentWantsRematch = 'opponentWantsRematch' in ctx ? ctx.opponentWantsRematch : false;

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
    <div className="game-over-overlay">
      <div className="game-over-dialog">
        <h2>Game Over</h2>
        <p className="game-over-result">
          {state.status === 'checkmate'
            ? winMessage(state.winner!, state.winReason)
            : state.status === 'draw'
            ? 'Draw — Threefold Repetition'
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
