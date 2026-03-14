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

/** Generate an inline SVG string for the loot box treasure chest. */
function lootBoxSvg(hitsRemaining: number, hitsColor: string): string {
  // Shared elements: wood body, base trim, lock
  const GOLD = '#d4a843';
  const GOLD_DARK = '#a07828';
  const WOOD = '#6b3a1f';
  const WOOD_DARK = '#4a2810';
  const WOOD_LIGHT = '#8b5e3c';

  // Badge (hit counter) — always present in top-right
  const badge = `
    <circle cx="82" cy="18" r="14" fill="${hitsColor}" stroke="#000" stroke-width="1.5"/>
    <text x="82" y="19" font-size="16" font-weight="bold" text-anchor="middle" dominant-baseline="central" fill="#fff">${hitsRemaining}</text>`;

  if (hitsRemaining >= 3) {
    // === PRISTINE: sealed chest, subtle golden glow ===
    return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="lbWood3" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${WOOD_LIGHT}"/>
          <stop offset="100%" stop-color="${WOOD}"/>
        </linearGradient>
        <linearGradient id="lbLid3" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${WOOD_LIGHT}"/>
          <stop offset="60%" stop-color="${WOOD_DARK}"/>
        </linearGradient>
      </defs>
      <!-- Body -->
      <rect x="15" y="52" width="62" height="30" rx="3" fill="url(#lbWood3)" stroke="${WOOD_DARK}" stroke-width="1.5"/>
      <!-- Horizontal wood plank lines -->
      <line x1="15" y1="62" x2="77" y2="62" stroke="${WOOD_DARK}" stroke-width="0.7" opacity="0.5"/>
      <line x1="15" y1="72" x2="77" y2="72" stroke="${WOOD_DARK}" stroke-width="0.7" opacity="0.5"/>
      <!-- Gold base trim -->
      <rect x="13" y="79" width="66" height="5" rx="1" fill="${GOLD}" stroke="${GOLD_DARK}" stroke-width="0.8"/>
      <!-- Gold band around body -->
      <rect x="13" y="52" width="66" height="5" rx="1" fill="${GOLD}" stroke="${GOLD_DARK}" stroke-width="0.8"/>
      <!-- Lid (arched top) -->
      <path d="M15,52 Q15,34 46,32 Q77,34 77,52 Z" fill="url(#lbLid3)" stroke="${WOOD_DARK}" stroke-width="1.5"/>
      <!-- Gold lid band -->
      <path d="M18,52 Q18,37 46,35 Q74,37 74,52" fill="none" stroke="${GOLD}" stroke-width="3" opacity="0.8"/>
      <!-- Gold clasp/lock -->
      <rect x="40" y="50" width="12" height="10" rx="2" fill="${GOLD}" stroke="${GOLD_DARK}" stroke-width="1"/>
      <circle cx="46" cy="57" r="2.5" fill="${WOOD_DARK}"/>
      <!-- Corner studs -->
      <circle cx="19" cy="55" r="2" fill="${GOLD}" stroke="${GOLD_DARK}" stroke-width="0.5"/>
      <circle cx="73" cy="55" r="2" fill="${GOLD}" stroke="${GOLD_DARK}" stroke-width="0.5"/>
      <circle cx="19" cy="78" r="2" fill="${GOLD}" stroke="${GOLD_DARK}" stroke-width="0.5"/>
      <circle cx="73" cy="78" r="2" fill="${GOLD}" stroke="${GOLD_DARK}" stroke-width="0.5"/>
      <!-- Subtle glow -->
      <ellipse cx="46" cy="55" rx="20" ry="8" fill="${GOLD}" opacity="0.08"/>
      ${badge}
    </svg>`;
  }

  if (hitsRemaining === 2) {
    // === DAMAGED: crack in lid, seam glow, slightly worn ===
    return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="lbWood2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${WOOD_LIGHT}"/>
          <stop offset="100%" stop-color="${WOOD}"/>
        </linearGradient>
        <linearGradient id="lbLid2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${WOOD_LIGHT}"/>
          <stop offset="60%" stop-color="${WOOD_DARK}"/>
        </linearGradient>
        <radialGradient id="lbGlow2" cx="50%" cy="80%" r="50%">
          <stop offset="0%" stop-color="#ffe066" stop-opacity="0.6"/>
          <stop offset="100%" stop-color="#ffe066" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <!-- Body -->
      <rect x="15" y="52" width="62" height="30" rx="3" fill="url(#lbWood2)" stroke="${WOOD_DARK}" stroke-width="1.5"/>
      <!-- Horizontal wood plank lines -->
      <line x1="15" y1="62" x2="77" y2="62" stroke="${WOOD_DARK}" stroke-width="0.7" opacity="0.5"/>
      <line x1="15" y1="72" x2="77" y2="72" stroke="${WOOD_DARK}" stroke-width="0.7" opacity="0.5"/>
      <!-- Gold base trim -->
      <rect x="13" y="79" width="66" height="5" rx="1" fill="${GOLD}" stroke="${GOLD_DARK}" stroke-width="0.8"/>
      <!-- Gold band around body -->
      <rect x="13" y="52" width="66" height="5" rx="1" fill="${GOLD}" stroke="${GOLD_DARK}" stroke-width="0.8"/>
      <!-- Seam glow (light leaking from inside) -->
      <rect x="16" y="50" width="60" height="4" rx="1" fill="url(#lbGlow2)" opacity="0.7"/>
      <!-- Lid slightly ajar (shifted up 2px) -->
      <path d="M15,50 Q15,32 46,30 Q77,32 77,50 Z" fill="url(#lbLid2)" stroke="${WOOD_DARK}" stroke-width="1.5"/>
      <!-- Gold lid band -->
      <path d="M18,50 Q18,35 46,33 Q74,35 74,50" fill="none" stroke="${GOLD}" stroke-width="3" opacity="0.8"/>
      <!-- Crack in lid -->
      <path d="M38,35 L40,40 L37,44 L39,49" fill="none" stroke="#2a1508" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M38,35 L40,40 L37,44 L39,49" fill="none" stroke="${GOLD}" stroke-width="0.5" opacity="0.4" stroke-linecap="round"/>
      <!-- Gold clasp/lock (slightly bent) -->
      <rect x="40" y="48" width="12" height="10" rx="2" fill="${GOLD}" stroke="${GOLD_DARK}" stroke-width="1" transform="rotate(3, 46, 53)"/>
      <circle cx="46" cy="55" r="2.5" fill="${WOOD_DARK}"/>
      <!-- Corner studs -->
      <circle cx="19" cy="55" r="2" fill="${GOLD}" stroke="${GOLD_DARK}" stroke-width="0.5"/>
      <circle cx="73" cy="55" r="2" fill="${GOLD}" stroke="${GOLD_DARK}" stroke-width="0.5"/>
      <circle cx="19" cy="78" r="2" fill="${GOLD}" stroke="${GOLD_DARK}" stroke-width="0.5"/>
      <circle cx="73" cy="78" r="2" fill="${GOLD}" stroke="${GOLD_DARK}" stroke-width="0.5"/>
      <!-- Dent mark on body -->
      <ellipse cx="58" cy="67" rx="5" ry="3" fill="${WOOD_DARK}" opacity="0.3"/>
      ${badge}
    </svg>`;
  }

  // === 1 HIT: NEARLY OPEN — lid popping, bright glow, treasure peeking ===
  return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="lbWood1" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${WOOD_LIGHT}"/>
        <stop offset="100%" stop-color="${WOOD}"/>
      </linearGradient>
      <linearGradient id="lbLid1" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${WOOD_LIGHT}"/>
        <stop offset="60%" stop-color="${WOOD_DARK}"/>
      </linearGradient>
      <radialGradient id="lbGlow1" cx="50%" cy="50%" r="60%">
        <stop offset="0%" stop-color="#fff7cc" stop-opacity="0.9"/>
        <stop offset="40%" stop-color="#ffe066" stop-opacity="0.6"/>
        <stop offset="100%" stop-color="#d4a843" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <!-- Bright glow behind chest -->
    <ellipse cx="46" cy="50" rx="32" ry="22" fill="url(#lbGlow1)" opacity="0.5"/>
    <!-- Body -->
    <rect x="15" y="52" width="62" height="30" rx="3" fill="url(#lbWood1)" stroke="${WOOD_DARK}" stroke-width="1.5"/>
    <!-- Horizontal wood plank lines -->
    <line x1="15" y1="62" x2="77" y2="62" stroke="${WOOD_DARK}" stroke-width="0.7" opacity="0.5"/>
    <line x1="15" y1="72" x2="77" y2="72" stroke="${WOOD_DARK}" stroke-width="0.7" opacity="0.5"/>
    <!-- Gold base trim -->
    <rect x="13" y="79" width="66" height="5" rx="1" fill="${GOLD}" stroke="${GOLD_DARK}" stroke-width="0.8"/>
    <!-- Gold band around body -->
    <rect x="13" y="52" width="66" height="5" rx="1" fill="${GOLD}" stroke="${GOLD_DARK}" stroke-width="0.8"/>
    <!-- Interior glow (light pouring from gap) -->
    <rect x="18" y="44" width="56" height="10" rx="2" fill="#ffe066" opacity="0.5"/>
    <!-- Treasure peeking out: gold coins -->
    <circle cx="34" cy="49" r="4" fill="${GOLD}" stroke="${GOLD_DARK}" stroke-width="0.8"/>
    <circle cx="42" cy="47" r="3.5" fill="#e8c252" stroke="${GOLD_DARK}" stroke-width="0.7"/>
    <circle cx="55" cy="48" r="4" fill="${GOLD}" stroke="${GOLD_DARK}" stroke-width="0.8"/>
    <!-- Gem peeking -->
    <polygon points="48,44 50,40 52,44" fill="#e04040" stroke="#a02020" stroke-width="0.5"/>
    <!-- Lid popped open (rotated up, hinge on left) -->
    <path d="M15,52 Q15,34 46,28 Q77,34 77,52 Z" fill="url(#lbLid1)" stroke="${WOOD_DARK}" stroke-width="1.5" transform="rotate(-18, 15, 52)"/>
    <!-- Gold lid band on popped lid -->
    <path d="M18,52 Q18,37 46,31 Q74,37 74,52" fill="none" stroke="${GOLD}" stroke-width="2.5" opacity="0.7" transform="rotate(-18, 15, 52)"/>
    <!-- Major cracks on lid -->
    <path d="M30,38 L33,43 L29,47" fill="none" stroke="#2a1508" stroke-width="1.8" stroke-linecap="round" transform="rotate(-18, 15, 52)"/>
    <path d="M52,36 L50,41 L54,45" fill="none" stroke="#2a1508" stroke-width="1.3" stroke-linecap="round" transform="rotate(-18, 15, 52)"/>
    <!-- Broken clasp hanging -->
    <rect x="42" y="52" width="8" height="6" rx="1" fill="${GOLD}" stroke="${GOLD_DARK}" stroke-width="0.8" transform="rotate(15, 46, 55)"/>
    <!-- Corner studs (some missing) -->
    <circle cx="19" cy="78" r="2" fill="${GOLD}" stroke="${GOLD_DARK}" stroke-width="0.5"/>
    <circle cx="73" cy="78" r="2" fill="${GOLD}" stroke="${GOLD_DARK}" stroke-width="0.5"/>
    <!-- Light rays from inside -->
    <line x1="35" y1="48" x2="30" y2="38" stroke="#ffe066" stroke-width="2" opacity="0.4" stroke-linecap="round"/>
    <line x1="46" y1="46" x2="46" y2="34" stroke="#ffe066" stroke-width="2.5" opacity="0.35" stroke-linecap="round"/>
    <line x1="57" y1="48" x2="62" y2="38" stroke="#ffe066" stroke-width="2" opacity="0.4" stroke-linecap="round"/>
    ${badge}
  </svg>`;
}

export function Board() {
  const ctx = useGameContext();
  const { state, dispatch, error, legalDests, placingPiece, placementSquares, cancelPlacement, boardOrientation } = ctx;

  // Extract loot box context (may not exist in all game hook types)
  const placingFromInventory = 'placingFromInventory' in ctx ? ctx.placingFromInventory as boolean : false;
  const equippingItem = 'equippingItem' in ctx ? ctx.equippingItem as ItemType | null : null;
  const equipTargets = 'equipTargets' in ctx ? ctx.equipTargets as Square[] : [];
  const hittableLootBoxes = 'hittableLootBoxes' in ctx ? ctx.hittableLootBoxes as { lootBoxSquare: Square; pieceSquares: Square[] }[] : [];
  const selectingHitPiece = 'selectingHitPiece' in ctx ? ctx.selectingHitPiece as boolean : false;
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
    const blocked = !!placingPiece || !!pendingPromotion || !!equippingItem || selectingHitPiece || hittingPieceSquare !== null || isGameOver;

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
  }, [state, legalDests, placingPiece, pendingPromotion, equippingItem, selectingHitPiece, hittingPieceSquare, error, boardOrientation]);

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

    // Hit piece selection highlights (all pieces that can hit a loot box)
    if (selectingHitPiece && hittableLootBoxes.length > 0) {
      const allPieces = new Set<Square>();
      for (const hittable of hittableLootBoxes) {
        for (const sq of hittable.pieceSquares) {
          allPieces.add(sq);
        }
      }
      for (const sq of allPieces) {
        shapes.push({ orig: squareToKey(sq), brush: 'green' });
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

    // Render loot boxes as custom shapes (medieval treasure chest)
    for (const box of state.lootBoxes) {
      const key = squareToKey(box.square);
      const hitsColor = HIT_COUNT_COLORS[box.hitsRemaining] || '#c44';
      shapes.push({
        orig: key,
        customSvg: {
          html: lootBoxSvg(box.hitsRemaining, hitsColor),
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
  }, [placingPiece, placementSquares, equippingItem, equipTargets, selectingHitPiece, hittableLootBoxes, hittingPieceSquare, hitTargets, state.lootBoxes, state.equipment]);

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
        } else if (placingPiece || equippingItem || selectingHitPiece || hittingPieceSquare !== null) {
          cancelPlacement();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [placingPiece, equippingItem, selectingHitPiece, hittingPieceSquare, cancelPlacement, pendingPromotion]);

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

    // Hit piece selection mode: click on a piece to select it for hitting
    if (selectingHitPiece && hittableLootBoxes.length > 0) {
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

  const showOverlay = !!placingPiece || !!equippingItem || selectingHitPiece || hittingPieceSquare !== null;

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
