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

## Phase 4 — Online Multiplayer (`v0.4`) 📋 TASKS DEFINED

GCP Cloud Run + Socket.IO. See `tasks/PHASE-4-INFRA-DECISION.md` for architecture rationale.

| Task | Role | Title | Status |
|------|------|-------|--------|
| 017 | Lead Dev | Extract Shared Engine Package | ✅ Complete |
| 018 | Lead Dev | Multiplayer Server: Room System + Socket.IO | 🔄 In progress |
| 019 | Lead Dev | Multiplayer Client: Lobby UI + Network Integration | ⬚ Not started |
| 020 | Lead Dev | Deploy Server to GCP Cloud Run | ⬚ Not started |
| 021 | QA | Multiplayer Integration Testing | ⬚ Not started |

**Dependencies:**
- Task 017 → 018, 019 (shared engine must be extracted first)
- Tasks 018 + 019 → 020 (server and client must work before deploy)
- Tasks 018-020 → 021 (QA blocked until deployed)
- Task 020 requires ~15 min user setup (GCP project, billing, service account)

---

## Phase 5 — Bot Opponent (`v0.5`) 🔲 TASKS NOT YET DEFINED

Heuristic AI for single-player mode.

**Planned scope (from ARCHITECTURE.md):**
- Heuristic AI (not strong, just functional)
- Material evaluation + simple lookahead
- Gold spending strategy (when to buy, what to buy)
- Difficulty levels (easy / medium)

**Team:** Lead Developer or Game/Logic Engineer

---

## Phase 6 — Conqueror Chess + Standard Chess (`v0.6`) 🔲 TASKS NOT YET DEFINED

Game modes 4 and 9.

**Planned scope:**
- Game mode selector in UI
- **Standard Chess (mode 9):** All custom flags off, `standardStart: true` — baseline "just play chess"
- **Conqueror Chess (mode 4):** Standard starting positions, no gold economy. Captured pieces change color. Win condition: `all-converted`
- Piece conversion engine logic (reusable for King's Chess later)

**Team:** Lead Developer + QA Engineer

---

## Phase 7 — Loot Boxes (`v0.7`) 🔲 TASKS NOT YET DEFINED

Game mode 2 — the signature Chess Gold mode with loot boxes and items.

**Planned scope:**
- Loot box spawning (every 4 rounds, max 1 on board)
- Hitting mechanics (3 hits to open, 1 for queen, pawns hit adjacent)
- Opening and reward distribution (weighted drop table)
- Item system: Crossbow, Turtle Shell, Crown
- **Piece identity layer** — unique IDs for equipment tracking
- Inventory + equipment UI
- Alternate win condition: collect 6 loot boxes
- Two Kings rule (if king from loot box — pending spec clarification)

**Team:** Lead Developer + QA Engineer

---

## Phase 8 — Full Platform (`v1.0`) 🔲 TASKS NOT YET DEFINED

Lobbies, ratings, profiles, game history.

**Planned scope:**
- Lobbies
- Elo rating system
- Rated vs. casual games
- Player profiles
- Game history / replay
- Database (PostgreSQL or SQLite)

**Team:** Lead Developer + Backend Developer + QA Engineer

---

## Phase 9 — King's Chess + Gold Mine (`v1.1`) 🔲 TASKS NOT YET DEFINED

Game modes 5 and 3.

**Planned scope:**
- **King's Chess (mode 5):** Chess Gold + piece conversion + placement throttle (every other turn). Win: `all-converted`
- **Gold Mine (mode 3):** Needs design clarification (starting gold? placement rules?). Win: `all-eliminated` or `checkmate`

**Team:** Lead Developer + QA Engineer

---

## Phase 10 — Siege (`v1.2`) 🔲 TASKS NOT YET DEFINED

Game mode 6.

**Planned scope:**
- Center square pulse every 5 moves (d4/d5/e4/e5)
- Temporary one-move upgrades per piece type
- Custom move generation layer (chessops can't handle natively)
- Win condition: all 4 center squares occupied OR checkmate
- Standard start, no gold economy

**Pending clarification:** Does upgrade persist for one move or until next pulse?

**Team:** Lead Developer + QA Engineer

---

## Phase 11 — Flashlight Modes (`v1.3`) 🔲 TASKS NOT YET DEFINED

Game modes 7 and 8.

**Planned scope:**
- **Flashlight (mode 7):** Fog of war — see only reachable squares. No check exists. King capture = win. Standard start.
- **Flashlight Gold (mode 8):** Flashlight + Chess Gold combined.
- Engine: disable check filtering when `noCheck: true`
- UI: show/hide squares per visibility
- **Multiplayer required** for proper fog of war (server-authoritative visibility)

**Pending from designer:**
- Exact visibility scope
- Placement rules in fog (Flashlight Gold)

**Team:** Lead Developer + QA Engineer

---

## Summary

| Phase | Version | Description | Tasks | Status |
|-------|---------|-------------|-------|--------|
| 1 | v0.1 | MVP: Local 2-Player | 001-010 | ✅ Complete |
| 2 | v0.2 | UI/UX Polish | 011-016, 022 | ✅ Complete |
| 3 | v0.3 | Web Deployment | (009, 011) | ✅ Complete |
| 4 | v0.4 | Online Multiplayer | 017-021 | 📋 Defined |
| 5 | v0.5 | Bot Opponent | — | 🔲 Not defined |
| 6 | v0.6 | Conqueror + Standard Chess | — | 🔲 Not defined |
| 7 | v0.7 | Loot Boxes | — | 🔲 Not defined |
| 8 | v1.0 | Full Platform | — | 🔲 Not defined |
| 9 | v1.1 | King's Chess + Gold Mine | — | 🔲 Not defined |
| 10 | v1.2 | Siege | — | 🔲 Not defined |
| 11 | v1.3 | Flashlight Modes | — | 🔲 Not defined |
