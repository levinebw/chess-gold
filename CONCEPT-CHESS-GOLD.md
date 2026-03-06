# Chess GOLD

# Chess GOLD

**Description**
Chess Gold - A strategic twist on chess where both players start with only a king and must spend gold to recruit pieces onto the board, earning gold back by capturing the opponent's army.

## 1st Gamemode — Chess Gold (Core)

Start with only a king on the back rank respective to your color.
You also start with **3 gold** in your inventory.
It is an 8x8 board with checkered squares.

**This tight starting economy is intentional.**
Both players must make sharp decisions about when and what to buy with limited gold. Capturing enemy pieces and passive income are the primary ways to grow your treasury.

Each player earns **+1 gold per turn** (received at the start of your turn).

### On your turn you can do ONE of the following:

- **Move** a piece that's already on the board (free)
- **Place** a new piece from the shop onto the board (costs gold, uses your turn)

### Piece Prices

| Piece  | Cost to Place |
|--------|--------------|
| Pawn   | 1 gold       |
| Bishop | 3 gold       |
| Knight | 3 gold       |
| Rook   | 5 gold       |
| Queen  | 8 gold       |

### Placement Rules

- You may place a piece on any **unoccupied** square within the first 3 rows on your side of the board.
- **Pawns** may only be placed on **rows 2–3** (not the back rank, where they would be immobile).
- Placed pawns on row 2 **do** get the standard 2-square first move option.
- En passant applies normally.
- Placing a piece **uses your entire turn** but **can** be used to block check.

### Pawn Promotion

When a pawn reaches the opposite back rank, you may **promote it to any piece** (bishop, knight, rook, or queen) by paying **1 gold**. If you cannot afford the promotion, the pawn remains on the last rank until you can.

### Capturing & Gold Economy

Gold values use **0.5 increments** (fractional gold is allowed).

When you capture an opponent's piece, you receive **half its cost**:

| Piece Captured | Gold Earned |
|----------------|-------------|
| Pawn           | 0.5 gold    |
| Bishop         | 1.5 gold    |
| Knight         | 1.5 gold    |
| Rook           | 2.5 gold    |
| Queen          | 4 gold      |

### Win Condition

Checkmate the opponent's king. Standard chess rules for check, checkmate, and stalemate apply.

---

## 2nd Gamemode — Loot Boxes

**Same rules as Chess Gold, with loot boxes added.**

Every **3–5 rounds**, a loot box spawns on a random unoccupied square on the board.

### Opening a Loot Box

To claim a loot box, a piece must **move to an adjacent square** as its turn action. This counts as one "hit." After **3 hits** (from either or both sides), the box opens and the **last player to hit it** claims the contents. Queens open boxes in **one hit**.

- Hitting a loot box **uses your turn**.
- If all squares adjacent to a loot box are occupied, it cannot be hit until a square opens up.
- A hit does not move your piece onto the box's square — your piece stays on the adjacent square it moved to.

### Loot Box Contents

| Contents      | Probability |
|---------------|-------------|
| 3 gold        | 12.5%       |
| 4 gold        | 6.25%       |
| 5 gold        | 6.25%       |
| 6 gold        | 6.25%       |
| Pawn          | 18.75%      |
| Bishop        | 12.5%       |
| Knight        | 12.5%       |
| Rook          | 6.25%       |
| Turtle Shell  | 6.25%       |
| Crossbow      | 6.25%       |
| Crown         | 6.24%       |
| King          | 0.01%       |

- **Piece rewards** go directly into your inventory and can be placed on a future turn (following normal placement rules, but for free since they were looted — not purchased).
- **Gold rewards** are added to your treasury immediately.
- **Item rewards** go into your inventory for later use.

### Special Items

Items can be **equipped to your pieces** and **do not use up your turn** to apply. Equipping costs gold.

| Item         | Effect | Equip Cost |
|--------------|--------|------------|
| Crossbow     | +1 piercing — the piece can capture an additional piece in the same move along its line of attack | 2 gold |
| Turtle Shell | +1 hit to capture — an opponent must capture this piece twice to remove it (also blocks one piercing hit) | 2 gold |
| Crown        | Transform the equipped piece into **any** piece except a king | 3.5 gold |

---

## 3rd Gamemode — Gold Mine

**Anything goes.** The only rule: you can only take or move **1 piece per turn.** All other restrictions (placement zones, pricing, gold economy) are removed.

> *Note: This mode needs further definition before implementation. What is the starting gold? Are pieces free to place anywhere? What is the win condition? Clarify before building.*

---

## 4th Gamemode — Conqueror Chess

Like **normal chess** (standard starting positions, no gold economy), except:

- When you **capture** an opponent's piece, it **changes to your color** and becomes yours (placed where the capture happened).
- **Win condition:** All pieces on the board are your color.

---

## 5th Gamemode — King's Chess

Same rules as **Chess Gold** (gamemode 1), with these additions:

- When you **capture** a piece, it **changes to your color** (like Conqueror).
- **Win condition:** All opponent pieces (including placed ones) are converted to your color.
- You may only **place** a piece (spend gold) on **every other turn** to prevent spam stalemates.

---

## Layout & Online Features

Menu similar to [lichess.org](http://lichess.org):

- Rated and casual games
- Bot opponents
- Random pairing
- Lobbies
- Elo rating system (increases/decreases with wins and losses)

---

## Suggested Build Phases

| Phase   | Scope |
|---------|-------|
| **MVP** | Gamemode 1 (Chess Gold) — local 2-player pass-and-pay on one board |
| **v0.2** | UI/UX improvements, tutorial/rules screen, sound | 
| **v0.3** | Deploy as a web app — playable in browser, shareable link, still local 2-player |
| **v0.4** | Online 2-player — real-time multiplayer via WebSockets, basic matchmaking | 
| **v0.5** | Simple bot opponent — basic heuristic AI (not strong, just functional) for solo play |
| **v0.6** | Gamemode 4 (Conqueror) — simplest variant to add |
| **v0.7** | Gamemode 2 (Loot Boxes) — adds items and RNG layer |
| **v1.0** | Lobbies, Elo, rated/casual games - full online platform | 
| **v1.1** | remaining gamemodes (3, 5) |

Copyright 2026 Zaden and Company
