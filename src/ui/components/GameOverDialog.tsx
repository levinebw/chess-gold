import { useGameContext } from '../context/GameContext.tsx';

export function GameOverDialog() {
  const { state, resetGame } = useGameContext();

  if (state.status !== 'checkmate' && state.status !== 'stalemate') {
    return null;
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
        <button className="new-game-button" onClick={resetGame}>
          New Game
        </button>
      </div>
    </div>
  );
}
