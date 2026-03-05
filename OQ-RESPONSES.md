# Open Question Responses — From Game Designer

> None of these block MVP (Phase 1). Responses below to unblock future phases where possible.

---

## OQ-1: Two Kings Rule — APPROVED WITH RECOMMENDATION

**Answer: Adopt the king capture model.** The PA's recommendation is correct.

- With two kings, kings **can be captured**. Check is not mandatory to resolve.
- You lose when your **last king is captured**.
- When down to one king, normal chess rules resume (must escape check).

Think of it as "two lives."

**Status:** Pending final sign-off from the end-users (the kids). I'll confirm before Phase 7. **Does not block MVP.**

---

## OQ-2: Siege Mode — ANSWERED

The kids already specified this in their latest update. Here are the answers:

1. **Pulse trigger:** Every 5 moves, the 4 center squares (d4, d5, e4, e5) pulse.
2. **Effect:** Any piece on a center square during a pulse is upgraded **for its next move only** (temporary, one-move buff).
3. **Upgrades:**
   - Pawns: move 1 square in any direction, capture in any direction
   - Knights: double jump (two L-moves in one turn)
   - Rooks/Bishops/Queens: can move through one friendly piece once
4. **Center squares:** d4, d5, e4, e5 — confirmed.
5. **Win by occupation:** All 4 center squares must be occupied by your pieces **simultaneously**.

**One remaining clarification** I'll get from the kids: does the upgrade persist for exactly one move after the pulse, or until the next pulse? My read is one move only.

**Status:** Mostly resolved. Does not block MVP. Final detail before Phase 10.

---

## OQ-3: Flashlight Mode — PARTIALLY ANSWERED

What I can answer from the spec:

- **Check:** No check exists in Flashlight mode. King capture replaces checkmate entirely. If you move your king into a watched square and the opponent captures it, you lose.
- **King capture:** Yes, replaces checkmate as the win condition.

What still needs the kids:

- **Visibility scope:** My recommendation is: own square + all legal move destinations + squares occupied by blocking pieces (you can see what blocks you, not beyond). Awaiting confirmation.
- **Placement in fog (Flashlight Gold):** Can you place a piece on a square you can't see? Awaiting answer.

**Status:** Partially resolved. Does not block MVP. Will clarify before Phase 11.

---

## OQ-4: Gold Mine — PENDING

This needs the kids. My best interpretation of "you can do ANYTHING":

- Infinite gold / no gold economy (everything is free)
- Place anywhere on the board (no zone restriction)
- One action per turn (the only rule)
- Win by eliminating all opponent pieces or checkmate (per their latest doc)

I'll get explicit confirmation on all sub-questions.

**Status:** Pending. Does not block MVP. Will clarify before Phase 9.

---

## Bottom Line

**Nothing blocks Phase 1 (MVP).** Proceed with the build. I'll get the remaining answers from the kids on a parallel track and update this file as responses come in.
