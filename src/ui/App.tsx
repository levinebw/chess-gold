import { useState, useCallback } from 'react';
import { GameProvider, BotGameProvider, OnlineGameProvider } from './context/GameContext.tsx';
import { Board } from './components/Board.tsx';
import { Shop } from './components/Shop.tsx';
import { GoldDisplay } from './components/GoldDisplay.tsx';
import { TurnIndicator } from './components/TurnIndicator.tsx';
import { ActionHistory } from './components/ActionHistory.tsx';
import { GameOverDialog } from './components/GameOverDialog.tsx';
import { RulesDialog } from './components/RulesDialog.tsx';
import { Lobby } from './components/Lobby.tsx';
import { OnlineStatusBar } from './components/OnlineGameView.tsx';
import { InventoryPanel } from './components/InventoryPanel.tsx';
import { LootBoxReward } from './components/LootBoxReward.tsx';
import { LootBoxCounter } from './components/LootBoxCounter.tsx';
import { GameHints } from './components/GameHints.tsx';
import { useGameContext } from './context/GameContext.tsx';
import { useOnlineGame } from './hooks/useOnlineGame.ts';
import { GoldCoin } from './components/GoldCoin.tsx';
import { isMuted, setMuted, getVolume, setVolume } from './utils/sounds.ts';
import type { Color, GameModeConfig, GameState } from '../engine/types.ts';
import type { BotPersona } from '../engine/bot/types.ts';
import type { Socket } from 'socket.io-client';
import type { ClientEvents, ServerEvents } from '../server/protocol.ts';
import '../styles/main.css';

const STARTING_GOLD_OPTIONS = [1, 3, 5, 10, 100];

type AppScreen =
  | { type: 'lobby' }
  | { type: 'local'; modeConfig: GameModeConfig }
  | { type: 'bot'; persona: BotPersona; modeConfig: GameModeConfig }
  | { type: 'online'; roomId: string; color: Color; socket: Socket<ServerEvents, ClientEvents>; initialState?: GameState };

function GameView({ isOnline, onLeave }: { isOnline: boolean; onLeave?: () => void }) {
  const { undo, canUndo, resetGame, startingGold, setStartingGold, state, flipBoard } = useGameContext();
  const [showRules, setShowRules] = useState(false);
  const [muted, setMutedState] = useState(isMuted);
  const [vol, setVol] = useState(getVolume);
  const gameInProgress = state.actionHistory.length > 0;
  const showEconomy = state.modeConfig.goldEconomy;

  const toggleMute = () => {
    const newVal = !muted;
    setMuted(newVal);
    setMutedState(newVal);
  };

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    setVol(v);
  };

  return (
    <div className="game-layout">
      {isOnline && onLeave && <OnlineStatusBar onLeave={onLeave} />}
      <header className="game-header">
        {!isOnline && onLeave && (
          <button onClick={onLeave} className="back-to-lobby-header" title="Back to Lobby">
            ← Lobby
          </button>
        )}
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
          <div className="volume-control">
            <button onClick={toggleMute} className="mute-button" title={muted ? 'Unmute' : 'Mute'}>
              {muted ? '\uD83D\uDD07' : '\uD83D\uDD0A'}
            </button>
            {!muted && (
              <input
                type="range"
                className="volume-slider"
                min="0"
                max="1"
                step="0.1"
                value={vol}
                onChange={handleVolume}
                title={`Volume: ${Math.round(vol * 100)}%`}
              />
            )}
          </div>
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
            <LootBoxCounter />
            <Shop />
            <InventoryPanel />
          </div>
        )}
        <ActionHistory />
      </div>
      <GameHints />
      <LootBoxReward />
      <GameOverDialog onLeave={isOnline ? onLeave : undefined} />
      {showRules && <RulesDialog onClose={() => setShowRules(false)} />}
    </div>
  );
}

function BotGameWrapper({ persona, modeConfig, onLeave }: { persona: BotPersona; modeConfig: GameModeConfig; onLeave: () => void }) {
  return (
    <BotGameProvider persona={persona} modeConfig={modeConfig}>
      <GameView isOnline={false} onLeave={onLeave} />
    </BotGameProvider>
  );
}

function OnlineGameWrapper({ roomId, color, socket, initialState, onLeave }: { roomId: string; color: Color; socket: Socket<ServerEvents, ClientEvents>; initialState?: GameState; onLeave: () => void }) {
  const game = useOnlineGame(roomId, color, socket, initialState);
  return (
    <OnlineGameProvider value={game}>
      <GameView isOnline onLeave={onLeave} />
    </OnlineGameProvider>
  );
}

export default function App() {
  const [screen, setScreen] = useState<AppScreen>({ type: 'lobby' });

  const handleLocalGame = useCallback((modeConfig: GameModeConfig) => {
    setScreen({ type: 'local', modeConfig });
  }, []);

  const handleBotGame = useCallback((persona: BotPersona, modeConfig: GameModeConfig) => {
    setScreen({ type: 'bot', persona, modeConfig });
  }, []);

  const handleJoinedRoom = useCallback((roomId: string, color: Color, _socket: Socket<ServerEvents, ClientEvents>, initialState?: GameState) => {
    setScreen({ type: 'online', roomId, color, socket: _socket, initialState });
  }, []);

  const handleLeave = useCallback(() => {
    setScreen(prev => {
      if (prev.type === 'online') {
        prev.socket.disconnect();
      }
      return { type: 'lobby' };
    });
  }, []);

  let content: React.ReactNode;
  if (screen.type === 'lobby') {
    content = <Lobby onLocalGame={handleLocalGame} onBotGame={handleBotGame} onJoinedRoom={handleJoinedRoom} />;
  } else if (screen.type === 'online') {
    content = (
      <OnlineGameWrapper
        roomId={screen.roomId}
        color={screen.color}
        initialState={screen.initialState}
        socket={screen.socket}
        onLeave={handleLeave}
      />
    );
  } else if (screen.type === 'bot') {
    content = (
      <BotGameWrapper
        persona={screen.persona}
        modeConfig={screen.modeConfig}
        onLeave={handleLeave}
      />
    );
  } else {
    content = (
      <GameProvider modeConfig={screen.modeConfig}>
        <GameView isOnline={false} onLeave={handleLeave} />
      </GameProvider>
    );
  }

  return (
    <>
      <div className="view-transition" key={screen.type === 'online' ? `online-${screen.roomId}` : screen.type}>
        {content}
      </div>
      <a
        className="github-link"
        href="https://github.com/levinebw/chess-gold"
        target="_blank"
        rel="noopener noreferrer"
        title="View on GitHub"
      >
        <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z"/>
        </svg>
      </a>
    </>
  );
}
