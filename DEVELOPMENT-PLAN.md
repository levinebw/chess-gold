# Chess Gold — Development Plan

> Task tracker across all phases. Shows which tasks are defined, their status, and which phases still need task breakdown.

---

## Phase 1 — MVP: Local 2-Player Chess Gold (`v0.1`) ✅ COMPLETE

Local hot-seat Chess Gold with full rules engine, shop, placement, promotion, and game over detection.

| Task | Role | Title | Status |
|------|------|-------|--------|
| 001 | Lead Dev | Project Scaffolding + Foundation Types | ✅ Complete |
| 001 | QA | Test Infrastructure + Gold Economy Tests (RED) | ✅ Complete |
| 002 | Lead Dev | Implement Gold Economy Module (GREEN) | ✅ Complete |
| 002 | QA | Placement Validation Tests (RED) | ✅ Complete |
| 003 | Lead Dev | Implement Placement Validation Module (GREEN) | ✅ Complete |
| 003 | QA | Promotion + Position Tests (RED) | ✅ Complete |
| 004 | Lead Dev | Implement Position + Promotion Modules (GREEN) | ✅ Complete |
| 004 | QA | Game Reducer Tests (RED) | ✅ Complete |
| 005 | Lead Dev | Implement Game Reducer (GREEN) | ✅ Complete |
| 005 | QA | Engine Hardening: Edge Case Tests + Coverage | ✅ Complete |
| 006 | Lead Dev | UI Foundation: React Shell + Chessground Board | ✅ Complete |
| 006 | QA | Manual UI Smoke Test + Component Test Scaffolding | ✅ Complete |
| 007 | Lead Dev | Game Controls: Shop, Placement, and Game Over | ✅ Complete |
| 007 | QA | E2E Smoke Tests + Full MVP Playtest | ✅ Complete |
| 008 | Lead Dev | Fix Placement Mode UI Bugs | ✅ Complete |
| 008 | QA | Real-User Playtest (Hands-On Browser Testing) | ✅ Complete |
| 009 | Lead Dev | Deploy to GitHub Pages (Alpha) | ✅ Complete |
| 010 | QA | Test Pawn Promotion Flow | ✅ Complete |

**Bugfix docs:** QA-BUG-001, QA-BUG-002, BUGFIX-PLAN-MVP-UI

---

## Phase 2 — UI/UX Polish (`v0.2`) ✅ COMPLETE

Rules screen, visual feedback, sound effects, undo, and QA regression.

| Task | Role | Title | Status |
|------|------|-------|--------|
| 011 | Lead Dev | Add CI Test Step to Deploy Workflow | ✅ Complete |
| 012 | Lead Dev | Rules / How-to-Play Screen | ✅ Complete |
| 013 | Lead Dev | Visual Feedback (last move, check glow, gold pulse) | ✅ Complete |
| 014 | Lead Dev | Sound Effects + Mute Toggle | ✅ Complete |
| 015 | QA | Phase 2 Regression Playtest | ✅ Complete |
| 016 | Lead Dev | Undo Move | ✅ Complete |
| 022 | Visual Designer | Gold Coin Icon | ✅ Complete |

**Additional work done during Phase 2 (from playtester feedback):**
- Promotion cost changed from 1g to 3g
- Configurable starting gold (1, 3, 5, 10, 100)
- Check + placement crash fix
- Placement-blocks-and-checks fix
- Responsive scaling for mobile
- Gold icon changed to 🪙

---

## Phase 3 — Web Deployment (`v0.3`) ✅ COMPLETE

Deployed to GitHub Pages via GitHub Actions.

| Task | Role | Title | Status |
|------|------|-------|--------|
| 009 | Lead Dev | Deploy to GitHub Pages | ✅ Complete |

> Phase 3 was completed alongside Phase 1 (Task 009). CI test step added in Phase 2 (Task 011).

**Live URL:** https://levinebw.github.io/chess-gold/

---

## Phase 4 — Online Multiplayer (`v0.4`) ✅ COMPLETE

GCP Cloud Run + Socket.IO. See `tasks/PHASE-4-INFRA-DECISION.md` for architecture rationale.

| Task | Role | Title | Status |
|------|------|-------|--------|
| 017 | Lead Dev | Extract Shared Engine Package | ✅ Complete |
| 018 | Lead Dev | Multiplayer Server: Room System + Socket.IO | ✅ Complete |
| 019 | Lead Dev | Multiplayer Client: Lobby UI + Network Integration | ✅ Complete |
| 020 | Lead Dev | Deploy Server to GCP Cloud Run | ✅ Complete |
| 021 | QA | Multiplayer Integration Testing | ✅ Complete |

**Dependencies:**
- Task 017 → 018, 019 (shared engine must be extracted first)
- Tasks 018 + 019 → 020 (server and client must work before deploy)
- Tasks 018-020 → 021 (QA blocked until deployed)
- Task 020 requires ~15 min user setup (GCP project, billing, service account)

---

## Phase 5 — Bot Opponent (`v0.5`) ✅ COMPLETE

Heuristic AI for single-player mode with three difficulty levels.

| Task | Role | Title | Status |
|------|------|-------|--------|
| 024 | Lead Dev | Last Move Highlight for Piece Placements | ✅ Complete |
| 025 | Lead Dev | Resign and Draw Buttons | ✅ Complete |
| 026 | Lead Dev | Bot Engine: Core AI Module | ✅ Complete |
| 027 | Game Designer | Bot Personas: Lizzie, Maxi, Mona | ✅ Complete |
| 028 | Lead Dev | Bot Game Mode: UI Integration | ✅ Complete |
| 029 | QA | Bot Engine Unit Tests | ✅ Complete |
| 030 | QA | Bot Playtest: Full Integration Testing | ✅ Complete |

**What was built:**
- Minimax search with alpha-beta pruning + quiescence search
- Material, positional, center control, and king safety evaluation
- Gold spending strategy (persona-weighted buy vs. move decisions)
- Three bot personas: Lizzie (easy, depth 1), Maxi (medium, depth 2), Mona (hard, depth 3)
- Bot game mode UI with persona selector, thinking indicator, auto-play, double undo
- Premove support (Chessground built-in premovable)
- 20 bot engine tests

**Performance work (post-playtest):**
- Time budget (2s deadline) flowing through all search functions
- Single FEN parse per move generation (`TaggedMove` interface)
- Lightweight `applyMoveForSearch` bypassing game.ts (3x faster per node)
- Position fallback for variant FENs (Conqueror mode compatibility)
- Quiescence depth reduced from 3 to 2

---

## Phase 6 — Conqueror Chess + Standard Chess (`v0.6`) ✅ COMPLETE

Game modes 4 and 9. Mode selector UI.

| Task | Role | Title | Status |
|------|------|-------|--------|
| — | Lead Dev | Mode Selector UI (ModeSelector.tsx) | ✅ Complete |
| — | Lead Dev | Standard Chess Mode (no gold, standard start) | ✅ Complete |
| — | Lead Dev | Conqueror Chess: Piece Conversion Engine | ✅ Complete |
| — | Lead Dev | Conqueror Chess: All-Converted Win Condition | ✅ Complete |
| — | Lead Dev | No-Economy UI Mode (hide shop/gold when goldEconomy=false) | ✅ Complete |
| — | QA | Mode Integration Testing + Mobile Responsive | ✅ Complete |

**What was built:**
- Mode selector in lobby with all 9 mode presets defined in config
- Piece conversion logic in `applyMove` (captured piece → attacker's origin, switches color)
- `checkAllConverted` win condition checker
- `createPosition` fallback for variant positions (pawns on back rank, piece overflow)
- Bot compatibility across all modes
- Mobile responsive fixes for no-economy board sizing

> Phase 6 tasks were not formally numbered (implemented ad hoc during Phase 5 work).

---

## Phase 7 — Loot Boxes (`v0.7`) ✅ COMPLETE

Game mode 2 — the signature Chess Gold mode with loot boxes and items.

| Task | Role | Title | Status |
|------|------|-------|--------|
| 031 | Lead Dev | Loot Box Core Engine: Spawn, Hit, Open, Reward | ✅ Complete |
| 032 | QA | Loot Box Core Engine Tests | ✅ Complete |
| 033 | Lead Dev | Inventory + Equipment Engine | ✅ Complete |
| 034 | QA | Inventory + Equipment Tests | ✅ Complete |
| 035 | Lead Dev | Loot Box Mode UI | ✅ Complete |
| 036 | QA | Loot Box Mode Playtest | ✅ Complete |
| 037 | Visual Designer | Custom Loot Box Asset — Medieval Treasure Chest | ✅ Complete |

**What was built:**
- Loot box spawning (ranks 4-5, every 4 turns, max 1 active)
- Hit mechanics (3 hits to open, queen opens in 1, pawn hits free)
- Auto-hit when piece moves adjacent while already attacking
- Drop table: gold (3-6g), pieces (to inventory), items (crossbow, turtle shell, crown)
- Equipment system: equip items to pieces with gold cost and special effects
- Custom 3-state treasure chest SVG (pristine → damaged → nearly open)
- Loot box mode UI: hit button, inventory panel, reward toast, counter
- Online multiplayer loot box support
- Bot AI loot box targeting
- Mode-aware rules dialog with loot box rules and item descriptions
- Win condition: collect 6 loot boxes

**Design decisions resolved:**
- King from drop table (0.01% weight) → treated as queen
- Crossbow: capture adjacent enemy without moving (costs 2g to equip)
- Piece rewards go to inventory (not forced immediate placement)

**Team:** Lead Developer + Visual Designer + QA Engineer

---

## Phase 8 — Full Platform (`v1.0`) 🔄 IN PROGRESS

Mobile polish, persistent identity, Elo ratings, player profiles.

| Task | Role | Title | Phase | Status |
|------|------|-------|-------|--------|
| 038 | Lead Dev | Mobile Fit & Finish | 8A | ✅ Complete |
| 039 | Backend Dev | Firestore Setup & Player Data Layer | 8B | ✅ Complete |
| 040 | Lead Dev | Guest Identity & Display Names | 8B | ✅ Complete |
| 041 | Lead Dev | Resign Action | 8C | ✅ Complete |
| 042 | Backend Dev | Elo Rating System | 8C | ✅ Complete |
| 043 | Lead Dev | Post-Game Rating Display & Rated/Casual UI | 8C | ✅ Complete |
| 044 | Lead Dev | Player Profiles & Leaderboard | 8D | ✅ Complete |
| 059 | Backend Dev | Backend Deployment: Firestore + Updated Cloud Run | 8E | ✅ Complete |
| 045 | QA | Phase 8 Regression & Integration Test | 8E | 🔲 Pending |

**Dependencies:**
- Task 039 → 040 (identity needs data layer)
- Task 040 → 041 (resign needs player identity for match recording)
- Tasks 039 + 040 + 041 → 042 (Elo needs data layer, identity, and resign)
- Task 042 → 043 (rating UI needs Elo backend)
- Tasks 042 + 043 → 044 (profiles need ratings and match data)
- Tasks 039-044 → 059 (deployment needs all backend features built)
- Task 059 → 045 (QA needs live backend to test against)

**Key design decisions:**
- Guest-only, no auth wall: display name + random token in localStorage
- Single overall Elo rating for v1 (not per-mode); Firestore is schemaless, per-mode can be added later
- K-factor: 32 for < 30 games, 16 otherwise. Floor at 100.
- Server-authoritative: Elo calculations and match recording happen server-side

**Team:** Lead Developer + Backend Developer + QA Engineer

---

## Phase 9 — King's Chess + Gold Mine (`v1.1`) 🔲 PENDING

Game modes 5 and 3. King's Chess reuses piece conversion (Phase 6) and gold economy (Phase 1), adding placement throttle. Gold Mine adds unrestricted placement and all-eliminated win condition.

| Task | Role | Title | Phase | Status |
|------|------|-------|-------|--------|
| 046 | Lead Dev | King's Chess: Placement Throttle Engine | 9A | 🔲 Pending |
| 047 | Lead Dev | Gold Mine: Unrestricted Placement + All-Eliminated Win Condition | 9A | 🔲 Pending |
| 048 | Lead Dev | Phase 9 UI: Mode Selector + Rules Dialog | 9B | 🔲 Pending |
| 049 | QA | Phase 9 Engine Tests + Playtest | 9C | 🔲 Pending |

**Dependencies:**
- Tasks 046 + 047 → 048 (UI integration needs engine logic first)
- Tasks 046 + 047 + 048 → 049 (QA blocked until all features complete)

**What already exists:**
- Piece conversion logic (Conqueror, Phase 6) — reused by King's Chess
- `all-converted` win condition — reused by King's Chess
- Gold economy — reused by King's Chess and Gold Mine
- Mode presets defined in `config.ts` for both modes

**What's new:**
- Placement throttle: can only place every other turn (King's Chess)
- `all-eliminated` win condition (Gold Mine)
- Unrestricted placement zones (Gold Mine)
- Infinite starting gold (Gold Mine)

**Open question:** OQ-4 (Gold Mine design) is tentatively resolved — infinite gold, place anywhere, win by elimination or checkmate. Pending final confirmation.

**Team:** Lead Developer + QA Engineer

---

## Phase 10 — Siege (`v1.2`) 🔲 PENDING

Game mode 6. The most technically complex remaining mode — introduces a center pulse timing system, temporary piece upgrades, and custom move generation that chessops cannot handle natively.

| Task | Role | Title | Phase | Status |
|------|------|-------|-------|--------|
| 050 | Lead Dev | Siege Engine: Center Pulse System + State Extensions | 10A | 🔲 Pending |
| 051 | Lead Dev | Siege Engine: Temporary Piece Upgrades + Custom Move Generation | 10A | 🔲 Pending |
| 052 | Lead Dev | Siege: Center-Occupied Win Condition + UI Integration | 10B | 🔲 Pending |
| 053 | QA | Siege Mode Tests + Playtest | 10C | 🔲 Pending |

**Dependencies:**
- Task 050 → 051 (upgrades need pulse system and state tracking)
- Tasks 050 + 051 → 052 (win condition + UI needs engine complete)
- Tasks 050 + 051 + 052 → 053 (QA blocked until all features complete)

**What already exists:**
- `centerPulse` flag in `GameModeConfig`
- Siege mode preset in `config.ts`
- Standard starting position support

**What's new:**
- Center pulse timing (every 5 half-moves, d4/d5/e4/e5)
- `GameState.siege` — pulse counter and upgraded piece tracking
- Temporary piece upgrades: pawn (king-like), knight (double jump), rook/bishop/queen (pass through one friendly)
- Custom move generation layer (`src/engine/siege.ts`)
- `center-occupied` win condition
- Pulse visual effects and upgrade indicators

**Open question:** OQ-2 — does upgrade persist for one move or until next pulse? Designer's read is one move only. Built for one-move upgrades.

**Team:** Lead Developer + QA Engineer

---

## Phase 11 — Flashlight Modes (`v1.3`) 🔲 PENDING

Game modes 7 and 8. Introduces fog of war and no-check mode — the most architecturally significant addition since multiplayer (Phase 4). Requires changes to the engine (legal move generation), UI (board masking), and server (visibility filtering).

| Task | Role | Title | Phase | Status |
|------|------|-------|-------|--------|
| 054 | Lead Dev | Flashlight Engine: No-Check Mode + King-Captured Win Condition | 11A | 🔲 Pending |
| 055 | Lead Dev | Flashlight Engine: Fog of War Visibility Calculation | 11A | 🔲 Pending |
| 056 | Lead Dev | Flashlight UI: Board Visibility Masking + Mode Integration | 11B | 🔲 Pending |
| 057 | Lead Dev | Flashlight Multiplayer: Server-Authoritative Visibility | 11C | 🔲 Pending |
| 058 | QA | Flashlight Modes Tests + Playtest | 11D | 🔲 Pending |

**Dependencies:**
- Task 054 → 055 (visibility needs no-check move generation for accurate legal dests)
- Tasks 054 + 055 → 056 (UI masking needs engine visibility)
- Tasks 054 + 055 → 057 (server filtering needs visibility calculation)
- Tasks 054-057 → 058 (QA blocked until all features complete)

**What already exists:**
- `fogOfWar` and `noCheck` flags in `GameModeConfig`
- Flashlight and Flashlight Gold presets in `config.ts`
- `game.ts` already skips checkmate detection when `noCheck: true`
- Socket.IO server with state broadcasting infrastructure

**What's new:**
- Override chessops king-safety filtering when `noCheck: true` (allow king-exposure moves)
- King capture as legal move
- `king-captured` win condition
- `src/engine/visibility.ts` — fog of war visibility calculation
- Placement filtered by visibility (Flashlight Gold)
- Board fog overlay + turn handoff screen (local play)
- Server-side state filtering (multiplayer anti-cheat: hidden pieces never sent to client)

**Open questions:** OQ-3 — exact visibility scope (default: own squares + reachable squares + blocking pieces). Placement in fog (default: restricted to visible squares within zone).

**Team:** Lead Developer + QA Engineer

---

## Summary

| Phase | Version | Description | Tasks | Status |
|-------|---------|-------------|-------|--------|
| 1 | v0.1 | MVP: Local 2-Player | 001-010 | ✅ Complete |
| 2 | v0.2 | UI/UX Polish | 011-016, 022 | ✅ Complete |
| 3 | v0.3 | Web Deployment | (009, 011) | ✅ Complete |
| 4 | v0.4 | Online Multiplayer | 017-021 | ✅ Complete |
| 5 | v0.5 | Bot Opponent | 024-030 | ✅ Complete |
| 6 | v0.6 | Conqueror + Standard Chess | (unnumbered) | ✅ Complete |
| 7 | v0.7 | Loot Boxes | 031-037 | ✅ Complete |
| 8 | v1.0 | Full Platform | 038-045 | 🔄 In progress |
| 9 | v1.1 | King's Chess + Gold Mine | 046-049 | 🔲 Pending |
| 10 | v1.2 | Siege | 050-053 | 🔲 Pending |
| 11 | v1.3 | Flashlight Modes | 054-058 | 🔲 Pending |
