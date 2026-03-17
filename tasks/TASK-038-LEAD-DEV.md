# TASK-038: Phase 8A — Mobile Fit & Finish

**Role:** Lead Developer
**Phase:** 8A
**Status:** COMPLETE
**Priority:** High

## Context

The game is playable on mobile but not polished. The 900px breakpoint switches to vertical layout, but below that there's no phone-specific optimization. Touch targets are too small (28-32px vs 44px Apple HIG minimum), the side panel creates excessive vertical scrolling, dialogs have oversized padding, and the lobby mode cards are cramped at 4-across on a 375px screen.

This task adds phone-specific CSS breakpoints to make the game comfortable on 375-430px portrait screens.

## Scope

**Single file:** `src/styles/main.css` — CSS only, no React component changes.

**New breakpoints** (append after existing `@media (max-width: 900px)` block):
- `@media (max-width: 480px)` — Phone
- `@media (max-width: 360px)` — Small phone

## Changes

### Global (no media query)

- [ ] `html, body { overflow-x: hidden; }` — prevent horizontal scroll bounce

### `@media (max-width: 480px)` — Phone breakpoint

**1. Root & layout spacing — tighter padding**
- [ ] `#root`: padding `0.5rem` (was 1rem)
- [ ] `.game-layout`, `.game-content`: gap `0.6rem` (was 1rem)
- [ ] `.side-panel`: gap `0.6rem`

**2. Header — wrap to two rows**
- [ ] `.game-header`: `flex-wrap: wrap; gap: 0.4rem`
- [ ] `.game-header h1`: `font-size: 1rem; width: 100%` (title takes full first row)
- [ ] `.header-actions`: `width: 100%; justify-content: flex-start; gap: 0.5rem; flex-wrap: wrap`
- [ ] `.turn-indicator`: `flex-direction: row; gap: 0.4rem; margin-left: auto`

**3. Touch targets — 44px minimum**
- [ ] `.undo-button, .new-game-header-button`: `min-height: 44px; padding: 0.5rem 1rem`
- [ ] `.rules-button, .flip-button`: `width: 44px; height: 44px; font-size: 1.2rem`
- [ ] `.mute-button`: `min-width: 44px; min-height: 44px; font-size: 1.3rem`
- [ ] `.starting-gold-select`: `min-height: 44px`
- [ ] `.shop-piece`: `min-height: 44px; padding: 0.6rem 0.75rem`
- [ ] `.inventory-piece, .inventory-item`: `min-height: 44px; padding: 0.6rem 0.75rem`
- [ ] `.hit-button`: `min-height: 44px; padding: 0.6rem 0.75rem`
- [ ] `.back-to-lobby`: `min-height: 44px; padding: 0.6rem 1rem`

**4. Board — maximize width**
- [ ] `.board-wrapper`: `width: min(480px, calc(100vw - 1rem))` (matches 0.5rem root padding)

**5. Shop — 2-column grid**
- [ ] `.shop-pieces`: `display: grid; grid-template-columns: 1fr 1fr; gap: 0.35rem` (halves vertical space from ~200px to ~120px)

**6. Inventory — 2-column grid**
- [ ] `.inventory-pieces, .inventory-items`: `display: grid; grid-template-columns: 1fr 1fr; gap: 0.35rem`

**7. Action history — compact**
- [ ] `.action-history`: `max-height: 100px` (was 200px)

**8. Dialogs — responsive padding**
- [ ] `.rules-dialog`: `max-width: calc(100vw - 2rem); padding: 1rem; max-height: 85vh`
- [ ] `.game-over-dialog`: `padding: 1.5rem; max-width: calc(100vw - 2rem)`
- [ ] `.loot-reward-toast`: `max-width: calc(100vw - 1rem); padding: 0.6rem 0.75rem 0.6rem 1rem`
- [ ] `.loot-reward-icon`: `font-size: 1.4rem`

**9. Lobby — 2x2 grid mode/bot cards**
- [ ] `.lobby-mode-cards`: `display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem`
- [ ] `.lobby-bot-cards`: `display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem`
- [ ] `.lobby`: `padding: 1.5rem 0.75rem`
- [ ] `.lobby h1`: `font-size: 1.5rem`

**10. Online status bar**
- [ ] `.online-status-bar`: `flex-wrap: wrap; gap: 0.5rem; font-size: 0.75rem`

### `@media (max-width: 360px)` — Small phone breakpoint

- [ ] `#root`: padding `0.25rem`
- [ ] `.board-wrapper`: `width: calc(100vw - 0.5rem)`
- [ ] `.game-header h1`: `font-size: 0.9rem`
- [ ] `.shop-pieces`: `grid-template-columns: 1fr` (single column fallback)
- [ ] `.lobby-mode-cards, .lobby-bot-cards`: `grid-template-columns: 1fr` (single column)

## Acceptance Criteria

- [ ] All interactive elements are >= 44px touch target on phones
- [ ] Board maximizes available width on 375-430px screens
- [ ] Shop and inventory use 2-column grid (not vertical stack) on phones
- [ ] Header wraps cleanly to two rows on narrow screens
- [ ] Dialogs (rules, game over, reward toast) fit on 375px screens without overflow
- [ ] Lobby mode cards display as 2x2 grid on phones
- [ ] No horizontal scroll on any phone size down to 320px
- [ ] Desktop layout (>900px) is completely unchanged
- [ ] `npx tsc --noEmit` passes
- [ ] `npx vitest run` — all 230 tests pass

## Verification

Manual browser test using Chrome DevTools responsive mode:
- **430px** (iPhone 15 Pro Max): board fills width, header wraps neatly, shop is 2-col grid
- **375px** (iPhone SE): all touch targets 44px+, dialogs fit, lobby 2x2 grid
- **360px** (Android): falls back to single-column shop/lobby
- **320px** (extreme): still usable, no horizontal overflow
- **1200px** (desktop): completely unchanged
