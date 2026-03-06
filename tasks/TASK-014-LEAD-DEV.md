# Task 014 — Lead Developer

## Sound Effects

### Objective

Add sound effects for key game events. Chess games feel significantly more polished with audio feedback. Use free/CC0 sound files — no licensing cost.

### Deliverables

#### 1. Sound Files

Source free chess sound effects (CC0 or similar permissive license). Needed sounds:

| Event | Sound | Notes |
|-------|-------|-------|
| Piece move | Short click/tap | Standard chess move sound |
| Piece capture | Slightly louder thud | Distinct from regular move |
| Piece placement (from shop) | Soft "place" sound | Different from move |
| Check | Alert tone | Brief, attention-getting |
| Checkmate / game over | Fanfare or conclusion tone | Celebratory |
| Purchase (gold spent) | Coin sound | Reinforces economy feel |

Place in `public/sounds/` directory.

#### 2. Sound Utility: `src/ui/utils/sounds.ts`

```typescript
export function playSound(name: 'move' | 'capture' | 'place' | 'check' | 'gameOver' | 'purchase') {
  const audio = new Audio(`/sounds/${name}.mp3`);
  audio.volume = 0.5;
  audio.play().catch(() => {}); // Ignore autoplay restrictions
}
```

#### 3. Integration Points

Trigger sounds in the appropriate places:
- `Board.tsx` move event → play 'move' or 'capture'
- Shop purchase → play 'purchase'
- Placement → play 'place'
- Check detected (sync effect) → play 'check'
- Game over → play 'gameOver'

#### 4. Mute Toggle

Add a mute/unmute button in the game header. Store preference in localStorage.

### Constraints

- Sound files must be free/CC0 licensed
- Total audio file size < 100KB (small clips, mp3 format)
- Gracefully handle browsers that block autoplay
- Mute state persists across sessions via localStorage

### Sources for Free Chess Sounds

- lichess open-source sounds (MIT licensed): https://github.com/lichess-org/lila/tree/master/public/sound
- freesound.org (filter by CC0)

### Done When

- [ ] Sound plays on move, capture, placement, check, game over, purchase
- [ ] Mute toggle in header works
- [ ] Mute preference persists in localStorage
- [ ] Sound files are properly licensed (CC0/MIT)
- [ ] Works on mobile (respects autoplay restrictions)
- [ ] All tests pass
- [ ] Commit and push
