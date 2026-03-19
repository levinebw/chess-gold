import { useState } from 'react';
import { useGameContext } from '../context/GameContext.tsx';
import type { PlayerInfo } from '../../server/protocol.ts';

interface Props {
  onLeave: () => void;
}

export function OnlineStatusBar({ onLeave }: Props) {
  const ctx = useGameContext();
  const [showResignConfirm, setShowResignConfirm] = useState(false);

  // These fields only exist on the online game context
  const onlineCtx = ctx as typeof ctx & {
    myColor?: string;
    onlineStatus?: string;
    rematchRequested?: boolean;
    opponentWantsRematch?: boolean;
    requestRematch?: () => void;
    roomId?: string;
    whiteInfo?: PlayerInfo | null;
    blackInfo?: PlayerInfo | null;
  };

  if (!onlineCtx.roomId) return null;

  const { myColor, onlineStatus, roomId, whiteInfo, blackInfo, state, dispatch } = onlineCtx;

  const myInfo = myColor === 'white' ? whiteInfo : blackInfo;
  const opponentInfo = myColor === 'white' ? blackInfo : whiteInfo;
  const myLabel = myInfo ? `${myInfo.displayName} (${myInfo.rating})` : null;
  const opLabel = opponentInfo ? `${opponentInfo.displayName} (${opponentInfo.rating})` : null;

  // Build the "You (Alice 1200) vs Bob (1150)" string
  const playerLabel = myLabel
    ? (opLabel ? `You (${myLabel}) vs ${opLabel}` : `You (${myLabel})`)
    : `You are ${myColor}`;

  const gameActive = state.status === 'active' || state.status === 'check';

  const handleResign = () => {
    dispatch({ type: 'resign' });
    setShowResignConfirm(false);
  };

  return (
    <div className="online-status-bar">
      <span className="online-room-info">
        Room: <strong>{roomId}</strong> · {playerLabel}
      </span>
      {onlineStatus === 'opponent-disconnected' && (
        <span className="online-warning">Opponent disconnected — waiting for reconnect...</span>
      )}
      {onlineStatus === 'room-closed' && (
        <span className="online-warning">Room closed — opponent left</span>
      )}
      {onlineStatus === 'error' && (
        <span className="online-warning">Connection lost — reconnecting...</span>
      )}
      {gameActive && !showResignConfirm && (
        <button className="lobby-button secondary small" onClick={() => setShowResignConfirm(true)}>Resign</button>
      )}
      {showResignConfirm && (
        <span className="resign-confirm">
          <span>Resign?</span>
          <button className="lobby-button secondary small resign-yes" onClick={handleResign}>Yes</button>
          <button className="lobby-button secondary small" onClick={() => setShowResignConfirm(false)}>No</button>
        </span>
      )}
      {!gameActive && (
        <button className="lobby-button secondary small" onClick={onLeave}>Leave</button>
      )}
    </div>
  );
}
