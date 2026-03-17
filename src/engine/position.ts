import { Chess, Castles } from 'chessops/chess';
import { parseFen, makeFen } from 'chessops/fen';
import type { Role as ChessopsRole } from 'chessops';
import type { GameState, Square, Role } from './types.ts';
import { awardCaptureReward } from './gold.ts';
import {
  transferEquipment,
  removeEquipment,
  hasTurtleShell,
  decrementTurtleShell,
} from './equipment.ts';

function createPosition(fen: string): Chess {
  const setup = parseFen(fen);
  if (setup.isErr) throw new Error(`Invalid FEN: ${fen}`);
  const pos = Chess.fromSetup(setup.value);
  if (pos.isOk) return pos.value;

  // Fallback for variant positions (Conqueror can produce positions
  // that chessops rejects, e.g. pawns on back rank from conversion)
  const fallback = Chess.default();
  fallback.board = setup.value.board;
  fallback.turn = setup.value.turn;
  fallback.castles = Castles.fromSetup(setup.value);
  fallback.epSquare = setup.value.epSquare;
  fallback.halfmoves = setup.value.halfmoves;
  fallback.fullmoves = setup.value.fullmoves;
  return fallback;
}

export function getLegalMoves(state: GameState): Map<Square, Square[]> {
  const pos = createPosition(state.fen);
  const allDests = pos.allDests();
  const lootBoxSquares = new Set(state.lootBoxes.map(lb => lb.square));
  const kingSquare = pos.board.kingOf(pos.turn);
  const result = new Map<Square, Square[]>();
  for (const [from, dests] of allDests) {
    let squares = ([...dests] as Square[]).filter(sq => !lootBoxSquares.has(sq));
    // Remap castling: chessops reports king→rook, UI needs king±2
    if (kingSquare !== undefined && from === kingSquare) {
      squares = squares.map(to => {
        const fromFile = from % 8;
        const toFile = to % 8;
        if (Math.floor(from / 8) === Math.floor(to / 8) && Math.abs(toFile - fromFile) > 1) {
          const newFile = fromFile + (toFile > fromFile ? 2 : -2);
          return (Math.floor(from / 8) * 8 + newFile) as Square;
        }
        return to;
      });
    }
    if (squares.length > 0) {
      result.set(from as Square, squares);
    }
  }
  return result;
}

export function isInCheck(state: GameState): boolean {
  const pos = createPosition(state.fen);
  return pos.isCheck();
}

export function isCheckmate(state: GameState): boolean {
  const pos = createPosition(state.fen);
  return pos.isCheckmate();
}

export function isStalemate(state: GameState): boolean {
  const pos = createPosition(state.fen);
  return pos.isStalemate();
}

export function applyMove(state: GameState, from: Square, to: Square, promotion?: Role): GameState {
  const pos = createPosition(state.fen);

  const capturedPiece = pos.board.get(to);
  const movingPiece = pos.board.get(from);
  const isEnPassant = movingPiece?.role === 'pawn' && to === pos.epSquare;

  // Record captured piece info for piece conversion
  let capturedRole: ChessopsRole | null = null;
  let capturedSquare: number | null = null;
  const isCapture = (capturedPiece && capturedPiece.role !== 'king') || isEnPassant;

  if (capturedPiece && capturedPiece.role !== 'king') {
    capturedRole = capturedPiece.role;
    capturedSquare = to;
  } else if (isEnPassant) {
    capturedRole = 'pawn';
    capturedSquare = state.turn === 'white' ? to - 8 : to + 8;
  }

  // --- Turtle Shell check: defender's piece survives, attacker bounces back ---
  if (isCapture && capturedPiece && hasTurtleShell(state.equipment, to)) {
    // Turtle shell absorbs the capture: attacker returns to origin, defender stays
    const newEquipment = decrementTurtleShell(state.equipment, to);

    // Board doesn't change (attacker bounced back, defender stays)
    // But we still flip turn
    return {
      ...state,
      equipment: newEquipment,
      turn: state.turn === 'white' ? 'black' : 'white',
    };
  }

  let newFen: string;

  if (state.modeConfig.pieceConversion && isCapture && capturedRole !== null && capturedSquare !== null) {
    // Piece conversion capture: don't use pos.play() — manipulate the board directly.
    // Swap: attacker moves to target square, captured piece goes to attacker's
    // origin square and switches color.
    const setup = parseFen(state.fen);
    if (setup.isErr) throw new Error(`Invalid FEN: ${state.fen}`);

    const attackerRole = movingPiece!.role;

    // Move attacker to the target square
    setup.value.board.set(to, { role: attackerRole, color: state.turn });
    // Place converted captured piece on attacker's origin square
    setup.value.board.set(from, { role: capturedRole, color: state.turn });

    // Handle en passant: remove the pawn from its actual square
    if (isEnPassant && capturedSquare !== from && capturedSquare !== to) {
      setup.value.board.set(capturedSquare, undefined as any);
    }

    // Flip the turn in the FEN
    setup.value.turn = state.turn === 'white' ? 'black' : 'white';
    // Clear en passant square
    setup.value.epSquare = undefined;
    // Increment halfmove clock
    setup.value.halfmoves = (setup.value.halfmoves ?? 0) + 1;
    // Increment fullmove number after black's move
    if (state.turn === 'black') {
      setup.value.fullmoves = (setup.value.fullmoves ?? 1) + 1;
    }

    newFen = makeFen(setup.value);
  } else {
    // Normal move (no piece conversion capture)
    // Convert castling from king±2 back to king→rook for chessops
    let playTo: number = to;
    if (movingPiece?.role === 'king') {
      const fromFile = from % 8;
      const toFile = to % 8;
      if (Math.abs(toFile - fromFile) === 2) {
        const rank = Math.floor(from / 8);
        playTo = toFile > fromFile ? rank * 8 + 7 : rank * 8;
      }
    }
    pos.play({
      from,
      to: playTo,
      promotion: promotion as ChessopsRole | undefined,
    });

    newFen = makeFen(pos.toSetup());
  }

  // Award capture gold BEFORE flipping turn (so state.turn is the capturing player)
  let newState: GameState = { ...state, fen: newFen };

  if (capturedPiece && capturedPiece.role !== 'king') {
    newState = awardCaptureReward(newState, capturedPiece.role);
  } else if (isEnPassant) {
    newState = awardCaptureReward(newState, 'pawn');
  }

  // --- Equipment movement ---
  let newEquipment = newState.equipment;

  if (isCapture) {
    // Defender's equipment is destroyed on capture
    newEquipment = removeEquipment(newEquipment, to);

    if (isEnPassant && capturedSquare !== null) {
      newEquipment = removeEquipment(newEquipment, capturedSquare as Square);
    }
  }

  // Transfer attacker's equipment from origin to destination
  newEquipment = transferEquipment(newEquipment, from, to);

  // For piece conversion: attacker equipment went to 'to', converted piece at 'from'
  // has no equipment (equipment follows the attacker, not the square)

  // Castling: move rook's equipment too
  if (movingPiece?.role === 'king' && Math.abs(from - to) === 2) {
    // Kingside: rook from h-file to f-file; Queenside: rook from a-file to d-file
    const rank = Math.floor(from / 8);
    if (to > from) {
      // Kingside
      const rookFrom = (rank * 8 + 7) as Square;
      const rookTo = (rank * 8 + 5) as Square;
      newEquipment = transferEquipment(newEquipment, rookFrom, rookTo);
    } else {
      // Queenside
      const rookFrom = (rank * 8 + 0) as Square;
      const rookTo = (rank * 8 + 3) as Square;
      newEquipment = transferEquipment(newEquipment, rookFrom, rookTo);
    }
  }

  newState = { ...newState, equipment: newEquipment };

  // Now flip the turn
  newState = {
    ...newState,
    turn: state.turn === 'white' ? 'black' : 'white',
  };

  return newState;
}
