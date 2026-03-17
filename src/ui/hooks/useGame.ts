import { useCallback, useMemo, useState } from 'react';
import type { GameState, GameAction, GameError, GameModeConfig, PurchasableRole, Square, ItemType } from '../../engine/types.ts';
import { createInitialState, applyAction } from '../../engine/game.ts';
import { getLegalMoves } from '../../engine/position.ts';
import { getValidPlacementSquares } from '../../engine/placement.ts';
import { validateHit } from '../../engine/lootbox.ts';
import { CHESS_GOLD_CONFIG } from '../../engine/config.ts';
import { parseFen } from 'chessops/fen';

export function useGame(modeConfig?: GameModeConfig) {
  const [startingGold, setStartingGold] = useState(CHESS_GOLD_CONFIG.startingGold);
  const [state, setState] = useState<GameState>(() => createInitialState(modeConfig, startingGold));
  const [stateHistory, setStateHistory] = useState<GameState[]>([]);
  const [error, setError] = useState<GameError | null>(null);
  const [placingPiece, setPlacingPiece] = useState<PurchasableRole | null>(null);
  const [placingFromInventory, setPlacingFromInventory] = useState(false);
  const [equippingItem, setEquippingItem] = useState<ItemType | null>(null);
  const [hittingPieceSquare, setHittingPieceSquare] = useState<Square | null>(null);
  const [selectingHitPiece, setSelectingHitPiece] = useState(false);
  const [rewardDismissed, setRewardDismissed] = useState(false);
  const [boardOrientation, setBoardOrientation] = useState<'white' | 'black'>('white');

  const dispatch = useCallback((action: GameAction) => {
    setState(prev => {
      const result = applyAction(prev, action);
      if ('type' in result && result.type === 'error') {
        setError(result as GameError);
        return prev;
      }
      setError(null);
      setStateHistory(h => [...h, prev]);

      const newState = result as GameState;

      // Show reward modal when a loot box is opened
      if (newState.lastLootBoxReward) {
        setRewardDismissed(false);
      }

      return newState;
    });
    setPlacingPiece(null);
    setPlacingFromInventory(false);
    setEquippingItem(null);
    setHittingPieceSquare(null);
    setSelectingHitPiece(false);
  }, []);

  const undo = useCallback(() => {
    setStateHistory(h => {
      if (h.length === 0) return h;
      const previous = h[h.length - 1];
      setState(previous);
      setError(null);
      setPlacingPiece(null);
      setPlacingFromInventory(false);
      setEquippingItem(null);
      setHittingPieceSquare(null);
      setSelectingHitPiece(false);
      return h.slice(0, -1);
    });
  }, []);

  const canUndo = stateHistory.length > 0;

  const resetGame = useCallback(() => {
    setState(createInitialState(modeConfig, startingGold));
    setStateHistory([]);
    setError(null);
    setPlacingPiece(null);
    setPlacingFromInventory(false);
    setEquippingItem(null);
    setHittingPieceSquare(null);
    setSelectingHitPiece(false);
    setRewardDismissed(false);
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
    setPlacingFromInventory(false);
    setEquippingItem(null);
    setHittingPieceSquare(null);
    setError(null);
  }, []);

  const startInventoryPlacement = useCallback((piece: PurchasableRole) => {
    setPlacingPiece(prev => {
      if (prev === piece && placingFromInventory) return null;
      return piece;
    });
    setPlacingFromInventory(true);
    setEquippingItem(null);
    setHittingPieceSquare(null);
    setError(null);
  }, [placingFromInventory]);

  const startEquip = useCallback((item: ItemType) => {
    setEquippingItem(prev => prev === item ? null : item);
    setPlacingPiece(null);
    setPlacingFromInventory(false);
    setHittingPieceSquare(null);
    setError(null);
  }, []);

  const cancelPlacement = useCallback(() => {
    setPlacingPiece(null);
    setPlacingFromInventory(false);
    setEquippingItem(null);
    setHittingPieceSquare(null);
    setSelectingHitPiece(false);
  }, []);

  const dismissReward = useCallback(() => {
    setRewardDismissed(true);
  }, []);

  // Get valid equip target squares (friendly non-king pieces without existing equipment)
  const equipTargets = useMemo((): Square[] => {
    if (!equippingItem) return [];
    const setup = parseFen(state.fen);
    if (setup.isErr) return [];
    const board = setup.value.board;
    const targets: Square[] = [];
    const FILES = 'abcdefgh';

    const pieces = state.turn === 'white' ? board.white : board.black;
    for (const sq of pieces) {
      const piece = board.get(sq);
      if (!piece || piece.role === 'king') continue;
      if (equippingItem === 'crown' && piece.role === 'queen') continue;
      const sqName = `${FILES[sq % 8]}${Math.floor(sq / 8) + 1}` as import('../../engine/types.ts').SquareName;
      if (state.equipment[sqName]) continue;
      // Check gold affordability (income is already accounted for in gold display)
      const cost = CHESS_GOLD_CONFIG.lootBox.equipCosts[equippingItem];
      if (state.gold[state.turn] + CHESS_GOLD_CONFIG.goldPerTurn < cost) continue;
      targets.push(sq as Square);
    }
    return targets;
  }, [state, equippingItem]);

  // Get loot box squares that can be hit by current player's adjacent pieces
  const hittableLootBoxes = useMemo((): { lootBoxSquare: Square; pieceSquares: Square[] }[] => {
    if (!state.modeConfig.lootBoxes) return [];
    if (state.lootBoxes.length === 0) return [];

    return state.lootBoxes.map(box => {
      const adjacentPieces: Square[] = [];
      const bFile = box.square % 8;
      const bRank = Math.floor(box.square / 8);
      for (let df = -1; df <= 1; df++) {
        for (let dr = -1; dr <= 1; dr++) {
          if (df === 0 && dr === 0) continue;
          const nf = bFile + df;
          const nr = bRank + dr;
          if (nf < 0 || nf > 7 || nr < 0 || nr > 7) continue;
          const sq = (nr * 8 + nf) as Square;
          if (validateHit(state, sq, box.square) === null) {
            adjacentPieces.push(sq);
          }
        }
      }
      return { lootBoxSquare: box.square, pieceSquares: adjacentPieces };
    }).filter(h => h.pieceSquares.length > 0);
  }, [state]);

  // Enter hit selection mode (show hittable pieces)
  const startHitSelection = useCallback(() => {
    setSelectingHitPiece(true);
    setHittingPieceSquare(null);
    setPlacingPiece(null);
    setPlacingFromInventory(false);
    setEquippingItem(null);
    setError(null);
  }, []);

  // Select a specific piece to hit with
  const startHit = useCallback((pieceSquare: Square) => {
    setHittingPieceSquare(prev => prev === pieceSquare ? null : pieceSquare);
    setSelectingHitPiece(false);
    setPlacingPiece(null);
    setPlacingFromInventory(false);
    setEquippingItem(null);
    setError(null);
  }, []);

  // Get loot box squares hittable by the selected piece
  const hitTargets = useMemo((): Square[] => {
    if (hittingPieceSquare === null) return [];
    return state.lootBoxes
      .filter(box => validateHit(state, hittingPieceSquare, box.square) === null)
      .map(box => box.square);
  }, [state, hittingPieceSquare]);

  return {
    state,
    dispatch,
    error,
    resetGame,
    undo,
    canUndo,
    legalDests,
    placingPiece,
    placingFromInventory,
    placementSquares,
    startPlacement,
    startInventoryPlacement,
    cancelPlacement,
    canAfford,
    config: CHESS_GOLD_CONFIG,
    startingGold,
    setStartingGold,
    boardOrientation,
    flipBoard: useCallback(() => setBoardOrientation(o => o === 'white' ? 'black' : 'white'), []),
    // Loot box hit
    hittableLootBoxes,
    selectingHitPiece,
    hittingPieceSquare,
    hitTargets,
    startHitSelection,
    startHit,
    // Equip
    equippingItem,
    equipTargets,
    startEquip,
    // Reward
    lastReward: rewardDismissed ? null : state.lastLootBoxReward,
    dismissReward,
  };
}
