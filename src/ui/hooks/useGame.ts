import { useCallback, useMemo, useState } from 'react';
import type { GameState, GameAction, GameError, GameModeConfig, PurchasableRole, Square } from '../../engine/types.ts';
import { createInitialState, applyAction } from '../../engine/game.ts';
import { getLegalMoves } from '../../engine/position.ts';
import { getValidPlacementSquares } from '../../engine/placement.ts';
import { CHESS_GOLD_CONFIG } from '../../engine/config.ts';

export function useGame(modeConfig?: GameModeConfig) {
  const [state, setState] = useState<GameState>(() => createInitialState(modeConfig));
  const [error, setError] = useState<GameError | null>(null);
  const [placingPiece, setPlacingPiece] = useState<PurchasableRole | null>(null);

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
    setPlacingPiece(null);
  }, []);

  const resetGame = useCallback(() => {
    setState(createInitialState(modeConfig));
    setError(null);
    setPlacingPiece(null);
  }, [modeConfig]);

  // Compute legal move destinations for Chessground
  const legalDests = useMemo(() => getLegalMoves(state), [state]);

  // Simulate +1 income to check affordability (income is awarded before action)
  const goldAfterIncome = useMemo(() => {
    return state.gold[state.turn] + CHESS_GOLD_CONFIG.goldPerTurn;
  }, [state]);

  // Check if a piece can be afforded (accounting for upcoming income)
  const canAfford = useCallback((piece: PurchasableRole): boolean => {
    return goldAfterIncome >= CHESS_GOLD_CONFIG.piecePrices[piece];
  }, [goldAfterIncome]);

  // Get valid placement squares for a piece
  const placementSquares = useMemo((): Square[] => {
    if (!placingPiece) return [];
    return getValidPlacementSquares(state, placingPiece);
  }, [state, placingPiece]);

  const startPlacement = useCallback((piece: PurchasableRole) => {
    setPlacingPiece(prev => prev === piece ? null : piece);
    setError(null);
  }, []);

  const cancelPlacement = useCallback(() => {
    setPlacingPiece(null);
  }, []);

  return {
    state,
    dispatch,
    error,
    resetGame,
    legalDests,
    placingPiece,
    placementSquares,
    startPlacement,
    cancelPlacement,
    canAfford,
    config: CHESS_GOLD_CONFIG,
  };
}
