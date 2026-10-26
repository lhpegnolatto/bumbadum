/** A placed light source's stable position, used to distribute the day-cycle level. */
export interface LightPosition {
  x: number;
  y: number;
}

/** Assigns stable, evenly spaced thresholds using position only to choose their order. */
export function lightThresholds(sources: readonly LightPosition[]): number[] {
  const ranked = sources
    .map((source, index) => ({ index, hash: hashPosition(source) }))
    .sort((a, b) => a.hash - b.hash || a.index - b.index);
  const thresholds = Array.from({ length: sources.length }, () => 0);
  ranked.forEach(({ index }, rank) => {
    thresholds[index] = rank / Math.max(1, sources.length);
  });
  return thresholds;
}

/** Whether a light should be visible at the current day-cycle level. */
export function lightTarget(level: number, threshold: number): boolean {
  return level > threshold;
}

/** A short linear fade from a source's previous alpha to its new target alpha. */
export function lightAlpha(from: number, to: number, elapsedMs: number, fadeMs = 180): number {
  const progress = Math.max(0, Math.min(1, elapsedMs / fadeMs));
  return from + (to - from) * progress;
}

/** The v7 lamp animation's per-frame brightness curve. */
export function lampIntensity(frame: number, reducedMotion: boolean): number {
  if (reducedMotion) return 1;
  return [1, 1, 1, 0.85, 1, 1, 0.35, 1][frame % 8] ?? 1;
}

function hashPosition({ x, y }: LightPosition): number {
  const value = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return value - Math.floor(value);
}
