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
  /** A name search found no video. */
  | { code: "search-nothing-found"; params?: undefined }
  /** The daily search quota ran out: names fail until midnight Pacific Time, links still work. */
  | { code: "search-quota-exhausted"; params?: undefined }
  /** The search could not answer: not configured, unreachable or broken. */
  | { code: "search-failed"; params?: undefined }
  /** Over the player's name searches per minute; a cached name never counts. */
  | { code: "search-rate-limited"; params?: undefined }
  | { code: "track-not-found"; params?: undefined }
  /** The track catalog could not answer: not configured, unreachable or out of quota. */
  | { code: "track-lookup-unavailable"; params?: undefined }
  | { code: `track-${Refusal}`; params?: undefined }
  /** `/skip` with nothing on air. */
  | { code: "skip-nothing-on-air"; params?: undefined }
  /** `/skip` again on the same track: the vote stands as it was. */
  | { code: "skip-already-voted"; params: { votes: number; needed: number } };

export type NoticeCode = Notice["code"];
