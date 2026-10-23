import type { TrackInfo } from "./radio.ts";

export type TrackLookup =
  | { kind: "found"; info: TrackInfo }
  | { kind: "not-found" }
  /** The catalog could not answer: not configured, unreachable or out of quota. */
  | { kind: "unavailable" };

/**
 * Port: where the radio learns a video's title, duration, and whether it may
 * play (ADR-0005). The YouTube Data API adapter lives in `apps/server`. A
 * lookup never rejects; failures come back as `unavailable`.
 */
export interface TrackCatalog {
  lookUp(videoId: string): Promise<TrackLookup>;
}
