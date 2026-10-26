import type { Direction } from "@bumbadum/world";
import { Container, Rectangle, Sprite, Texture } from "pixi.js";
import { carDepth } from "../depth.ts";
import { carFrame, fxFrame } from "../movement/car-animation.ts";
import type { CarPoint, CarPose } from "../movement/car-driving.ts";

const CELL_SIZE = 48;
const SMOKE_CELL_SIZE = 16;
const DUST_CELL_SIZE = 24;
const SPEED_LINE_CELL_SIZE = 16;

export interface CarFxTextures {
  smoke?: Texture;
  dust?: Texture;
  speedLines?: Texture;
}

export interface CarRendererTextures {
  /** 3×3 sheet: direction rows, parked/walk A/walk B columns. */
  background: Texture;
  front: Texture;
  fx?: CarFxTextures;
}

export interface CarRendererOptions {
  textures: CarRendererTextures;
  /** An AvatarSprite.view or another avatar container, inserted between car layers. */
  avatar?: Container;
}

/** Pixi view of a car: rear body, driver avatar, front body, then transient driving FX. */
export class CarRenderer {
  readonly view = new Container({ label: "car", sortableChildren: true });
  private readonly background: Sprite;
  private readonly front: Sprite;
  private readonly backgroundSheet: Texture;
  private readonly frontSheet: Texture;
  private readonly smoke?: Sprite;
  private readonly dust?: Sprite;
  private readonly speedLines?: Sprite;
  private readonly smokeSheet?: Texture;
  private readonly dustSheet?: Texture;
  private readonly speedLineSheet?: Texture;
  private readonly avatar?: Container;

  constructor({ textures, avatar }: CarRendererOptions) {
    this.backgroundSheet = textures.background;
    this.frontSheet = textures.front;
    this.background = new Sprite({ texture: sheetFrame(this.backgroundSheet, 0, 0, CELL_SIZE) });
    this.front = new Sprite({ texture: sheetFrame(this.frontSheet, 0, 0, CELL_SIZE) });
    for (const sprite of [this.background, this.front]) {
      sprite.anchor.set(0.5, 44 / CELL_SIZE);
    }
    this.background.zIndex = 0;
    this.avatar = avatar;
    if (avatar) {
      avatar.zIndex = 1;
      this.view.addChild(this.background, avatar, this.front);
    } else {
      this.view.addChild(this.background, this.front);
    }
    this.front.zIndex = 2;

    this.smokeSheet = textures.fx?.smoke;
    this.dustSheet = textures.fx?.dust;
    this.speedLineSheet = textures.fx?.speedLines;
    this.smoke = effectSprite(this.smokeSheet, SMOKE_CELL_SIZE, -19, -4);
    this.dust = effectSprite(this.dustSheet, DUST_CELL_SIZE, 0, 0);
    this.speedLines = effectSprite(this.speedLineSheet, SPEED_LINE_CELL_SIZE, 0, -18);
    for (const sprite of [this.smoke, this.dust, this.speedLines]) {
      if (sprite) {
        sprite.zIndex = 3;
        this.view.addChild(sprite);
      }
    }
  }

  /** Updates pose, car layers and FX without making assumptions about server state. */
  update(
    pose: Pick<CarPose, "direction" | "speed" | "drifting">,
    now: number,
    reducedMotion = false,
  ): void {
    const selected = carFrame(pose.direction, pose.speed, pose.drifting, now, reducedMotion);
    this.background.texture = sheetFrame(
      this.backgroundSheet,
      selected.row,
      selected.column,
      CELL_SIZE,
    );
    this.front.texture = sheetFrame(this.frontSheet, selected.row, selected.column, CELL_SIZE);
    this.background.scale.x = selected.mirrored ? -1 : 1;
    this.front.scale.x = selected.mirrored ? -1 : 1;
    if (this.avatar) this.avatar.scale.x = selected.mirrored ? -1 : 1;

    if (this.smoke) {
      this.smoke.visible = !reducedMotion && pose.speed > 0.2;
      if (this.smokeSheet)
        this.smoke.texture = sheetFrame(this.smokeSheet, 0, fxFrame(now, 4, 90), SMOKE_CELL_SIZE);
    }
    if (this.dust) {
      this.dust.visible = !reducedMotion && pose.drifting;
      if (this.dustSheet)
        this.dust.texture = sheetFrame(this.dustSheet, 0, fxFrame(now, 4, 90), DUST_CELL_SIZE);
    }
    if (this.speedLines) {
      this.speedLines.visible = !reducedMotion && pose.speed > 5;
      if (this.speedLineSheet)
        this.speedLines.texture = sheetFrame(
          this.speedLineSheet,
          0,
          fxFrame(now, 2, 90),
          SPEED_LINE_CELL_SIZE,
        );
    }
  }

  /** Places the car by its bottom-center anchor and updates its shared room depth key. */
  place(at: CarPoint, tileSize = 16): void {
    this.view.position.set((at.x + 0.5) * tileSize, (at.y + 1) * tileSize);
    this.view.zIndex = carDepth(at) * (tileSize / 16);
  }

  /** Places the Car at its authoritative pixel-space base anchor. */
  placePixel(at: CarPoint): void {
    this.view.position.set(at.x, at.y);
    this.view.zIndex = at.y;
  }

  setDirection(direction: Direction): void {
    this.background.scale.x = direction === "left" ? -1 : 1;
    this.front.scale.x = direction === "left" ? -1 : 1;
  }
}

function effectSprite(
  texture: Texture | undefined,
  size: number,
  x: number,
  y: number,
): Sprite | undefined {
  if (!texture) return undefined;
  const sprite = new Sprite({ texture: sheetFrame(texture, 0, 0, size), visible: false, x, y });
  sprite.anchor.set(0.5);
  return sprite;
}

function sheetFrame(texture: Texture, row: number, column: number, size: number): Texture {
  return new Texture({
    source: texture.source,
    frame: new Rectangle(column * size, row * size, size, size),
  });
}
