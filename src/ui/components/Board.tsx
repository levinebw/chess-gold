import { useEffect, useRef, useState, useMemo } from 'react';
import { Chessground } from 'chessground';
import type { Api } from 'chessground/api';
import type { Key } from 'chessground/types';
import type { DrawShape } from 'chessground/draw';
import { parseFen } from 'chessops/fen';
import type { Square, PurchasableRole, ItemType } from '../../engine/types.ts';
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

const EQUIPMENT_ICONS: Record<string, string> = {
  crossbow: '\uD83C\uDFF9',
  'turtle-shell': '\uD83D\uDEE1\uFE0F',
  crown: '\uD83D\uDC51',
};

const HIT_COUNT_COLORS: Record<number, string> = {
  3: '#4a4',
  2: '#cc4',
  1: '#c44',
};

export function Board() {
  const ctx = useGameContext();
  const { state, dispatch, error, legalDests, placingPiece, placementSquares, cancelPlacement, boardOrientation } = ctx;

  // Extract loot box context (may not exist in all game hook types)
  const placingFromInventory = 'placingFromInventory' in ctx ? ctx.placingFromInventory as boolean : false;
  const equippingItem = 'equippingItem' in ctx ? ctx.equippingItem as ItemType | null : null;
  const equipTargets = 'equipTargets' in ctx ? ctx.equipTargets as Square[] : [];
  const hittableLootBoxes = 'hittableLootBoxes' in ctx ? ctx.hittableLootBoxes as { lootBoxSquare: Square; pieceSquares: Square[] }[] : [];
  const hittingPieceSquare = 'hittingPieceSquare' in ctx ? ctx.hittingPieceSquare as Square | null : null;
  const hitTargets = 'hitTargets' in ctx ? ctx.hitTargets as Square[] : [];
  const startHit = 'startHit' in ctx ? ctx.startHit as (sq: Square) => void : undefined;

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
      premovable: {
        enabled: true,
        showDests: true,
        castle: true,
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

    const isGameOver = state.status === 'checkmate' || state.status === 'stalemate' || state.status === 'draw';
    const blocked = !!placingPiece || !!pendingPromotion || !!equippingItem || hittingPieceSquare !== null || isGameOver;

    // Extract last move for highlighting
    const lastAction = state.actionHistory[state.actionHistory.length - 1];
    let lastMove: [Key, Key] | undefined;
    if (lastAction?.type === 'move') {
      lastMove = [squareToKey(lastAction.from), squareToKey(lastAction.to)];
    } else if (lastAction?.type === 'place') {
      const key = squareToKey(lastAction.square);
      lastMove = [key, key];
    }

    cgRef.current.set({
      fen: state.fen,
      turnColor: state.turn,
      orientation: boardOrientation,
      lastMove,
      check: isInCheck(state) ? state.turn : undefined,
      movable: {
        free: false,
        color: blocked ? undefined : state.turn,
        dests: blocked ? new Map() : legalDestsToChessground(legalDests),
      },
    });

    // Auto-play premove when player's turn arrives
    if (!blocked && state.turn === boardOrientation) {
      setTimeout(() => cgRef.current?.playPremove(), 1);
    }
  }, [state, legalDests, placingPiece, pendingPromotion, equippingItem, hittingPieceSquare, error, boardOrientation]);

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
    } else if (lastAction?.type === 'hit-loot-box') {
      // Detect if a box was opened (fewer boxes now)
      playSound('lootBoxHit');
    } else if (lastAction?.type === 'equip') {
      playSound('equip');
    }
  }, [state]);

  // Build all auto-shapes: placement highlights, loot boxes, equipment, hit/equip targets
  const autoShapes = useMemo((): DrawShape[] => {
    const shapes: DrawShape[] = [];

    // Placement squares (buying or inventory)
    if (placingPiece && placementSquares.length > 0) {
      for (const sq of placementSquares) {
        shapes.push({ orig: squareToKey(sq), brush: 'green' });
      }
    }

    // Equip target highlights
    if (equippingItem && equipTargets.length > 0) {
      for (const sq of equipTargets) {
        shapes.push({ orig: squareToKey(sq), brush: 'blue' });
      }
    }

    // Hit target highlights (loot box squares hittable by selected piece)
    if (hittingPieceSquare !== null && hitTargets.length > 0) {
      for (const sq of hitTargets) {
        shapes.push({ orig: squareToKey(sq), brush: 'yellow' });
      }
      // Also highlight the selected piece
      shapes.push({ orig: squareToKey(hittingPieceSquare), brush: 'blue' });
    }

    // Render loot boxes as custom shapes
    for (const box of state.lootBoxes) {
      const key = squareToKey(box.square);
      const hitsColor = HIT_COUNT_COLORS[box.hitsRemaining] || '#c44';
      shapes.push({
        orig: key,
        customSvg: {
          html: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <text x="50" y="55" font-size="50" text-anchor="middle" dominant-baseline="central" opacity="0.85">\uD83C\uDF81</text>
            <circle cx="82" cy="18" r="14" fill="${hitsColor}" stroke="#000" stroke-width="1.5"/>
            <text x="82" y="19" font-size="16" font-weight="bold" text-anchor="middle" dominant-baseline="central" fill="#fff">${box.hitsRemaining}</text>
          </svg>`,
        },
      });
    }

    // Render equipment icons
    for (const [sqName, eq] of Object.entries(state.equipment)) {
      if (!eq) continue;
      const icon = EQUIPMENT_ICONS[eq.type] || '?';
      shapes.push({
        orig: sqName as Key,
        customSvg: {
          html: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <text x="85" y="85" font-size="28" text-anchor="middle" dominant-baseline="central" opacity="0.9">${icon}</text>
          </svg>`,
        },
      });
    }

    return shapes;
  }, [placingPiece, placementSquares, equippingItem, equipTargets, hittingPieceSquare, hitTargets, state.lootBoxes, state.equipment]);

  // Apply auto-shapes
  useEffect(() => {
    if (!cgRef.current) return;
    cgRef.current.setAutoShapes(autoShapes);
  }, [autoShapes]);

  // Cancel placement/equip/hit on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (pendingPromotion) {
          setPendingPromotion(null);
        } else if (placingPiece || equippingItem || hittingPieceSquare !== null) {
          cancelPlacement();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [placingPiece, equippingItem, hittingPieceSquare, cancelPlacement, pendingPromotion]);

  // Overlay click handler for placement, equip, and hit-loot-box
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cgRef.current) return;
    const key = cgRef.current.getKeyAtDomPos([e.clientX, e.clientY]);
    if (!key) return;
    const sq = keyToSquare(key);

    // Placement mode (from shop or inventory)
    if (placingPiece) {
      if (placementSquares.includes(sq)) {
        dispatch({ type: 'place', piece: placingPiece, square: sq, fromInventory: placingFromInventory });
      }
      return;
    }

    // Equip mode
    if (equippingItem) {
      if (equipTargets.includes(sq)) {
        dispatch({ type: 'equip', item: equippingItem, square: sq });
      }
      return;
    }

    // Hit-loot-box mode: click on a loot box to hit it
    if (hittingPieceSquare !== null) {
      if (hitTargets.includes(sq)) {
        dispatch({ type: 'hit-loot-box', pieceSquare: hittingPieceSquare, lootBoxSquare: sq });
      }
      return;
    }

    // Click on a piece adjacent to a loot box to enter hit mode
    if (hittableLootBoxes.length > 0) {
      for (const hittable of hittableLootBoxes) {
        if (hittable.pieceSquares.includes(sq)) {
          startHit?.(sq);
          return;
        }
      }
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

  const showOverlay = !!placingPiece || !!equippingItem || hittingPieceSquare !== null;

  return (
    <div className="board-wrapper">
      <div ref={boardRef} className="board-container" />
      {showOverlay && (
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
