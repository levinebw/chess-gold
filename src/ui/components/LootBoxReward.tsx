import { useEffect } from 'react';
import { useGameContext } from '../context/GameContext.tsx';
import { playSound } from '../utils/sounds.ts';
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
      return { title: PIECE_NAMES[reward.piece] || reward.piece, desc: 'Added to your inventory.' };
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

  // Play sound and auto-dismiss after 4 seconds
  useEffect(() => {
    if (!lastReward) return;
    playSound('lootBoxOpen');
    const timer = setTimeout(() => {
      dismissReward?.();
    }, 4000);
    return () => clearTimeout(timer);
  }, [lastReward, dismissReward]);

  if (!lastReward) return null;

  const colorLabel = lastReward.player === 'white' ? 'White' : 'Black';
  const { title, desc } = rewardContent(lastReward.reward);

  return (
    <div className="loot-reward-toast">
      <div className="loot-reward-icon">{'\uD83C\uDF81'}</div>
      <div className="loot-reward-text">
        <div className="loot-reward-title">{colorLabel} opened a loot box!</div>
        <div className="loot-reward-content">Got: {title}</div>
        {desc && <div className="loot-reward-desc">{desc}</div>}
      </div>
      <button className="loot-reward-dismiss" onClick={dismissReward} aria-label="Dismiss">
        &times;
      </button>
    </div>
  );
}
