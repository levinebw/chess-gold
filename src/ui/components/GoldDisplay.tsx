import { useEffect, useRef, useState } from 'react';
import { useGameContext } from '../context/GameContext.tsx';
import { GoldCoin } from './GoldCoin.tsx';

function FloatingDelta({ delta }: { delta: number }) {
  if (delta === 0) return null;
  const sign = delta > 0 ? '+' : '';
  const className = delta > 0 ? 'gold-float gold-float-positive' : 'gold-float gold-float-negative';
  return <span className={className}>{sign}{delta}</span>;
}

export function GoldDisplay() {
  const { state } = useGameContext();
  const prevGold = useRef(state.gold);
  const [whiteChanged, setWhiteChanged] = useState(false);
  const [blackChanged, setBlackChanged] = useState(false);
  const [whiteDelta, setWhiteDelta] = useState(0);
  const [blackDelta, setBlackDelta] = useState(0);

  useEffect(() => {
    if (state.gold.white !== prevGold.current.white) {
      const delta = state.gold.white - prevGold.current.white;
      setWhiteChanged(true);
      setWhiteDelta(delta);
      const t = setTimeout(() => { setWhiteChanged(false); setWhiteDelta(0); }, 800);
      prevGold.current = { ...prevGold.current, white: state.gold.white };
      return () => clearTimeout(t);
    }
  }, [state.gold.white]);

  useEffect(() => {
    if (state.gold.black !== prevGold.current.black) {
      const delta = state.gold.black - prevGold.current.black;
      setBlackChanged(true);
      setBlackDelta(delta);
      const t = setTimeout(() => { setBlackChanged(false); setBlackDelta(0); }, 800);
      prevGold.current = { ...prevGold.current, black: state.gold.black };
      return () => clearTimeout(t);
    }
  }, [state.gold.black]);

  return (
    <div className="gold-display">
      <div className={`gold-player ${state.turn === 'white' ? 'active' : ''}`}>
        <span className="gold-label">White</span>
        <span className={`gold-amount ${whiteChanged ? 'gold-changed' : ''}`}>
          {state.gold.white}<GoldCoin size={18}/>
          <FloatingDelta delta={whiteDelta} />
        </span>
      </div>
      <div className={`gold-player ${state.turn === 'black' ? 'active' : ''}`}>
        <span className="gold-label">Black</span>
        <span className={`gold-amount ${blackChanged ? 'gold-changed' : ''}`}>
          {state.gold.black}<GoldCoin size={18}/>
          <FloatingDelta delta={blackDelta} />
        </span>
      </div>
    </div>
  );
}
