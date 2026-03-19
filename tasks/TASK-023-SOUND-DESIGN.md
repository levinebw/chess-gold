# TASK-023: Gold Economy Sound Effects

**Assigned to:** Lead Developer (source free audio) or Visual Designer (if creating custom)
**Priority:** Medium
**Phase:** v0.2
**Source:** Game Designer direction + playtester feedback (enhancement #5, #8)

## Summary

Add two sound effects tied to the gold economy to make buying and earning gold feel satisfying.

## Sound Effects Needed

### 1. Purchase — Cash Register
- **Trigger:** Player buys a piece from the shop (gold is deducted, piece placed on board)
- **Sound:** Cash register "ka-ching" — a short, punchy register sound
- **Duration:** Under 1 second
- **Feel:** Deliberate, transactional. "You just spent money."

### 2. Capture Reward — Coin Jingle
- **Trigger:** Player captures an opponent's piece (gold is earned)
- **Sound:** Coins jingling / chaching — a bright, rewarding coin sound
- **Duration:** Under 1 second
- **Feel:** Rewarding, satisfying. "You just earned money." Should feel distinct from the purchase sound — this one is a gain, not a spend.

## Technical Requirements

- **Format:** MP3 or OGG (web-compatible). Provide both for browser fallback.
- **File size:** Under 50KB each
- **Location:** `src/assets/audio/purchase.mp3` and `src/assets/audio/capture-reward.mp3`
- **Playback:** Fire-and-forget. No looping. Should not overlap or cut off other game sounds (move, check, etc.).
- **Volume:** Should sit at a similar level to other game sounds (piece move, check). Not jarring.

## Sources

Free sound effect libraries:
- [freesound.org](https://freesound.org) — search "cash register" and "coin jingle" (check license: CC0 or CC-BY preferred)
- [mixkit.co](https://mixkit.co/free-sound-effects/) — free for commercial use
- [pixabay.com/sound-effects](https://pixabay.com/sound-effects/) — royalty-free

Or generate via AI audio tools if available.

## Context

These two sounds complete the economy feedback loop:
- **Spend gold → cash register** (cost is felt)
- **Capture piece → coin jingle** (reward is felt)

Combined with the gold coin icon (TASK-022), this makes the gold economy tangible — you see it and hear it.
