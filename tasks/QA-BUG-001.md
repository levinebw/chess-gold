# QA Bug Report — Invalid Checkmate FEN

## File
`test/engine/position.test.ts`, line 92-96

## Test
"detects checkmate" in `checkmate detection` describe block

## Issue
The FEN `4k3/8/8/8/8/8/6q1/7K w - - 0 1` is not checkmate. White king on h1 can capture the undefended black queen on g2 (square 14). chessops correctly reports `isCheckmate() === false`.

## Fix
The queen on g2 needs a defender. Suggested replacement FEN:

```
4k1r1/8/8/8/8/8/6q1/7K w - - 0 1
```

This adds a black rook on g8 defending the queen. Now h1 king has no escape:
- g1: attacked by queen
- h2: attacked by queen
- g2 (capture queen): defended by rook on g8

## Impact
1 test fails. All other position tests pass (11/12).
