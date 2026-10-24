import {
  correctDrift,
  DRIFT_CORRECTION,
  type DriftCorrection,
  expectedPositionMs,
  type NowPlaying,
  recordDrift,
  startDriftCorrection,
} from "@bumbadum/radio";
import type { ScreenPlayer } from "./screen-player.ts";

export interface ScreenSyncDeps {
  player: ScreenPlayer;
  /** The server's time now, or `undefined` while the clock is not synced yet. */
  serverNow(): number | undefined;
  /** A steady local clock, for timing the corrections. */
  localNow(): number;
}

/** What the screen plays and where, against where the radio is. */
export interface ScreenReading {
  videoId: string;
  positionMs: number;
  expectedMs: number;
}

export interface ScreenSync {
  /** What is on air now; `undefined` when the radio is silent. */
  show(nowPlaying: NowPlaying | undefined): void;
  reading(): ScreenReading | undefined;
  /** Stops the screen while something covers it, such as a notice; `show` still tracks the radio. */
  pause(): void;
  /** Plays again where the radio is now. */
  resume(): void;
  stop(): void;
}

/** How often the screen's position is read; the prototype read it every 20 ms. */
const SAMPLE_EVERY_MS = 20;

/**
 * Keeps the screen on the radio's time (ADR-0004): loads what is on air at
 * the position the server clock gives, then nudges or seeks as drift calls
 * for, with the values chosen in the radio sync prototype.
 */
export function syncScreen({ player, serverNow, localNow }: ScreenSyncDeps): ScreenSync {
  let wanted: NowPlaying | undefined;
  let loaded: NowPlaying | undefined;
  let paused = false;
  let correction: DriftCorrection = startDriftCorrection(localNow());

  function expectedMs(nowPlaying: NowPlaying): number | undefined {
    const now = serverNow();
    return now === undefined ? undefined : expectedPositionMs(nowPlaying, now);
  }

  function loadWanted() {
    if (paused || !wanted || wanted === loaded) return;
    const expected = expectedMs(wanted);
    if (expected === undefined) return;
    player.setRate(1);
    player.load(wanted.track.videoId, expected / 1000);
    loaded = wanted;
    correction = startDriftCorrection(localNow());
  }

  function reading(): ScreenReading | undefined {
    if (!loaded) return undefined;
    const position = player.position();
    const expected = expectedMs(loaded);
    if (position === undefined || expected === undefined) return undefined;
    return { videoId: loaded.track.videoId, positionMs: position * 1000, expectedMs: expected };
  }

  function sample() {
    loadWanted();
    const current = reading();
    if (current)
      correction = recordDrift(correction, localNow(), current.positionMs - current.expectedMs);
  }

  function correct() {
    if (!loaded) return;
    const decision = correctDrift(correction, localNow());
    correction = decision.correction;
    const { action } = decision;
    if (action.kind === "set-rate") player.setRate(action.rate);
    if (action.kind === "seek") {
      const expected = expectedMs(loaded);
      if (expected === undefined) return;
      player.setRate(1);
      player.seek(expected / 1000);
    }
  }

  const sampling = setInterval(sample, SAMPLE_EVERY_MS);
  const correcting = setInterval(correct, DRIFT_CORRECTION.checkEveryMs);

  return {
    show(nowPlaying) {
      if (sameTrackOnAir(nowPlaying, wanted)) return;
      wanted = nowPlaying;
      if (!nowPlaying) {
        if (loaded) player.stop();
        loaded = undefined;
        return;
      }
      loadWanted();
    },
    reading,
    pause() {
      paused = true;
      if (loaded) player.stop();
      loaded = undefined;
    },
    resume() {
      paused = false;
      loadWanted();
    },
    stop() {
      clearInterval(sampling);
      clearInterval(correcting);
    },
  };
}

function sameTrackOnAir(a: NowPlaying | undefined, b: NowPlaying | undefined): boolean {
  return a?.track.videoId === b?.track.videoId && a?.startedAt === b?.startedAt;
}
