import type { Direction } from "@bumbadum/world";
import { type SchemaType, schema, t } from "@colyseus/schema";
import { AvatarState } from "../avatar/avatar-state.ts";
import { RadioState } from "../radio/radio-state.ts";

/** A server-authoritative car motion snapshot, in pixel coordinates. */
export const CarState = schema(
  {
    model: t.string(),
    color: t.string(),
    x: t.float64(),
    y: t.float64(),
    velocityX: t.float64(),
    velocityY: t.float64(),
    input: t.string<Direction>(),
    driverId: t.string(),
    respawnAt: t.float64(),
  },
  "CarState",
);
export type CarState = SchemaType<typeof CarState>;

/** A player present in the room, positioned in tile coordinates. */
export const PlayerState = schema(
  {
    nickname: t.string(),
    avatar: t.ref(AvatarState),
    x: t.uint8(),
    y: t.uint8(),
    direction: t.string<Direction>(),
    /**
     * How many step intents the room has handled for this player, applied or
     * refused. The client compares it with how many it sent to reconcile its
     * predicted steps.
     */
    stepIntents: t.uint32(),
    /** The dance the player is performing, or `NOT_DANCING`. */
    dance: t.string(),
    /** Empty while the player is on foot; otherwise the id of the occupied car. */
    carId: t.string(),
  },
  "PlayerState",
);
export type PlayerState = SchemaType<typeof PlayerState>;

export const RoomState = schema(
  {
    /** Keyed by the player's session id. */
    players: t.map(PlayerState),
    /** Keyed by the deterministic car id. */
    cars: t.map(CarState),
    radio: t.ref(RadioState),
  },
  "RoomState",
);
export type RoomState = SchemaType<typeof RoomState>;
