import { describe, expect, it } from "vitest";
import { createYouTubeMusicSearch } from "./youtube-music-search.ts";

/** A `search.list` result as YouTube sends it with `part=id`. */
const video = (videoId: string) => ({
  kind: "youtube#searchResult",
  id: { kind: "youtube#video", videoId },
});

/** A Google API error body with one error of `reason`. */
const apiError = (code: number, reason: string) => ({
  error: { code, message: "…", errors: [{ domain: "youtube.quota", reason, message: "…" }] },
});

/** A search whose YouTube answers every request with `body` and `status`. */
function searchAnswering(body: unknown, status = 200) {
  const requests: { url: string; headers: Headers }[] = [];
  const search = createYouTubeMusicSearch("secret-key", async (input, init) => {
    requests.push({ url: String(input), headers: new Headers(init?.headers) });
    return new Response(JSON.stringify(body), { status });
  });
  return { search, requests };
}

describe("YouTube music search", () => {
  it("finds the first video search.list lists", async () => {
    const { search } = searchAnswering({ items: [video("dQw4w9WgXcQ"), video("yPYZpwSpKmA")] });

    expect(await search.search("never gonna give you up")).toEqual({
      kind: "found",
      videoId: "dQw4w9WgXcQ",
    });
  });

  it("finds nothing when YouTube lists no video", async () => {
    expect(await searchAnswering({ items: [] }).search.search("zzzz")).toEqual({
      kind: "nothing-found",
    });
    expect(await searchAnswering({}).search.search("zzzz")).toEqual({ kind: "nothing-found" });
  });

  it("asks only for embeddable videos, a few of them, with the key in a header and never in the URL", async () => {
    const { search, requests } = searchAnswering({ items: [video("dQw4w9WgXcQ")] });
    await search.search("never gonna give you up");

    const [request] = requests;
    const url = new URL(request?.url ?? "");
    expect(url.origin + url.pathname).toBe("https://www.googleapis.com/youtube/v3/search");
    expect(Object.fromEntries(url.searchParams)).toEqual({
      part: "id",
      q: "never gonna give you up",
      type: "video",
      videoEmbeddable: "true",
      maxResults: "5",
    });
    expect(request?.url).not.toContain("secret-key");
    expect(request?.headers.get("x-goog-api-key")).toBe("secret-key");
  });

  it("reports the daily quota running out", async () => {
    for (const reason of ["quotaExceeded", "dailyLimitExceeded"]) {
      const { search } = searchAnswering(apiError(403, reason), 403);
      expect(await search.search("anything"), reason).toEqual({ kind: "quota-exhausted" });
    }
  });

  it("is unavailable when YouTube refuses for another reason, answers nonsense, or cannot be reached", async () => {
    const answers: [unknown, number][] = [
      [apiError(403, "forbidden"), 403],
      [apiError(400, "badRequest"), 400],
      ["<html>Server Error</html>", 500],
      [{ items: [{ id: { videoId: 42 } }] }, 200],
    ];
    for (const [body, status] of answers) {
      const { search } = searchAnswering(body, status);
      expect(await search.search("anything"), String(status)).toEqual({ kind: "unavailable" });
    }
    const unreachable = createYouTubeMusicSearch("secret-key", async () => {
      throw new TypeError("fetch failed");
    });
    expect(await unreachable.search("anything")).toEqual({ kind: "unavailable" });
  });
});
