import { useEffect } from 'react';
import { useGame } from './useGame.ts';
import { chooseAction } from '../../engine/bot/bot.ts';
import type { BotPersona } from '../../engine/bot/types.ts';
import type { GameModeConfig } from '../../engine/types.ts';

function thinkingDelay(persona: BotPersona): number {
  const base = 600;
  const variance = 400;
  const personalityFactor = 1 - persona.aggression * 0.5;
  return base * personalityFactor + Math.random() * variance;
}

export function useBotGame(persona: BotPersona, modeConfig?: GameModeConfig) {
  const game = useGame(modeConfig);

  useEffect(() => {
    const isBotTurn =
      game.state.turn === 'black' &&
      (game.state.status === 'active' || game.state.status === 'check');

    if (!isBotTurn) return;

    const timer = setTimeout(() => {
      try {
        const action = chooseAction(game.state, persona);
        game.dispatch(action);
      } catch {
        // Bot has no available actions — game should be over
      }
    }, thinkingDelay(persona));

    return () => clearTimeout(timer);
  }, [game.state.turn, game.state.halfMoveCount]);

  // Bot undo: undo TWO half-moves (bot response + player move)
  const botUndo = () => {
    game.undo(); // undo bot's move
    game.undo(); // undo player's move
  };

  const isBotTurn =
    game.state.turn === 'black' &&
    (game.state.status === 'active' || game.state.status === 'check');

  return {
    ...game,
    undo: botUndo,
    canUndo: game.state.actionHistory.length >= 2 && !isBotTurn,
    isBotTurn,
    botPersona: persona,
    boardOrientation: 'white' as const,
    flipBoard: () => {}, // no flip in bot mode
  };
}
