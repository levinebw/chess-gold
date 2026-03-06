import { GameProvider } from './context/GameContext.tsx';
import { Board } from './components/Board.tsx';
import { Shop } from './components/Shop.tsx';
import { GoldDisplay } from './components/GoldDisplay.tsx';
import { TurnIndicator } from './components/TurnIndicator.tsx';
import { ActionHistory } from './components/ActionHistory.tsx';
import { GameOverDialog } from './components/GameOverDialog.tsx';
import { useGameContext } from './context/GameContext.tsx';
import '../styles/main.css';

function GameView() {
  const { undo, canUndo } = useGameContext();
  return (
    <div className="game-layout">
      <header className="game-header">
        <h1>Chess Gold</h1>
        <div className="header-actions">
          <button onClick={undo} disabled={!canUndo} className="undo-button">
            Undo
          </button>
          <TurnIndicator />
        </div>
      </header>
      <div className="game-content">
        <div className="board-panel">
          <Board />
        </div>
        <div className="side-panel">
          <GoldDisplay />
          <Shop />
          <ActionHistory />
        </div>
      </div>
      <GameOverDialog />
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
