import { describe, expect, it } from "vitest";
import {
  type CorrectionAction,
  correctDrift,
  DRIFT_CORRECTION,
  type DriftCorrection,
  recordDrift,
  startDriftCorrection,
} from "./index.ts";

const { cooldownMs } = DRIFT_CORRECTION;

/** A correction past its start-up quiet time, at `cooldownMs`. */
const settled = () => startDriftCorrection(0);

/** Records the same drift every 50 ms over [from, to]. */
function drifting(correction: DriftCorrection, driftMs: number, from: number, to: number) {
  let next = correction;
  for (let at = from; at <= to; at += 50) next = recordDrift(next, at, driftMs);
  return next;
}

/** Records steady drift up to `at` and asks what to do then. */
function decide(correction: DriftCorrection, driftMs: number, at: number) {
  return correctDrift(drifting(correction, driftMs, at - 500, at), at);
}

const none: CorrectionAction = { kind: "none" };

describe("correctDrift", () => {
  const t = cooldownMs + 1000;

  it("leaves small drift alone", () => {
    expect(decide(settled(), 140, t).action).toEqual(none);
    expect(decide(settled(), -140, t).action).toEqual(none);
  });

  it("slows down when ahead and speeds up when behind, by 5%", () => {
    expect(decide(settled(), 200, t).action).toEqual({ kind: "set-rate", rate: 0.95 });
    expect(decide(settled(), -200, t).action).toEqual({ kind: "set-rate", rate: 1.05 });
  });

  it("keeps the nudge until drift falls under 40 ms, then plays at normal speed", () => {
    const nudging = decide(settled(), 300, t).correction;

    const closing = decide(nudging, 100, t + 250);
    expect(closing.action).toEqual(none);
    const done = decide(closing.correction, 30, t + 500);
    expect(done.action).toEqual({ kind: "set-rate", rate: 1 });
    expect(decide(done.correction, 30, t + 750).action).toEqual(none);
  });

  it("ends the nudge when drift overshoots to the other side", () => {
    const nudging = decide(settled(), -300, t).correction;

    expect(decide(nudging, 60, t + 250).action).toEqual({ kind: "set-rate", rate: 1 });
  });

  it("seeks when drift passes a second, also in the middle of a nudge", () => {
    expect(decide(settled(), 1200, t).action).toEqual({ kind: "seek" });
    const nudging = decide(settled(), -300, t).correction;
    expect(decide(nudging, -1500, t + 250).action).toEqual({ kind: "seek" });
  });

  it("stays quiet for a moment after a seek, forgetting the drift from before it", () => {
    const seeked = decide(settled(), 2000, t).correction;

    expect(decide(seeked, 2000, t + cooldownMs - 1).action).toEqual(none);
    // Only drift recorded after the quiet time counts.
    const after = drifting(seeked, 0, t + 50, t + cooldownMs);
    expect(correctDrift(after, t + cooldownMs).action).toEqual(none);
  });

  it("stays quiet for a moment after starting, while a freshly loaded video settles", () => {
    const started = startDriftCorrection(10_000);

    expect(decide(started, 2000, 10_000 + cooldownMs - 1).action).toEqual(none);
    expect(decide(started, 2000, 10_000 + cooldownMs).action).toEqual({ kind: "seek" });
  });

  it("judges the median of the last half second, so a single odd reading does not count", () => {
    let correction = drifting(settled(), 0, t - 500, t);
    correction = recordDrift(correction, t, 5000);
    expect(correctDrift(correction, t).action).toEqual(none);

    const stale = drifting(settled(), 5000, t - 2000, t - 600);
    expect(correctDrift(drifting(stale, 0, t - 450, t), t).action).toEqual(none);
  });

  it("does nothing before any drift is recorded", () => {
    expect(correctDrift(settled(), t).action).toEqual(none);
  });
});
