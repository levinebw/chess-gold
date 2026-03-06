import { useEffect, useRef, useState } from 'react';
import { useGameContext } from '../context/GameContext.tsx';

export function GoldDisplay() {
  const { state } = useGameContext();
  const prevGold = useRef(state.gold);
  const [whiteChanged, setWhiteChanged] = useState(false);
  const [blackChanged, setBlackChanged] = useState(false);

  useEffect(() => {
    if (state.gold.white !== prevGold.current.white) {
      setWhiteChanged(true);
      const t = setTimeout(() => setWhiteChanged(false), 300);
      prevGold.current = { ...prevGold.current, white: state.gold.white };
      return () => clearTimeout(t);
    }
  }, [state.gold.white]);

  useEffect(() => {
    if (state.gold.black !== prevGold.current.black) {
      setBlackChanged(true);
      const t = setTimeout(() => setBlackChanged(false), 300);
      prevGold.current = { ...prevGold.current, black: state.gold.black };
      return () => clearTimeout(t);
    }
  }, [state.gold.black]);

  return (
    <div className="gold-display">
      <div className={`gold-player ${state.turn === 'white' ? 'active' : ''}`}>
        <span className="gold-label">White</span>
        <span className={`gold-amount ${whiteChanged ? 'gold-changed' : ''}`}>{state.gold.white}🪙</span>
      </div>
      <div className={`gold-player ${state.turn === 'black' ? 'active' : ''}`}>
        <span className="gold-label">Black</span>
        <span className={`gold-amount ${blackChanged ? 'gold-changed' : ''}`}>{state.gold.black}🪙</span>
      </div>
    </div>
  );
}
