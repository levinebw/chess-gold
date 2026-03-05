import type { GameAction, Square } from '../../engine/types.ts';
import { useGameContext } from '../context/GameContext.tsx';

const FILES = 'abcdefgh';

function squareName(sq: Square): string {
  return `${FILES[sq % 8]}${Math.floor(sq / 8) + 1}`;
}

function formatAction(action: GameAction, index: number): string {
  const moveNum = Math.floor(index / 2) + 1;
  const side = index % 2 === 0 ? '' : '...';

  if (action.type === 'move') {
    return `${moveNum}.${side} ${squareName(action.from)}-${squareName(action.to)}`;
  }
  if (action.type === 'place') {
    const pieceName = action.piece.charAt(0).toUpperCase() + action.piece.slice(1);
    return `${moveNum}.${side} +${pieceName} ${squareName(action.square)}`;
  }
  return `${moveNum}.${side} ?`;
}

export function ActionHistory() {
  const { state } = useGameContext();

  if (state.actionHistory.length === 0) {
    return (
      <div className="action-history">
        <h3>Moves</h3>
        <div className="history-empty">No moves yet</div>
      </div>
    );
  }

  return (
    <div className="action-history">
      <h3>Moves</h3>
      <div className="history-list">
        {state.actionHistory.map((action, i) => (
          <span key={i} className="history-entry">
            {formatAction(action, i)}
          </span>
        ))}
      </div>
    </div>
  );
}
