import {
  type Avatar,
  sameAvatar as avatarsMatch,
  FRAME_SIZE,
  IDLE_FRAME_MS,
} from "@bumbadum/avatar";
import {
  type AvatarState,
  avatarFromState,
  type PlayerState,
  type RoomState,
} from "@bumbadum/protocol";
import {
  type Direction,
  type GameMap,
  isWalkable,
  lobbyMap,
  STEPS_PER_SECOND,
} from "@bumbadum/world";
import { Application, Container, Graphics, Text, TextureStyle } from "pixi.js";
import { listenToDirectionKeys } from "./keyboard.ts";
import { type Bump, bumpOffset, Glide, isBumping } from "./movement/glide.ts";
import { type Pose, StepPredictor } from "./movement/step-predictor.ts";
import { StepRepeater } from "./movement/step-repeater.ts";
import { SpeechBubbles } from "./speech-bubbles.ts";
import { AvatarAnimation } from "./sprites/avatar-animation.ts";
import { AvatarSprite, FrameTextures } from "./sprites/avatar-sprite.ts";
import { fitMapToViewport, TILE_SIZE } from "./world-layout.ts";

/** Screen pixels between the top of an avatar's frame and their nickname. */
const LABEL_GAP = 3;
/** Transparent world pixels above every avatar's highest visible pixel. */
const AVATAR_TOP_INSET = 8;
/** Screen pixels between a player's nickname and their speech bubble. */
const BUBBLE_GAP = 2;
const LABEL_PADDING_X = 4;
const LABEL_PADDING_Y = 2;
const LABEL_CORNER_RADIUS = 4;

// The movement feel chosen in the movement prototype (ticket 02).
const STEP_INTERVAL_MS = 1000 / STEPS_PER_SECOND;
const REPEAT_DELAY_MS = 200;
const CORRECTION_SLIDE_MS = 120;
const ANIMATION_TIMING = { idleFrameMs: IDLE_FRAME_MS, walkFrameMs: 100, walkGraceMs: 60 };

const COLORS = {
  background: "#2b2238",
  floor: ["#e9d8bd", "#e2cfb1"],
  wall: "#3b3346",
  wallTop: "#4d4459",
  furniture: "#8a6f5a",
  furnitureTop: "#a3876f",
  spawnPoint: "#c9b08a",
  label: "#ffffff",
  labelBackground: "#000000",
} as const;

export interface GameEngineOptions {
  /** The local player's session id: their steps are predicted and sent. */
  sessionId: string;
  /** Sends a step intent to the room. */
  sendStep(direction: Direction): void;
}

/** A player as the engine draws them: the tile they stand on or glide towards. */
export interface DrawnPlayer extends Pose {
  sessionId: string;
  nickname: string;
  avatar: Avatar;
}

export interface GameEngine {
  /** Updates the room from the latest server state. */
  applyState(state: RoomState): void;
  /** What the canvas shows, for end-to-end tests that cannot read pixels. */
  drawnPlayers(): DrawnPlayer[];
  /** Shows `text` in a bubble over the player for a few seconds. */
  showBubble(sessionId: string, text: string): void;
  /** Lets the walking keys move the local player, or stops them, as while the wardrobe is open. */
  setWalking(enabled: boolean): void;
  destroy(): void;
}

interface PlayerView {
  nickname: string;
  sprite: AvatarSprite;
  label: Container;
  glide: Glide;
  animation: AvatarAnimation;
  direction: Direction;
  bump?: Bump;
}

/** Creates the PixiJS canvas inside `container` and returns the API React drives. */
export async function mountGameEngine(
  container: HTMLElement,
  { sessionId, sendStep }: GameEngineOptions,
): Promise<GameEngine> {
  const map = lobbyMap;
  TextureStyle.defaultOptions.scaleMode = "nearest";
  const app = new Application();
  await app.init({
    width: map.width * TILE_SIZE,
    height: map.height * TILE_SIZE,
    background: COLORS.background,
    antialias: false,
    roundPixels: true,
    resolution: window.devicePixelRatio,
    autoDensity: true,
  });
  container.appendChild(app.canvas);
  const textures = await FrameTextures.load();

  const world = new Container();
  // Players lower on the map are drawn in front of the ones above them.
  const players = new Container({ sortableChildren: true });
  world.addChild(drawMap(map), players);
  const labels = new Container();
  app.stage.addChild(world, labels);
  // Last on the stage, so bubbles stay above every avatar and label.
  const bubbles = new SpeechBubbles(app.stage, app.screen);

  const fitToContainer = () => {
    const viewportWidth = container.clientWidth;
    const viewportHeight = container.clientHeight;
    app.renderer.resize(viewportWidth, viewportHeight);
    // Below native size the room is hidden behind the compatibility notice: keep the last fit.
    if (viewportWidth < map.width * TILE_SIZE || viewportHeight < map.height * TILE_SIZE) return;
    const layout = fitMapToViewport(map, viewportWidth, viewportHeight);
    world.scale.set(layout.scale);
    world.position.set(layout.x, layout.y);
  };
  fitToContainer();
  const resizeObserver = new ResizeObserver(fitToContainer);
  resizeObserver.observe(container);

  const avatars = new Map<string, PlayerView>();
  let predictor: StepPredictor | undefined;
  const repeater = new StepRepeater({
    stepIntervalMs: STEP_INTERVAL_MS,
    repeatDelayMs: REPEAT_DELAY_MS,
  });
  let walking = true;
  const stopListening = listenToDirectionKeys(repeater, () => walking);
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const addAvatar = (id: string, player: PlayerState): PlayerView => {
    const sprite = new AvatarSprite(textures, avatarOf(player.avatar));
    const label = drawNickname(player.nickname);
    players.addChild(sprite.view);
    labels.addChild(label);
    const avatar: PlayerView = {
      nickname: player.nickname,
      sprite,
      label,
      glide: new Glide({ x: player.x, y: player.y }),
      animation: new AvatarAnimation(id, ANIMATION_TIMING),
      direction: player.direction,
    };
    avatars.set(id, avatar);
    return avatar;
  };

  const walkLocalPlayer = (now: number) => {
    const direction = repeater.tick(now);
    const me = avatars.get(sessionId);
    if (!direction || !predictor || !me) return;
    const { send, moved } = predictor.step(direction);
    if (send) sendStep(direction);
    me.direction = predictor.pose.direction;
    if (moved) me.glide.to(predictor.pose, now, STEP_INTERVAL_MS);
    else me.bump = { direction, at: now };
  };

  app.ticker.add(() => {
    const now = performance.now();
    const animationNow = Date.now();
    walkLocalPlayer(now);
    for (const avatar of avatars.values()) {
      const at = avatar.glide.at(now);
      const nudge = avatar.bump ? bumpOffset(avatar.bump, now) : { x: 0, y: 0 };
      const { view } = avatar.sprite;
      // Feet on the bottom edge of the tile, centred across it.
      view.position.set((at.x + nudge.x + 0.5) * TILE_SIZE, (at.y + nudge.y + 1) * TILE_SIZE);
      view.zIndex = view.y;
      const frame = avatar.animation.frame(
        avatar.glide.moving(now) || isBumping(avatar.bump, now),
        animationNow,
        reducedMotion.matches,
      );
      avatar.sprite.draw(avatar.direction, frame.cycle, frame.frame);
      // Labels live outside the scaled world, so their size and gap render in screen pixels.
      avatar.label.position.set(
        world.x + view.x * world.scale.x,
        world.y + (view.y - FRAME_SIZE + AVATAR_TOP_INSET) * world.scale.y - LABEL_GAP,
      );
    }
    bubbles.update(now, (id) => {
      const label = avatars.get(id)?.label;
      return label && { x: label.x, y: label.y - label.height - BUBBLE_GAP };
    });
  });

  return {
    applyState(state) {
      const now = performance.now();
      for (const [id, avatar] of avatars) {
        if (!state.players.has(id)) {
          avatar.sprite.view.destroy({ children: true });
          avatar.label.destroy({ children: true });
          avatars.delete(id);
        }
      }
      state.players.forEach((player, id) => {
        const avatar = avatars.get(id) ?? addAvatar(id, player);
        if (!sameAvatar(avatar.sprite.avatar, player.avatar)) {
          avatar.sprite.wear(avatarOf(player.avatar));
        }
        if (id === sessionId) {
          if (!predictor) {
            predictor = new StepPredictor(map, player, player.stepIntents);
          } else if (predictor.reconcile(player, player.stepIntents)) {
            avatar.glide.to(predictor.pose, now, CORRECTION_SLIDE_MS);
          }
          avatar.direction = predictor.pose.direction;
          return;
        }
        const target = avatar.glide.target;
        const distance = Math.abs(player.x - target.x) + Math.abs(player.y - target.y);
        if (distance > 0) {
          const duration = distance === 1 ? STEP_INTERVAL_MS : CORRECTION_SLIDE_MS;
          avatar.glide.to({ x: player.x, y: player.y }, now, duration);
        }
        avatar.direction = player.direction;
      });
    },
    drawnPlayers() {
      return [...avatars].map(([id, avatar]) => ({
        sessionId: id,
        nickname: avatar.nickname,
        avatar: avatar.sprite.avatar,
        ...avatar.glide.target,
        direction: avatar.direction,
      }));
    },
    showBubble(id, text) {
      bubbles.show(id, text, performance.now());
    },
    setWalking(enabled) {
      walking = enabled;
      if (!enabled) repeater.releaseAll();
    },
    destroy() {
      stopListening();
      resizeObserver.disconnect();
      app.destroy({ removeView: true }, { children: true });
    },
  };
}

function drawNickname(nickname: string): Container {
  const text = new Text({
    text: nickname,
    style: {
      fontFamily: "sans-serif",
      fontSize: 12,
      fill: COLORS.label,
    },
  });
  text.position.set(LABEL_PADDING_X, LABEL_PADDING_Y);
  const background = new Graphics()
    .roundRect(
      0,
      0,
      text.width + LABEL_PADDING_X * 2,
      text.height + LABEL_PADDING_Y * 2,
      LABEL_CORNER_RADIUS,
    )
    .fill({ color: COLORS.labelBackground, alpha: 0.65 });
  const label = new Container();
  label.addChild(background, text);
  label.pivot.set(label.width / 2, label.height);
  return label;
}

function drawMap(map: GameMap): Graphics {
  const g = new Graphics();
  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      const px = x * TILE_SIZE;
      const py = y * TILE_SIZE;
      if (isWalkable(map, { x, y })) {
        g.rect(px, py, TILE_SIZE, TILE_SIZE).fill(COLORS.floor[(x + y) % 2]);
        continue;
      }
      const isWall = x === 0 || y === 0 || x === map.width - 1 || y === map.height - 1;
      g.rect(px, py, TILE_SIZE, TILE_SIZE).fill(isWall ? COLORS.wall : COLORS.furniture);
      if (isWall) g.rect(px, py, TILE_SIZE, 3).fill(COLORS.wallTop);
      else if (isWalkable(map, { x, y: y - 1 }))
        g.rect(px, py, TILE_SIZE, 3).fill(COLORS.furnitureTop);
    }
  }
  const spawn = map.spawnPoint;
  g.rect(spawn.x * TILE_SIZE + 4, spawn.y * TILE_SIZE + 4, TILE_SIZE - 8, TILE_SIZE - 8).stroke({
    width: 1,
    color: COLORS.spawnPoint,
  });
  return g;
}

function avatarOf(state: AvatarState): Avatar {
  return avatarFromState(state);
}

function sameAvatar(a: Avatar, b: AvatarState): boolean {
  return avatarsMatch(a, avatarFromState(b));
}
