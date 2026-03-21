# TASK-070: First-Time Experience & Onboarding

**Assigned to:** UX Designer
**Priority:** Low
**Phase:** UX-F
**Spec ref:** UX-REVIEW-SPEC.md, Section 9
**Depends on:** TASK-060, TASK-066

## Summary

Help first-time players understand the game without reading the full rules dialog.

## Deliverables

- [ ] **First-visit detection** — `localStorage` flag (`chess-gold-visited`)
- [ ] **Welcome tooltip** — on first visit:
  - Brief highlight on the rules button or auto-show a welcome message
  - Suggest starting with "Chess Gold" mode
  - Dismissable, non-blocking
- [ ] **In-game hints** (first game only):
  - "You earn +1 gold each turn" on first gold increment
  - "Click a piece in the shop, then click a square to place it" on first turn with gold
  - Tooltips near the relevant UI element, auto-dismiss after 5s or on interaction
- [ ] **Progressive disclosure** — consider showing fewer modes to new players:
  - "Chess Gold" + "Standard Chess" prominent
  - Other modes in a "More modes" expandable section or with a "New" badge
  - Evaluate if this simplifies the lobby or over-complicates it
- [ ] `npx vitest run` passes

## Notes

- Keep hints minimal and non-annoying
- Player should be able to start playing within 10 seconds of first visit
