# TASK-068: Accessibility Pass

**Assigned to:** UX Designer
**Priority:** High
**Phase:** UX-E
**Spec ref:** UX-REVIEW-SPEC.md, Section 8
**Depends on:** TASK-060, TASK-061

## Summary

Ensure the app meets WCAG AA accessibility standards.

## Deliverables

- [ ] **Keyboard navigation** — Tab through all controls in logical order, Enter/Space to activate
  - Verify all buttons have proper `tabindex` or are naturally focusable
  - Ensure shop pieces, mode cards, bot cards are keyboard-accessible
- [ ] **Focus indicators** — visible focus rings on all interactive elements:
  - `outline: 2px solid var(--color-gold)` with `outline-offset: 2px`
  - Applied via `:focus-visible` (not `:focus`) to avoid showing on click
  - Already added in TASK-061 — verify completeness here
- [ ] **Color contrast** — verify all text meets WCAG AA:
  - Body text on dark backgrounds: 4.5:1 minimum
  - Large text (headings): 3:1 minimum
  - Fix any failing contrasts (especially `#888` on `#252525` — may be too low)
- [ ] **Color independence** — no information conveyed by color alone:
  - Win/loss/draw indicators: add text labels alongside colors
  - Check indicator: not just red glow — needs text or icon
  - Gold/error states: already have distinct visual treatment, verify
- [ ] **`prefers-reduced-motion`** — comprehensive support:
  - All new animations from TASK-061 through TASK-067 respect this
  - Existing animations (`gold-pulse`, `toast-slide-in`, `bot-think-pulse`) also gated
- [ ] **Screen reader basics** — `aria-live` region for game state changes (turn, check, game over)
- [ ] `npx vitest run` passes
