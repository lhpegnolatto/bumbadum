/**
 * The frame an object's Ambient animation starts on, by the v7 bundle's formula
 * `(x × 7 + y × 13) mod frames`, with `x` and `y` the Tiled object's position in pixels (its
 * left edge and its base). It never changes between frames or page loads, yet neighbouring
 * objects start on different frames and never move in unison.
 */
export function ambientStartFrame(position: { x: number; y: number }, frames: number): number {
  return (position.x * 7 + position.y * 13) % frames;
}

/**
 * The frame of an Ambient animation shown at `now`: the loop of `durations` (milliseconds per
 * frame), started at the beginning of frame `startFrame`.
 */
export function ambientFrame(
  durations: readonly number[],
  now: number,
  startFrame: number,
  reducedMotion: boolean,
): number {
  if (reducedMotion) return 0;
  const loop = durations.reduce((total, duration) => total + duration, 0);
  const lead = durations.slice(0, startFrame).reduce((total, duration) => total + duration, 0);
  let elapsed = (now + lead) % loop;
  for (const [index, duration] of durations.entries()) {
    if (elapsed < duration) return index;
    elapsed -= duration;
  }
  return 0;
}
