import type { NowPlaying } from "./radio.ts";

/**
 * How a client keeps its estimate of the server clock (radio sync prototype,
 * ticket 06): a burst of pings, spaced out, repeated now and then.
 */
export const CLOCK_SYNC = {
  burstSize: 8,
  burstSpacingMs: 100,
  resyncEveryMs: 30_000,
} as const;

/** One ping: sent and answered by the local clock, stamped by the server's in between. */
export interface PingSample {
  sentAt: number;
  serverTime: number;
  receivedAt: number;
}

/** How far the server clock is ahead of the local one: `serverNow = localNow + offset`. */
export function estimateClockOffset(samples: readonly PingSample[]): number | undefined {
  let best: PingSample | undefined;
  for (const sample of samples) {
    if (!best || roundTrip(sample) < roundTrip(best)) best = sample;
  }
  // The server read its clock, as far as we can tell, halfway through the round trip.
  return best && best.serverTime - (best.sentAt + best.receivedAt) / 2;
}

function roundTrip(sample: PingSample): number {
  return sample.receivedAt - sample.sentAt;
}

/** Where playback of the track on air should be at `serverNow`. */
export function expectedPositionMs(nowPlaying: NowPlaying, serverNow: number): number {
  const elapsed = serverNow - nowPlaying.startedAt;
  return Math.min(Math.max(elapsed, 0), nowPlaying.track.durationMs);
}
