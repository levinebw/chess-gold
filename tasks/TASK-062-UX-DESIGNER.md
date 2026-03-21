# TASK-062: Dialog Transitions

**Assigned to:** UX Designer
**Priority:** High
**Phase:** UX-B
**Spec ref:** UX-REVIEW-SPEC.md, Section 4
**Depends on:** TASK-060

## Summary

Add enter/exit animations to all modal dialogs. Currently dialogs appear/disappear instantly.

## Deliverables

- [ ] **Enter animation** — fade in + scale from 0.95 to 1.0 (200ms ease-out)
- [ ] **Exit animation** — fade out + scale to 0.95 (150ms ease-out)
- [ ] **Backdrop animation** — fade in dark overlay (200ms)
- [ ] Apply to: `.game-over-overlay/.game-over-dialog`, `.rules-overlay/.rules-dialog`, `.promotion-overlay/.promotion-dialog`
- [ ] Toast (`.loot-reward-toast`) already has enter animation — add exit animation (slide out + fade)
- [ ] `prefers-reduced-motion` — instant show/hide, no animation
- [ ] `npx vitest run` passes

## Implementation Notes

- Dialogs are conditionally rendered in React (not toggled via CSS class), so exit animations require either:
  - A brief delay before unmounting (setTimeout in component)
  - Or a CSS class-based approach (add `closing` class, listen for `animationend`)
- Evaluate which approach is simpler for each dialog
