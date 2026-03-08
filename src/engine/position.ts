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

  if (capturedPiece && capturedPiece.role !== 'king') {
    capturedRole = capturedPiece.role;
    capturedSquare = to;
  } else if (isEnPassant) {
    capturedRole = 'pawn';
    // En passant: captured pawn is one rank behind the target square
    capturedSquare = state.turn === 'white' ? to - 8 : to + 8;
  }

  pos.play({
    from,
    to,
    promotion: promotion as ChessopsRole | undefined,
  });

  let newFen = makeFen(pos.toSetup());

  // Piece conversion: capturing piece returns to its origin square,
  // captured piece stays on its square but changes to the capturer's color
  if (state.modeConfig.pieceConversion && capturedRole !== null && capturedSquare !== null) {
    const setup = parseFen(newFen);
    if (!setup.isErr) {
      // Move the capturing piece back to where it started
      const attackerOnTarget = setup.value.board.get(to);
      if (attackerOnTarget) {
        setup.value.board.set(from, attackerOnTarget);
        setup.value.board.delete(to);
      }
      // Place the captured piece on its square in the capturer's color
      setup.value.board.set(capturedSquare, { role: capturedRole, color: state.turn });
      newFen = makeFen(setup.value);
    }
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
