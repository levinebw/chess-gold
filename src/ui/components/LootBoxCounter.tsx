import { useGameContext } from '../context/GameContext.tsx';
import { CHESS_GOLD_CONFIG } from '../../engine/config.ts';

export function LootBoxCounter() {
  const { state } = useGameContext();

  if (!state.modeConfig.winConditions.includes('loot-boxes-collected')) return null;

  const target = CHESS_GOLD_CONFIG.lootBox.boxesToWin;

  return (
    <div className="loot-counter">
      <span className="loot-counter-label">Loot Boxes</span>
      <span className="loot-counter-scores">
        <span className="loot-counter-white">
          W {state.lootBoxesCollected.white}/{target}
        </span>
        <span className="loot-counter-sep">{'\u2014'}</span>
        <span className="loot-counter-black">
          B {state.lootBoxesCollected.black}/{target}
        </span>
      </span>
    </div>
  );
}
