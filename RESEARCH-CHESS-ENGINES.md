# Chess Engine Research Results

## Summary

Research into open source chess libraries, engines, and UI frameworks for building Chess Gold — a browser-based chess variant with an economic metagame.

---

## Recommended Stack: chessops + Chessground

| Layer | Library | What it does | License |
|-------|---------|-------------|---------|
| **Board UI** | [Chessground](https://github.com/lichess-org/chessground) | Renders board, drag-and-drop, animations. Variant-agnostic — no chess logic inside. 10K gzipped, no dependencies. | GPL-3.0 |
| **Chess Rules** | [chessops](https://github.com/niklasf/chessops) | Move generation, check/checkmate detection. Has Crazyhouse variant with **piece drops** — close to Chess Gold's placement mechanic. Designed for extension via abstract `Position` class. | GPL-3.0 |
| **Game Logic** | Custom code | Gold economy, shop, items, loot boxes, turn management, game modes | — |

**Why this combination:**
- chessops was designed for variant support — the Crazyhouse piece-drop implementation is a head start on Chess Gold's placement system
- Chessground is explicitly "chess-variant agnostic" and has built-in chessops integration via `chessgroundDests()`
- Both are battle-tested at scale (they power lichess.org)
- GPL-3.0 is acceptable for a browser game where source is visible anyway

---

## Alternative Stack: chess.js + react-chessboard (MIT licensed)

| Layer | Library | What it does | License |
|-------|---------|-------------|---------|
| **Board UI** | [react-chessboard](https://github.com/Clariity/react-chessboard) | React component, custom pieces, extensive event handling | MIT |
| **Chess Rules** | [chess.js](https://github.com/jhlywa/chess.js) | Standard move validation, FEN/PGN parsing | BSD-2-Clause |
| **Game Logic** | Custom code | Same as above | — |

**Trade-offs vs. recommended:**
- (+) Permissive licenses (MIT + BSD)
- (+) Large React ecosystem
- (-) chess.js has no variant support — requires heavier forking
- (-) No built-in integration between the two libraries
- (-) chess.js is less architecturally suited to extension than chessops

---

## Other Libraries Evaluated

### Rules/Logic Libraries

| Library | Stars | License | Verdict |
|---------|-------|---------|---------|
| [js-chess-engine](https://github.com/josefjadrny/js-chess-engine) | Active | MIT | Standard chess only, includes AI. No variant support. **Not suitable.** |
| [node-chess](https://github.com/Seikho/node-chess) | 22 | Unclear | Designed for custom rules but unmaintained, risky. **Not recommended.** |
| [Fairy-Stockfish / ffish.js](https://github.com/fairy-stockfish/Fairy-Stockfish) | Large | GPL-3.0 | Powerful variant engine (WASM) but config system can't express gold economy. Overkill. Potentially useful later for **AI opponents**. |

### Board UI Libraries

| Library | Stars | License | Verdict |
|---------|-------|---------|---------|
| [cm-chessboard](https://github.com/shaack/cm-chessboard) | 283 | MIT | SVG-rendered, extension system. Good middle-ground but less proven than Chessground. |
| [chessboard.js](https://github.com/oakmac/chessboardjs) | 2.1k | MIT | Legacy, requires jQuery. **Not recommended.** |
| [chessboard2](https://github.com/oakmac/chessboard2) | 110 | ISC | Pre-release (v0.5.0), written in ClojureScript. **Not stable enough.** |
| [chessboard-element](https://github.com/justinfagnani/chessboard-element) | Moderate | MIT | Web Component, framework-agnostic. Less feature-rich than Chessground. |
| [gchessboard](https://github.com/mganjoo/gchessboard) | Small | MIT | Best accessibility features. Niche pick. |

### Full Frameworks

| Library | License | Verdict |
|---------|---------|---------|
| [Jocly](https://github.com/mi-g/jocly) | AGPL-3.0 | 100+ board games, 2D/3D/VR. Too heavy, too restrictive, likely unmaintained. **Not recommended.** |
| [Fairyground](https://github.com/ianfab/fairyground) | GPL-3.0 | Chessground + Fairy-Stockfish demo. Useful as **reference code** for wiring Chessground to a custom engine. |
| [pychess-variants](https://github.com/gbtami/pychess-variants) | AGPL-3.0 | Full variant server (Python + Chessground). Good **architectural reference** for how to build a variant web app. |

---

## What Must Be Custom Code

Regardless of which stack is chosen, these Chess Gold features are entirely custom:

- Gold economy engine (balance tracking, +1/turn income, purchase validation)
- Piece placement system (shop UI, placement zone validation, turn-type choice)
- Pawn promotion with gold cost
- Item system (Crossbow, Turtle Shell, Crown) and equipment mechanics
- Loot box spawning, hitting, opening, and reward distribution
- Game mode manager (Chess Gold, Loot Boxes, Conqueror, King's Chess, Gold Mine)
- Conqueror/King's Chess piece color-changing capture mechanics
- Turn state machine (move vs. place vs. equip item vs. hit loot box)
- Eventually: multiplayer networking, matchmaking, Elo, bot AI

The chess libraries handle **spatial mechanics** (how pieces move, what's check, is this checkmate). Everything else is Chess Gold's unique game design.

---

## Bottom Line

**chessops + Chessground** is the strongest foundation. The Crazyhouse piece-drop mechanic gives a head start on Chess Gold's core placement system, and the variant-aware architecture means the libraries were designed for exactly this kind of extension.
