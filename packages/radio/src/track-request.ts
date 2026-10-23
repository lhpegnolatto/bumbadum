/** What a player asked the radio to play. */
export type TrackRequest =
  | { kind: "video"; videoId: string }
  /**
   * A bare 11-character word: a video ID, unless the catalog knows no such
   * video, in which case it is a name to search for.
   */
  | { kind: "video-or-name"; videoId: string; name: string }
  | { kind: "name"; name: string }
  | { kind: "not-a-video" }
  | { kind: "missing" };

const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;

/** Looks like a link: a scheme, or a host and a path, with no spaces. */
const LINK = /^(?:[a-z][a-z0-9+.-]*:\/\/|[^\s/]+\.[^\s/]+\/)\S*$/i;

const YOUTUBE_HOSTS = ["youtube.com", "youtube-nocookie.com"];
const SHORT_HOST = "youtu.be";

/** Paths that carry the video ID as their second segment: `/embed/<id>`, `/shorts/<id>`… */
const ID_PATHS = new Set(["embed", "shorts", "live", "v"]);

/**
 * Reads the argument of `/play`: a YouTube link (a playlist link plays only
 * the video it names), a video ID, or a name to search for.
 */
export function readTrackRequest(input: string): TrackRequest {
  const text = input.trim();
  if (text.length === 0) return { kind: "missing" };
  if (VIDEO_ID.test(text)) return { kind: "video-or-name", videoId: text, name: text };
  if (!LINK.test(text)) return { kind: "name", name: text };

  const videoId = videoIdOfLink(text);
  return videoId === undefined ? { kind: "not-a-video" } : { kind: "video", videoId };
}

/** An http(s) link, the scheme optional: host, path, query, fragment. */
const LINK_PARTS = /^(?:https?:\/\/)?([^/?#]+)([^?#]*)(?:\?([^#]*))?(?:#.*)?$/i;

function videoIdOfLink(link: string): string | undefined {
  const [, rawHost = "", path = "", query = ""] = LINK_PARTS.exec(link) ?? [];
  const host = rawHost.toLowerCase();
  const segments = path.split("/").filter(Boolean);
  let candidate: string | undefined;
  if (host === SHORT_HOST) {
    candidate = segments[0];
  } else if (YOUTUBE_HOSTS.some((domain) => host === domain || host.endsWith(`.${domain}`))) {
    const [first = "", second] = segments;
    if (first === "watch") candidate = queryParam(query, "v");
    else if (ID_PATHS.has(first)) candidate = second;
  }
  return candidate && VIDEO_ID.test(candidate) ? candidate : undefined;
}

function queryParam(query: string, name: string): string | undefined {
  for (const pair of query.split("&")) {
    const [key, value] = pair.split("=");
    if (key === name) return value;
  }
  return undefined;
}
