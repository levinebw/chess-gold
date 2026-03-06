import { useCallback, useMemo, useState } from 'react';
import type { GameState, GameAction, GameError, GameModeConfig, PurchasableRole, Square } from '../../engine/types.ts';
import { createInitialState, applyAction } from '../../engine/game.ts';
import { getLegalMoves } from '../../engine/position.ts';
import { getValidPlacementSquares } from '../../engine/placement.ts';
import { CHESS_GOLD_CONFIG } from '../../engine/config.ts';

export function useGame(modeConfig?: GameModeConfig) {
  const [startingGold, setStartingGold] = useState(CHESS_GOLD_CONFIG.startingGold);
  const [state, setState] = useState<GameState>(() => createInitialState(modeConfig, startingGold));
  const [stateHistory, setStateHistory] = useState<GameState[]>([]);
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
      setStateHistory(h => [...h, prev]);
      return result as GameState;
    });
    setPlacingPiece(null);
  }, []);

  const undo = useCallback(() => {
    setStateHistory(h => {
      if (h.length === 0) return h;
      const previous = h[h.length - 1];
      setState(previous);
      setError(null);
      setPlacingPiece(null);
      return h.slice(0, -1);
    });
  }, []);

  const canUndo = stateHistory.length > 0;

  const resetGame = useCallback(() => {
    setState(createInitialState(modeConfig, startingGold));
    setStateHistory([]);
    setError(null);
    setPlacingPiece(null);
  }, [modeConfig, startingGold]);

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
    undo,
    canUndo,
    legalDests,
    placingPiece,
    placementSquares,
    startPlacement,
    cancelPlacement,
    canAfford,
    config: CHESS_GOLD_CONFIG,
    startingGold,
    setStartingGold,
  };
}
