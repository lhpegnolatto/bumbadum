import { type Direction, type GameMap, step, type Tile } from "@bumbadum/world";

/** Where a player stands and where they face. */
export interface Pose extends Tile {
  direction: Direction;
}

/**
 * Predicts the local player's steps and reconciles them with the room. The room
 * applies each step intent from the tile it holds and counts every intent it
 * handles, so the steps it has not handled yet are the last ones sent.
 */
export class StepPredictor {
  private predicted: Pose;
  /** Directions sent and not yet handled by the room, oldest first. */
  private pending: Direction[] = [];
  private sent: number;

  constructor(
    private readonly map: GameMap,
    roomPose: Pose,
    roomHandled: number,
  ) {
    this.predicted = { x: roomPose.x, y: roomPose.y, direction: roomPose.direction };
    this.sent = roomHandled;
  }

  get pose(): Pose {
    return this.predicted;
  }

  /** The player tries a step: predicts it, and says whether the room needs to hear of it. */
  step(direction: Direction): { send: boolean; moved: boolean } {
    const { tile, moved } = step(this.map, this.predicted, direction);
    if (!moved && this.predicted.direction === direction) return { send: false, moved };
    this.predicted = { ...tile, direction };
    this.pending.push(direction);
    this.sent += 1;
    return { send: true, moved };
  }

  /**
   * The room's pose for the player, after handling `roomHandled` step intents.
   * Returns whether the predicted tile changed, which the player sees as a correction.
   */
  reconcile(roomPose: Pose, roomHandled: number): boolean {
    const unhandled = this.sent - roomHandled;
    if (unhandled < 0 || unhandled > this.pending.length) {
      // The room's count does not follow ours (e.g. it seated us anew): start over from it.
      this.pending = [];
      this.sent = roomHandled;
    } else {
      this.pending = this.pending.slice(this.pending.length - unhandled);
    }

    let pose: Pose = { x: roomPose.x, y: roomPose.y, direction: roomPose.direction };
    for (const direction of this.pending) {
      pose = { ...step(this.map, pose, direction).tile, direction };
    }

    const corrected = pose.x !== this.predicted.x || pose.y !== this.predicted.y;
    this.predicted = pose;
    return corrected;
  }
}
