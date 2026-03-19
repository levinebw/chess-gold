import { useState, useEffect } from 'react';
import type { Socket } from 'socket.io-client';
import type { ClientEvents, ServerEvents, LeaderboardEntry } from '../../server/protocol.ts';

type TypedSocket = Socket<ServerEvents, ClientEvents>;

interface Props {
  socket: TypedSocket;
  currentPlayerId?: string;
  onBack: () => void;
  onViewProfile: (playerId: string) => void;
}

export function Leaderboard({ socket, currentPlayerId, onBack, onViewProfile }: Props) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    socket.emit('get-leaderboard', (res) => {
      setLoading(false);
      setEntries(res);
    });
  }, [socket]);

  if (loading) {
    return (
      <div className="leaderboard-page">
        <button className="lobby-button secondary" onClick={onBack}>Back</button>
        <p className="leaderboard-loading">Loading leaderboard...</p>
      </div>
    );
  }

  return (
    <div className="leaderboard-page">
      <button className="lobby-button secondary" onClick={onBack}>Back</button>
      <h2>Leaderboard</h2>
      {entries.length === 0 ? (
        <p className="leaderboard-empty">No ranked players yet.</p>
      ) : (
        <div className="leaderboard-table">
          <div className="leaderboard-header">
            <span className="lb-rank">#</span>
            <span className="lb-name">Player</span>
            <span className="lb-rating">Rating</span>
            <span className="lb-games">Games</span>
            <span className="lb-wins">Wins</span>
          </div>
          {entries.map((e) => (
            <button
              key={e.playerId}
              className={`leaderboard-row${e.playerId === currentPlayerId ? ' current-player' : ''}`}
              onClick={() => onViewProfile(e.playerId)}
            >
              <span className="lb-rank">{e.rank}</span>
              <span className="lb-name">{e.displayName}</span>
              <span className="lb-rating">{e.rating}</span>
              <span className="lb-games">{e.gamesPlayed}</span>
              <span className="lb-wins">{e.wins}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
