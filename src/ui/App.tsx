import { useState, useCallback } from 'react';
import { GameProvider, OnlineGameProvider } from './context/GameContext.tsx';
import { Board } from './components/Board.tsx';
import { Shop } from './components/Shop.tsx';
import { GoldDisplay } from './components/GoldDisplay.tsx';
import { TurnIndicator } from './components/TurnIndicator.tsx';
import { ActionHistory } from './components/ActionHistory.tsx';
import { GameOverDialog } from './components/GameOverDialog.tsx';
import { RulesDialog } from './components/RulesDialog.tsx';
import { Lobby } from './components/Lobby.tsx';
import { ModeSelector } from './components/ModeSelector.tsx';
import { OnlineStatusBar } from './components/OnlineGameView.tsx';
import { useGameContext } from './context/GameContext.tsx';
import { useOnlineGame } from './hooks/useOnlineGame.ts';
import { GoldCoin } from './components/GoldCoin.tsx';
import { isMuted, setMuted } from './utils/sounds.ts';
import type { Color, GameModeConfig } from '../engine/types.ts';
import type { Socket } from 'socket.io-client';
import type { ClientEvents, ServerEvents } from '../server/protocol.ts';
import '../styles/main.css';

const STARTING_GOLD_OPTIONS = [1, 3, 5, 10, 100];

type AppScreen =
  | { type: 'mode-select' }
  | { type: 'lobby'; modeConfig: GameModeConfig }
  | { type: 'local'; modeConfig: GameModeConfig }
  | { type: 'online'; modeConfig: GameModeConfig; roomId: string; color: Color; socket: Socket<ServerEvents, ClientEvents> };

function GameView({ isOnline, onLeave, onBackToMenu }: { isOnline: boolean; onLeave?: () => void; onBackToMenu?: () => void }) {
  const { undo, canUndo, resetGame, startingGold, setStartingGold, state, flipBoard } = useGameContext();
  const [showRules, setShowRules] = useState(false);
  const [muted, setMutedState] = useState(isMuted);
  const gameInProgress = state.actionHistory.length > 0;
  const showEconomy = state.modeConfig.goldEconomy;

  const toggleMute = () => {
    const newVal = !muted;
    setMuted(newVal);
    setMutedState(newVal);
  };

  return (
    <div className="game-layout">
      {isOnline && onLeave && <OnlineStatusBar onLeave={onLeave} />}
      <header className="game-header">
        <h1>{state.modeConfig.name}</h1>
        <div className="header-actions">
          {!isOnline && showEconomy && (
            <div className="starting-gold-picker" title="Starting gold">
              <GoldCoin size={16}/>
              <select
                className="starting-gold-select"
                value={startingGold}
                onChange={e => setStartingGold(Number(e.target.value))}
                disabled={gameInProgress}
              >
                {STARTING_GOLD_OPTIONS.map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
          )}
          {!isOnline && (
            <button onClick={resetGame} className="new-game-header-button" title="New Game">
              New Game
            </button>
          )}
          <button onClick={() => setShowRules(true)} className="rules-button" title="Rules">
            ?
          </button>
          {!isOnline && (
            <button onClick={undo} disabled={!canUndo} className="undo-button" title="Undo">
              Undo
            </button>
          )}
          <button onClick={flipBoard} className="flip-button" title="Flip board">
            ⟳
          </button>
          <button onClick={toggleMute} className="mute-button" title={muted ? 'Unmute' : 'Mute'}>
            {muted ? '\uD83D\uDD07' : '\uD83D\uDD0A'}
          </button>
          <TurnIndicator />
        </div>
      </header>
      <div className={`game-content${showEconomy ? '' : ' no-economy'}`}>
        <div className="board-panel">
          <Board />
        </div>
        {showEconomy && (
          <div className="side-panel">
            <GoldDisplay />
            <Shop />
          </div>
        )}
        <ActionHistory />
      </div>
      <GameOverDialog />
      {showRules && <RulesDialog onClose={() => setShowRules(false)} />}
      {!isOnline && onBackToMenu && (
        <button className="back-to-lobby" onClick={onBackToMenu}>← Change Mode</button>
      )}
    </div>
  );
}

function OnlineGameWrapper({ roomId, color, socket, onLeave }: { roomId: string; color: Color; socket: Socket<ServerEvents, ClientEvents>; onLeave: () => void }) {
  const game = useOnlineGame(roomId, color, socket);
  return (
    <OnlineGameProvider value={game}>
      <GameView isOnline onLeave={onLeave} />
    </OnlineGameProvider>
  );
}

export default function App() {
  const [screen, setScreen] = useState<AppScreen>({ type: 'mode-select' });

  const handleModeSelect = useCallback((_key: string, config: GameModeConfig) => {
    setScreen({ type: 'lobby', modeConfig: config });
  }, []);

  const handleBackToMenu = useCallback(() => {
    setScreen(prev => {
      if (prev.type === 'online') {
        prev.socket.disconnect();
      }
      return { type: 'mode-select' };
    });
  }, []);

  const handleLocalGame = useCallback(() => {
    setScreen(prev => {
      if (prev.type === 'lobby') {
        return { type: 'local', modeConfig: prev.modeConfig };
      }
      return prev;
    });
  }, []);

  const handleJoinedRoom = useCallback((roomId: string, color: Color, _socket: Socket<ServerEvents, ClientEvents>) => {
    setScreen(prev => {
      if (prev.type === 'lobby') {
        return { type: 'online', modeConfig: prev.modeConfig, roomId, color, socket: _socket };
      }
      return prev;
    });
  }, []);

  const handleLeave = useCallback(() => {
    setScreen(prev => {
      if (prev.type === 'online') {
        prev.socket.disconnect();
      }
      if (prev.type === 'online' || prev.type === 'local') {
        return { type: 'lobby', modeConfig: prev.modeConfig };
      }
      return { type: 'mode-select' };
    });
  }, []);

  if (screen.type === 'mode-select') {
    return <ModeSelector onSelectMode={handleModeSelect} />;
  }

  if (screen.type === 'lobby') {
    return (
      <Lobby
        onLocalGame={handleLocalGame}
        onJoinedRoom={handleJoinedRoom}
        onBackToMenu={handleBackToMenu}
        modeConfig={screen.modeConfig}
      />
    );
  }

  if (screen.type === 'online') {
    return (
      <OnlineGameWrapper
        roomId={screen.roomId}
        color={screen.color}
        socket={screen.socket}
        onLeave={handleLeave}
      />
    );
  }

  // Local game
  return (
    <GameProvider modeConfig={screen.modeConfig}>
      <GameView isOnline={false} onLeave={handleLeave} onBackToMenu={handleBackToMenu} />
    </GameProvider>
  );
}
