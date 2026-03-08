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
import { OnlineStatusBar } from './components/OnlineGameView.tsx';
import { useGameContext } from './context/GameContext.tsx';
import { useOnlineGame } from './hooks/useOnlineGame.ts';
import { GoldCoin } from './components/GoldCoin.tsx';
import { isMuted, setMuted } from './utils/sounds.ts';
import type { Color } from '../engine/types.ts';
import type { Socket } from 'socket.io-client';
import type { ClientEvents, ServerEvents } from '../server/protocol.ts';
import '../styles/main.css';

const STARTING_GOLD_OPTIONS = [1, 3, 5, 10, 100];

type AppScreen =
  | { type: 'lobby' }
  | { type: 'local' }
  | { type: 'online'; roomId: string; color: Color; socket: Socket<ServerEvents, ClientEvents> };

function GameView({ isOnline, onLeave }: { isOnline: boolean; onLeave?: () => void }) {
  const { undo, canUndo, resetGame, startingGold, setStartingGold, state, flipBoard } = useGameContext();
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
      {isOnline && onLeave && <OnlineStatusBar onLeave={onLeave} />}
      <header className="game-header">
        <h1>Chess Gold</h1>
        <div className="header-actions">
          {!isOnline && (
            <>
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
              <button onClick={resetGame} className="new-game-header-button" title="New Game">
                New Game
              </button>
            </>
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

function OnlineGameWrapper({ roomId, color, socket, onLeave }: { roomId: string; color: Color; socket: Socket<ServerEvents, ClientEvents>; onLeave: () => void }) {
  const game = useOnlineGame(roomId, color, socket);
  return (
    <OnlineGameProvider value={game}>
      <GameView isOnline onLeave={onLeave} />
    </OnlineGameProvider>
  );
}

export default function App() {
  const [screen, setScreen] = useState<AppScreen>({ type: 'lobby' });

  const handleLocalGame = useCallback(() => {
    setScreen({ type: 'local' });
  }, []);

  const handleJoinedRoom = useCallback((roomId: string, color: Color, _socket: Socket<ServerEvents, ClientEvents>) => {
    setScreen({ type: 'online', roomId, color, socket: _socket });
  }, []);

  const handleLeave = useCallback(() => {
    setScreen(prev => {
      if (prev.type === 'online') {
        prev.socket.disconnect();
      }
      return { type: 'lobby' };
    });
  }, []);

  if (screen.type === 'lobby') {
    return <Lobby onLocalGame={handleLocalGame} onJoinedRoom={handleJoinedRoom} />;
  }

  if (screen.type === 'online') {
    return <OnlineGameWrapper roomId={screen.roomId} color={screen.color} socket={screen.socket} onLeave={handleLeave} />;
  }

  // Local game
  return (
    <GameProvider>
      <GameView isOnline={false} onLeave={handleLeave} />
      <button className="back-to-lobby" onClick={handleLeave}>← Back to Lobby</button>
    </GameProvider>
  );
}
