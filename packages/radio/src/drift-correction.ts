/**
 * How a client keeps its screen on the radio's time (radio sync prototype,
 * ticket 06). Drift is the player's position minus the expected one: positive
 * means ahead.
 */
export const DRIFT_CORRECTION = {
  /** Drift is the median of the readings over this window… */
  windowMs: 500,
  /** …judged this often. */
  checkEveryMs: 250,
  /** Above this, nudge the playback rate… */
  nudgeAboveMs: 150,
  /** …until drift falls under this, or flips sign. */
  nudgeUntilMs: 40,
  /** The nudge: play at 1 ± this. */
  nudgeRateStep: 0.05,
  /** Above this, seek instead of nudging… */
  seekAboveMs: 1000,
  /** …then correct nothing for this long; also the quiet time after a video loads. */
  cooldownMs: 1500,
} as const;

interface DriftReading {
  at: number;
  driftMs: number;
}

/** The state of one screen's drift correction. Opaque: create it, record into it, ask it. */
export interface DriftCorrection {
  readonly readings: readonly DriftReading[];
  /** +1 while slowed down because ahead, -1 while sped up because behind, 0 at normal speed. */
  readonly nudge: -1 | 0 | 1;
  readonly quietUntil: number;
}

/**
 * What the screen should do now. `seek` means: go to the expected position
 * and play at normal speed.
 */
export type CorrectionAction =
  | { kind: "none" }
  | { kind: "set-rate"; rate: number }
  | { kind: "seek" };

/** A fresh correction for a video that just loaded at `now`: quiet while it settles. */
export function startDriftCorrection(now: number): DriftCorrection {
  return { readings: [], nudge: 0, quietUntil: now + DRIFT_CORRECTION.cooldownMs };
}

/** Adds a drift reading taken at `at`, forgetting those older than the window. */
export function recordDrift(
  correction: DriftCorrection,
  at: number,
  driftMs: number,
): DriftCorrection {
  const since = at - DRIFT_CORRECTION.windowMs;
  return {
    ...correction,
    readings: [...correction.readings.filter((reading) => reading.at >= since), { at, driftMs }],
  };
}

/**
 * Decides whether the screen needs correcting at `now` (hybrid style): nudge
 * the playback rate for moderate drift, seek for large drift.
 */
export function correctDrift(
  correction: DriftCorrection,
  now: number,
): { correction: DriftCorrection; action: CorrectionAction } {
  const unchanged = { correction, action: { kind: "none" } } as const;
  if (now < correction.quietUntil) return unchanged;
  const since = now - DRIFT_CORRECTION.windowMs;
  const drift = median(
    correction.readings.filter((reading) => reading.at >= since).map((reading) => reading.driftMs),
  );
  if (drift === undefined) return unchanged;

  const size = Math.abs(drift);
  const side = Math.sign(drift) as -1 | 0 | 1;
  if (size > DRIFT_CORRECTION.seekAboveMs) {
    return { correction: startDriftCorrection(now), action: { kind: "seek" } };
  }
  if (correction.nudge === 0 && size > DRIFT_CORRECTION.nudgeAboveMs) {
    const rate = 1 - side * DRIFT_CORRECTION.nudgeRateStep;
    return { correction: { ...correction, nudge: side }, action: { kind: "set-rate", rate } };
  }
  if (
    correction.nudge !== 0 &&
    (size < DRIFT_CORRECTION.nudgeUntilMs || side !== correction.nudge)
  ) {
    return { correction: { ...correction, nudge: 0 }, action: { kind: "set-rate", rate: 1 } };
  }
  return unchanged;
}

function median(values: readonly number[]): number | undefined {
  if (values.length === 0) return undefined;
  const sorted = values.toSorted((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? sorted[middle]
    : ((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2;
}
