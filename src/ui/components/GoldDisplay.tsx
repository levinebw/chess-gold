import { useGameContext } from '../context/GameContext.tsx';

export function GoldDisplay() {
  const { state } = useGameContext();

  return (
    <div className="gold-display">
      <div className={`gold-player ${state.turn === 'white' ? 'active' : ''}`}>
        <span className="gold-label">White</span>
        <span className="gold-amount">{state.gold.white}g</span>
      </div>
      <div className={`gold-player ${state.turn === 'black' ? 'active' : ''}`}>
        <span className="gold-label">Black</span>
        <span className="gold-amount">{state.gold.black}g</span>
      </div>
    </div>
  );
}
