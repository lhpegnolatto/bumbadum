import type { ConfettiThrown } from "@bumbadum/protocol";
import type { Direction } from "@bumbadum/world";
import { type Container, Rectangle, Sprite, Texture } from "pixi.js";
import {
  confettiThrowFrame,
  flightMs,
  flightPoint,
  handPoint,
  landingPoint,
  type PixelPoint,
} from "./confetti-throw.ts";

const PROJECTILE_FRAME_SIZE = 16;
const IMPACT_FRAME_SIZE = 48;
/** The impact's 48×48 cells burst around this point. */
const IMPACT_HIT_POINT = { x: 24, y: 18 };

interface Throw {
  thrown: ConfettiThrown;
  startedAt: number;
  flightMs: number;
  landing: PixelPoint;
  /** Where the confetti left the hand: set once it does. */
  release?: PixelPoint;
  projectile: Sprite;
  impact: Sprite;
}

/** The Confetti throws in flight over the room, drawn above every avatar and object. */
export class ConfettiThrowSprites {
  private readonly throws: Throw[] = [];
  private readonly projectileFrames: Texture[];
  private readonly impactFrames: Texture[];

  constructor(
    private readonly layer: Container,
    projectileTexture: Texture,
    impactTexture: Texture,
  ) {
    this.projectileFrames = frames(projectileTexture, PROJECTILE_FRAME_SIZE);
    this.impactFrames = frames(impactTexture, IMPACT_FRAME_SIZE);
  }

  /** Starts drawing `thrown`, by a thrower whose feet are now at `feet`, in world pixels. */
  start(thrown: ConfettiThrown, feet: PixelPoint, now: number): void {
    const landing = landingPoint(thrown.target);
    const hand = handPoint(feet, thrown.direction);
    const projectile = new Sprite({ texture: this.projectileFrames[0], visible: false });
    projectile.anchor.set(0.5);
    const impact = new Sprite({ texture: this.impactFrames[0], visible: false });
    impact.anchor.set(
      IMPACT_HIT_POINT.x / IMPACT_FRAME_SIZE,
      IMPACT_HIT_POINT.y / IMPACT_FRAME_SIZE,
    );
    impact.position.set(landing.x, landing.y);
    this.layer.addChild(projectile, impact);
    this.throws.push({
      thrown,
      startedAt: now,
      flightMs: flightMs(Math.hypot(landing.x - hand.x, landing.y - hand.y)),
      landing,
      projectile,
      impact,
    });
  }

  /**
   * Moves every throw on to `now`. `feetOf` gives where a thrower's feet are drawn, so the
   * confetti leaves their hand wherever they walked meanwhile.
   */
  update(
    now: number,
    reducedMotion: boolean,
    feetOf: (id: string) => PixelPoint | undefined,
  ): void {
    for (const current of [...this.throws]) {
      const frame = confettiThrowFrame(now - current.startedAt, current.flightMs, reducedMotion);
      const { projectile, impact, thrown } = current;
      projectile.visible = frame.phase === "flight";
      impact.visible = frame.phase === "impact";
      if (frame.phase === "flight") {
        const feet = feetOf(thrown.throwerId);
        current.release ??= feet ? handPoint(feet, thrown.direction) : current.landing;
        const point = flightPoint(current.release, current.landing, frame.progress);
        const texture = this.projectileFrames[frame.frame];
        if (texture) projectile.texture = texture;
        projectile.position.set(point.x, point.y);
        projectile.rotation = point.rotation;
        projectile.scale.x = point.mirrored ? -1 : 1;
      } else if (frame.phase === "impact") {
        const texture = this.impactFrames[frame.frame];
        if (texture) impact.texture = texture;
      } else if (frame.phase === "done") {
        projectile.destroy();
        impact.destroy();
        this.throws.splice(this.throws.indexOf(current), 1);
      }
    }
  }

  /** The hand a thrower shows now, winding up their latest throw, or `undefined`. */
  handOf(
    throwerId: string,
    now: number,
    reducedMotion: boolean,
  ): { direction: Direction; frame: number } | undefined {
    for (let i = this.throws.length - 1; i >= 0; i--) {
      const current = this.throws[i];
      if (current?.thrown.throwerId !== throwerId) continue;
      const frame = confettiThrowFrame(now - current.startedAt, current.flightMs, reducedMotion);
      if (frame.phase === "hand")
        return { direction: current.thrown.direction, frame: frame.frame };
    }
    return undefined;
  }
}

/** Cuts a one-row sheet into square frames. */
function frames(sheet: Texture, size: number): Texture[] {
  return Array.from(
    { length: sheet.width / size },
    (_, frame) =>
      new Texture({ source: sheet.source, frame: new Rectangle(frame * size, 0, size, size) }),
  );
}
