# TASK-061: Button & Card Micro-Interactions

**Assigned to:** UX Designer
**Priority:** High
**Phase:** UX-B
**Spec ref:** UX-REVIEW-SPEC.md, Sections 2 & 4
**Depends on:** TASK-060

## Summary

Establish consistent hover/press/disabled states for all interactive elements (buttons, cards). Currently hover states are inconsistent — some scale, some don't, some change border, some don't.

## Deliverables

- [ ] **Button interaction pattern** (all buttons):
  - Hover: `scale(1.02)` + brightness shift
  - Active/pressed: `scale(0.98)` + darken
  - Disabled: `opacity: 0.4` + `cursor: not-allowed` (already partially done)
  - Transition: `150ms ease-out` on transform + background
  - Apply to: `.lobby-button`, `.undo-button`, `.new-game-button`, `.new-game-header-button`, `.rules-button`, `.flip-button`, `.rules-close-button`, `.back-to-lobby-header`, `.hit-button`, `.shop-piece`, `.lobby-button.small`
- [ ] **Card interaction pattern** (all cards):
  - Hover: `translateY(-2px)` + increased box-shadow + border glow
  - Selected state: gold border + subtle gold background tint
  - Apply to: `.mode-card`, `.lobby-mode-card`, `.lobby-bot-card`, `.lobby-room`, `.leaderboard-row`
  - Make selected state consistent (currently `.lobby-mode-card.selected` uses different pattern than `.shop-piece.selected`)
- [ ] **Focus-visible indicators** — visible focus ring (`outline: 2px solid var(--color-gold)`) on all interactive elements for keyboard nav
- [ ] `prefers-reduced-motion` — disable transforms, keep color changes
- [ ] `npx vitest run` passes
