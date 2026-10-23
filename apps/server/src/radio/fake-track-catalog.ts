import type { TrackCatalog, TrackInfo, TrackLookup } from "@bumbadum/radio";

const MINUTE = 60_000;

/**
 * Answers for any video ID without touching YouTube, for tests and e2e runs
 * (`TRACK_CATALOG=fake`). The ID's first four letters pick the answer:
 *
 * - `live`: a live stream
 * - `lock`: a video that cannot be embedded
 * - `long`: an 11-minute video
 * - `tiny`: a half-second video, to watch the radio advance
 * - `gone`: no such video
 * - `down`: the catalog cannot answer
 *
 * Anything else is a 3-minute video titled `Fake track <id>`.
 */
export function createFakeTrackCatalog(): TrackCatalog {
  return {
    async lookUp(videoId) {
      return lookUp(videoId);
    },
  };
}

function lookUp(videoId: string): TrackLookup {
  const track: TrackInfo = {
    videoId,
    title: `Fake track ${videoId}`,
    durationMs: 3 * MINUTE,
    embeddable: true,
    live: false,
  };
  switch (videoId.slice(0, 4)) {
    case "live":
      return { kind: "found", info: { ...track, live: true, durationMs: 0 } };
    case "lock":
      return { kind: "found", info: { ...track, embeddable: false } };
    case "long":
      return { kind: "found", info: { ...track, durationMs: 11 * MINUTE } };
    case "tiny":
      return { kind: "found", info: { ...track, durationMs: 500 } };
    case "gone":
      return { kind: "not-found" };
    case "down":
      return { kind: "unavailable" };
    default:
      return { kind: "found", info: track };
  }
}
