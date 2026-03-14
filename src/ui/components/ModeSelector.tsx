import { MODE_PRESETS } from '../../engine/config.ts';
import type { GameModeConfig } from '../../engine/types.ts';

interface Props {
  onSelectMode: (modeKey: string, config: GameModeConfig) => void;
}

import { TreasureChestIcon } from './TreasureChestIcon.tsx';

const MODES = [
  {
    key: 'chess-gold',
    description: 'Start with a king and gold. Buy pieces from the shop.',
    icon: '♛' as React.ReactNode,
  },
  {
    key: 'loot-boxes',
    description: 'Collect loot boxes for gold, pieces, and equipment. First to 6 wins!',
    icon: <TreasureChestIcon /> as React.ReactNode,
  },
  {
    key: 'standard',
    description: 'Classic chess with standard starting positions.',
    icon: '♔' as React.ReactNode,
  },
  {
    key: 'conqueror',
    description: 'Captured pieces switch sides. Convert all pieces to win.',
    icon: '⚔' as React.ReactNode,
  },
];

export function ModeSelector({ onSelectMode }: Props) {
  return (
    <div className="mode-selector">
      <h1 className="mode-selector-title">Chess Gold</h1>
      <p className="mode-selector-subtitle">Choose a game mode</p>
      <div className="mode-cards">
        {MODES.map(({ key, description, icon }) => {
          const config = MODE_PRESETS[key];
          return (
            <button
              key={key}
              className="mode-card"
              onClick={() => onSelectMode(key, config)}
            >
              <span className="mode-card-icon">{icon}</span>
              <span className="mode-card-name">{config.name}</span>
              <span className="mode-card-desc">{description}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
