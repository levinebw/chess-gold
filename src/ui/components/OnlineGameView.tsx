import { useGameContext } from '../context/GameContext.tsx';

interface Props {
  onLeave: () => void;
}

export function OnlineStatusBar({ onLeave }: Props) {
  const ctx = useGameContext();

  // These fields only exist on the online game context
  const onlineCtx = ctx as typeof ctx & {
    myColor?: string;
    onlineStatus?: string;
    rematchRequested?: boolean;
    opponentWantsRematch?: boolean;
    requestRematch?: () => void;
    roomId?: string;
  };

  if (!onlineCtx.roomId) return null;

  const { myColor, onlineStatus, roomId } = onlineCtx;

  return (
    <div className="online-status-bar">
      <span className="online-room-info">
        Room: <strong>{roomId}</strong> · You are <strong>{myColor}</strong>
      </span>
      {onlineStatus === 'opponent-disconnected' && (
        <span className="online-warning">Opponent disconnected — waiting for reconnect...</span>
      )}
      {onlineStatus === 'room-closed' && (
        <span className="online-warning">Room closed — opponent left</span>
      )}
      <button className="lobby-button secondary small" onClick={onLeave}>Leave</button>
    </div>
  );
}
