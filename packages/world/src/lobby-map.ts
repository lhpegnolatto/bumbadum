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

// Cars need a forgiving apron around the parking lot to pull out without catching
// on decorative lamps, signs, or the baked parking barriers with their collision radius.
const PARKING_DRIVE_ZONE = {
  left: 944,
  right: 1216,
  top: 272,
  bottom: 640,
};

/** Pixel-space collision geometry for Cars, including blocked map objects. */
export const lobbyCarCollisionWorld = {
  isBlocked(x: number, y: number): boolean {
    const tileX = Math.floor(x / 16);
    const tileY = Math.floor(y / 16);
    const onParkingSpot = lobbyParkingSpots.some(
      (spot) => Math.hypot(spot.x - x, spot.y - y) <= 20,
    );
    const inParkingDriveZone =
      x >= PARKING_DRIVE_ZONE.left &&
      x <= PARKING_DRIVE_ZONE.right &&
      y >= PARKING_DRIVE_ZONE.top &&
      y <= PARKING_DRIVE_ZONE.bottom;
    const onAutodromeTrack = PLAZA_V2_TRACK_ROWS[tileY]?.[tileX] === "#";
    if (onAutodromeTrack || inParkingDriveZone) return false;
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
