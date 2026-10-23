import type { MusicSearch, SearchResult } from "@bumbadum/radio";

/**
 * Answers any search without touching YouTube, for tests and e2e runs
 * (`MUSIC_SEARCH=fake`). The query's first word picks the answer:
 *
 * - `nothing`: no video found
 * - `quota`: the daily quota has run out
 * - `broken`: the search cannot answer
 *
 * Anything else finds `srch` plus the last 7 letters, digits, `_` or `-` of
 * the query (`lofi beats abc1234` finds `srchabc1234`), which the fake track
 * catalog answers with a 3-minute `Fake track srchabc1234`.
 */
export function createFakeMusicSearch(): MusicSearch {
  return {
    async search(query) {
      return search(query);
    },
  };
}

function search(query: string): SearchResult {
  switch (query.trim().split(/\s/, 1)[0]?.toLowerCase()) {
    case "nothing":
      return { kind: "nothing-found" };
    case "quota":
      return { kind: "quota-exhausted" };
    case "broken":
      return { kind: "unavailable" };
    default: {
      const tail = query
        .replace(/[^A-Za-z0-9_-]/g, "")
        .slice(-7)
        .padStart(7, "0");
      return { kind: "found", videoId: `srch${tail}` };
    }
  }
}
