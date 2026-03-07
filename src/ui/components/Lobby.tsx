import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import type { Color } from '../../engine/types.ts';
import type { ClientEvents, ServerEvents, RoomInfo } from '../../server/protocol.ts';

type TypedSocket = Socket<ServerEvents, ClientEvents>;

const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? 'http://localhost:3001';

const STARTING_GOLD_OPTIONS = [1, 3, 5, 10, 100];

interface Props {
  onLocalGame: () => void;
  onJoinedRoom: (roomId: string, color: Color, socket: TypedSocket) => void;
}

export function Lobby({ onLocalGame, onJoinedRoom }: Props) {
  const [joinCode, setJoinCode] = useState('');
  const [startingGold, setStartingGold] = useState(3);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'waiting' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [waitingRoomId, setWaitingRoomId] = useState<string | null>(null);
  const [rooms, setRooms] = useState<RoomInfo[]>([]);
  const socketRef = useRef<TypedSocket | null>(null);

  // Fetch open rooms on mount
  useEffect(() => {
    const socket: TypedSocket = io(SERVER_URL);
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('list-rooms', (roomList) => {
        setRooms(roomList);
      });
    });

    socket.on('player-joined', () => {
      // Opponent joined our room — start the game
      if (waitingRoomId && socketRef.current) {
        onJoinedRoom(waitingRoomId, 'white', socketRef.current);
      }
    });

    socket.on('game-state', () => {
      // Game started after opponent joined
      if (waitingRoomId && socketRef.current) {
        onJoinedRoom(waitingRoomId, 'white', socketRef.current);
      }
    });

    return () => {
      if (status !== 'waiting') {
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
    socket.emit('create-room', { startingGold }, (res) => {
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

      <div className="lobby-section">
        <button className="lobby-button primary" onClick={onLocalGame}>
          Local Game (Pass &amp; Play)
        </button>
      </div>

      <div className="lobby-divider">or play online</div>

      <div className="lobby-section">
        <h2>Create Room</h2>
        <div className="lobby-create">
          <label>
            Starting Gold:
            <select
              value={startingGold}
              onChange={e => setStartingGold(Number(e.target.value))}
              className="starting-gold-select"
            >
              {STARTING_GOLD_OPTIONS.map(g => (
                <option key={g} value={g}>{g}🪙</option>
              ))}
            </select>
          </label>
          <button className="lobby-button primary" onClick={createRoom} disabled={status === 'connecting'}>
            {status === 'connecting' ? 'Creating...' : 'Create Room'}
          </button>
        </div>
      </div>

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
                <span className="room-gold">{room.startingGold}🪙</span>
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
