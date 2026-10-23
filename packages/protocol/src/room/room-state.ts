import type { Direction } from "@bumbadum/world";
import { type SchemaType, schema, t } from "@colyseus/schema";

/** A player present in the room, positioned in tile coordinates. */
export const PlayerState = schema(
  {
    nickname: t.string(),
    x: t.uint8(),
    y: t.uint8(),
    direction: t.string<Direction>(),
    /**
     * How many step intents the room has handled for this player, applied or
     * refused. The client compares it with how many it sent to reconcile its
     * predicted steps.
     */
    stepIntents: t.uint32(),
  },
  "PlayerState",
);
export type PlayerState = SchemaType<typeof PlayerState>;

export const RoomState = schema(
  {
    /** Keyed by the player's session id. */
    players: t.map(PlayerState),
  },
  "RoomState",
);
export type RoomState = SchemaType<typeof RoomState>;
