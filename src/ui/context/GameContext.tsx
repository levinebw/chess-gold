import { createContext, useContext } from 'react';
import type { GameModeConfig } from '../../engine/types.ts';
import { useGame } from '../hooks/useGame.ts';
import type { useOnlineGame } from '../hooks/useOnlineGame.ts';

// The context value is the union of local and online game hooks
// Online hook returns a superset of the local hook's shape
type GameContextValue = ReturnType<typeof useGame> | ReturnType<typeof useOnlineGame>;

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children, modeConfig }: { children: React.ReactNode; modeConfig?: GameModeConfig }) {
  const game = useGame(modeConfig);
  return <GameContext.Provider value={game}>{children}</GameContext.Provider>;
}

export function OnlineGameProvider({ children, value }: { children: React.ReactNode; value: GameContextValue }) {
  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGameContext(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGameContext must be used within GameProvider');
  return ctx;
}
