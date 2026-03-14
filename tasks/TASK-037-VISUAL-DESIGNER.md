# TASK-037: Custom Loot Box Asset — Medieval Treasure Chest

**Role:** Visual Designer
**Phase:** 7 — Loot Boxes
**Status:** In Progress

## Objective

Replace the current 🎁 gift box emoji with a custom SVG loot box asset styled as a medieval treasure chest. The asset must fit the game's gold/medieval premium aesthetic and work within Chessground's custom SVG auto-shape system.

## Current Implementation

The loot box is rendered in `src/ui/components/Board.tsx` as a Chessground `customSvg` auto-shape. The SVG uses a `viewBox="0 0 100 100"` and renders a 🎁 emoji via `<text>` element. A colored circle badge in the top-right corner shows hits remaining (3/2/1), with color changing per hit count.

```typescript
// Current rendering (Board.tsx ~line 237)
customSvg: {
  html: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <text x="50" y="55" font-size="50" text-anchor="middle" dominant-baseline="central" opacity="0.85">🎁</text>
    <circle cx="82" cy="18" r="14" fill="${hitsColor}" stroke="#000" stroke-width="1.5"/>
    <text x="82" y="19" font-size="16" font-weight="bold" text-anchor="middle" dominant-baseline="central" fill="#fff">${box.hitsRemaining}</text>
  </svg>`,
},
```

Hit count colors are defined in Board.tsx:
```typescript
const HIT_COUNT_COLORS: Record<number, string> = { 3: '#4a4', 2: '#da4', 1: '#c44' };
```

## Requirements

### 1. SVG Treasure Chest Asset

Create an inline SVG treasure chest that:
- **Looks like a medieval wooden treasure chest** with gold trim/clasps/keyhole
- **Reads clearly at 40–80px** (typical board square size)
- **Is clearly distinct from chess pieces** — should never be mistaken for a piece
- **Fits within the `viewBox="0 0 100 100"` coordinate space** — the chest should occupy roughly the center 60-80% of the space, leaving room for the hit counter badge in the top-right corner
- **Uses the game's gold accent color** (`#d4a843`) and dark wood tones
- **Is drawn with SVG path/rect/polygon elements**, not embedded images or emoji
- **Has reasonable path complexity** — keep it optimized, no excessive detail that inflates the SVG string

### 2. Hit State Variants

Create 3 visual states for the chest corresponding to hits remaining:
- **3 hits (pristine):** Chest looks intact, sealed, glowing slightly
- **2 hits (damaged):** Visible crack or dent, lid slightly ajar, seam glow intensifying
- **1 hit (nearly open):** Major damage, lid popping, bright glow from inside, treasure peeking out

These should be implementable as inline SVG strings (since they're rendered via Chessground's `customSvg`).

### 3. Integration

- Place the SVG code directly in `Board.tsx`, replacing the current emoji-based rendering
- Keep the hit counter badge (colored circle + number) — it overlays the chest in the top-right
- The SVG must be a **string literal** (template literal), not a file import, because Chessground's `customSvg.html` requires an SVG string
- Test that it renders properly on both light and dark board squares

## Deliverables

1. Updated `Board.tsx` with the new chest SVG replacing the 🎁 emoji
2. Three visual states for hit counts 3, 2, 1
3. Optionally, save a standalone reference copy at `src/assets/ui/loot-box.svg` (pristine state)

## Style Reference

- Game aesthetic: premium mobile game, gold accents, medieval/fantasy
- Existing gold color: `#d4a843`
- Dark UI background: `#252525`
- The chest sits on chess board squares (alternating light/dark)
- Other board elements use similar inline SVG (equipment icons are emoji, pieces are standard Chessground)

## Constraints

- Must be inline SVG string (not an external file reference) for Chessground compatibility
- Keep total SVG string size reasonable (under ~2KB per state)
- No JavaScript or CSS animations in the SVG — it's a static render per state
- Maintain the hit counter badge overlay in the top-right corner
