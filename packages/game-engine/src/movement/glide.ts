import type { Direction } from "@bumbadum/world";

/** A point in tile units, which may fall between tiles while gliding. */
export interface Point {
  x: number;
  y: number;
}

/** Where an avatar is drawn: gliding in a straight line towards its target tile. */
export class Glide {
  private from: Point;
  private destination: Point;
  private startedAt = 0;
  private durationMs = 0;

  constructor(start: Point) {
    this.from = { ...start };
    this.destination = { ...start };
  }

  get target(): Point {
    return this.destination;
  }

  /** Heads for `target` from wherever the avatar is drawn at `now`. */
  to(target: Point, now: number, durationMs: number): void {
    this.from = this.at(now);
    this.destination = { ...target };
    this.startedAt = now;
    this.durationMs = durationMs;
  }

  /** Whether the avatar is still on its way to the target at `now`. */
  moving(now: number): boolean {
    return this.durationMs > 0 && now - this.startedAt < this.durationMs;
  }

  at(now: number): Point {
    const progress = this.durationMs > 0 ? (now - this.startedAt) / this.durationMs : 1;
    if (progress >= 1) return { ...this.destination };
    const k = Math.max(0, progress);
    return {
      x: this.from.x + (this.destination.x - this.from.x) * k,
      y: this.from.y + (this.destination.y - this.from.y) * k,
    };
  }
}

/** The prototype's 5 px bump on its 32 px tiles, in tiles. */
const BUMP_TILES = 5 / 32;
const BUMP_MS = 120;

const BUMP_AXIS: Record<Direction, Point> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

export interface Bump {
  direction: Direction;
  at: number;
}

/** How far a bump against a blocked tile pushes the avatar at `now`, in tiles. */
export function bumpOffset(bump: Bump, now: number): Point {
  const progress = (now - bump.at) / BUMP_MS;
  if (progress < 0 || progress >= 1) return { x: 0, y: 0 };
  const distance = Math.sin(progress * Math.PI) * BUMP_TILES;
  const axis = BUMP_AXIS[bump.direction];
  return { x: axis.x * distance, y: axis.y * distance };
}
