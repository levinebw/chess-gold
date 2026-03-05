import { GameProvider, useGameContext } from './context/GameContext.tsx';
import { Board } from './components/Board.tsx';
import '../styles/main.css';

function GameView() {
  const { state, dispatch, error } = useGameContext();

  return (
    <div className="game-layout">
      <h1>Chess Gold</h1>
      <div className="game-info">
        <span className={state.turn === 'white' ? 'active-turn' : ''}>
          White: {state.gold.white}g
        </span>
        <span className="turn-indicator">
          {state.status === 'checkmate'
            ? `Checkmate! ${state.winner} wins!`
            : state.status === 'stalemate'
              ? 'Stalemate - Draw'
              : `${state.turn === 'white' ? 'White' : 'Black'} to move`}
        </span>
        <span className={state.turn === 'black' ? 'active-turn' : ''}>
          Black: {state.gold.black}g
        </span>
      </div>
      <Board state={state} dispatch={dispatch} />
      {error && <div className="error-message">{error.message}</div>}
    </div>
  );
}

export default function App() {
  return (
    <GameProvider>
      <GameView />
    </GameProvider>
  );
}
