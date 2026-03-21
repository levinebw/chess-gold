import { useGameContext } from '../context/GameContext.tsx';

export function TurnIndicator() {
  const ctx = useGameContext();
  const { state } = ctx;

  // Check if we're in a bot game
  const botPersona = 'botPersona' in ctx ? ctx.botPersona : undefined;
  const isBotTurn = 'isBotTurn' in ctx ? ctx.isBotTurn : false;

  let statusText: string;
  let isThinking = false;

  if (state.status === 'checkmate') {
    if (botPersona) {
      statusText = state.winner === 'white'
        ? 'Checkmate! You win!'
        : `Checkmate! ${botPersona.avatar} ${botPersona.name} wins!`;
    } else {
      statusText = `Checkmate! ${state.winner === 'white' ? 'White' : 'Black'} wins!`;
    }
  } else if (state.status === 'stalemate') {
    statusText = 'Stalemate — Draw';
  } else if (botPersona) {
    if (isBotTurn) {
      if (state.status === 'check') {
        statusText = `${botPersona.avatar} ${botPersona.name} is in check...`;
      } else {
        statusText = `${botPersona.avatar} ${botPersona.name} is thinking...`;
      }
      isThinking = true;
    } else {
      statusText = state.status === 'check' ? 'You are in check!' : 'Your turn';
    }
  } else if (state.status === 'check') {
    statusText = `${state.turn === 'white' ? 'White' : 'Black'} is in check`;
  } else {
    statusText = `${state.turn === 'white' ? 'White' : 'Black'} to move`;
  }

  return (
    <div className="turn-indicator" aria-live="polite" aria-atomic="true">
      <span className={`turn-status${isThinking ? ' bot-thinking' : ''}`}>{statusText}</span>
      <span className="turn-number">Turn {state.turnNumber}</span>
    </div>
  );
}
