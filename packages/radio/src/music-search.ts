export type SearchResult =
  /** The first video the search found. */
  | { kind: "found"; videoId: string }
  | { kind: "nothing-found" }
  /** The daily search quota ran out; it resets at midnight Pacific Time (ADR-0005). */
  | { kind: "quota-exhausted" }
  /** The search could not answer: not configured, unreachable, or answered nonsense. */
  | { kind: "unavailable" };

/**
 * Port: finds the video a name stands for (ADR-0005). The YouTube Data API
 * `search.list` adapter lives in `apps/server`. Searches are scarce (about 100
 * a day), so callers cache by `normalizeSearchQuery` and rate-limit per
 * player. A search never rejects; failures come back as a result.
 */
export interface MusicSearch {
  search(query: string): Promise<SearchResult>;
}

/** The form a search is cached under: queries differing only in case and spacing are one. */
export function normalizeSearchQuery(query: string): string {
  return query.trim().replace(/\s+/g, " ").toLowerCase();
}
