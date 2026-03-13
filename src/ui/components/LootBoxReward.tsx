import { useEffect } from 'react';
import { useGameContext } from '../context/GameContext.tsx';
import type { LootBoxRewardInfo } from '../hooks/useGame.ts';

const PIECE_NAMES: Record<string, string> = {
  pawn: 'Pawn',
  knight: 'Knight',
  bishop: 'Bishop',
  rook: 'Rook',
  queen: 'Queen',
};

const ITEM_NAMES: Record<string, string> = {
  crossbow: 'Crossbow \uD83C\uDFF9',
  'turtle-shell': 'Turtle Shell \uD83D\uDEE1\uFE0F',
  crown: 'Crown \uD83D\uDC51',
};

function rewardText(reward: LootBoxRewardInfo['reward']): string {
  switch (reward.type) {
    case 'gold':
      return `${reward.amount} Gold`;
    case 'piece':
      return PIECE_NAMES[reward.piece] || reward.piece;
    case 'item':
      return ITEM_NAMES[reward.item] || reward.item;
  }
}

export function LootBoxReward() {
  const ctx = useGameContext();
  const lastReward = 'lastReward' in ctx ? ctx.lastReward as LootBoxRewardInfo | null : null;
  const dismissReward = 'dismissReward' in ctx ? ctx.dismissReward as () => void : undefined;

  // Auto-dismiss after 3 seconds
  useEffect(() => {
    if (!lastReward) return;
    const timer = setTimeout(() => {
      dismissReward?.();
    }, 3000);
    return () => clearTimeout(timer);
  }, [lastReward, dismissReward]);

  if (!lastReward) return null;

  const colorLabel = lastReward.player === 'white' ? 'White' : 'Black';

  return (
    <div className="loot-reward-toast" onClick={dismissReward}>
      <div className="loot-reward-icon">{'\uD83C\uDF81'}</div>
      <div className="loot-reward-text">
        <div className="loot-reward-title">{colorLabel} opened a loot box!</div>
        <div className="loot-reward-content">Got: {rewardText(lastReward.reward)}</div>
      </div>
    </div>
  );
}
