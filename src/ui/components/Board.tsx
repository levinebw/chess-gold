import { useEffect, useRef } from 'react';
import { Chessground } from 'chessground';
import type { Api } from 'chessground/api';
import type { Key } from 'chessground/types';
import type { GameState, GameAction, Square } from '../../engine/types.ts';
import { getLegalMoves } from '../../engine/position.ts';

const FILES = 'abcdefgh';

function squareToKey(sq: Square): Key {
  const file = FILES[sq % 8];
  const rank = Math.floor(sq / 8) + 1;
  return `${file}${rank}` as Key;
}

function keyToSquare(key: Key): Square {
  const file = key.charCodeAt(0) - 'a'.charCodeAt(0);
  const rank = parseInt(key[1]) - 1;
  return (rank * 8 + file) as Square;
}

function computeDests(state: GameState): Map<Key, Key[]> {
  const legalMoves = getLegalMoves(state);
  const dests = new Map<Key, Key[]>();
  for (const [from, toSquares] of legalMoves) {
    const fromKey = squareToKey(from);
    const toKeys = toSquares.map(squareToKey);
    dests.set(fromKey, toKeys);
  }
  return dests;
}

interface BoardProps {
  state: GameState;
  dispatch: (action: GameAction) => void;
}

export function Board({ state, dispatch }: BoardProps) {
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
        dests: computeDests(state),
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
    cgRef.current.set({
      fen: state.fen,
      turnColor: state.turn,
      movable: {
        free: false,
        color: state.turn,
        dests: computeDests(state),
      },
    });
  }, [state]);

  return <div ref={boardRef} className="board-container" />;
}
