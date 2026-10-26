import {
  type Avatar,
  sameAvatar as avatarsMatch,
  type DanceId,
  DEFAULT_AVATAR,
  FRAME_SIZE,
  IDLE_FRAME_MS,
} from "@bumbadum/avatar";
import {
  type AvatarState,
  avatarFromStateOrDefault,
  type CarState,
  type ConfettiThrown,
  danceOf,
  type PlayerState,
  type RoomState,
} from "@bumbadum/protocol";
import { type Direction, isDirection, lobbyMap, STEPS_PER_SECOND } from "@bumbadum/world";
import {
  Application,
  Assets,
  Container,
  Graphics,
  Rectangle,
  Sprite,
  Text,
  Texture,
  TextureStyle,
} from "pixi.js";
import { cameraOn, TILE_SIZE } from "./camera.ts";
import { objectDepth, playerDepth } from "./depth.ts";
import { listenToDirectionKeys } from "./keyboard.ts";
import { type Bump, bumpOffset, Glide, isBumping, type Point } from "./movement/glide.ts";
import { Steering } from "./movement/steering.ts";
import { type Pose, StepPredictor } from "./movement/step-predictor.ts";
import { StepRepeater } from "./movement/step-repeater.ts";
import { PLAZA_V2_OBJECTS } from "./plaza-v2-objects.generated.ts";
import { SpeechBubbles } from "./speech-bubbles.ts";
import { AvatarAnimation } from "./sprites/avatar-animation.ts";
import { AvatarSprite, FrameTextures } from "./sprites/avatar-sprite.ts";
import { CarRenderer } from "./sprites/car-renderer.ts";
import { ConfettiThrowSprites } from "./sprites/confetti-throw-sprites.ts";

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

// The Lobby's art, generated from its Tiled project (ADR-0016).
const PLAZA_FLOOR = "/sprites/plaza-v2/floor.png";
const PLAZA_OBJECTS_ATLAS = "/sprites/plaza-v2/objects.png";
const PLAZA_LIGHTS = "/sprites/plaza-v2/lights.png";
const SOUND_NOTES = "/sprites/effects/fx-notas-4q-arco-iris.png";
const CONFETTI_HAND = "/sprites/effects/confetti-hand.png";
const CONFETTI_PROJECTILE = "/sprites/effects/confetti-projectile.png";
const CONFETTI_IMPACT = "/sprites/effects/confetti-impact.png";
/** How many recent Confetti throws the engine remembers for end-to-end tests. */
const DRAWN_THROWS_KEPT = 20;

const COLORS = {
  background: "#2b2238",
  label: "#ffffff",
  labelBackground: "#000000",
} as const;

export interface GameEngineOptions {
  /** The local player's session id: their steps are predicted and sent. */
  sessionId: string;
  /** Sends a step intent to the room. */
  sendStep(direction: Direction): void;
  /** Sends the persistent direction while the local Player is driving a Car. */
  sendCarDrive?(direction: Direction): void;
  /** The server's time now, or `undefined` until it is known: dancers keep in step with it. */
  serverNow(): number | undefined;
}

/** A player as the engine draws them: the tile they stand on or glide towards. */
export interface DrawnPlayer extends Pose {
  sessionId: string;
  nickname: string;
  avatar: Avatar;
  /** The dance the player is performing, or `null`. */
  dance: DanceId | null;
  /** Where the centre of that tile is drawn, in CSS pixels from the canvas's top-left corner. */
  canvasPosition: { x: number; y: number };
}

/** A Confetti throw as the engine drew it. */
export interface DrawnConfettiThrow extends ConfettiThrown {
  nickname: string;
}

export interface GameEngine {
  /** Updates the room from the latest server state. */
  applyState(state: RoomState): void;
  /** What the canvas shows, for end-to-end tests that cannot read pixels. */
  drawnPlayers(): DrawnPlayer[];
  /** Draws a Confetti throw the room announced, from the thrower's hand to its Throw target. */
  throwConfetti(thrown: ConfettiThrown): void;
  /** The latest Confetti throws drawn, oldest first, for end-to-end tests. */
  drawnConfettiThrows(): DrawnConfettiThrow[];
  /** Shows `text` in a bubble over the player for a few seconds. */
  showBubble(sessionId: string, text: string): void;
  /** Lets the walking keys move the local player, or stops them, as while the wardrobe is open. */
  setWalking(enabled: boolean): void;
  /**
   * Walks the local player towards `direction` like a held walking key, with the same timing, until
   * steered elsewhere or `null`. Ignored while walking is off.
   */
  steer(direction: Direction | null): void;
  /**
   * CSS pixels at the top of the canvas that room interface covers, such as the Screen on a
   * phone: the local player is framed below them (ADR-0018). 0, the default, frames the whole canvas.
   */
  setTopInset(pixels: number): void;
  destroy(): void;
}

interface PlayerView {
  nickname: string;
  sprite: AvatarSprite;
  label: Container;
  glide: Glide;
  animation: AvatarAnimation;
  direction: Direction;
  dance: DanceId | null;
  bump?: Bump;
}

interface CarView {
  renderer: CarRenderer;
  avatar: AvatarSprite;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
}

/** Creates the PixiJS canvas inside `container` and returns the API React drives. */
export async function mountGameEngine(
  container: HTMLElement,
  { sessionId, sendStep, sendCarDrive, serverNow }: GameEngineOptions,
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
  const [
    textures,
    floor,
    objectsAtlas,
    lights,
    soundNotes,
    confettiHand,
    confettiProjectile,
    confettiImpact,
  ] = await Promise.all([
    FrameTextures.load(),
    Assets.load<Texture>(PLAZA_FLOOR),
    Assets.load<Texture>(PLAZA_OBJECTS_ATLAS),
    Assets.load<Texture>(PLAZA_LIGHTS),
    Assets.load<Texture>(SOUND_NOTES),
    Assets.load<Texture>(CONFETTI_HAND),
    Assets.load<Texture>(CONFETTI_PROJECTILE),
    Assets.load<Texture>(CONFETTI_IMPACT),
  ]);
  const carFx = await Promise.all([
    Assets.load<Texture>("/sprites/plaza-v2/cars/exhaust-smoke-16.png"),
    Assets.load<Texture>("/sprites/plaza-v2/cars/drift-dust-24x16.png"),
    Assets.load<Texture>("/sprites/plaza-v2/cars/speed-lines-16.png"),
  ]);
  const carTextures = new Map<string, { background: Texture; front: Texture }>();
  await Promise.all(
    ["kart", "convertible"].flatMap((model) =>
      ["red", "yellow", "green", "blue", "purple", "pink", "white", "black"].map(async (color) => {
        const [background, front] = await Promise.all([
          Assets.load<Texture>(`/sprites/plaza-v2/cars/${model}/${model}-${color}-back.png`),
          Assets.load<Texture>(`/sprites/plaza-v2/cars/${model}/${model}-${color}-front.png`),
        ]);
        carTextures.set(`${model}:${color}`, { background, front });
      }),
    ),
  );

  const world = new Container();
  // Players and objects lower on the map are drawn in front of the ones above them.
  const depthSorted = new Container({ sortableChildren: true });
  for (const object of PLAZA_V2_OBJECTS) {
    // Dynamic cars occupy these same parking anchors; keeping the decorative Tiled cars would
    // render a second car underneath every spawned vehicle.
    if (object.name.startsWith("car-")) continue;
    const { x, y, width, height } = object.frame;
    const texture = new Texture({
      source: objectsAtlas.source,
      frame: new Rectangle(x, y, width, height),
    });
    const sprite = new Sprite({ texture, x: object.x, y: object.y });
    sprite.zIndex = objectDepth(object);
    depthSorted.addChild(sprite);
  }
  // Thrown confetti flies above every player and object.
  const confettiLayer = new Container();
  const confetti = new ConfettiThrowSprites(confettiLayer, confettiProjectile, confettiImpact);
  const drawnThrows: DrawnConfettiThrow[] = [];
  // The evening glow brightens whatever lies beneath it, avatars and confetti included.
  world.addChild(
    new Sprite(floor),
    depthSorted,
    confettiLayer,
    new Sprite({ texture: lights, blendMode: "add" }),
  );
  const labels = new Container();
  app.stage.addChild(world, labels);
  // Last on the stage, so bubbles stay above every avatar and label.
  const bubbles = new SpeechBubbles(app.stage, app.screen);

  // The camera frames the world every frame, from the resized screen and its pixel ratio.
  const fitToContainer = () =>
    app.renderer.resize(container.clientWidth, container.clientHeight, window.devicePixelRatio);
  fitToContainer();
  const resizeObserver = new ResizeObserver(fitToContainer);
  resizeObserver.observe(container);
  // Browser zoom and moving the window to another monitor change the ratio, not always the size.
  const stopWatchingRatio = onDevicePixelRatioChange(fitToContainer);

  const avatars = new Map<string, PlayerView>();
  const cars = new Map<string, CarView>();
  const carSnapshots = new Map<string, CarState>();
  const playerSnapshots = new Map<string, PlayerState>();
  let predictor: StepPredictor | undefined;
  const repeater = new StepRepeater({
    stepIntervalMs: STEP_INTERVAL_MS,
    repeatDelayMs: REPEAT_DELAY_MS,
  });
  let walking = true;
  let topInset = 0;
  let localCarId = "";
  const stopListening = listenToDirectionKeys(repeater, () => walking);
  const steering = new Steering(repeater);
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const addAvatar = (id: string, player: PlayerState): PlayerView => {
    const sprite = new AvatarSprite(textures, avatarOf(player.avatar), soundNotes, confettiHand);
    const label = drawNickname(player.nickname);
    depthSorted.addChild(sprite.view);
    labels.addChild(label);
    const avatar: PlayerView = {
      nickname: player.nickname,
      sprite,
      label,
      glide: new Glide({ x: player.x, y: player.y }),
      animation: new AvatarAnimation(id, ANIMATION_TIMING),
      direction: player.direction,
      dance: danceOf(player),
    };
    avatars.set(id, avatar);
    return avatar;
  };

  const walkLocalPlayer = (now: number) => {
    const direction = repeater.tick(now);
    const me = avatars.get(sessionId);
    if (!direction || !me) return;
    if (localCarId) {
      sendCarDrive?.(direction);
      return;
    }
    if (!predictor) return;
    const { send, moved } = predictor.step(direction);
    if (send) sendStep(direction);
    me.direction = predictor.pose.direction;
    if (moved) me.glide.to(predictor.pose, now, STEP_INTERVAL_MS);
    else me.bump = { direction, at: now };
  };

  app.ticker.add(() => {
    const now = performance.now();
    const animationNow = Date.now();
    // Before the first clock sync, the local clock keeps a dancer moving, if not yet in unison.
    const danceNow = serverNow() ?? animationNow;
    walkLocalPlayer(now);
    // Follows the glide, not the bump, so a blocked step does not shake the view.
    const localCar = localCarId ? carSnapshots.get(localCarId) : undefined;
    const focus = localCar
      ? { x: localCar.x / TILE_SIZE - 0.5, y: localCar.y / TILE_SIZE - 1 }
      : (avatars.get(sessionId)?.glide.at(now) ?? map.spawnPoint);
    const camera = cameraOn(map, app.screen, tileCentre(focus), app.renderer.resolution, topInset);
    world.scale.set(camera.scale);
    world.position.set(camera.x, camera.y);
    for (const [id, avatar] of avatars) {
      const at = avatar.glide.at(now);
      const nudge = avatar.bump ? bumpOffset(avatar.bump, now) : { x: 0, y: 0 };
      const { view } = avatar.sprite;
      const drawnAt = { x: at.x + nudge.x, y: at.y + nudge.y };
      const walkingNow = avatar.glide.moving(now) || isBumping(avatar.bump, now);
      const frame = avatar.animation.frame(
        walkingNow,
        animationNow,
        reducedMotion.matches,
        avatar.dance ? { dance: avatar.dance, serverNow: danceNow } : undefined,
      );
      const soundNoteFrame = avatar.animation.soundNoteFrame(
        walkingNow,
        animationNow,
        reducedMotion.matches,
        avatar.dance ? { dance: avatar.dance, serverNow: danceNow } : undefined,
      );
      const dancing = "direction" in frame ? frame : undefined;
      // Feet on the bottom edge of the tile, centred across it; a dance frame nudges them.
      view.position.set(
        (drawnAt.x + 0.5) * TILE_SIZE + (dancing?.dx ?? 0),
        (drawnAt.y + 1) * TILE_SIZE + (dancing?.dy ?? 0),
      );
      view.zIndex = playerDepth(drawnAt);
      avatar.sprite.draw(
        dancing?.direction ?? avatar.direction,
        frame.cycle,
        frame.frame,
        dancing?.mirrored ?? false,
      );
      avatar.sprite.drawSoundNote(soundNoteFrame);
      avatar.sprite.drawHand(confetti.handOf(id, now, reducedMotion.matches));
      // Labels live outside the scaled world, so their size and gap render in screen pixels.
      avatar.label.position.set(
        world.x + view.x * world.scale.x,
        world.y + (view.y - FRAME_SIZE + AVATAR_TOP_INSET) * world.scale.y - LABEL_GAP,
      );
    }
    for (const [id, car] of cars) {
      const state = carSnapshots.get(id);
      if (!state) continue;
      const direction = isDirection(state.input)
        ? state.input
        : directionFromVelocity(state.velocityX, state.velocityY);
      const speed = Math.hypot(state.velocityX, state.velocityY) / TILE_SIZE;
      car.x += (car.targetX - car.x) * 0.35;
      car.y += (car.targetY - car.y) * 0.35;
      car.renderer.placePixel({ x: car.x, y: car.y });
      car.renderer.update(
        { direction, speed, drifting: speed > 5 && Boolean(state.input) },
        animationNow,
        reducedMotion.matches,
      );
      const driver = state.driverId ? playerSnapshots.get(state.driverId) : undefined;
      car.avatar.view.visible = Boolean(driver);
      if (driver) {
        car.avatar.wear(avatarOf(driver.avatar));
        car.avatar.draw(direction, "idle", 0);
        car.avatar.view.position.set(0, -4);
      }
    }
    confetti.update(now, reducedMotion.matches, (id) => {
      const view = avatars.get(id)?.sprite.view;
      return view && { x: view.x, y: view.y };
    });
    bubbles.update(now, (id) => {
      const label = avatars.get(id)?.label;
      return label && { x: label.x, y: label.y - label.height - BUBBLE_GAP };
    });
  });

  return {
    applyState(state) {
      const now = performance.now();
      playerSnapshots.clear();
      state.players.forEach((player, id) => {
        playerSnapshots.set(id, player);
      });
      carSnapshots.clear();
      state.cars.forEach((car, id) => {
        carSnapshots.set(id, car);
      });
      localCarId = state.players.get(sessionId)?.carId ?? "";
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
        if (avatar.nickname !== player.nickname) {
          // The ticker positions the new label on the next frame, as it does every frame.
          avatar.label.destroy({ children: true });
          avatar.label = drawNickname(player.nickname);
          labels.addChild(avatar.label);
          avatar.nickname = player.nickname;
        }
        avatar.dance = danceOf(player);
        avatar.sprite.view.visible = !player.carId;
        avatar.label.visible = !player.carId;
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
      state.cars.forEach((car, id) => {
        if (cars.has(id)) return;
        const carTexturePair = carTextures.get(`${car.model}:${car.color}`);
        if (!carTexturePair) return;
        const driver = car.driverId ? state.players.get(car.driverId) : undefined;
        const avatar = new AvatarSprite(
          textures,
          driver ? avatarOf(driver.avatar) : DEFAULT_AVATAR,
          soundNotes,
          confettiHand,
        );
        avatar.view.visible = Boolean(driver);
        const renderer = new CarRenderer({
          textures: {
            background: carTexturePair.background,
            front: carTexturePair.front,
            fx: { smoke: carFx[0], dust: carFx[1], speedLines: carFx[2] },
          },
          avatar: avatar.view,
        });
        depthSorted.addChild(renderer.view);
        cars.set(id, { renderer, avatar, x: car.x, y: car.y, targetX: car.x, targetY: car.y });
      });
      state.cars.forEach((car, id) => {
        const view = cars.get(id);
        if (view) {
          view.targetX = car.x;
          view.targetY = car.y;
        }
      });
      for (const [id, car] of cars) {
        if (state.cars.has(id)) continue;
        car.renderer.view.destroy({ children: true });
        cars.delete(id);
      }
    },
    drawnPlayers() {
      return [...avatars].map(([id, avatar]) => {
        const centre = tileCentre(avatar.glide.target);
        return {
          sessionId: id,
          nickname: avatar.nickname,
          avatar: avatar.sprite.avatar,
          dance: avatar.dance,
          ...avatar.glide.target,
          direction: avatar.direction,
          canvasPosition: {
            x: world.x + centre.x * world.scale.x,
            y: world.y + centre.y * world.scale.y,
          },
        };
      });
    },
    throwConfetti(thrown) {
      const thrower = avatars.get(thrown.throwerId);
      if (!thrower) return;
      const { view } = thrower.sprite;
      confetti.start(thrown, { x: view.x, y: view.y }, performance.now());
      drawnThrows.push({ ...thrown, nickname: thrower.nickname });
      if (drawnThrows.length > DRAWN_THROWS_KEPT) drawnThrows.shift();
    },
    drawnConfettiThrows() {
      return [...drawnThrows];
    },
    showBubble(id, text) {
      bubbles.show(id, text, performance.now());
    },
    setWalking(enabled) {
      walking = enabled;
      if (!enabled) repeater.releaseAll();
    },
    steer(direction) {
      steering.steer(walking ? direction : null, performance.now());
    },
    setTopInset(pixels) {
      topInset = pixels;
    },
    destroy() {
      stopListening();
      resizeObserver.disconnect();
      stopWatchingRatio();
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

/** Calls `listener` each time `window.devicePixelRatio` changes, until the returned function is called. */
function onDevicePixelRatioChange(listener: () => void): () => void {
  const stop = new AbortController();
  const watch = () => {
    // Matches only the current ratio, so it fires once the ratio moves away from it.
    window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`).addEventListener(
      "change",
      () => {
        listener();
        watch();
      },
      { once: true, signal: stop.signal },
    );
  };
  watch();
  return () => stop.abort();
}

/** The centre of the tile at `point`, in world pixels. */
function tileCentre(point: Point): { x: number; y: number } {
  return { x: (point.x + 0.5) * TILE_SIZE, y: (point.y + 0.5) * TILE_SIZE };
}

function avatarOf(state: AvatarState): Avatar {
  return avatarFromStateOrDefault(state);
}

function directionFromVelocity(x: number, y: number): Direction {
  if (Math.abs(x) >= Math.abs(y)) return x < 0 ? "left" : "right";
  return y < 0 ? "up" : "down";
}

function sameAvatar(a: Avatar, b: AvatarState): boolean {
  return avatarsMatch(a, avatarFromStateOrDefault(b));
}
