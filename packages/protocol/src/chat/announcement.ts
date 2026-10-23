/**
 * Server → every client: a room event shown in the chat history. It travels
 * as a code plus parameters, never display text (ADR-0009); each client
 * renders it in its own language.
 */
export const ANNOUNCEMENT = "announcement";

export type Announcement =
  | { code: "player-joined"; params: { nickname: string } }
  | { code: "player-left"; params: { nickname: string } }
  /** `nickname` is the submitter's. */
  | { code: "track-queued"; params: { title: string; nickname: string } }
  | { code: "now-playing"; params: { title: string; nickname: string } }
  /** `nickname` is the voter's; the track is skipped once `votes` reaches `needed`. */
  | { code: "skip-vote-cast"; params: { nickname: string; votes: number; needed: number } }
  /** `nickname` is the submitter's. */
  | { code: "track-skipped"; params: { title: string; nickname: string } };

export type AnnouncementCode = Announcement["code"];
