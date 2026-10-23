/**
 * Server → one client: room text for that player only. It travels as a code
 * plus parameters, never display text (ADR-0009); each client renders it in
 * its own language.
 */
export const NOTICE = "notice";

export type Notice =
  | { code: "unknown-command"; params: { name: string } }
  | { code: "rate-limited"; params?: undefined };

export type NoticeCode = Notice["code"];
