import type { Refusal } from "@bumbadum/radio";

/**
 * Server → one client: room text for that player only. It travels as a code
 * plus parameters, never display text (ADR-0009); each client renders it in
 * its own language.
 */
export const NOTICE = "notice";

export type Notice =
  | { code: "unknown-command"; params: { name: string } }
  | { code: "rate-limited"; params?: undefined }
  /** `/play` with nothing after it. */
  | { code: "play-missing-track"; params?: undefined }
  /** A link that names no YouTube video. */
  | { code: "play-not-a-video"; params?: undefined }
  /** A name to search for: searching arrives with `MusicSearch` (ticket 08). */
  | { code: "play-search-unavailable"; params?: undefined }
  | { code: "track-not-found"; params?: undefined }
  /** The track catalog could not answer: not configured, unreachable or out of quota. */
  | { code: "track-lookup-unavailable"; params?: undefined }
  | { code: `track-${Refusal}`; params?: undefined };

export type NoticeCode = Notice["code"];
