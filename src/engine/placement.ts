import { Chess } from 'chessops/chess';
import { parseFen } from 'chessops/fen';
import type { Color, GameState, PurchasableRole, Role, Square } from './types.ts';
import { CHESS_GOLD_CONFIG } from './config.ts';
import { isInCheck } from './position.ts';

function squareRow(square: Square): number {
  return Math.floor(square / 8) + 1;
}

function getPlacementZone(color: 'white' | 'black'): { minRow: number; maxRow: number } {
  const maxRow = CHESS_GOLD_CONFIG.placement.maxRow;
  if (color === 'white') {
    return { minRow: 1, maxRow };
  }
  return { minRow: 9 - maxRow, maxRow: 8 };
}

function getPawnMinRow(color: 'white' | 'black'): number {
  const pawnMinRow = CHESS_GOLD_CONFIG.placement.pawnMinRow;
  if (color === 'white') {
    return pawnMinRow;
  }
  // For black, pawn can't go on back rank (row 8). Mirror: 9 - maxRow through 9 - pawnMinRow
  // Black's back rank is row 8, so pawn min row from black's side = row 6-7 (not row 8)
  // pawnMinRow=2 means "not row 1" for white. For black, "not row 8" means max row 7.
  return 9 - CHESS_GOLD_CONFIG.placement.maxRow;
}

function getPawnMaxRow(color: 'white' | 'black'): number {
  if (color === 'white') {
    return CHESS_GOLD_CONFIG.placement.maxRow;
  }
  return 9 - CHESS_GOLD_CONFIG.placement.pawnMinRow;
}

function parseBoard(fen: string) {
  const setup = parseFen(fen);
  if (setup.isErr) throw new Error(`Invalid FEN: ${fen}`);
  return setup.value.board;
}

export function isValidPlacement(state: GameState, piece: PurchasableRole, square: Square): boolean {
  const row = squareRow(square);

  if (state.modeConfig.unrestrictedPlacement) {
    // Unrestricted: any unoccupied square, but pawns still can't go on back rank
    if (piece === 'pawn') {
      const backRank = state.turn === 'white' ? 8 : 1;
      if (row === backRank) return false;
    }
  } else {
    // Standard zone-restricted placement
    const zone = getPlacementZone(state.turn);
    if (row < zone.minRow || row > zone.maxRow) return false;

    if (piece === 'pawn') {
      const pawnMin = getPawnMinRow(state.turn);
      const pawnMax = getPawnMaxRow(state.turn);
      if (row < pawnMin || row > pawnMax) return false;
    }
  }

  const board = parseBoard(state.fen);
  if (board.get(square) !== undefined) return false;

  // Cannot place on a loot box square
  if (state.lootBoxes.some(lb => lb.square === square)) return false;

  return true;
}

export function getValidPlacementSquares(state: GameState, piece: PurchasableRole): Square[] {
  const squares: Square[] = [];
  const inCheck = isInCheck(state);
  for (let sq = 0; sq < 64; sq++) {
    if (isValidPlacement(state, piece, sq as Square)) {
      if (!inCheck || placementResolvesCheck(state, piece, sq as Square)) {
        squares.push(sq as Square);
      }
    }
  }
  return squares;
}

export function placementResolvesCheck(state: GameState, piece: PurchasableRole, square: Square): boolean {
  const setup = parseFen(state.fen);
  if (setup.isErr) return false;

  // Place the piece on the board
  setup.value.board.set(square, { role: piece, color: state.turn });

  // Flip turn to simulate end of placement — chessops validates that
  // the non-moving side's king is NOT in check, which is our king.
  // This correctly allows placements that both block check and give check.
  setup.value.turn = state.turn === 'white' ? 'black' : 'white';

  const pos = Chess.fromSetup(setup.value);
  if (pos.isErr) return false;

  return true;
}

// --- Placement throttle ---

export function canPlaceThisTurn(state: GameState, color: Color): boolean {
  if (!state.modeConfig.placementThrottle) return true;
  const lastTurn = state.lastPlacementTurn[color];
  if (lastTurn === null) return true;
  return state.turnNumber - lastTurn >= 2;
}

// --- Inventory helpers ---

export function hasInInventory(state: GameState, piece: Role): boolean {
  return state.inventory[state.turn].some(
    inv => inv.type === 'piece' && inv.pieceType === piece,
  );
}

export function removeFromInventory(state: GameState, piece: Role): GameState {
  const player = state.turn;
  const idx = state.inventory[player].findIndex(
    inv => inv.type === 'piece' && inv.pieceType === piece,
  );
  if (idx === -1) return state;

  const newInventory = [...state.inventory[player]];
  newInventory.splice(idx, 1);

  return {
    ...state,
    inventory: {
      ...state.inventory,
      [player]: newInventory,
    },
  };
}
