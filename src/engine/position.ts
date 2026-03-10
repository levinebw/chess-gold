import { Chess, Castles } from 'chessops/chess';
import { parseFen, makeFen } from 'chessops/fen';
import type { Role as ChessopsRole } from 'chessops';
import type { GameState, Square, Role } from './types.ts';
import { awardCaptureReward } from './gold.ts';

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
