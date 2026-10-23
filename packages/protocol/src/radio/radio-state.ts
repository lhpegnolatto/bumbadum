import { type SchemaType, schema, t } from "@colyseus/schema";

/** A track and who submitted it. */
export const TrackState = schema(
  {
    videoId: t.string(),
    title: t.string(),
    durationMs: t.uint32(),
    submitterId: t.string(),
    submitterNickname: t.string(),
  },
  "TrackState",
);
export type TrackState = SchemaType<typeof TrackState>;

export const NowPlayingState = schema(
  {
    track: t.ref(TrackState),
    /** Server time in epoch milliseconds (ADR-0004); clients turn it into a position. */
    startedAt: t.float64(),
  },
  "NowPlayingState",
);
export type NowPlayingState = SchemaType<typeof NowPlayingState>;

/** The room's radio: what is on air, and the queue behind it, oldest first. */
export const RadioState = schema(
  {
    nowPlaying: t.ref(NowPlayingState).optional(),
    queue: t.array(TrackState),
  },
  "RadioState",
);
export type RadioState = SchemaType<typeof RadioState>;
