import type { MusicSearch } from "@bumbadum/radio";
import { createFakeMusicSearch } from "./fake-music-search.ts";
import { createYouTubeMusicSearch } from "./youtube-music-search.ts";

/**
 * Picks the music search from the environment:
 *
 * - `MUSIC_SEARCH=fake`: the in-memory fake, for e2e runs (never YouTube).
 * - `YOUTUBE_API_KEY`: the YouTube Data API. The key stays on the server.
 * - neither: every search is unavailable, so `/play <name>` answers with a notice.
 */
export function musicSearchFromEnv(env: NodeJS.ProcessEnv): MusicSearch {
  if (env.MUSIC_SEARCH === "fake") {
    console.warn("MUSIC_SEARCH=fake: name searches come from the fake search, not YouTube");
    return createFakeMusicSearch();
  }
  const apiKey = env.YOUTUBE_API_KEY?.trim();
  if (apiKey) return createYouTubeMusicSearch(apiKey);
  console.warn("YOUTUBE_API_KEY is not set: /play cannot search by name");
  return { search: async () => ({ kind: "unavailable" }) };
}
