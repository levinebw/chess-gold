# TASK-065: Page Transitions (Lobby <-> Game)

**Assigned to:** UX Designer
**Priority:** Medium
**Phase:** UX-D
**Spec ref:** UX-REVIEW-SPEC.md, Sections 2 & 4
**Depends on:** TASK-060

## Summary

Add smooth transitions between lobby and game views. Currently the switch is a hard cut (instant mount/unmount).

## Deliverables

- [ ] **Cross-fade transition** (300ms minimum) between:
  - Mode selector -> Lobby
  - Lobby -> Game
  - Game -> Lobby (back button / game over)
  - Lobby -> Profile
  - Lobby -> Leaderboard
- [ ] Implement via CSS class approach:
  - Wrap views in a transition container
  - Add `entering` / `exiting` CSS classes with fade + optional slide
  - Brief delay before unmounting exiting view
- [ ] `prefers-reduced-motion` — instant switch, no animation
- [ ] `npx vitest run` passes

## Notes

- This may require small React changes to the App component's view switching logic
- Keep it simple — a basic cross-fade is sufficient for v1
