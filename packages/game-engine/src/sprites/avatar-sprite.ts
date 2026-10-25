import {
  type AnimationCycle,
  type Avatar,
  avatarFrames,
  avatarKey,
  type Direction,
  FRAME_SIZE,
  type LayerFrame,
  SPRITE_SHEETS,
} from "@bumbadum/avatar";
import { Assets, Container, Rectangle, Sprite, Texture } from "pixi.js";

const SOUND_NOTE_FRAME_SIZE = 48;
/** The hand sheet's 48×48 cells put the thrower's feet in the middle of their bottom edge. */
const HAND_FRAME_SIZE = 48;
const HAND_FRAMES = 2;
/** The hand sheet's rows; a left-facing hand is the right-facing one mirrored. */
const HAND_ROWS = { down: 0, right: 1, up: 2, left: 1 } as const satisfies Record<
  Direction,
  number
>;

/** The avatar sheets, cut into 24×24 frame textures on first use. */
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
 * A player's avatar drawn from the project's first-party sprite sheet.
 * The view's origin is the middle of the frame's bottom edge: put it where the
 * feet should stand.
 */
export class AvatarSprite {
  readonly view = new Container();
  private readonly layers: Sprite[] = [];
  private readonly soundNote: Sprite;
  private readonly soundNoteFrames: Texture[];
  private readonly hand: Sprite;
  /** By row, then frame. */
  private readonly handFrames: Texture[][];
  private worn: Avatar;
  private drawn = "";

  constructor(
    private readonly textures: FrameTextures,
    avatar: Avatar,
    soundNoteTexture: Texture,
    handTexture: Texture,
  ) {
    this.worn = { ...avatar };
    this.soundNoteFrames = Array.from(
      { length: 4 },
      (_, frame) =>
        new Texture({
          source: soundNoteTexture.source,
          frame: new Rectangle(
            frame * SOUND_NOTE_FRAME_SIZE,
            0,
            SOUND_NOTE_FRAME_SIZE,
            SOUND_NOTE_FRAME_SIZE,
          ),
        }),
    );
    this.soundNote = new Sprite({ texture: this.soundNoteFrames[0] });
    this.soundNote.anchor.set(0.5, 1);
    this.soundNote.position.set(0, -FRAME_SIZE);
    this.soundNote.visible = false;
    this.handFrames = [0, 1, 2].map((row) =>
      Array.from(
        { length: HAND_FRAMES },
        (_, frame) =>
          new Texture({
            source: handTexture.source,
            frame: new Rectangle(
              frame * HAND_FRAME_SIZE,
              row * HAND_FRAME_SIZE,
              HAND_FRAME_SIZE,
              HAND_FRAME_SIZE,
            ),
          }),
      ),
    );
    this.hand = new Sprite();
    this.hand.anchor.set(0.5, 1);
    this.hand.visible = false;
    this.view.addChild(this.hand);
  }

  get avatar(): Avatar {
    return this.worn;
  }

  wear(avatar: Avatar): void {
    this.worn = { ...avatar };
  }

  /**
   * Shows one animation frame facing `direction`, flipped once more when `flipped`, as a dance
   * frame may be; cheap when nothing changed.
   */
  draw(direction: Direction, cycle: AnimationCycle, frame: number, flipped = false): void {
    const key = `${avatarKey(this.worn)}:${direction}:${cycle}:${frame}:${flipped}`;
    if (key === this.drawn) return;
    this.drawn = key;
    const frames = avatarFrames(this.worn, direction, cycle, frame);
    while (this.layers.length < frames.length) {
      const layer = new Sprite();
      layer.anchor.set(0.5, 1);
      this.layers.push(layer);
      this.view.addChild(layer);
    }
    this.layers.forEach((layer, i) => {
      const layerFrame = frames[i];
      layer.visible = layerFrame !== undefined;
      if (!layerFrame) return;
      layer.texture = this.textures.get(layerFrame);
      layer.scale.x = layerFrame.mirrored !== flipped ? -1 : 1;
    });
    this.view.addChild(this.soundNote);
  }

  /**
   * Shows the hand holding confetti, frame `frame` of a throw towards `direction`, or hides it
   * on `undefined`. Throwing up, the hand is behind the body; otherwise in front of it.
   */
  drawHand(hand: { direction: Direction; frame: number } | undefined): void {
    this.hand.visible = hand !== undefined;
    if (!hand) return;
    const texture = this.handFrames[HAND_ROWS[hand.direction]]?.[hand.frame];
    if (texture) this.hand.texture = texture;
    this.hand.scale.x = hand.direction === "left" ? -1 : 1;
    // In front, it goes just below the sound note, which every draw puts on top.
    const index = hand.direction === "up" ? 0 : this.view.children.length - 2;
    this.view.setChildIndex(this.hand, Math.max(0, index));
  }

  drawSoundNote(frame: number | undefined): void {
    this.soundNote.visible = frame !== undefined;
    if (frame !== undefined) {
      const texture = this.soundNoteFrames[frame];
      if (texture) this.soundNote.texture = texture;
    }
  }
}
