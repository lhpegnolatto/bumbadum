import { describe, expect, it } from "vitest";
import { createYouTubeTrackCatalog } from "./youtube-track-catalog.ts";

/** A `videos.list` item as YouTube sends it, trimmed to the parts the catalog asks for. */
function item(
  overrides: { duration?: string; embeddable?: boolean; live?: string; title?: string } = {},
) {
  return {
    id: "dQw4w9WgXcQ",
    snippet: {
      title: overrides.title ?? "Never Gonna Give You Up",
      liveBroadcastContent: overrides.live ?? "none",
    },
    contentDetails: { duration: overrides.duration ?? "PT3M33S" },
    status: { embeddable: overrides.embeddable ?? true },
  };
}

/** A catalog whose YouTube answers every request with `body` and `status`. */
function catalogAnswering(body: unknown, status = 200) {
  const requests: { url: string; headers: Headers }[] = [];
  const catalog = createYouTubeTrackCatalog("secret-key", async (input, init) => {
    requests.push({ url: String(input), headers: new Headers(init?.headers) });
    return new Response(JSON.stringify(body), { status });
  });
  return { catalog, requests };
}

describe("YouTube track catalog", () => {
  it("reads title, duration, embeddable and live from videos.list", async () => {
    const { catalog } = catalogAnswering({ items: [item()] });

    expect(await catalog.lookUp("dQw4w9WgXcQ")).toEqual({
      kind: "found",
      info: {
        videoId: "dQw4w9WgXcQ",
        title: "Never Gonna Give You Up",
        durationMs: 213_000,
        embeddable: true,
        live: false,
      },
    });
  });

  it("reads every ISO 8601 duration YouTube uses", async () => {
    const durations: [string, number][] = [
      ["PT45S", 45_000],
      ["PT10M", 600_000],
      ["PT1H2M3S", 3_723_000],
      ["P1DT1S", 86_401_000],
      ["P0D", 0],
    ];
    for (const [duration, durationMs] of durations) {
      const { catalog } = catalogAnswering({ items: [item({ duration })] });
      expect(await catalog.lookUp("dQw4w9WgXcQ"), duration).toMatchObject({ info: { durationMs } });
    }
  });

  it("counts live and upcoming broadcasts as live", async () => {
    for (const live of ["live", "upcoming"]) {
      const { catalog } = catalogAnswering({ items: [item({ live, duration: "P0D" })] });
      expect(await catalog.lookUp("dQw4w9WgXcQ")).toMatchObject({ info: { live: true } });
    }
  });

  it("passes on a video that cannot be embedded", async () => {
    const { catalog } = catalogAnswering({ items: [item({ embeddable: false })] });
    expect(await catalog.lookUp("dQw4w9WgXcQ")).toMatchObject({ info: { embeddable: false } });
  });

  it("finds nothing when YouTube lists no such video", async () => {
    const { catalog } = catalogAnswering({ items: [] });
    expect(await catalog.lookUp("dQw4w9WgXcQ")).toEqual({ kind: "not-found" });
  });

  it("is unavailable when YouTube refuses, answers nonsense, or cannot be reached", async () => {
    expect(await catalogAnswering({ error: {} }, 403).catalog.lookUp("dQw4w9WgXcQ")).toEqual({
      kind: "unavailable",
    });
    expect(await catalogAnswering({ items: [{ id: 1 }] }).catalog.lookUp("dQw4w9WgXcQ")).toEqual({
      kind: "unavailable",
    });
    const unreachable = createYouTubeTrackCatalog("secret-key", async () => {
      throw new TypeError("fetch failed");
    });
    expect(await unreachable.lookUp("dQw4w9WgXcQ")).toEqual({ kind: "unavailable" });
  });

  it("asks for only the parts it reads, and keeps the key out of the URL", async () => {
    const { catalog, requests } = catalogAnswering({ items: [item()] });
    await catalog.lookUp("dQw4w9WgXcQ");

    const [request] = requests;
    const url = new URL(request?.url ?? "");
    expect(url.origin + url.pathname).toBe("https://www.googleapis.com/youtube/v3/videos");
    expect(url.searchParams.get("id")).toBe("dQw4w9WgXcQ");
    expect(url.searchParams.get("part")).toBe("snippet,contentDetails,status");
    expect(request?.url).not.toContain("secret-key");
    expect(request?.headers.get("x-goog-api-key")).toBe("secret-key");
  });
});
