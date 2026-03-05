import { useGameContext } from '../context/GameContext.tsx';

export function TurnIndicator() {
  const { state } = useGameContext();

  let statusText: string;
  if (state.status === 'checkmate') {
    statusText = `Checkmate! ${state.winner === 'white' ? 'White' : 'Black'} wins!`;
  } else if (state.status === 'stalemate') {
    statusText = 'Stalemate — Draw';
  } else if (state.status === 'check') {
    statusText = `${state.turn === 'white' ? 'White' : 'Black'} is in check`;
  } else {
    statusText = `${state.turn === 'white' ? 'White' : 'Black'} to move`;
  }

  return (
    <div className="turn-indicator">
      <span className="turn-status">{statusText}</span>
      <span className="turn-number">Turn {state.turnNumber}</span>
    </div>
  );
}
