# TASK-063: Board Frame & Visual Presentation

**Assigned to:** UX Designer
**Priority:** High
**Phase:** UX-C
**Spec ref:** UX-REVIEW-SPEC.md, Section 3
**Depends on:** TASK-060

## Summary

Enhance the board's visual frame and surrounding context. The board currently sits in a plain container with no visual grounding.

## Deliverables

- [ ] **Board frame** — subtle border/shadow around `.board-wrapper`:
  - Inner border or inset shadow to create a "frame" effect
  - Consider a subtle CSS gradient border (dark wood or marble feel) — keep it classy, not heavy
  - Drop shadow to lift the board off the background
- [ ] **Turn indicator enhancement**:
  - Active player's side: subtle glow or accent border
  - Inactive side: slightly dimmed
  - Smooth color transition on turn change (not instant swap)
- [ ] **Check indication** — enhance king check glow:
  - CSS pulse animation on the check square (red glow, ~200ms cycle)
  - Consider subtle screen shake (CSS transform, ~2px, ~200ms) — keep optional
- [ ] **Coordinate labels** — ensure Chessground coordinates are visible and styled to match theme
- [ ] `prefers-reduced-motion` — no pulse/shake, static highlight only
- [ ] `npx vitest run` passes

## Notes

- Chessground handles piece rendering; we can only style the container and CSS classes it exposes
- Check glow already exists in some form — enhance, don't duplicate
