/**
 * Why the server refused a join. The server sends only the code (ADR-0009);
 * each client renders it in its own language.
 */
export const joinRejections = ["room-full", "invalid-nickname", "invalid-avatar"] as const;
export type JoinRejection = (typeof joinRejections)[number];

export function isJoinRejection(value: unknown): value is JoinRejection {
  return joinRejections.includes(value as JoinRejection);
}
