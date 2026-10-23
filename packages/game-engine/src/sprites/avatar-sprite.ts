import {
  type Avatar,
  avatarFrames,
  type Direction,
  FRAME_SIZE,
  type LayerFrame,
  SPRITE_SHEETS,
} from "@bumbadum/avatar";
import { Assets, Container, Rectangle, Sprite, Texture } from "pixi.js";

/** The avatar sheets, cut into 32×32 frame textures on first use. */
export class FrameTextures {
  private readonly frames = new Map<string, Texture>();

  private constructor(private readonly sheets: Record<string, Texture>) {}

  static async load(): Promise<FrameTextures> {
    return new FrameTextures(await Assets.load<Texture>([...SPRITE_SHEETS]));
  }

  get({ sheet, x, y }: LayerFrame): Texture {
    const key = `${sheet}:${x}:${y}`;
    let texture = this.frames.get(key);
    if (!texture) {
      const source = this.sheets[sheet]?.source;
      if (!source) throw new Error(`sprite sheet ${sheet} is not loaded`);
      texture = new Texture({ source, frame: new Rectangle(x, y, FRAME_SIZE, FRAME_SIZE) });
      this.frames.set(key, texture);
    }
    return texture;
  }
}

/**
 * A player's avatar drawn as its layers, shadow at the bottom and hair on top.
 * The view's origin is the middle of the frame's bottom edge: put it where the
 * feet should stand.
 */
export class AvatarSprite {
  readonly view = new Container();
  private readonly layers = Array.from({ length: 4 }, () => new Sprite());
  private worn: Avatar;
  private drawn = "";

  constructor(
    private readonly textures: FrameTextures,
    avatar: Avatar,
  ) {
    this.worn = { ...avatar };
    for (const layer of this.layers) {
      layer.anchor.set(0.5, 1);
      this.view.addChild(layer);
    }
  }

  get avatar(): Avatar {
    return this.worn;
  }

  wear(avatar: Avatar): void {
    this.worn = { ...avatar };
  }

  /** Shows walking frame `walkFrame` facing `direction`; cheap when nothing changed. */
  draw(direction: Direction, walkFrame: number): void {
    const { skinTone, hair, outfit } = this.worn;
    const key = `${skinTone}:${hair}:${outfit}:${direction}:${walkFrame}`;
    if (key === this.drawn) return;
    this.drawn = key;
    avatarFrames(this.worn, direction, walkFrame).forEach((frame, i) => {
      const layer = this.layers[i];
      if (!layer) return;
      layer.texture = this.textures.get(frame);
      layer.scale.x = frame.mirrored ? -1 : 1;
    });
  }
}
