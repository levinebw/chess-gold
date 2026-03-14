import { useEffect } from 'react';
import { useGameContext } from '../context/GameContext.tsx';
import type { LootBoxReward as LootBoxRewardType } from '../../engine/types.ts';

const PIECE_NAMES: Record<string, string> = {
  pawn: 'Pawn',
  knight: 'Knight',
  bishop: 'Bishop',
  rook: 'Rook',
  queen: 'Queen',
};

const ITEM_INFO: Record<string, { name: string; desc: string }> = {
  crossbow: {
    name: 'Crossbow \uD83C\uDFF9',
    desc: 'Equip to a piece. Capture an adjacent enemy without moving.',
  },
  'turtle-shell': {
    name: 'Turtle Shell \uD83D\uDEE1\uFE0F',
    desc: 'Equip to a piece. Absorbs one capture — attacker bounces back.',
  },
  crown: {
    name: 'Crown \uD83D\uDC51',
    desc: 'Equip to a piece. Instantly promotes it to a Queen. Consumed on use.',
  },
};

function rewardContent(reward: LootBoxRewardType['reward']): { title: string; desc: string | null } {
  switch (reward.type) {
    case 'gold':
      return { title: `${reward.amount} Gold`, desc: null };
    case 'piece':
      return { title: PIECE_NAMES[reward.piece] || reward.piece, desc: 'Place it on the board this turn!' };
    case 'item': {
      const info = ITEM_INFO[reward.item];
      return info
        ? { title: info.name, desc: info.desc }
        : { title: reward.item, desc: null };
    }
  }
}

export function LootBoxReward() {
  const ctx = useGameContext();
  const lastReward = 'lastReward' in ctx ? ctx.lastReward as LootBoxRewardType | null : null;
  const dismissReward = 'dismissReward' in ctx ? ctx.dismissReward as () => void : undefined;

  // Auto-dismiss after 4 seconds (longer to read descriptions)
  useEffect(() => {
    if (!lastReward) return;
    const timer = setTimeout(() => {
      dismissReward?.();
    }, 4000);
    return () => clearTimeout(timer);
  }, [lastReward, dismissReward]);

  if (!lastReward) return null;

  const colorLabel = lastReward.player === 'white' ? 'White' : 'Black';
  const { title, desc } = rewardContent(lastReward.reward);

  return (
    <div className="loot-reward-toast" onClick={dismissReward}>
      <div className="loot-reward-icon">{'\uD83C\uDF81'}</div>
      <div className="loot-reward-text">
        <div className="loot-reward-title">{colorLabel} opened a loot box!</div>
        <div className="loot-reward-content">Got: {title}</div>
        {desc && <div className="loot-reward-desc">{desc}</div>}
      </div>
    </div>
  );
}
