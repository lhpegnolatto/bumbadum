import type { TrackCatalog } from "@bumbadum/radio";
import { createFakeTrackCatalog } from "./fake-track-catalog.ts";
import { createYouTubeTrackCatalog } from "./youtube-track-catalog.ts";

/**
 * Picks the track catalog from the environment:
 *
 * - `TRACK_CATALOG=fake`: the in-memory fake, for e2e runs (never YouTube).
 * - `YOUTUBE_API_KEY`: the YouTube Data API. The key stays on the server.
 * - neither: every lookup is unavailable, so `/play` answers with a notice.
 */
export function trackCatalogFromEnv(env: NodeJS.ProcessEnv): TrackCatalog {
  if (env.TRACK_CATALOG === "fake") {
    console.warn("TRACK_CATALOG=fake: tracks come from the fake catalog, not YouTube");
    return createFakeTrackCatalog();
  }
  const apiKey = env.YOUTUBE_API_KEY?.trim();
  if (apiKey) return createYouTubeTrackCatalog(apiKey);
  console.warn("YOUTUBE_API_KEY is not set: /play cannot look tracks up");
  return { lookUp: async () => ({ kind: "unavailable" }) };
}
