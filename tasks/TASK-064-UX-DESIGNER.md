# TASK-064: Gold Transaction Feedback & Placement Mode Polish

**Assigned to:** UX Designer
**Priority:** High
**Phase:** UX-C
**Spec ref:** UX-REVIEW-SPEC.md, Section 3
**Depends on:** TASK-060

## Summary

Add visual feedback for gold changes and polish the placement mode UI state.

## Deliverables

- [ ] **Gold floating numbers** — when gold changes:
  - Floating "+1" / "-3" number near gold display (CSS animation: float up + fade out, ~800ms)
  - Brief pulse/shine on the gold coin icon
  - Existing `gold-pulse` animation scales the number — enhance with floating number
- [ ] **Placement mode polish**:
  - Valid placement squares: gold shimmer highlight (not just color overlay) — CSS animation on Chessground squares
  - Clear "Cancel" affordance: text or icon near the shop indicating how to cancel
  - Placement hint text (`.placement-hint`) — make more visible, consider positioning it near the board
- [ ] `prefers-reduced-motion` — static color changes only, no floating numbers
- [ ] `npx vitest run` passes

## Implementation Notes

- Floating numbers will need a small React component or a CSS-only approach with pseudo-elements
- Chessground placement highlights use CSS classes on squares — verify which classes are used
