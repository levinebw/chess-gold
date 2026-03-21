# Chess Gold — UX Review & Polish Spec

> Goal: Elevate Chess Gold from "functional developer UI" to App Store-quality game experience. Every interaction should feel intentional, responsive, and polished.

---

## Reference Points

**Competitive bar:**
- [Chess.com](https://chess.com) — polished, vibrant, smooth animations, excellent onboarding
- [Lichess](https://lichess.org) — clean, fast, minimal, functional elegance
- Chess Gold should land between these: the speed and clarity of Lichess with the visual warmth and feedback of Chess.com, plus its own gold-themed identity.

**Design skill reference:** [ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) — AI design intelligence skill for Claude Code. Provides design system generation, 161 color palettes, 57 font pairings, 99 UX guidelines. Consider installing for the UX designer agent.

---

## 1. Design System Audit

Chess Gold lacks a formal design system. Colors, spacing, font sizes, and component styles are ad-hoc in `main.css`. Before making visual changes, establish a system.

### Deliverables

- [ ] **Color palette** — Define a named palette (not scattered hex values):
  - Primary gold: `#d4a843` (already used, needs companion shades — light gold, dark gold, gold on hover)
  - Background tiers: surface, card, elevated card, overlay
  - Semantic colors: success (green), error (red), warning, info
  - Text hierarchy: primary, secondary, muted, disabled
- [ ] **Typography scale** — Consistent font sizes with purpose:
  - Display (game title), heading, subheading, body, caption, label
  - Currently sizes range from 0.65rem to 2.2rem with no system — rationalize
- [ ] **Spacing scale** — 4px base unit (4, 8, 12, 16, 24, 32, 48)
- [ ] **Border radius** — Pick 2-3 values and use them everywhere (currently 4px, 8px, 10px — inconsistent)
- [ ] **Shadow/elevation** — Define levels for cards, dialogs, overlays
- [ ] **Extract to CSS custom properties** — All design tokens as `--color-*`, `--space-*`, `--radius-*`, `--font-*` variables in `:root`

### Acceptance Criteria
- All hardcoded hex/rem values in `main.css` replaced with CSS custom properties
- Visual appearance unchanged (this is a refactor, not a redesign)
- Any agent touching CSS can use named tokens instead of guessing values

---

## 2. Lobby & Navigation

The lobby is the first thing players see. It needs to feel like a game menu, not a settings page.

### Current Issues
- Flat layout — sections (mode select, local/bot/online) have no visual hierarchy
- "Back to Lobby" button was hidden at bottom of screen (fixed to header — verify this feels right)
- Online section gated behind identity but the gate feels like a form, not a game flow
- No visual distinction between "start a game" (primary action) and secondary navigation

### Deliverables

- [ ] **Visual hierarchy** — Primary actions (start game) should be prominent. Secondary actions (leaderboard, profile) should be clearly subordinate.
- [ ] **Mode selector cards** — Already improved to grid (done). Consider:
  - Hover state: subtle glow or border animation, not just color change
  - Selected state: more prominent indicator (checkmark, filled background, gold glow)
  - Mode icons: current emoji icons work but custom SVG icons would elevate
  - Tooltip or expandable detail for each mode (rules preview without opening full dialog)
- [ ] **Bot persona cards** — Match the visual treatment of mode cards (consistent card component)
- [ ] **Online section** — Register flow should feel like joining a game, not filling out a form:
  - Single-line inline input, not a separate section with a heading
  - "Quick Play" button for instant matchmaking (even if it just creates a rated room)
- [ ] **Smooth transitions** — Lobby → game should animate (fade, slide, or scale transition), not hard-cut

### Acceptance Criteria
- First-time player can start a game in < 3 clicks/taps
- Visual hierarchy guides the eye: mode → start → play
- Transition to game feels smooth, not jarring

---

## 3. Game Board & Piece Presentation

The board is the centerpiece. Chessground handles rendering, but the surrounding frame and feedback can be enhanced.

### Current Issues
- Board sits in a plain container with no visual frame
- Piece placement highlights are functional but not beautiful
- Last-move highlight is basic
- Check glow exists but may not be dramatic enough

### Deliverables

- [ ] **Board frame** — Subtle border or shadow around the board to ground it visually. Consider a wood-grain or marble texture border (CSS gradient, not an image).
- [ ] **Coordinate labels** — Ensure file (a-h) and rank (1-8) labels are visible, styled to match the theme, and don't interfere with play
- [ ] **Move feedback** — When a piece moves:
  - Origin square: brief fade-out highlight
  - Destination square: brief arrival highlight
  - Captured piece: brief "pop" or dissolve animation (CSS only)
- [ ] **Check indication** — King square should pulse with urgency (red glow animation, not just a static highlight). Consider a subtle screen shake (CSS transform, ~2px, ~200ms) for dramatic check moments.
- [ ] **Gold transaction feedback** — When gold changes:
  - Floating "+1" or "-3" number near the gold display (CSS animation, floats up and fades)
  - Gold coin icon should pulse/shine briefly
- [ ] **Placement mode** — When in placement mode:
  - Valid squares should have a distinct, inviting highlight (gold shimmer, not just a color overlay)
  - Piece "cursor" — show the piece being placed as a ghost image following the mouse/finger
  - Cancel placement: clear visual affordance (X button or "tap elsewhere to cancel")
- [ ] **Turn indicator** — More prominent. Consider:
  - Active player's side of the board has a subtle glow or border
  - Inactive side is slightly dimmed
  - Smooth color transition on turn change (not instant swap)

### Acceptance Criteria
- Every player action has visible, immediate feedback (< 100ms response)
- Check feels urgent
- Gold changes are noticeable without being disruptive
- Placement mode is clearly a distinct UI state

---

## 4. Animations & Micro-Interactions

This is where "juice" lives. Every button press, state change, and game event should have a subtle response. Keep animations under 400ms. Subtlety is key — enhance, don't distract.

### Deliverables

- [ ] **Button interactions** — All buttons should have:
  - Hover: slight scale (1.02) + brightness shift
  - Active/pressed: scale down (0.98) + darken
  - Disabled: reduced opacity + no cursor
  - Transition: 150ms ease-out
- [ ] **Card interactions** — Mode cards, bot cards, room list items:
  - Hover: translate up 2px + shadow increase
  - Already partially done — make consistent across all card types
- [ ] **Dialog transitions** — Modals (rules, game over, promotion) should:
  - Enter: fade in + scale from 0.95 to 1.0 (200ms)
  - Exit: fade out + scale to 0.95 (150ms)
  - Backdrop: fade in dark overlay
- [ ] **Game over** — Victory/defeat should feel significant:
  - Checkmate: brief board flash or vignette effect
  - Winner text: entrance animation (scale up or typewriter effect)
  - Consider confetti or particle effect for wins (CSS-only, lightweight)
- [ ] **Toast notifications** — Loot box rewards, capture gold, errors:
  - Slide in from top or bottom
  - Auto-dismiss after 3s with progress indicator
  - Consistent component (not ad-hoc alerts)
- [ ] **Page transitions** — Lobby → game, game → lobby:
  - Cross-fade (300ms) minimum
  - Consider slide transitions for sub-views (profile, leaderboard)
- [ ] **Loading states** — Any async operation (joining room, fetching profile):
  - Skeleton screens or shimmer placeholders, not "Loading..."
  - Spinner for short waits (< 2s), skeleton for longer

### Acceptance Criteria
- No interaction feels "dead" (every tap/click has visual response)
- Animations are smooth (no jank, use CSS transforms, avoid layout thrash)
- Animations can be disabled for accessibility (prefers-reduced-motion media query)

---

## 5. Sound Design Review

Sound effects exist (Phase 2, Task 014). Review for completeness and quality.

### Checklist

- [ ] Piece move: satisfying click/tap
- [ ] Piece capture: distinct from move (more weight)
- [ ] Piece placement (from shop): distinct "placing" sound (coin + piece)
- [ ] Check: alert tone (urgent but not alarming)
- [ ] Checkmate: victory fanfare (brief, 1-2s)
- [ ] Gold earned: coin clink
- [ ] Gold spent: coin spend/deduct sound
- [ ] Button click: subtle UI tap
- [ ] Error/rejection: soft negative tone
- [ ] Loot box hit: impact sound
- [ ] Loot box open: reward reveal sound
- [ ] Turn change: subtle tick or chime (optional — could be annoying)
- [ ] Game start: brief intro tone
- [ ] Resign: somber tone

### Quality Bar
- Sounds should be crisp, short (< 500ms for UI, < 2s for events)
- No sounds should be jarring or unpleasant at any volume
- Mute toggle already exists — ensure it persists across sessions (localStorage)
- Consider volume slider (not just mute/unmute)

---

## 6. Typography & Readability

### Deliverables

- [ ] **Font choice** — Evaluate current default font. Consider:
  - A clean sans-serif for UI (Inter, Geist, or system font stack)
  - An optional serif or display font for headings/titles ("Chess Gold" title)
  - Monospace for gold numbers and game stats (consistent width, easy to scan)
- [ ] **Text contrast** — Verify all text meets WCAG AA contrast ratio (4.5:1 for body, 3:1 for large text) against dark backgrounds
- [ ] **Gold display numbers** — Should be large, bold, and instantly readable. Consider tabular number font feature for aligned digits.
- [ ] **Action history** — Move notation should be scannable with consistent formatting

---

## 7. Mobile Experience

### Deliverables

- [ ] **Touch targets** — All interactive elements minimum 44x44px (Apple HIG)
- [ ] **Board sizing** — Board should fill available width on mobile, with controls below (not beside)
- [ ] **Shop on mobile** — Scrollable horizontal strip or bottom sheet, not a cramped sidebar
- [ ] **Gestures** — Swipe to undo? Pull-to-refresh in lobby? Consider natural mobile patterns.
- [ ] **Orientation** — Portrait-first on phone. Landscape support on tablet.
- [ ] **Safe areas** — Respect notch/dynamic island on iOS, navigation bar on Android

### Test Devices
- iPhone SE (375px) — smallest common phone
- iPhone 14/15 (390px) — standard phone
- iPad Mini (768px) — tablet
- Desktop (1280px+)

---

## 8. Accessibility

### Deliverables

- [ ] **Keyboard navigation** — Tab through all controls, Enter/Space to activate
- [ ] **Focus indicators** — Visible focus rings on all interactive elements (not just browser default)
- [ ] **Screen reader** — Board state announced on changes (aria-live region)
- [ ] **Color independence** — No information conveyed by color alone (add icons/text alongside)
- [ ] **Reduced motion** — Respect `prefers-reduced-motion` media query (disable animations)
- [ ] **High contrast** — Test with forced-colors / high contrast mode

---

## 9. Onboarding / First-Time Experience

### Current State
Players land on the lobby with no guidance. The "?" rules button exists but requires initiative.

### Deliverables

- [ ] **First-visit detection** — localStorage flag. If first visit:
  - Briefly highlight the rules button or auto-show a welcome tooltip
  - Suggest starting with "Chess Gold" mode
  - Optional: 3-step overlay tour (mode select → shop → place piece)
- [ ] **In-game hints** — First game only:
  - "You earn +1 gold each turn" on first gold increment
  - "Click a piece in the shop, then click a square to place it" on first turn
  - Dismissable, non-blocking tooltips
- [ ] **Progressive disclosure** — Don't show all 9 modes to new players. Consider:
  - Default: show Chess Gold + Standard
  - "More modes" expandable section for the rest
  - Or: recommended/new badges on modes

---

## 10. Competitive Comparison Checklist

Features present in Chess.com/Lichess that Chess Gold should match for "App Store quality":

| Feature | Chess.com | Lichess | Chess Gold | Priority |
|---------|-----------|---------|------------|----------|
| Smooth piece animations | Yes | Yes | Chessground handles | Already done |
| Board themes | 8+ | 15+ | 1 (dark) | Medium |
| Piece set options | 5+ | 30+ | 1 (default) | Low |
| Sound on every action | Yes | Yes | Partial | High |
| Move confirmation haptics | Yes (mobile) | No | No | Low |
| Game clock display | Yes | Yes | No (not needed for async) | N/A |
| Post-game analysis | Yes | Yes | No | Future |
| Animated transitions | Yes | Minimal | No | High |
| Loading skeletons | Yes | No | No | Medium |
| Error toasts | Yes | Yes | Alert-style | Medium |
| Keyboard shortcuts | Yes | Yes | No | Low |
| Board coordinates | Yes | Toggle | Not visible | Medium |

---

## Implementation Approach

### Recommended Agent

A **UX Designer agent** with access to the codebase (CSS, React components) and the design system. Consider installing [ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) for design intelligence.

### Phasing

| Phase | Scope | Effort |
|-------|-------|--------|
| **UX-A** | Design system extraction (CSS custom properties) | Small |
| **UX-B** | Animations & micro-interactions (buttons, dialogs, transitions) | Medium |
| **UX-C** | Game board feedback (check, capture, gold, placement) | Medium |
| **UX-D** | Lobby redesign (hierarchy, flow, transitions) | Medium |
| **UX-E** | Mobile polish + accessibility | Medium |
| **UX-F** | Onboarding + first-time experience | Small |
| **UX-G** | Sound design review + new sounds | Small |

### Constraints

- No engine changes — this is purely UI/CSS/component work
- Must not break existing functionality (run `npx vitest run` after every change)
- Must respect `prefers-reduced-motion` for all new animations
- Keep bundle size impact minimal (CSS animations over JS, no heavy animation libraries)
- All visual changes should work on the existing dark theme

---

## Sources

- [The Complete Game UX Guide for 2025](https://game-ace.com/blog/the-complete-game-ux-guide/)
- [Best Practices for Game UI/UX Design](https://genieee.com/best-practices-for-game-ui-ux-design/)
- [Game UI: Design Principles, Best Practices](https://www.justinmind.com/ui-design/game)
- [5 Game UI/UX Trends in 2025](https://gamecrio.com/5-game-ui-ux-trends-in-2025-every-developer-should-follow/)
- [Best Examples in Mobile Game UI Designs (2026)](https://pixune.com/blog/best-examples-mobile-game-ui-design/)
- [Juice in Game Design: Making Games Feel Amazing](https://www.bloodmooninteractive.com/articles/juice.html)
- [Micro-Interactions 2025: Best Practices](https://www.stan.vision/journal/micro-interactions-2025-in-web-design)
- [Microinteractions in Mobile Apps: 2025 Best Practices](https://medium.com/@rosalie24/microinteractions-in-mobile-apps-2025-best-practices-c2e6ecd53569)
- [ui-ux-pro-max-skill — AI Design Intelligence](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill)
- [Chess.com vs Lichess: UI Comparison](https://www.chess.com/blog/TheBoardLords/chess-com-vs-lichess-a-battle-of-the-best-online-chess-platforms)
