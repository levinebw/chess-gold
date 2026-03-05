import { useEffect, useRef } from 'react';
import { Chessground } from 'chessground';
import type { Api } from 'chessground/api';
import type { Key } from 'chessground/types';
import type { Square } from '../../engine/types.ts';
import { useGameContext } from '../context/GameContext.tsx';

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

export function Board() {
  const { state, dispatch, legalDests, placingPiece, placementSquares, cancelPlacement } = useGameContext();
  const boardRef = useRef<HTMLDivElement>(null);
  const cgRef = useRef<Api | null>(null);

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
          dispatch({
            type: 'move',
            from: keyToSquare(orig),
            to: keyToSquare(dest),
          });
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

    cgRef.current.set({
      fen: state.fen,
      turnColor: state.turn,
      movable: {
        free: false,
        color: isGameOver ? undefined : state.turn,
        dests: isGameOver ? new Map() : legalDestsToChessground(legalDests),
      },
    });
  }, [state, legalDests]);

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

  // Handle placement clicks
  const handleBoardClick = (e: React.MouseEvent) => {
    if (!placingPiece || !cgRef.current) return;

    const boardEl = boardRef.current;
    if (!boardEl) return;

    const rect = boardEl.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const fileIndex = Math.floor((x / rect.width) * 8);
    const rankIndex = 7 - Math.floor((y / rect.height) * 8);
    const square = (rankIndex * 8 + fileIndex) as Square;

    if (placementSquares.includes(square)) {
      dispatch({
        type: 'place',
        piece: placingPiece,
        square,
        fromInventory: false,
      });
    }
  };

  // Cancel placement on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && placingPiece) {
        cancelPlacement();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [placingPiece, cancelPlacement]);

  return (
    <div
      ref={boardRef}
      className={`board-container ${placingPiece ? 'placement-mode' : ''}`}
      onClick={handleBoardClick}
    />
  );
}
