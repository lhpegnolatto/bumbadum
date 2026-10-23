import type { MusicSearch, SearchResult } from "@bumbadum/radio";
import { z } from "zod";

const SEARCH_URL = "https://www.googleapis.com/youtube/v3/search";

/** A search that hangs this long counts as unavailable. */
const TIMEOUT_MS = 5000;

/** Only the first is played; a few more cost nothing extra and cover a result without a video. */
const MAX_RESULTS = 5;

const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;

const searchListSchema = z.object({
  items: z
    .array(z.object({ id: z.object({ videoId: z.string().regex(VIDEO_ID).optional() }) }))
    .default([]),
});

const errorSchema = z.object({
  error: z.object({ errors: z.array(z.object({ reason: z.string() })).default([]) }),
});

/** The reasons YouTube gives when the daily quota has run out. */
const QUOTA_REASONS = new Set(["quotaExceeded", "dailyLimitExceeded"]);

/**
 * The music search backed by the YouTube Data API `search.list` (ADR-0005),
 * which draws on its own bucket of about 100 calls a day. The API key travels
 * in a header, so it never shows up in a URL or a log line; neither does the
 * query, which is player text.
 */
export function createYouTubeMusicSearch(
  apiKey: string,
  fetchFn: typeof fetch = fetch,
): MusicSearch {
  return {
    async search(query) {
      const url = new URL(SEARCH_URL);
      url.searchParams.set("part", "id");
      url.searchParams.set("q", query);
      url.searchParams.set("type", "video");
      url.searchParams.set("videoEmbeddable", "true");
      url.searchParams.set("maxResults", String(MAX_RESULTS));
      try {
        const response = await fetchFn(url, {
          headers: { "x-goog-api-key": apiKey },
          signal: AbortSignal.timeout(TIMEOUT_MS),
        });
        if (!response.ok) return await readFailure(response);
        return readSearchList(await response.json());
      } catch (error) {
        console.warn(
          `YouTube search.list failed: ${error instanceof Error ? error.name : "unknown"}`,
        );
        return { kind: "unavailable" };
      }
    },
  };
}

async function readFailure(response: Response): Promise<SearchResult> {
  const body = errorSchema.safeParse(await response.json().catch(() => undefined));
  const reasons = body.success ? body.data.error.errors.map((error) => error.reason) : [];
  if (response.status === 403 && reasons.some((reason) => QUOTA_REASONS.has(reason))) {
    console.warn("YouTube search.list quota is exhausted until midnight Pacific Time");
    return { kind: "quota-exhausted" };
  }
  console.warn(`YouTube search.list answered ${response.status} (${reasons.join(", ")})`);
  return { kind: "unavailable" };
}

function readSearchList(body: unknown): SearchResult {
  const result = searchListSchema.safeParse(body);
  if (!result.success) {
    console.warn("YouTube search.list answered in an unexpected shape");
    return { kind: "unavailable" };
  }
  const videoId = result.data.items.find((item) => item.id.videoId)?.id.videoId;
  return videoId ? { kind: "found", videoId } : { kind: "nothing-found" };
}
