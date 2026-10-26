---
status: accepted
supersedes: ADR-0027
---

# Tennis participants exit to the hall and follow the Ball

When a Tennis match ends, its two participants leave the match immediately and return to the Tennis hall. They are not automatically re-enrolled in the Tennis line. A short result celebration remains visible, and the winner receives a Confetti animation in the hall. Players already waiting in the line may start the next match after the celebration; the finished participants do not take those seats.

While a Tennis match is active, a participant's camera follows the authoritative Ball trajectory. This keeps the Rebound target and the Ball visible even when the two baselines are farther apart than the viewport. Players who are only observing retain the normal spatial camera.

The default Ball release speed is 128 px/s. The existing 10% per-Rebound increase and 2× per-Point cap remain unchanged; the higher release speed increases the baseline difficulty without changing the contact policy.

## Consequences

- The server must clear match participants and place them at hall markers before broadcasting the winner's Confetti animation.
- The client renderer must suppress the normal world avatar while the Tennis avatar is drawn and focus participant cameras on the Ball.
- The result state remains available during the short celebration so the UI can announce the winner.
