# Chess Gold

A strategic twist on chess where both players start with only a king and must spend gold to recruit pieces onto the board, earning gold back by capturing the opponent's army.

## Play

[Play Chess Gold](https://levinebw.github.io/chess-gold/) (alpha)

## Game Concept

In Chess Gold, the familiar mechanics of chess meet an economic metagame:

- **Start with nothing** — each player begins with only their king and 3 gold
- **Buy your army** — spend gold to place pieces on the board (pawns, bishops, knights, rooks, queens)
- **Earn through combat** — capturing enemy pieces earns back gold (half the piece's purchase cost)
- **Passive income** — gain +1 gold at the start of each turn
- **Win by checkmate** — standard chess win conditions apply

Every turn, you choose: move a piece already on the board, or spend gold to place a new one. The tension between building your army and using it creates a unique strategic layer on top of chess fundamentals.

## Game Modes

Chess Gold includes multiple game modes with different rule sets:

| Mode | Description |
|------|-------------|
| **Chess Gold** | Core mode — gold economy + piece placement |
| **Loot Boxes** | Chess Gold + random loot box drops with items and power-ups |
| **Gold Mine** | Unrestricted variant — anything goes |
| **Conqueror** | Standard chess, but captured pieces switch sides |
| **King's Chess** | Chess Gold + piece conversion + placement throttle |
| **Siege** | Standard chess + center square pulse mechanic |
| **Flashlight** | Fog of war — you only see what your pieces can reach |
| **Flashlight Gold** | Flashlight + Chess Gold combined |
| **Standard Chess** | Classic chess (baseline mode) |

Modes can be combined via a feature flag system for custom rule sets.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Language | TypeScript |
| Build | Vite |
| Chess Rules | [chessops](https://github.com/niklasf/chessops) |
| Board UI | [Chessground](https://github.com/lichess-org/chessground) |
| UI Framework | React |
| Unit Tests | Vitest |
| E2E Tests | Playwright |

## Project Status

**Phase 1 (MVP)** — Local 2-player Chess Gold is playable in browser. Deployed to GitHub Pages.

See [ARCHITECTURE.md](ARCHITECTURE.md) for the full system architecture, data model, and phase plan.

## Build Phases

| Phase | Milestone |
|-------|-----------|
| **Phase 1 (MVP)** | Local 2-player Chess Gold — playable in browser |
| Phase 2 | UI/UX polish, sound, tutorial |
| Phase 3 | Web deployment |
| Phase 4 | Online multiplayer (WebSocket) |
| Phase 5 | Bot opponent |
| Phases 6-11 | Additional game modes + full platform (lobbies, Elo, matchmaking) |

## Documentation

| Document | Purpose |
|----------|---------|
| [CONCEPT-CHESS-GOLD.md](CONCEPT-CHESS-GOLD.md) | Full game design specification |
| [ARCHITECTURE.md](ARCHITECTURE.md) | System architecture, data model, phase plan, ADRs |
| [RESEARCH-CHESS-ENGINES.md](RESEARCH-CHESS-ENGINES.md) | Chess library evaluation |

## License

This project uses [chessops](https://github.com/niklasf/chessops) and [Chessground](https://github.com/lichess-org/chessground), both licensed under GPL-3.0. Accordingly, this project is licensed under the **GNU General Public License v3.0**.

See [LICENSE](LICENSE) for details.

Copyright 2026 Zaden and Company
