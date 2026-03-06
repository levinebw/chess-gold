import { useState } from 'react';
import { GameProvider } from './context/GameContext.tsx';
import { Board } from './components/Board.tsx';
import { Shop } from './components/Shop.tsx';
import { GoldDisplay } from './components/GoldDisplay.tsx';
import { TurnIndicator } from './components/TurnIndicator.tsx';
import { ActionHistory } from './components/ActionHistory.tsx';
import { GameOverDialog } from './components/GameOverDialog.tsx';
import { RulesDialog } from './components/RulesDialog.tsx';
import { useGameContext } from './context/GameContext.tsx';
import { isMuted, setMuted } from './utils/sounds.ts';
import '../styles/main.css';

const STARTING_GOLD_OPTIONS = [1, 3, 5, 10, 100];

function GameView() {
  const { undo, canUndo, resetGame, startingGold, setStartingGold, state } = useGameContext();
  const [showRules, setShowRules] = useState(false);
  const [muted, setMutedState] = useState(isMuted);
  const gameInProgress = state.actionHistory.length > 0;

  const toggleMute = () => {
    const newVal = !muted;
    setMuted(newVal);
    setMutedState(newVal);
  };
  return (
    <div className="game-layout">
      <header className="game-header">
        <h1>Chess Gold</h1>
        <div className="header-actions">
          <select
            className="starting-gold-select"
            value={startingGold}
            onChange={e => setStartingGold(Number(e.target.value))}
            disabled={gameInProgress}
            title="Starting gold"
          >
            {STARTING_GOLD_OPTIONS.map(g => (
              <option key={g} value={g}>{g}🪙</option>
            ))}
          </select>
          <button onClick={resetGame} className="new-game-header-button" title="New Game">
            New Game
          </button>
          <button onClick={() => setShowRules(true)} className="rules-button" title="Rules">
            ?
          </button>
          <button onClick={undo} disabled={!canUndo} className="undo-button" title="Undo">
            Undo
          </button>
          <button onClick={toggleMute} className="mute-button" title={muted ? 'Unmute' : 'Mute'}>
            {muted ? '\uD83D\uDD07' : '\uD83D\uDD0A'}
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
        </div>
        <ActionHistory />
      </div>
      <GameOverDialog />
      {showRules && <RulesDialog onClose={() => setShowRules(false)} />}
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
