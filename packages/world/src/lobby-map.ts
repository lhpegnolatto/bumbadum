import { createMap, isWalkable } from "./map.ts";
import {
  PLAZA_V2_COLLISION_OBJECTS,
  PLAZA_V2_PARKING_SPOTS,
  PLAZA_V2_ROWS,
  PLAZA_V2_TRACK_ROWS,
} from "./plaza-v2-map.generated.ts";

/** The lobby's map: the v2 music plaza, generated from its Tiled project (ADR-0016). */
export const lobbyMap = createMap(PLAZA_V2_ROWS);

export const lobbyParkingSpots = PLAZA_V2_PARKING_SPOTS;

/** Pixel-space collision geometry for Cars, including blocked map objects. */
export const lobbyCarCollisionWorld = {
  isBlocked(x: number, y: number): boolean {
    const tileX = Math.floor(x / 16);
    const tileY = Math.floor(y / 16);
    const onParkingSpot = lobbyParkingSpots.some(
      (spot) => Math.hypot(spot.x - x, spot.y - y) <= 20,
    );
    const onAutodromeTrack = PLAZA_V2_TRACK_ROWS[tileY]?.[tileX] === "#";
    if (onAutodromeTrack) return false;
    return (
      (!isWalkable(lobbyMap, { x: tileX, y: tileY }) && !onParkingSpot) ||
      this.isBlockedByObject(x, y)
    );
  },
  isBlockedByObject(x: number, y: number): boolean {
    return PLAZA_V2_COLLISION_OBJECTS.some(
      (object) =>
        !object.name.startsWith("car-") &&
        x >= object.x &&
        x <= object.x + object.width &&
        y >= object.y &&
        y <= object.y + object.height,
    );
  },
};
