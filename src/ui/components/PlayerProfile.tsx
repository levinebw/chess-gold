import { useState, useEffect } from 'react';
import type { Socket } from 'socket.io-client';
import type { ClientEvents, ServerEvents, ProfileResponse, MatchSummary } from '../../server/protocol.ts';

type TypedSocket = Socket<ServerEvents, ClientEvents>;

interface Props {
  playerId: string;
  socket: TypedSocket;
  currentPlayerId?: string;
  onBack: () => void;
  onViewProfile: (playerId: string) => void;
}

export function PlayerProfile({ playerId, socket, currentPlayerId, onBack, onViewProfile }: Props) {
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    socket.emit('get-profile', playerId, (res) => {
      setLoading(false);
      if (res.error) {
        setError(res.error);
      } else {
        setProfile(res);
      }
    });
  }, [playerId, socket]);

  if (loading) {
    return (
      <div className="profile-page">
        <button className="lobby-button secondary" onClick={onBack}>Back</button>
        <p className="profile-loading">Loading profile...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="profile-page">
        <button className="lobby-button secondary" onClick={onBack}>Back</button>
        <p className="profile-error">{error || 'Player not found'}</p>
      </div>
    );
  }

  const winRate = profile.gamesPlayed! > 0
    ? Math.round((profile.wins! / profile.gamesPlayed!) * 100)
    : 0;

  const isMe = currentPlayerId === playerId;

  return (
    <div className="profile-page">
      <button className="lobby-button secondary" onClick={onBack}>Back</button>
      <h2 className="profile-name">{profile.displayName}{isMe && ' (You)'}</h2>
      <div className="profile-stats">
        <div className="profile-stat">
          <span className="stat-value">{profile.rating}</span>
          <span className="stat-label">Rating</span>
        </div>
        <div className="profile-stat">
          <span className="stat-value">{profile.gamesPlayed}</span>
          <span className="stat-label">Games</span>
        </div>
        <div className="profile-stat">
          <span className="stat-value">{profile.wins}</span>
          <span className="stat-label">Wins</span>
        </div>
        <div className="profile-stat">
          <span className="stat-value">{profile.losses}</span>
          <span className="stat-label">Losses</span>
        </div>
        <div className="profile-stat">
          <span className="stat-value">{profile.draws}</span>
          <span className="stat-label">Draws</span>
        </div>
        <div className="profile-stat">
          <span className="stat-value">{winRate}%</span>
          <span className="stat-label">Win Rate</span>
        </div>
      </div>

      {profile.recentMatches && profile.recentMatches.length > 0 && (
        <div className="profile-matches">
          <h3>Recent Matches</h3>
          <div className="matches-table">
            {profile.recentMatches.map((m: MatchSummary, i: number) => (
              <div key={i} className="match-row">
                <span className={`match-result ${m.result}`}>
                  {m.result === 'win' ? 'W' : m.result === 'loss' ? 'L' : 'D'}
                </span>
                <button className="match-opponent lobby-name-link" onClick={() => onViewProfile(m.opponentId)}>{m.opponent} ({m.opponentRating})</button>
                <span className={`match-rating-change ${m.ratingChange >= 0 ? 'positive' : 'negative'}`}>
                  {m.ratingChange >= 0 ? '+' : ''}{m.ratingChange}
                </span>
                <span className="match-mode">{m.mode}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
