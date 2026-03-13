# Task 035 — Lead Developer

## Loot Box Mode UI

### Objective

Build the UI for the Loot Boxes game mode: render loot boxes on the Chessground board, hit interaction, inventory/equipment panel, loot box opening reward reveal, and loot-box-specific HUD elements.

### Phase

v0.7 — Loot Boxes

### Prerequisites

- Task 031 (Loot Box Core Engine) complete
- Task 033 (Inventory + Equipment Engine) complete

### Scope

#### 1. Render Loot Boxes on Board

Loot boxes need to appear on the Chessground board as visible elements.

**Approach:** Use Chessground's `setAutoShapes` or custom SVG overlays to render loot boxes:

- Each loot box is a shape/overlay on its square
- Show a loot box icon (e.g., a chest emoji or SVG) at the box's square
- Show remaining hits as a small badge or number overlay (e.g., "3", "2", "1")
- When a box is opened, brief opening animation (flash/pulse) before removal

**Implementation in `Board.tsx`:**
- Read `state.lootBoxes` from game context
- Map loot boxes to Chessground auto-shapes (custom SVG brush)
- Update shapes in the sync effect alongside existing placement highlights

#### 2. Hit Interaction

Players need to click a piece adjacent to a loot box to hit it.

**UX flow:**
1. Player clicks on their piece that is adjacent to a loot box
2. A "Hit" button/indicator appears (or the loot box square highlights as a valid target)
3. Player clicks the loot box square to confirm the hit
4. Dispatch `HitLootBoxAction` with `pieceSquare` and `lootBoxSquare`

**Alternative simpler UX:**
- When a player's piece is adjacent to a loot box, show a "Hit Loot Box" button in the game panel
- Button dispatches the hit action using the nearest adjacent piece
- If multiple pieces are adjacent, let the player choose (or auto-pick)

**Recommended approach:** Highlight loot box squares as clickable targets when a player's piece is adjacent. Clicking the loot box square triggers the hit. This mirrors the existing placement overlay click pattern.

#### 3. Inventory Panel (`src/ui/components/InventoryPanel.tsx` — new)

Show the player's inventory (pieces and items from loot box rewards).

**Layout:**
- Appears below or beside the Shop panel (only in loot-boxes mode)
- **Pieces section:** List of piece icons with count badges (e.g., "Pawn x2, Knight x1")
  - Clicking a piece starts placement mode (same as shop, but `fromInventory: true`)
- **Items section:** List of item icons (crossbow, turtle shell, crown)
  - Clicking an item starts equip mode (highlight friendly pieces to equip to)
- Show gold cost for equipping next to each item

**Equip flow:**
1. Player clicks an item in the inventory panel
2. Friendly non-king pieces highlight as equip targets
3. Player clicks a target piece on the board
4. Dispatch `EquipAction`

#### 4. Equipment Display on Board

Show equipped items on pieces:

- Small icon overlay on squares with equipped pieces (e.g., crossbow icon, shield icon, crown icon)
- Use Chessground custom shapes (SVG) anchored to the piece's square
- Equipment icons should be small and positioned at the corner of the square to not obscure the chess piece

#### 5. Loot Box Opening Reward Reveal

When a loot box opens, show the player what they got:

- Brief modal/toast notification: "You opened a loot box! Got: Knight" or "Got: 4 Gold" or "Got: Crossbow"
- Show the reward icon and name
- Auto-dismiss after 2-3 seconds (or click to dismiss)
- Play a sound effect for loot box opening (add to sound system)

#### 6. Loot Box Collection Counter

Show progress toward the `loot-boxes-collected` win condition:

- In the HUD/status area: "Loot Boxes: White 2/6 — Black 1/6"
- Only show when `loot-boxes-collected` is in the mode's win conditions

#### 7. Hit Counter on Loot Box

Display remaining hits on the board:

- Small number badge on the loot box shape (e.g., circled number)
- Updates after each hit
- Color changes as hits decrease (green → yellow → red)

#### 8. Sound Effects

Add new sounds to `src/ui/utils/sounds.ts`:

- `lootBoxHit` — short impact sound when hitting a box
- `lootBoxOpen` — celebratory/reveal sound when box opens
- `equip` — metallic click when equipping an item
- `rangedCapture` — twang/whoosh for crossbow ranged capture

### Files to Create/Modify

| File | Action |
|------|--------|
| `src/ui/components/InventoryPanel.tsx` | **Create** — inventory display, place/equip interaction |
| `src/ui/components/LootBoxReward.tsx` | **Create** — reward reveal modal/toast |
| `src/ui/components/Board.tsx` | **Modify** — loot box shapes, equipment shapes, hit interaction |
| `src/ui/components/GamePage.tsx` or equivalent | **Modify** — add InventoryPanel, loot box counter |
| `src/ui/context/GameContext.tsx` | **Modify** — expose hit/equip actions, inventory state |
| `src/ui/utils/sounds.ts` | **Modify** — add new sound effects |
| `src/styles/main.css` | **Modify** — inventory panel, reward toast, loot box counter styles |

### Visual Design Notes

- Loot box icon: Use a treasure chest emoji (🧰 or 📦) or a simple SVG chest
- Equipment icons: Small and distinct — crossbow (🏹), shield (🛡️), crown (👑)
- Hit count badge: Circled number, positioned at top-right of loot box square
- Inventory panel should match the existing shop panel's visual style
- Reward toast should be attention-grabbing but not blocking gameplay

### Acceptance Criteria

- [ ] Loot boxes render on board as clear, distinct shapes
- [ ] Hit count is visible on each loot box
- [ ] Players can hit loot boxes by clicking adjacent (UX is intuitive)
- [ ] Inventory panel shows collected pieces and items
- [ ] Placing from inventory works (same UX as shop placement)
- [ ] Equip flow works (select item → select target piece)
- [ ] Equipment icons visible on equipped pieces
- [ ] Reward reveal appears on loot box opening
- [ ] Loot box collection counter displayed
- [ ] Sound effects play for hits, opens, equips
- [ ] Mobile responsive (inventory panel stacks properly)
