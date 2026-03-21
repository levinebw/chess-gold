import { useState, useEffect, useRef } from 'react';
import { useGameContext } from '../context/GameContext.tsx';
import { areHintsDismissed, dismissHints } from '../utils/onboarding.ts';

export function GameHints() {
  const { state } = useGameContext();
  const [hint, setHint] = useState<string | null>(null);
  const shownHints = useRef<Set<string>>(new Set());
  const dismissed = useRef(areHintsDismissed());

  useEffect(() => {
    if (dismissed.current) return;

    // Hint 1: First turn — explain gold earning
    if (state.turnNumber === 1 && !shownHints.current.has('gold')) {
      shownHints.current.add('gold');
      setHint('You earn +1 gold each turn. Use gold to buy pieces from the shop.');
      const t = setTimeout(() => setHint(null), 6000);
      return () => clearTimeout(t);
    }

    // Hint 2: When player has enough gold to buy a pawn (1g) — explain placement
    if (state.turnNumber === 2 && state.gold.white >= 1 && !shownHints.current.has('shop')) {
      shownHints.current.add('shop');
      setHint('Click a piece in the shop, then click a highlighted square to place it.');
      const t = setTimeout(() => setHint(null), 6000);
      return () => clearTimeout(t);
    }
  }, [state.turnNumber, state.gold.white]);

  if (!hint) return null;

  const handleDismiss = () => {
    setHint(null);
    dismissHints();
    dismissed.current = true;
  };

  return (
    <div className="game-hint">
      <span className="game-hint-text">{hint}</span>
      <button className="game-hint-dismiss" onClick={handleDismiss} title="Don't show hints">
        &times;
      </button>
    </div>
  );
}
