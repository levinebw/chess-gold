import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';
import type { GameState, GameAction, GameError, PurchasableRole, Square, Color } from '../../engine/types.ts';
import { createInitialState } from '../../engine/game.ts';
import { getLegalMoves } from '../../engine/position.ts';
import { getValidPlacementSquares } from '../../engine/placement.ts';
import { CHESS_GOLD_CONFIG } from '../../engine/config.ts';
import type { ClientEvents, ServerEvents } from '../../server/protocol.ts';

type TypedSocket = Socket<ServerEvents, ClientEvents>;

export type OnlineStatus =
  | 'connecting'
  | 'waiting'
  | 'playing'
  | 'opponent-disconnected'
  | 'room-closed'
  | 'error';

export function useOnlineGame(roomId: string, myColor: Color, existingSocket: TypedSocket) {
  const socketRef = useRef<TypedSocket>(existingSocket);
  const [state, setState] = useState<GameState>(() => createInitialState());
  const [error, setError] = useState<GameError | null>(null);
  const [placingPiece, setPlacingPiece] = useState<PurchasableRole | null>(null);
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
      // Re-join room to restore server-side socket mapping
      socket.emit('join-room', roomId, (res: { state?: GameState; error?: string }) => {
        if (res.state) {
          setState(res.state);
          setOnlineStatus('playing');
        }
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
    setError(null);
  }, []);

  const cancelPlacement = useCallback(() => {
    setPlacingPiece(null);
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
    placementSquares,
    startPlacement,
    cancelPlacement,
    canAfford,
    config: CHESS_GOLD_CONFIG,
    startingGold: CHESS_GOLD_CONFIG.startingGold,
    setStartingGold: () => {},
    boardOrientation: myColor as 'white' | 'black',
    flipBoard: () => {},
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
