import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';
import type { GameState, GameAction, GameError, PurchasableRole, Square, Color, ItemType } from '../../engine/types.ts';
import { createInitialState } from '../../engine/game.ts';
import { getLegalMoves } from '../../engine/position.ts';
import { getValidPlacementSquares } from '../../engine/placement.ts';
import { validateHit } from '../../engine/lootbox.ts';
import { CHESS_GOLD_CONFIG } from '../../engine/config.ts';
import { parseFen } from 'chessops/fen';
import type { ClientEvents, ServerEvents, AuthResponse } from '../../server/protocol.ts';

type TypedSocket = Socket<ServerEvents, ClientEvents>;

// Module-level session store shared with Lobby.tsx
// These are re-exported so Lobby can set them and useOnlineGame can read them
// We import from Lobby indirectly — but since both files are in the same bundle
// and we use module-level variables, we need a shared store.
// For simplicity, we duplicate the refs here and sync via a getter/setter pattern.
// In practice, Lobby.tsx sets these before handing off to useOnlineGame.
let _sessionId: string | null = null;
let _sessionToken: string | null = null;

export function setSessionCredentials(sessionId: string, token: string): void {
  _sessionId = sessionId;
  _sessionToken = token;
}

export function getSessionCredentials(): { sessionId: string | null; token: string | null } {
  return { sessionId: _sessionId, token: _sessionToken };
}

export type OnlineStatus =
  | 'connecting'
  | 'waiting'
  | 'playing'
  | 'opponent-disconnected'
  | 'room-closed'
  | 'error';

export function useOnlineGame(roomId: string, myColor: Color, existingSocket: TypedSocket, initialState?: GameState) {
  const socketRef = useRef<TypedSocket>(existingSocket);
  const [state, setState] = useState<GameState>(() => initialState ?? createInitialState());
  const [error, setError] = useState<GameError | null>(null);
  const [placingPiece, setPlacingPiece] = useState<PurchasableRole | null>(null);
  const [placingFromInventory, setPlacingFromInventory] = useState(false);
  const [equippingItem, setEquippingItem] = useState<ItemType | null>(null);
  const [hittingPieceSquare, setHittingPieceSquare] = useState<Square | null>(null);
  const [selectingHitPiece, setSelectingHitPiece] = useState(false);
  const [rewardDismissed, setRewardDismissed] = useState(false);
  const [onlineStatus, setOnlineStatus] = useState<OnlineStatus>('playing');
  const [rematchRequested, setRematchRequested] = useState(false);
  const [opponentWantsRematch, setOpponentWantsRematch] = useState(false);

  // Attach event handlers to the existing socket
  useEffect(() => {
    const socket = socketRef.current;

    // Remove lobby handlers (targeted — don't strip Socket.IO internals)
    socket.off('player-joined');
    socket.off('game-state');
    socket.off('player-disconnected');
    socket.off('player-reconnected');
    socket.off('action-error');
    socket.off('rematch-requested');
    socket.off('rematch-accepted');
    socket.off('room-closed');

    const onGameState = (newState: GameState) => {
      setState(newState);
      setError(null);
      setOnlineStatus('playing');
      // Show reward modal when a loot box is opened
      if (newState.lastLootBoxReward) {
        setRewardDismissed(false);
      }
    };

    const onActionError = (err: GameError) => {
      setError(err);
    };

    const onPlayerJoined = () => {
      setOnlineStatus('playing');
    };

    const onPlayerDisconnected = () => {
      setOnlineStatus('opponent-disconnected');
    };

    const onPlayerReconnected = () => {
      setOnlineStatus('playing');
    };

    const onRematchRequested = () => {
      setOpponentWantsRematch(true);
    };

    const onRematchAccepted = (newState: GameState) => {
      setState(newState);
      setRematchRequested(false);
      setOpponentWantsRematch(false);
      setError(null);
    };

    const onRoomClosed = () => {
      setOnlineStatus('room-closed');
    };

    const onDisconnect = () => {
      setOnlineStatus('error');
    };

    const onReconnect = () => {
      // Re-authenticate first, then re-join room
      const creds = getSessionCredentials();
      socket.emit('authenticate', creds.sessionId, creds.token, (authRes: AuthResponse) => {
        // Update stored credentials (may be the same or a new session)
        setSessionCredentials(authRes.sessionId, authRes.token);
        // Re-join room to restore server-side socket mapping
        socket.emit('join-room', roomId, (res: { state?: GameState; error?: string }) => {
          if (res.state) {
            setState(res.state);
            setOnlineStatus('playing');
          }
        });
      });
    };

    socket.on('game-state', onGameState);
    socket.on('action-error', onActionError);
    socket.on('player-joined', onPlayerJoined);
    socket.on('player-disconnected', onPlayerDisconnected);
    socket.on('player-reconnected', onPlayerReconnected);
    socket.on('rematch-requested', onRematchRequested);
    socket.on('rematch-accepted', onRematchAccepted);
    socket.on('room-closed', onRoomClosed);
    socket.on('disconnect', onDisconnect);
    socket.on('connect', onReconnect);

    return () => {
      socket.off('game-state', onGameState);
      socket.off('action-error', onActionError);
      socket.off('player-joined', onPlayerJoined);
      socket.off('player-disconnected', onPlayerDisconnected);
      socket.off('player-reconnected', onPlayerReconnected);
      socket.off('rematch-requested', onRematchRequested);
      socket.off('rematch-accepted', onRematchAccepted);
      socket.off('room-closed', onRoomClosed);
      socket.off('disconnect', onDisconnect);
      socket.off('connect', onReconnect);
    };
  }, []);

  // Dispatch action to server
  const dispatch = useCallback((action: GameAction) => {
    setPlacingPiece(null);
    setPlacingFromInventory(false);
    setEquippingItem(null);
    setHittingPieceSquare(null);
    setSelectingHitPiece(false);
    socketRef.current.emit('action', roomId, action);
  }, [roomId]);

  // Request rematch
  const requestRematch = useCallback(() => {
    setRematchRequested(true);
    socketRef.current.emit('request-rematch', roomId);
  }, [roomId]);

  // Computed values (same interface as useGame)
  const legalDests = useMemo(() => getLegalMoves(state), [state]);

  const goldAfterIncome = useMemo(() => {
    return state.gold[state.turn] + CHESS_GOLD_CONFIG.goldPerTurn;
  }, [state]);

  const canAfford = useCallback((piece: PurchasableRole): boolean => {
    return goldAfterIncome >= CHESS_GOLD_CONFIG.piecePrices[piece];
  }, [goldAfterIncome]);

  const placementSquares = useMemo((): Square[] => {
    if (!placingPiece) return [];
    return getValidPlacementSquares(state, placingPiece);
  }, [state, placingPiece]);

  const startPlacement = useCallback((piece: PurchasableRole) => {
    setPlacingPiece(prev => prev === piece ? null : piece);
    setPlacingFromInventory(false);
    setEquippingItem(null);
    setHittingPieceSquare(null);
    setSelectingHitPiece(false);
    setError(null);
  }, []);

  const startInventoryPlacement = useCallback((piece: PurchasableRole) => {
    setPlacingPiece(prev => prev === piece ? null : piece);
    setPlacingFromInventory(true);
    setEquippingItem(null);
    setHittingPieceSquare(null);
    setSelectingHitPiece(false);
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

  // --- Loot box hit ---

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

  const startHitSelection = useCallback(() => {
    setSelectingHitPiece(true);
    setHittingPieceSquare(null);
    setPlacingPiece(null);
    setPlacingFromInventory(false);
    setEquippingItem(null);
    setError(null);
  }, []);

  const startHit = useCallback((pieceSquare: Square) => {
    setHittingPieceSquare(prev => prev === pieceSquare ? null : pieceSquare);
    setSelectingHitPiece(false);
    setPlacingPiece(null);
    setPlacingFromInventory(false);
    setEquippingItem(null);
    setError(null);
  }, []);

  const hitTargets = useMemo((): Square[] => {
    if (hittingPieceSquare === null) return [];
    return hittableLootBoxes
      .filter(h => h.pieceSquares.includes(hittingPieceSquare))
      .map(h => h.lootBoxSquare);
  }, [hittingPieceSquare, hittableLootBoxes]);

  // --- Equip ---

  const equipTargets = useMemo((): Square[] => {
    if (!equippingItem) return [];
    const setup = parseFen(state.fen);
    if (setup.isErr) return [];
    const board = setup.value.board;
    const targets: Square[] = [];
    const pieces = state.turn === 'white' ? board.white : board.black;
    for (const sq of pieces) {
      const piece = board.get(sq);
      if (!piece || piece.role === 'king') continue;
      const sqName = 'abcdefgh'[sq % 8] + (Math.floor(sq / 8) + 1);
      if (state.equipment[sqName as keyof typeof state.equipment]) continue;
      targets.push(sq as Square);
    }
    return targets;
  }, [equippingItem, state]);

  const startEquip = useCallback((item: ItemType) => {
    setEquippingItem(prev => prev === item ? null : item);
    setPlacingPiece(null);
    setPlacingFromInventory(false);
    setHittingPieceSquare(null);
    setSelectingHitPiece(false);
    setError(null);
  }, []);

  return {
    state,
    dispatch,
    error,
    resetGame: requestRematch,
    undo: () => {},
    canUndo: false,
    legalDests,
    placingPiece,
    placingFromInventory,
    placementSquares,
    startPlacement,
    startInventoryPlacement,
    cancelPlacement,
    canAfford,
    config: CHESS_GOLD_CONFIG,
    startingGold: CHESS_GOLD_CONFIG.startingGold,
    setStartingGold: () => {},
    boardOrientation: myColor as 'white' | 'black',
    flipBoard: () => {},
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
    // Online-specific
    myColor,
    isMyTurn: state.turn === myColor,
    onlineStatus,
    rematchRequested,
    opponentWantsRematch,
    requestRematch,
    roomId,
  };
}
