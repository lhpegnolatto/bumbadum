import { type SchemaType, schema, t } from "@colyseus/schema";

export type TennisSide = "top" | "bottom";
export type TennisMatchStatus = "idle" | "countdown" | "rally" | "complete";

/** The two participants' authoritative horizontal position during a match. */
export const TennisParticipantState = schema(
  {
    side: t.string<TennisSide>(),
    /** Pixel coordinate on the participant's baseline. */
    x: t.float64(),
  },
  "TennisParticipantState",
);
export type TennisParticipantState = SchemaType<typeof TennisParticipantState>;

/** A server-timed trajectory that lets clients interpolate the Ball locally. */
export const TennisBallState = schema(
  {
    fromSide: t.string<TennisSide>(),
    receivingSide: t.string<TennisSide>(),
    startX: t.float64(),
    targetX: t.float64(),
    speed: t.float64(),
    reboundCount: t.uint8(),
    /** Epoch milliseconds on the server clock, compatible with clock-ping. */
    launchedAt: t.float64(),
    bounceAt: t.float64(),
    contactAt: t.float64(),
  },
  "TennisBallState",
);
export type TennisBallState = SchemaType<typeof TennisBallState>;

export const TennisScoreState = schema(
  {
    top: t.uint8().default(0),
    bottom: t.uint8().default(0),
  },
  "TennisScoreState",
);
export type TennisScoreState = SchemaType<typeof TennisScoreState>;

/** Shared Tennis activity state; the server owns every field's value. */
export const TennisState = schema(
  {
    /** Ordered session ids waiting for a match, oldest first. */
    queue: t.array("string"),
    matchStatus: t.string<TennisMatchStatus>().default("idle"),
    /** Non-zero only while matchStatus is countdown. */
    countdownEndsAt: t.float64().default(0),
    /** Keyed by player session id while the match is active or celebrating. */
    participants: t.map(TennisParticipantState),
    score: t.ref(TennisScoreState).default(() => new TennisScoreState()),
    servingSide: t.string<TennisSide>().default("top"),
    winnerId: t.string().default(""),
    /** Absent before countdown and after the match is complete. */
    ball: t.ref(TennisBallState).optional(),
  },
  "TennisState",
);
export type TennisState = SchemaType<typeof TennisState>;
