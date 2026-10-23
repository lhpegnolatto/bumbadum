import type { TrackCatalog, TrackLookup } from "@bumbadum/radio";
import { z } from "zod";

const VIDEOS_URL = "https://www.googleapis.com/youtube/v3/videos";

/** A lookup that hangs this long counts as unavailable. */
const TIMEOUT_MS = 5000;

/** YouTube caps titles at 100 characters; anything longer is cut, never trusted. */
const TITLE_MAX_LENGTH = 100;

const videosListSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string(),
        snippet: z.object({
          title: z.string().transform((title) => title.slice(0, TITLE_MAX_LENGTH)),
          /** "none", "live" or "upcoming". */
          liveBroadcastContent: z.string(),
        }),
        contentDetails: z.object({ duration: z.string() }),
        status: z.object({ embeddable: z.boolean() }),
      }),
    )
    .default([]),
});

const ISO_DURATION = /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/;

/**
 * The track catalog backed by the YouTube Data API `videos.list` (ADR-0005),
 * which costs 1 unit of the daily quota per lookup. The API key travels in a
 * header, so it never shows up in a URL or a log line.
 */
export function createYouTubeTrackCatalog(
  apiKey: string,
  fetchFn: typeof fetch = fetch,
): TrackCatalog {
  return {
    async lookUp(videoId) {
      const url = new URL(VIDEOS_URL);
      url.searchParams.set("part", "snippet,contentDetails,status");
      url.searchParams.set("id", videoId);
      try {
        const response = await fetchFn(url, {
          headers: { "x-goog-api-key": apiKey },
          signal: AbortSignal.timeout(TIMEOUT_MS),
        });
        if (!response.ok) {
          console.warn(`YouTube videos.list answered ${response.status}`);
          return { kind: "unavailable" };
        }
        return readVideosList(await response.json(), videoId);
      } catch (error) {
        console.warn(
          `YouTube videos.list failed: ${error instanceof Error ? error.name : "unknown"}`,
        );
        return { kind: "unavailable" };
      }
    },
  };
}

function readVideosList(body: unknown, videoId: string): TrackLookup {
  const result = videosListSchema.safeParse(body);
  if (!result.success) {
    console.warn("YouTube videos.list answered in an unexpected shape");
    return { kind: "unavailable" };
  }
  const video = result.data.items.find((item) => item.id === videoId);
  if (!video) return { kind: "not-found" };
  const durationMs = parseDuration(video.contentDetails.duration);
  if (durationMs === undefined) {
    console.warn(`YouTube gave an unreadable duration: ${video.contentDetails.duration}`);
    return { kind: "unavailable" };
  }
  return {
    kind: "found",
    info: {
      videoId,
      title: video.snippet.title,
      durationMs,
      embeddable: video.status.embeddable,
      live: video.snippet.liveBroadcastContent !== "none",
    },
  };
}

function parseDuration(text: string): number | undefined {
  const match = ISO_DURATION.exec(text);
  if (!match) return undefined;
  const [days = 0, hours = 0, minutes = 0, seconds = 0] = match
    .slice(1)
    .map((part) => Number(part ?? 0));
  return (((days * 24 + hours) * 60 + minutes) * 60 + seconds) * 1000;
}
