import type { SearchResult } from "@bumbadum/radio";

/** The answers worth keeping: failures are not, so the next search tries again. */
export type CachedSearch = Extract<SearchResult, { kind: "found" | "nothing-found" }>;

/** Enough for every name friends ask for in a day, small enough to bound memory against floods. */
const DEFAULT_CAPACITY = 1000;

/**
 * Search answers by normalized query, in server memory (ADR-0005): a hit
 * costs no quota. Bounded, since the keys are player text; the least
 * recently used answer goes first.
 */
export class SearchCache {
  private readonly answers = new Map<string, CachedSearch>();

  constructor(private readonly capacity = DEFAULT_CAPACITY) {}

  get(query: string): CachedSearch | undefined {
    const answer = this.answers.get(query);
    if (answer) {
      // Map keeps insertion order: re-inserting marks it the most recently used.
      this.answers.delete(query);
      this.answers.set(query, answer);
    }
    return answer;
  }

  set(query: string, answer: CachedSearch) {
    this.answers.delete(query);
    this.answers.set(query, answer);
    if (this.answers.size > this.capacity) {
      const oldest = this.answers.keys().next();
      if (!oldest.done) this.answers.delete(oldest.value);
    }
  }
}
