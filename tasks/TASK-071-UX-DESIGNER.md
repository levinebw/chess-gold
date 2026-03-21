# TASK-071: Sound Design Review

**Assigned to:** UX Designer
**Priority:** Low
**Phase:** UX-G
**Spec ref:** UX-REVIEW-SPEC.md, Section 5
**Depends on:** None (independent)

## Summary

Audit existing sound effects for completeness and quality. Add missing sounds.

## Deliverables

- [ ] **Audit existing sounds** — verify these exist and sound good:
  - Piece move, piece capture, check, checkmate, gold earned/spent
  - Button click, error/rejection
- [ ] **Add missing sounds** (if not present):
  - Piece placement from shop (coin + piece sound)
  - Game start tone
  - Resign tone
  - Loot box hit / reward reveal
- [ ] **Quality check**:
  - All sounds < 500ms for UI, < 2s for events
  - No sounds are jarring at any volume
  - Sounds match the game's aesthetic (not generic/stock-feeling)
- [ ] **Mute persistence** — verify mute state persists in localStorage
- [ ] **Volume control** — consider adding a volume slider (not just mute/unmute)
- [ ] `npx vitest run` passes

## Notes

- Sound files should be small (< 50KB each)
- Acceptable formats: mp3, ogg, wav
- No new npm dependencies for audio
