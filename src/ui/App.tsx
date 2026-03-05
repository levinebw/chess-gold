import { GameProvider } from './context/GameContext.tsx';
import { Board } from './components/Board.tsx';
import { Shop } from './components/Shop.tsx';
import { GoldDisplay } from './components/GoldDisplay.tsx';
import { TurnIndicator } from './components/TurnIndicator.tsx';
import { ActionHistory } from './components/ActionHistory.tsx';
import { GameOverDialog } from './components/GameOverDialog.tsx';
import '../styles/main.css';

function GameView() {
  return (
    <div className="game-layout">
      <header className="game-header">
        <h1>Chess Gold</h1>
        <TurnIndicator />
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
