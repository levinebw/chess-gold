import { useCallback, useState } from 'react';
import type { GameState, GameAction, GameError, GameModeConfig } from '../../engine/types.ts';
import { createInitialState, applyAction } from '../../engine/game.ts';

export function useGame(modeConfig?: GameModeConfig) {
  const [state, setState] = useState<GameState>(() => createInitialState(modeConfig));
  const [error, setError] = useState<GameError | null>(null);

  const dispatch = useCallback((action: GameAction) => {
    setState(prev => {
      const result = applyAction(prev, action);
      if ('type' in result && result.type === 'error') {
        setError(result as GameError);
        return prev;
      }
      setError(null);
      return result as GameState;
    });
  }, []);

  const resetGame = useCallback(() => {
    setState(createInitialState(modeConfig));
    setError(null);
  }, [modeConfig]);

  return { state, dispatch, error, resetGame };
}
