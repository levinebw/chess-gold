# QA Bug Report — Checkmate Tests Use Invalid Positions

## Affected Tests (3 failures)

### 1. `game.test.ts` line 343-356: "detects checkmate and sets status to checkmate"
### 2. `game.test.ts` line 387-401: "sets the winner when checkmate occurs"

**FEN:** `6k1/R7/7R/K7/8/8/8/8 w - - 0 1`
**Move:** Rh6-h8

After the move, position is `6kR/R7/8/K7/8/8/8/8 b`. Black king on g8 can capture the undefended rook on h8 (the rook on a7 does not defend h8). chessops correctly reports `isCheckmate() === false`.

**Fix:** The rook delivering check needs to be defended. For example, move from `Rh6-h7` instead of `Rh6-h8`, then both rooks defend each other on adjacent ranks:
- Pre-move FEN: `6k1/R7/7R/K7/8/8/8/8 w - - 0 1`
- Move: Rh6-h7 (not h8)
- After: `6k1/R6R/8/K7/8/8/8/8 b` — Ra7 and Rh7 both on rank 7. King on g8 can go to: f8 (not attacked? Ra7 is on a-file not f-file, Rh7 is rank 7 not rank 8... f8 IS safe). Not checkmate either.

Better approach — use a FEN where one rook is already in position and the other delivers a checkmate with defense:
- FEN: `6k1/R7/8/K7/8/8/8/7R w - - 0 1`
- Move: Rh1-h8. After: `6kR/R7/8/K7/8/8/8/8 b`. Same problem — Rh8 undefended.

For true ladder mate, the rooks need to be on adjacent ranks/files covering each other:
- FEN: `8/R5k1/8/K7/8/8/8/7R w - - 0 1` (Ra7, Kb5, Rh1, Kg7)
- Move: Rh1-h8. After: `7R/R5k1/8/K7/8/8/8/8 b`
- Kg7 can go to: f6, f7 (Ra7 rank 7!), f8, g6, g8, h7 (Ra7 rank 7!), h8 (Rh8!)
- f6 safe? Not on a-file, h-file, rank 7, or rank 8. Not attacked by Ka5. YES f6 is safe. Still not checkmate.

The challenge is that two rooks alone (without king support cutting off escape) need the king nearby to deliver checkmate. A simpler approach for the test:

**Recommended FEN for checkmate test:**
```
1R4k1/6pp/6N1/8/8/8/8/4K3 w - - 0 1
```
White: Ke1, Rb8, Ng6. Black: Kg8, g7 pawn, h7 pawn.
Move: Rb8-b8 already in place... Actually just use a known checkmate-in-one:

```
6k1/5ppp/8/8/8/8/8/4K2R w - - 0 1
```
Move: Rh1-h8#. King on g8, pawns on f7/g7/h7 block escape. Rh8 delivers mate on rank 8. h7 pawn blocks Kh7. g7/f7 block Kg7/Kf7. Kf8 — is f8 attacked by Rh8? Rh8 is on rank 8, so yes f8 is attacked! CHECKMATE.

### 3. `game.test.ts` line 438-501: "can play a sequence of moves and placements to reach checkmate"

The 19-move ladder mate sequence ends with `Ra6-a8` producing position `R5k1/7R/8/1K6/8/8/8/8 b`. Black king on g8 can capture the undefended rook on h7. Not checkmate.

**Fix:** The move sequence needs to be redesigned so the final position has both rooks defending each other. Alternatively, the approach could involve buying pawns to block escape squares, making the checkmate valid.

## Root Cause
Ladder mate requires the rooks to alternate ranks/files in a way that each rook defends the other. The test sequences leave the final checking rook undefended.
