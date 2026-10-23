# 02 — Animate idle, walking and blocked-step attempts

**What to build:** Bring every room avatar to life with the first-party idle and walk cycles. A standing player idles in their last facing direction; a moving player walks; and a player pressing into an obstacle visibly attempts to walk. Previews use the same idle artwork without making the skin-tone choices visually noisy.

**Blocked by:** 01 — Replace the avatar with four first-party skin tones.

**Status:** resolved

- [x] Idle advances through four frames at 4 FPS and walk advances through four frames at approximately 10 FPS while a player moves or bumps against an obstacle.
- [x] Stopping returns to idle in the last facing direction, and left-facing animation mirrors the right-facing block.
- [x] Each player's idle cycle has a stable phase derived from their session identity, so all clients draw that player consistently without synchronizing every player together.
- [x] With reduced motion enabled, idle remains on its first frame while walk still communicates actual movement and blocked-step attempts.
- [x] Large previews on the join page and in the wardrobe animate idle; skin-tone option thumbnails remain on a stable first frame.
- [x] Logic tests cover frame timing, direction, stable phase, bumps and reduced motion, and `pnpm check` passes.

