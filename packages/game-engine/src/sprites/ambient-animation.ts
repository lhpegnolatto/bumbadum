/**
 * Where in its loop an object's Ambient animation starts, as a share of the loop in [0, 1):
 * derived from its world position, so it never changes between frames or page loads, yet
 * neighbouring objects land far apart and never move in unison.
 */
export function ambientPhase(position: { x: number; y: number }): number {
  let hash =
    Math.imul(Math.round(position.x), 0x27d4eb2d) ^ Math.imul(Math.round(position.y), 0x165667b1);
  hash = Math.imul(hash ^ (hash >>> 15), 0x85ebca6b);
  hash = Math.imul(hash ^ (hash >>> 13), 0xc2b2ae35);
  hash ^= hash >>> 16;
  return (hash >>> 0) / 2 ** 32;
}

/**
 * The frame of an Ambient animation shown at `now`: the loop of `durations` (milliseconds per
 * frame), started `phase` of the way through (a share of the loop, in [0, 1)).
 */
export function ambientFrame(
  durations: readonly number[],
  now: number,
  phase: number,
  reducedMotion: boolean,
): number {
  if (reducedMotion) return 0;
  const loop = durations.reduce((total, duration) => total + duration, 0);
  let elapsed = (now + phase * loop) % loop;
  for (const [index, duration] of durations.entries()) {
    if (elapsed < duration) return index;
    elapsed -= duration;
  }
  return 0;
}
