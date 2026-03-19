import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { GoldCoin } from './GoldCoin.tsx';
import { MODE_PRESETS } from '../../engine/config.ts';
import { BOT_PERSONAS } from '../../engine/bot/personas.ts';
import { setSessionCredentials, getSessionCredentials } from '../hooks/useOnlineGame.ts';
import { getStoredPlayerToken, setStoredPlayerToken, getStoredDisplayName, setStoredDisplayName, clearPlayerIdentity } from '../utils/playerIdentity.ts';
import type { BotPersona } from '../../engine/bot/types.ts';
import type { Color, GameModeConfig, GameState } from '../../engine/types.ts';
import type { ClientEvents, ServerEvents, RoomInfo, AuthResponse } from '../../server/protocol.ts';
import { PlayerProfile } from './PlayerProfile.tsx';
import { Leaderboard } from './Leaderboard.tsx';

type TypedSocket = Socket<ServerEvents, ClientEvents>;

const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? 'http://localhost:3001';

const STARTING_GOLD_OPTIONS = [1, 3, 5, 10, 100];

import { TreasureChestIcon } from './TreasureChestIcon.tsx';

const AVAILABLE_MODES = [
  {
    key: 'chess-gold',
    description: 'Start with a king and gold. Buy pieces from the shop.',
    icon: '♛' as React.ReactNode,
  },
  {
    key: 'loot-boxes',
    description: 'Collect loot boxes for gold, pieces, and equipment. First to 6 wins!',
    icon: (<TreasureChestIcon />) as React.ReactNode,
  },
  {
    key: 'standard',
    description: 'Classic chess with standard starting positions.',
    icon: '♔' as React.ReactNode,
  },
  {
    key: 'conqueror',
    description: 'Captured pieces switch sides. Convert all pieces to win.',
    icon: '⚔' as React.ReactNode,
  },
];

interface Props {
  onLocalGame: (modeConfig: GameModeConfig) => void;
  onBotGame: (persona: BotPersona, modeConfig: GameModeConfig) => void;
  onJoinedRoom: (roomId: string, color: Color, socket: TypedSocket, initialState?: GameState) => void;
}

export function Lobby({ onLocalGame, onBotGame, onJoinedRoom }: Props) {
  const [joinCode, setJoinCode] = useState('');
  const [selectedMode, setSelectedMode] = useState<string>('chess-gold');
  const [startingGold, setStartingGold] = useState(3);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'waiting' | 'error'>('idle');
  const [socketConnected, setSocketConnected] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [waitingRoomId, setWaitingRoomId] = useState<string | null>(null);
  const [rooms, setRooms] = useState<RoomInfo[]>([]);
  const socketRef = useRef<TypedSocket | null>(null);
  const handedOffRef = useRef(false);

  // Player identity state
  const [playerName, setPlayerName] = useState<string | null>(getStoredDisplayName());
  const [identityStatus, setIdentityStatus] = useState<'checking' | 'needs-register' | 'ready'>(
    getStoredPlayerToken() ? 'checking' : 'needs-register'
  );
  const [registerInput, setRegisterInput] = useState('');
  const [registerError, setRegisterError] = useState('');
  const [playerRating, setPlayerRating] = useState<number | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [rated, setRated] = useState(true);
  const [subView, setSubView] = useState<'lobby' | 'profile' | 'leaderboard'>('lobby');
  const [viewingProfileId, setViewingProfileId] = useState<string | null>(null);

  const modeConfig = MODE_PRESETS[selectedMode];
  const showEconomy = modeConfig.goldEconomy;

  // Connect socket and handle identity on mount
  useEffect(() => {
    const socket: TypedSocket = io(SERVER_URL);
    socketRef.current = socket;

    socket.on('connect', () => {
      setSocketConnected(true);
      // Authenticate session first
      const creds = getSessionCredentials();
      socket.emit('authenticate', creds.sessionId, creds.token, (res: AuthResponse) => {
        setSessionCredentials(res.sessionId, res.token);

        // Try to log in with stored player token
        const storedToken = getStoredPlayerToken();
        if (storedToken) {
          socket.emit('login', storedToken, (loginRes) => {
            if (loginRes.playerId && loginRes.displayName) {
              setPlayerName(loginRes.displayName);
              setStoredDisplayName(loginRes.displayName);
              setPlayerRating(loginRes.rating ?? null);
              setPlayerId(loginRes.playerId);
              setIdentityStatus('ready');
            } else {
              // Token invalid or expired — clear and show register
              clearPlayerIdentity();
              setPlayerName(null);
              setIdentityStatus('needs-register');
            }
            // Fetch rooms regardless
            socket.emit('list-rooms', (roomList) => { setRooms(roomList); });
          });
        } else {
          setIdentityStatus('needs-register');
          socket.emit('list-rooms', (roomList) => { setRooms(roomList); });
        }
      });
    });

    socket.on('disconnect', () => {
      setSocketConnected(false);
    });

    return () => {
      if (!handedOffRef.current) {
        socket.disconnect();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update the player-joined handler when waitingRoomId changes
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !waitingRoomId) return;

    const handleGameState = (serverState: GameState) => {
      handedOffRef.current = true;
      onJoinedRoom(waitingRoomId, 'white', socket, serverState);
    };

    socket.on('game-state', handleGameState);

    return () => {
      socket.off('game-state', handleGameState);
    };
  }, [waitingRoomId, onJoinedRoom]);

  const handleRegister = () => {
    const socket = socketRef.current;
    if (!socket?.connected) return;

    const name = registerInput.trim();
    if (name.length < 2 || name.length > 20) {
      setRegisterError('Name must be 2-20 characters');
      return;
    }
    if (!/^[a-zA-Z0-9 ]+$/.test(name)) {
      setRegisterError('Letters, numbers, and spaces only');
      return;
    }

    setRegisterError('');
    socket.emit('register', name, (res) => {
      if (res.error) {
        setRegisterError(res.error);
        return;
      }
      if (res.playerToken && res.displayName) {
        setStoredPlayerToken(res.playerToken);
        setStoredDisplayName(res.displayName);
        setPlayerName(res.displayName);
        setPlayerId(res.playerId ?? null);
        setPlayerRating(1200);
        setIdentityStatus('ready');
      }
    });
  };

  const createRoom = () => {
    const socket = socketRef.current;
    if (!socket?.connected) {
      setErrorMsg('Not connected to server');
      setStatus('error');
      return;
    }

    setStatus('connecting');
    socket.emit('create-room', { startingGold, modeConfig, rated }, (res) => {
      if (res.error) {
        setErrorMsg(res.error);
        setStatus('error');
        return;
      }
      setWaitingRoomId(res.roomId);
      setStatus('waiting');
    });
  };

  const joinRoom = (roomId: string) => {
    const socket = socketRef.current;
    if (!socket?.connected) {
      setErrorMsg('Not connected to server');
      setStatus('error');
      return;
    }

    setStatus('connecting');
    socket.emit('join-room', roomId, (res) => {
      if (res.error) {
        setErrorMsg(res.error);
        setStatus('error');
        return;
      }
      if (res.roomId && res.color) {
        handedOffRef.current = true;
        onJoinedRoom(res.roomId, res.color, socket, res.state);
      }
    });
  };

  const refreshRooms = () => {
    socketRef.current?.emit('list-rooms', (roomList) => {
      setRooms(roomList);
    });
  };

  // Sub-views (profile/leaderboard) rendered within the lobby
  if (subView === 'profile' && viewingProfileId && socketRef.current) {
    return (
      <PlayerProfile
        playerId={viewingProfileId}
        socket={socketRef.current}
        currentPlayerId={playerId ?? undefined}
        onBack={() => setSubView('lobby')}
        onViewProfile={(id) => setViewingProfileId(id)}
      />
    );
  }

  if (subView === 'leaderboard' && socketRef.current) {
    return (
      <Leaderboard
        socket={socketRef.current}
        currentPlayerId={playerId ?? undefined}
        onBack={() => setSubView('lobby')}
        onViewProfile={(id) => { setViewingProfileId(id); setSubView('profile'); }}
      />
    );
  }

  if (status === 'waiting' && waitingRoomId) {
    return (
      <div className="lobby">
        <h1>Chess Gold</h1>
        <div className="lobby-waiting">
          <p>Waiting for opponent...</p>
          <p className="lobby-hint">{modeConfig.name}</p>
          <div className="room-code-display">
            <span className="room-code-label">Room Code</span>
            <span className="room-code-value">{waitingRoomId}</span>
          </div>
          <p className="lobby-hint">Share this code with your opponent</p>
          <button className="lobby-button secondary" onClick={() => {
            socketRef.current?.disconnect();
            setStatus('idle');
            setWaitingRoomId(null);
          }}>
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="lobby">
      <h1>Chess Gold</h1>

      {/* Mode Selection */}
      <div className="lobby-section">
        <h2>Game Mode</h2>
        <div className="lobby-mode-cards">
          {AVAILABLE_MODES.map(({ key, description, icon }) => {
            const config = MODE_PRESETS[key];
            return (
              <button
                key={key}
                className={`lobby-mode-card${selectedMode === key ? ' selected' : ''}`}
                onClick={() => setSelectedMode(key)}
              >
                <span className="lobby-mode-icon">{icon}</span>
                <span className="lobby-mode-name">{config.name}</span>
                <span className="lobby-mode-desc">{description}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Local Game */}
      <div className="lobby-section">
        <button className="lobby-button primary" onClick={() => onLocalGame(modeConfig)}>
          Local Game (Pass &amp; Play)
        </button>
      </div>

      {/* Play vs Bot */}
      <div className="lobby-section">
        <h2>Play vs Bot</h2>
        <div className="lobby-bot-cards">
          {BOT_PERSONAS.map(persona => (
            <button
              key={persona.id}
              className="lobby-bot-card"
              onClick={() => onBotGame(persona, modeConfig)}
            >
              <span className="bot-avatar">{persona.avatar}</span>
              <span className="lobby-bot-name">{persona.name}</span>
              <span className="lobby-bot-desc">{persona.description}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="lobby-divider">or play online</div>

      {/* Player identity gate for online play */}
      {identityStatus === 'checking' && (
        <div className="lobby-section">
          <p className="lobby-hint">Checking identity...</p>
        </div>
      )}

      {identityStatus === 'needs-register' && (
        <div className="lobby-section">
          <h2>Enter Your Name</h2>
          <div className="lobby-register">
            <input
              type="text"
              placeholder="Display name"
              value={registerInput}
              onChange={e => setRegisterInput(e.target.value)}
              className="lobby-input"
              maxLength={20}
              onKeyDown={e => { if (e.key === 'Enter') handleRegister(); }}
            />
            <button
              className="lobby-button primary"
              onClick={handleRegister}
              disabled={!socketConnected || registerInput.trim().length < 2}
            >
              Play
            </button>
          </div>
          {registerError && <div className="lobby-error">{registerError}</div>}
          <button className="lobby-skip-link" onClick={() => setIdentityStatus('ready')}>
            Skip — play without a name
          </button>
        </div>
      )}

      {identityStatus === 'ready' && (
        <>
          {playerName && (
            <div className="lobby-section lobby-identity">
              Playing as: {playerId ? (
                <button className="lobby-name-link" onClick={() => { setViewingProfileId(playerId); setSubView('profile'); }}>
                  <strong>{playerName}</strong>{playerRating !== null && ` (${playerRating})`}
                </button>
              ) : (
                <><strong>{playerName}</strong>{playerRating !== null && ` (${playerRating})`}</>
              )}
              <button className="lobby-button secondary small" onClick={() => setSubView('leaderboard')}>Leaderboard</button>
            </div>
          )}

          {/* Create Room */}
          <div className="lobby-section">
            <h2>Create Room</h2>
            <div className="lobby-create">
              {showEconomy && (
                <label>
                  Starting Gold: <GoldCoin size={16}/>
                  <select
                    value={startingGold}
                    onChange={e => setStartingGold(Number(e.target.value))}
                    className="starting-gold-select"
                  >
                    {STARTING_GOLD_OPTIONS.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </label>
              )}
              <label className="rated-toggle">
                <input type="checkbox" checked={rated} onChange={e => setRated(e.target.checked)} />
                Rated
              </label>
              <button className="lobby-button primary" onClick={createRoom} disabled={!socketConnected || status === 'connecting'}>
                {!socketConnected ? 'Connecting...' : status === 'connecting' ? 'Creating...' : 'Create Room'}
              </button>
            </div>
          </div>

          {/* Join Room */}
          <div className="lobby-section">
            <h2>Join Room</h2>
            <div className="lobby-join">
              <input
                type="text"
                placeholder="Enter room code"
                value={joinCode}
                onChange={e => setJoinCode(e.target.value.toLowerCase().trim())}
                className="lobby-input"
                maxLength={8}
              />
              <button
                className="lobby-button primary"
                onClick={() => joinRoom(joinCode)}
                disabled={!joinCode || !socketConnected || status === 'connecting'}
              >
                Join
              </button>
            </div>
          </div>

          {/* Open Rooms */}
          {rooms.length > 0 && (
            <div className="lobby-section">
              <h2>
                Open Rooms
                <button className="lobby-refresh" onClick={refreshRooms} title="Refresh">↻</button>
              </h2>
              <div className="lobby-rooms">
                {rooms.map(room => (
                  <button
                    key={room.id}
                    className="lobby-room"
                    onClick={() => joinRoom(room.id)}
                  >
                    <span className="room-id">{room.id}</span>
                    {room.whiteName && <span className="room-host">{room.whiteName}{room.whiteRating ? ` (${room.whiteRating})` : ''}</span>}
                    <span className="room-mode">{room.modeName}</span>
                    <span className={`room-rated-badge ${room.rated ? 'rated' : 'casual'}`}>{room.rated ? 'Rated' : 'Casual'}</span>
                    {room.startingGold > 0 && (
                      <span className="room-gold">{room.startingGold}<GoldCoin size={14}/></span>
                    )}
                    <span className="room-players">{room.players}/2</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="lobby-error">{errorMsg}</div>
          )}
        </>
      )}
    </div>
  );
}
