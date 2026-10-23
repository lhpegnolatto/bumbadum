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

/** The room's radio: what is on air, the queue behind it, oldest first, and the skip vote. */
export const RadioState = schema(
  {
    nowPlaying: t.ref(NowPlayingState).optional(),
    queue: t.array(TrackState),
    /** Skip votes against the track on air from the players present. */
    skipVotes: t.uint8(),
    /** The votes that skip it: more than half of the players present. */
    skipVotesNeeded: t.uint8(),
  },
  "RadioState",
);
export type RadioState = SchemaType<typeof RadioState>;
