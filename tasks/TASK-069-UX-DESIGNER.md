# TASK-069: Mobile Polish

**Assigned to:** UX Designer
**Priority:** Medium
**Phase:** UX-E
**Spec ref:** UX-REVIEW-SPEC.md, Section 7
**Depends on:** TASK-060

## Summary

Final mobile polish pass. Some responsive work is already done (480px, 360px breakpoints) — this task addresses remaining gaps.

## Deliverables

- [ ] **Touch target audit** — verify all interactive elements are minimum 44x44px on mobile:
  - Already done for many elements at 480px — verify completeness
  - Check promotion choices, leaderboard rows, lobby rooms
- [ ] **Safe areas** — respect iOS notch/dynamic island and Android nav bar:
  - `env(safe-area-inset-*)` on body/root padding
  - Fixed elements (`.github-link`, `.loot-reward-toast`) respect safe areas
- [ ] **Shop on mobile** — currently 2-column grid at 480px, verify usability:
  - Ensure piece names aren't truncated
  - Verify gold prices are visible
- [ ] **Portrait optimization** — board fills width, controls stack below cleanly
  - Verify no horizontal overflow at 375px (iPhone SE)
  - Test 390px (standard iPhone)
- [ ] **Scrolling** — ensure game view doesn't require excessive scrolling on small screens
  - Action history is already capped at 100px on mobile — verify this is enough
- [ ] `npx vitest run` passes
