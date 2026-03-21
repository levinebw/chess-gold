# TASK-067: Game Over & Victory Feedback

**Assigned to:** UX Designer
**Priority:** Medium
**Phase:** UX-C
**Spec ref:** UX-REVIEW-SPEC.md, Section 4
**Depends on:** TASK-060, TASK-062

## Summary

Make game-ending moments feel significant with appropriate visual drama.

## Deliverables

- [ ] **Checkmate/victory**:
  - Brief board vignette effect (CSS radial gradient overlay, ~300ms)
  - Winner text entrance animation (scale up from 0.8 to 1.0)
  - Consider CSS-only confetti or particle effect (lightweight, optional)
- [ ] **Stalemate/draw** — neutral presentation, no celebration
- [ ] **Resignation** — somber tone, dimmed presentation
- [ ] **Game over dialog** — use dialog transition from TASK-062 plus:
  - Rating change display with color-coded animation (+/- sliding in)
  - "New Game" and "Back to Lobby" buttons with clear hierarchy
- [ ] `prefers-reduced-motion` — static presentation, no entrance animations
- [ ] `npx vitest run` passes
