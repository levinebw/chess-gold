# TASK-060: Design System — CSS Custom Properties

**Assigned to:** UX Designer
**Priority:** Critical (blocks all other UX tasks)
**Phase:** UX-A
**Spec ref:** UX-REVIEW-SPEC.md, Section 1

## Summary

Extract all hardcoded values in `main.css` into CSS custom properties (design tokens) on `:root`. This is a pure refactor — visual appearance must not change.

## Deliverables

- [ ] **Color tokens** — `--color-*` variables:
  - Gold: primary (`#d4a843`), hover (`#e0b854`), dark, muted
  - Backgrounds: body (`#1a1a1a`), surface (`#252525`), card (`#2a2a2a`), elevated (`#333`), border (`#444`)
  - Text: primary (`#e0e0e0`), secondary (`#aaa`), muted (`#888`), disabled (`#666`)
  - Semantic: success (`#4caf50`), error (`#e05454`), warning (`#e0b854`)
  - Overlay: `rgba(0,0,0,0.5)`, `rgba(0,0,0,0.7)`
- [ ] **Typography tokens** — `--font-*` and `--text-*`:
  - Font families: `--font-sans`, `--font-mono`
  - Scale: display (2.2rem), h1 (1.8rem), h2 (1.2-1.5rem), body (0.9rem), caption (0.8rem), label (0.75rem), small (0.7rem)
- [ ] **Spacing tokens** — `--space-*`: 1 (4px), 2 (8px), 3 (12px), 4 (16px), 6 (24px), 8 (32px), 12 (48px)
- [ ] **Border radius tokens** — `--radius-sm` (4px), `--radius-md` (6px), `--radius-lg` (10px), `--radius-full` (50%)
- [ ] **Shadow tokens** — `--shadow-sm`, `--shadow-md`, `--shadow-lg`
- [ ] **Transition tokens** — `--transition-fast` (150ms), `--transition-normal` (200ms), `--transition-slow` (300ms)
- [ ] Replace all hardcoded values throughout `main.css` with the new tokens
- [ ] `npx vitest run` passes
- [ ] Visual appearance unchanged (screenshot comparison)

## Notes

- Keep existing `system-ui, -apple-system, sans-serif` font stack (not Orbitron)
- No new fonts or dependencies in this task
