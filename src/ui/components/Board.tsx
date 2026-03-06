import { useEffect, useRef, useState } from 'react';
import { Chessground } from 'chessground';
import type { Api } from 'chessground/api';
import type { Key } from 'chessground/types';
import { parseFen } from 'chessops/fen';
import type { Square, PurchasableRole } from '../../engine/types.ts';
import { useGameContext } from '../context/GameContext.tsx';
import { isInCheck } from '../../engine/position.ts';
import { playSound } from '../utils/sounds.ts';
import { PromotionDialog } from './PromotionDialog.tsx';

const FILES = 'abcdefgh';

export function squareToKey(sq: Square): Key {
  const file = FILES[sq % 8];
  const rank = Math.floor(sq / 8) + 1;
  return `${file}${rank}` as Key;
}

export function keyToSquare(key: Key): Square {
  const file = key.charCodeAt(0) - 'a'.charCodeAt(0);
  const rank = parseInt(key[1]) - 1;
  return (rank * 8 + file) as Square;
}

function legalDestsToChessground(legalDests: Map<Square, Square[]>): Map<Key, Key[]> {
  const dests = new Map<Key, Key[]>();
  for (const [from, toSquares] of legalDests) {
    dests.set(squareToKey(from), toSquares.map(squareToKey));
  }
  return dests;
}

function isPromotionMove(fen: string, from: Square, to: Square): boolean {
  const toRank = Math.floor(to / 8);
  if (toRank !== 7 && toRank !== 0) return false;
  const setup = parseFen(fen);
  if (setup.isErr) return false;
  const piece = setup.value.board.get(from);
  return piece?.role === 'pawn';
}

export function Board() {
  const { state, dispatch, error, legalDests, placingPiece, placementSquares, cancelPlacement } = useGameContext();
  const boardRef = useRef<HTMLDivElement>(null);
  const cgRef = useRef<Api | null>(null);
  const [pendingPromotion, setPendingPromotion] = useState<{ from: Square; to: Square } | null>(null);

  // We need a ref for state.fen so the Chessground move callback
  // (created once in the init effect) can read the current FEN.
  const fenRef = useRef(state.fen);
  useEffect(() => {
    fenRef.current = state.fen;
  }, [state.fen]);

  // Create Chessground instance once
  useEffect(() => {
    if (!boardRef.current) return;
    const cg = Chessground(boardRef.current, {
      fen: state.fen,
      turnColor: state.turn,
      movable: {
        free: false,
        color: state.turn,
        dests: legalDestsToChessground(legalDests),
      },
      events: {
        move: (orig: Key, dest: Key) => {
          const from = keyToSquare(orig);
          const to = keyToSquare(dest);

          if (isPromotionMove(fenRef.current, from, to)) {
            setPendingPromotion({ from, to });
            return;
          }

          dispatch({ type: 'move', from, to });
        },
      },
    });
    cgRef.current = cg;
    return () => cg.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync state changes to Chessground
  useEffect(() => {
    if (!cgRef.current) return;

    const isGameOver = state.status === 'checkmate' || state.status === 'stalemate';
    const blocked = !!placingPiece || !!pendingPromotion || isGameOver;

    // Extract last move for highlighting
    const lastAction = state.actionHistory[state.actionHistory.length - 1];
    let lastMove: [Key, Key] | undefined;
    if (lastAction?.type === 'move') {
      lastMove = [squareToKey(lastAction.from), squareToKey(lastAction.to)];
    }

    cgRef.current.set({
      fen: state.fen,
      turnColor: state.turn,
      lastMove,
      check: isInCheck(state) ? state.turn : undefined,
      movable: {
        free: false,
        color: blocked ? undefined : state.turn,
        dests: blocked ? new Map() : legalDestsToChessground(legalDests),
      },
    });
  }, [state, legalDests, placingPiece, pendingPromotion, error]);

  // Play sounds on state changes
  const prevActionCount = useRef(state.actionHistory.length);
  const prevFenRef = useRef(state.fen);
  useEffect(() => {
    const currentCount = state.actionHistory.length;
    const prevFen = prevFenRef.current;
    if (currentCount <= prevActionCount.current) {
      prevActionCount.current = currentCount;
      prevFenRef.current = state.fen;
      return;
    }
    prevActionCount.current = currentCount;
    prevFenRef.current = state.fen;

    if (state.status === 'checkmate' || state.status === 'stalemate') {
      playSound('gameOver');
      return;
    }

    const lastAction = state.actionHistory[currentCount - 1];
    if (lastAction?.type === 'place') {
      playSound('place');
    } else if (lastAction?.type === 'move') {
      if (isInCheck(state)) {
        playSound('check');
      } else {
        // Detect capture by comparing piece counts
        const prevPieces = prevFen.split(' ')[0].replace(/[^a-zA-Z]/g, '').length;
        const newPieces = state.fen.split(' ')[0].replace(/[^a-zA-Z]/g, '').length;
        playSound(newPieces < prevPieces ? 'capture' : 'move');
      }
    }
  }, [state]);

  // Highlight placement squares
  useEffect(() => {
    if (!cgRef.current) return;
    if (placingPiece && placementSquares.length > 0) {
      const shapes = placementSquares.map(sq => ({
        orig: squareToKey(sq),
        brush: 'green',
      }));
      cgRef.current.setAutoShapes(shapes);
    } else {
      cgRef.current.setAutoShapes([]);
    }
  }, [placingPiece, placementSquares]);

  // Cancel placement on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (pendingPromotion) {
          setPendingPromotion(null);
        } else if (placingPiece) {
          cancelPlacement();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [placingPiece, cancelPlacement, pendingPromotion]);

  // Placement click handler via overlay
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cgRef.current || !placingPiece) return;
    const key = cgRef.current.getKeyAtDomPos([e.clientX, e.clientY]);
    if (!key) return;
    const sq = keyToSquare(key);
    if (placementSquares.includes(sq)) {
      dispatch({ type: 'place', piece: placingPiece, square: sq, fromInventory: false });
    }
  };

  // Promotion handlers
  const handlePromotionSelect = (role: PurchasableRole) => {
    if (!pendingPromotion) return;
    dispatch({
      type: 'move',
      from: pendingPromotion.from,
      to: pendingPromotion.to,
      promotion: role,
    });
    setPendingPromotion(null);
  };

  const handlePromotionCancel = () => {
    setPendingPromotion(null);
    // Sync effect will re-render Chessground to match game state
    // (pawn snaps back to pre-move position)
  };

  return (
    <div className="board-wrapper">
      <div ref={boardRef} className="board-container" />
      {placingPiece && (
        <div className="placement-overlay" onClick={handleOverlayClick} />
      )}
      {pendingPromotion && (
        <PromotionDialog
          color={state.turn}
          onSelect={handlePromotionSelect}
          onCancel={handlePromotionCancel}
        />
      )}
    </div>
  );
}
