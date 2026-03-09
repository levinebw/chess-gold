import { createContext, useContext } from 'react';
import type { GameModeConfig } from '../../engine/types.ts';
import type { BotPersona } from '../../engine/bot/types.ts';
import { useGame } from '../hooks/useGame.ts';
import { useBotGame } from '../hooks/useBotGame.ts';
import type { useOnlineGame } from '../hooks/useOnlineGame.ts';

// The context value is the union of local, bot, and online game hooks
type GameContextValue =
  | ReturnType<typeof useGame>
  | ReturnType<typeof useBotGame>
  | ReturnType<typeof useOnlineGame>;

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children, modeConfig }: { children: React.ReactNode; modeConfig?: GameModeConfig }) {
  const game = useGame(modeConfig);
  return <GameContext.Provider value={game}>{children}</GameContext.Provider>;
}

export function BotGameProvider({ children, persona, modeConfig }: { children: React.ReactNode; persona: BotPersona; modeConfig?: GameModeConfig }) {
  const game = useBotGame(persona, modeConfig);
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
