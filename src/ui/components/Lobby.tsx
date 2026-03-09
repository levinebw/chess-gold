import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { GoldCoin } from './GoldCoin.tsx';
import { MODE_PRESETS } from '../../engine/config.ts';
import type { Color, GameModeConfig } from '../../engine/types.ts';
import type { ClientEvents, ServerEvents, RoomInfo } from '../../server/protocol.ts';

type TypedSocket = Socket<ServerEvents, ClientEvents>;

const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? 'http://localhost:3001';

const STARTING_GOLD_OPTIONS = [1, 3, 5, 10, 100];

const AVAILABLE_MODES = [
  {
    key: 'chess-gold',
    description: 'Start with a king and gold. Buy pieces from the shop.',
    icon: '♛',
  },
  {
    key: 'standard',
    description: 'Classic chess with standard starting positions.',
    icon: '♔',
  },
  {
    key: 'conqueror',
    description: 'Captured pieces switch sides. Convert all pieces to win.',
    icon: '⚔',
  },
] as const;

interface Props {
  onLocalGame: (modeConfig: GameModeConfig) => void;
  onJoinedRoom: (roomId: string, color: Color, socket: TypedSocket) => void;
}

export function Lobby({ onLocalGame, onJoinedRoom }: Props) {
  const [joinCode, setJoinCode] = useState('');
  const [selectedMode, setSelectedMode] = useState<string>('chess-gold');
  const [startingGold, setStartingGold] = useState(3);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'waiting' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [waitingRoomId, setWaitingRoomId] = useState<string | null>(null);
  const [rooms, setRooms] = useState<RoomInfo[]>([]);
  const socketRef = useRef<TypedSocket | null>(null);
  const handedOffRef = useRef(false);

  const modeConfig = MODE_PRESETS[selectedMode];
  const showEconomy = modeConfig.goldEconomy;

  // Fetch open rooms on mount
  useEffect(() => {
    const socket: TypedSocket = io(SERVER_URL);
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('list-rooms', (roomList) => {
        setRooms(roomList);
      });
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

    const handleJoined = () => {
      handedOffRef.current = true;
      onJoinedRoom(waitingRoomId, 'white', socket);
    };

    socket.on('player-joined', handleJoined);
    socket.on('game-state', handleJoined);

    return () => {
      socket.off('player-joined', handleJoined);
      socket.off('game-state', handleJoined);
    };
  }, [waitingRoomId, onJoinedRoom]);

  const createRoom = () => {
    const socket = socketRef.current;
    if (!socket?.connected) {
      setErrorMsg('Not connected to server');
      setStatus('error');
      return;
    }

    setStatus('connecting');
    socket.emit('create-room', { startingGold, modeConfig }, (res) => {
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
        onJoinedRoom(res.roomId, res.color, socket);
      }
    });
  };

  const refreshRooms = () => {
    socketRef.current?.emit('list-rooms', (roomList) => {
      setRooms(roomList);
    });
  };

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

      <div className="lobby-divider">or play online</div>

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
          <button className="lobby-button primary" onClick={createRoom} disabled={status === 'connecting'}>
            {status === 'connecting' ? 'Creating...' : 'Create Room'}
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
            disabled={!joinCode || status === 'connecting'}
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
                <span className="room-mode">{room.modeName}</span>
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
    </div>
  );
}
