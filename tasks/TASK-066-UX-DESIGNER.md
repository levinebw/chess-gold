# TASK-066: Lobby Visual Hierarchy & Polish

**Assigned to:** UX Designer
**Priority:** Medium
**Phase:** UX-D
**Spec ref:** UX-REVIEW-SPEC.md, Section 2
**Depends on:** TASK-060, TASK-061

## Summary

Improve the lobby's visual hierarchy so primary actions are prominent and the flow guides new players naturally.

## Deliverables

- [ ] **Primary action prominence** — "Start Game" / "Play vs Bot" buttons should be visually dominant:
  - Larger, gold-filled, with more padding
  - Secondary actions (leaderboard, profile) clearly subordinate
- [ ] **Mode card selected state** — more prominent indicator:
  - Gold glow/border animation on selected card
  - Consider checkmark overlay or filled background
- [ ] **Section separation** — clearer visual breaks between sections:
  - Mode select, play options, online section
  - Consider subtle card backgrounds or dividers
- [ ] **Online register flow** — feels less like a form:
  - Inline input style (single line, not a separate section with a heading)
  - Friendly copy ("Choose a name to play online" not "Register")
- [ ] `npx vitest run` passes
