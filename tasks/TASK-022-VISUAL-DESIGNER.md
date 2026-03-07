# TASK-022: Gold Coin Icon

**Assigned to:** Visual Designer
**Priority:** High
**Phase:** v0.2 (needed before next playtester round)
**Source:** Playtester feedback (user-bug-list-mar-6.md, enhancement #10)

## Summary

Design a gold coin icon to replace the "g" text used throughout the game UI for gold amounts. Players requested a visual coin instead of a letter.

## Requirements

- **Color:** Gold — warm yellow/amber metallic. Must clearly read as *gold*, not silver or copper. The standard coin emoji 🪙 is not gold enough.
- **Sizes:** Must be crisp and readable at:
  - **16px** — inline with gold balance numbers (e.g., "3 [coin]" next to player name)
  - **32px** — in the shop next to piece prices (e.g., "Pawn [coin] 1")
  - **48px** — for any larger UI use (dialogs, game over screen)
- **Format:** SVG (single file, scales to all sizes)
- **Design:** Simple and iconic. Suggestions (pick one or propose):
  - A "G" stamped on the coin face
  - A tiny crown or king silhouette stamped on the face
  - Plain gold coin with rim detail and a subtle shine
- **Style:** Must match the game's dark theme with gold accents. See current screenshots in `test/reports/screenshots/` for the existing color palette (dark background, gold text `#D4A843` approximate).
- **Legibility:** At 16px, the coin shape must still be recognizable. Avoid fine detail that disappears at small sizes.

## Deliverable

- `src/assets/ui/gold-coin.svg` — the icon file
- Confirm it looks correct on dark backgrounds (#1a1a1a)

## Context

The gold coin appears in these UI locations:
- Gold balance display (top of sidebar — "WHITE: 3g / BLACK: 4g")
- Shop piece prices (each row — "Pawn 1g", "Knight 3g", etc.)
- Capture reward notifications (future)
- Rules dialog price table

Currently all of these show a gold-colored number followed by "g". The icon replaces the "g".

## Reference

- Current game: https://levinebw.github.io/chess-gold/
- Screenshots: `test/reports/screenshots/live-01-initial.png` (see gold display and shop)
