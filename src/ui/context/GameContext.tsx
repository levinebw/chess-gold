import { createContext, useContext } from 'react';
import type { GameModeConfig } from '../../engine/types.ts';
import { useGame } from '../hooks/useGame.ts';

type GameContextValue = ReturnType<typeof useGame>;

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children, modeConfig }: { children: React.ReactNode; modeConfig?: GameModeConfig }) {
  const game = useGame(modeConfig);
  return <GameContext.Provider value={game}>{children}</GameContext.Provider>;
}

export function useGameContext(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGameContext must be used within GameProvider');
  return ctx;
}
