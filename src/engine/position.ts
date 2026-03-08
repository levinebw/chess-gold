import { Chess } from 'chessops/chess';
import { parseFen, makeFen } from 'chessops/fen';
import type { Role as ChessopsRole } from 'chessops';
import type { GameState, Square, Role } from './types.ts';
import { awardCaptureReward } from './gold.ts';

function createPosition(fen: string): Chess {
  const setup = parseFen(fen);
  if (setup.isErr) throw new Error(`Invalid FEN: ${fen}`);
  const pos = Chess.fromSetup(setup.value);
  if (pos.isErr) throw new Error(`Invalid position: ${fen}`);
  return pos.value;
}

export function getLegalMoves(state: GameState): Map<Square, Square[]> {
  const pos = createPosition(state.fen);
  const allDests = pos.allDests();
  const result = new Map<Square, Square[]>();
  for (const [from, dests] of allDests) {
    const squares: Square[] = [...dests];
    if (squares.length > 0) {
      result.set(from as Square, squares as Square[]);
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

  let newFen: string;

  if (state.modeConfig.pieceConversion && isCapture && capturedRole !== null && capturedSquare !== null) {
    // Piece conversion capture: don't use pos.play() — manipulate the board directly.
    // Attacker stays on its square. Captured piece changes color in place.
    const setup = parseFen(state.fen);
    if (setup.isErr) throw new Error(`Invalid FEN: ${state.fen}`);

    // Convert the captured piece to the attacker's color
    setup.value.board.set(capturedSquare, { role: capturedRole, color: state.turn });

    // Handle en passant: remove the pawn from its actual square (it's not on `to`)
    if (isEnPassant) {
      // The en passant pawn was already set to capturer's color above at capturedSquare.
      // Clear the en passant target square if different from capturedSquare.
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
    pos.play({
      from,
      to,
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

  // Now flip the turn
  newState = {
    ...newState,
    turn: state.turn === 'white' ? 'black' : 'white',
  };

  return newState;
}
