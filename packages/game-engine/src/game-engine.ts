import {
  type Avatar,
  sameAvatar as avatarsMatch,
  type DanceId,
  DEFAULT_AVATAR,
  danceFrame,
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
  TENNIS_COACH_ID,
  type TennisSteerDirection,
} from "@bumbadum/protocol";
import { type Direction, isDirection, lobbyMap, STEPS_PER_SECOND } from "@bumbadum/world";
import {
  Application,
  Assets,
  ColorMatrixFilter,
  Container,
  Graphics,
  Rectangle,
  Sprite,
  Text,
  Texture,
  TextureStyle,
} from "pixi.js";
import {
  AMBIENT_NPCS,
  type AmbientNpc,
  nearestAmbientNpc as findNearestAmbientNpc,
  TENNIS_COACH_NPC,
} from "./ambient-npcs.ts";
import { cameraOn, TILE_SIZE } from "./camera.ts";
import { ambientLightMatrix, daylightAt } from "./daylight/daylight.ts";
import { objectDepth, playerDepth } from "./depth.ts";
import { listenToDirectionKeys, listenToTennisDirectionKeys } from "./keyboard.ts";
import { lampIntensity, lightAlpha, lightTarget, lightThresholds } from "./lighting.ts";
import { type Bump, bumpOffset, Glide, isBumping, type Point } from "./movement/glide.ts";
import { Steering } from "./movement/steering.ts";
import { type Pose, StepPredictor } from "./movement/step-predictor.ts";
import { StepRepeater } from "./movement/step-repeater.ts";
import { PLAZA_V2_OBJECTS } from "./plaza-v2-objects.generated.ts";
import { SpeechBubbles } from "./speech-bubbles.ts";
import { ambientFrame, ambientStartFrame } from "./sprites/ambient-animation.ts";
import { AvatarAnimation } from "./sprites/avatar-animation.ts";
import { AvatarSprite, FrameTextures } from "./sprites/avatar-sprite.ts";
import { CarRenderer } from "./sprites/car-renderer.ts";
import { ConfettiThrowSprites } from "./sprites/confetti-throw-sprites.ts";
import { type TennisRenderSnapshot, tennisRenderSnapshot } from "./sprites/tennis-rendering.ts";
import {
  visibleWindowRegions,
  type WindowFacade,
  type WindowOccluder,
} from "./window-occlusion.ts";

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
const PLAZA_LAMP_GLOW = "/sprites/plaza-v2/lamp-glow.png";
const PLAZA_STAGE_GLOW = "/sprites/plaza-v2/stage-glow.png";
const SOUND_NOTES = "/sprites/effects/fx-notas-4q-arco-iris.png";
const CONFETTI_HAND = "/sprites/effects/confetti-hand.png";
const CONFETTI_PROJECTILE = "/sprites/effects/confetti-projectile.png";
const CONFETTI_IMPACT = "/sprites/effects/confetti-impact.png";
const TENNIS_BALL = "/sprites/effects/ball-8.png";
const TENNIS_BALL_SHADOW = "/sprites/effects/ball-shadow-8x4.png";
const TENNIS_BALL_TRAIL = "/sprites/effects/ball-trail-16.png";
const TENNIS_IMPACT = "/sprites/effects/impact-16.png";
const TENNIS_RACKET = "/sprites/effects/racket-sheet.png";
const TENNIS_SIDE_COLORS = { top: 0xf6c453, bottom: 0x55d68a } as const;
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
  /** Sends horizontal input while the local Player is in a Tennis match. */
  sendTennisSteer?(direction: TennisSteerDirection | null): void;
  /** The server's time now, or `undefined` until it is known: dancers keep in step with it. */
  serverNow(): number | undefined;
  /**
   * The local Player's Time of day now, in hours since midnight with minutes as a fraction of the
   * hour (18.5 is 18:30): the Ambient light and the Lamp glow follow it.
   */
  timeOfDay(): number;
  /** Receives a local interaction with the nearest Ambient NPC. */
  onAmbientNpcInteract?(npc: AmbientNpc): void;
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
  /** The latest Tennis render snapshot, for test seams and non-pixel observers. */
  drawnTennis(): TennisRenderSnapshot;
  /** Shows `text` in a bubble over the player for a few seconds. */
  showBubble(sessionId: string, text: string): void;
  /** Lets the walking keys move the local player, or stops them, as while the wardrobe is open. */
  setWalking(enabled: boolean): void;
  /** Starts or stops the speakers' Ambient pulse with the Radio's Now playing. */
  setOnAir(onAir: boolean): void;
  /**
   * Walks the local player towards `direction` like a held walking key, with the same timing, until
   * steered elsewhere or `null`. Ignored while walking is off.
   */
  steer(direction: Direction | null): void;
  /** Holds or releases horizontal input for the local Tennis participant. */
  steerTennis(direction: TennisSteerDirection | null): void;
  /** The nearest Ambient NPC to the local Player, when one is within interaction distance. */
  nearestAmbientNpc(): AmbientNpc | null;
  /** Invokes the host callback for the nearest Ambient NPC, returning whether one was found. */
  interactWithNearestNpc(): boolean;
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

interface TennisParticipantView {
  avatar: AvatarSprite;
  racket: Sprite;
}

/** A Map object looping through its Ambient animation's frames. */
interface AmbientObjectView {
  sprite: Sprite;
  textures: Texture[];
  durations: number[];
  startFrame: number;
  speaker: boolean;
}

interface AmbientNpcView {
  npc: AmbientNpc;
  sprite: AvatarSprite;
  label: Container;
}

/** Creates the PixiJS canvas inside `container` and returns the API React drives. */
export async function mountGameEngine(
  container: HTMLElement,
  {
    sessionId,
    sendStep,
    sendCarDrive,
    sendTennisSteer,
    serverNow,
    timeOfDay,
    onAmbientNpcInteract,
  }: GameEngineOptions,
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
    lampGlowTexture,
    stageGlowTexture,
    soundNotes,
    confettiHand,
    confettiProjectile,
    confettiImpact,
    tennisBall,
    tennisBallShadow,
    tennisBallTrail,
    tennisImpact,
    tennisRacket,
  ] = await Promise.all([
    FrameTextures.load(),
    Assets.load<Texture>(PLAZA_FLOOR),
    Assets.load<Texture>(PLAZA_OBJECTS_ATLAS),
    Assets.load<Texture>(PLAZA_LAMP_GLOW),
    Assets.load<Texture>(PLAZA_STAGE_GLOW),
    Assets.load<Texture>(SOUND_NOTES),
    Assets.load<Texture>(CONFETTI_HAND),
    Assets.load<Texture>(CONFETTI_PROJECTILE),
    Assets.load<Texture>(CONFETTI_IMPACT),
    Assets.load<Texture>(TENNIS_BALL),
    Assets.load<Texture>(TENNIS_BALL_SHADOW),
    Assets.load<Texture>(TENNIS_BALL_TRAIL),
    Assets.load<Texture>(TENNIS_IMPACT),
    Assets.load<Texture>(TENNIS_RACKET),
  ]);
  const carFx = await Promise.all([
    Assets.load<Texture>("/sprites/plaza-v2/cars/exhaust-smoke-48.png"),
    Assets.load<Texture>("/sprites/plaza-v2/cars/drift-dust-48.png"),
    Assets.load<Texture>("/sprites/plaza-v2/cars/speed-lines-48.png"),
  ]);
  const windowTextures = new Map<string, Texture>(
    await Promise.all(
      ["building-cafe", "building-brick", "food-truck"].map(
        async (name) =>
          [
            `windows-${name}.png`,
            await Assets.load<Texture>(`/sprites/plaza-v2/windows-${name}.png`),
          ] as const,
      ),
    ),
  );
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
  const scoreboardObject = PLAZA_V2_OBJECTS.find((object) => object.name === "scoreboard");
  if (!scoreboardObject) throw new Error("the generated plaza has no scoreboard placement");
  // Players and objects lower on the map are drawn in front of the ones above them.
  const depthSorted = new Container({ sortableChildren: true });
  const lightLayer = new Container();
  const lampGlowFrames = Array.from(
    { length: 8 },
    (_, index) =>
      new Texture({
        source: lampGlowTexture.source,
        frame: new Rectangle(
          index * (lampGlowTexture.width / 8),
          0,
          lampGlowTexture.width / 8,
          lampGlowTexture.height,
        ),
      }),
  );
  const lightStateStart = performance.now();
  const lightSprites: Array<{
    sprite: Sprite;
    level: "lampGlow" | "stageGlow";
    threshold: number;
    target: boolean;
    from: number;
    changedAt: number;
    lamp?: { durations: number[]; startFrame: number };
  }> = [];
  const windowViews: Array<{
    facade: WindowFacade;
    texture: Texture;
    layer: Container;
    threshold: number;
    target: boolean;
    from: number;
    changedAt: number;
  }> = [];
  const ambientObjects: AmbientObjectView[] = [];
  for (const object of PLAZA_V2_OBJECTS) {
    // Dynamic cars occupy these same parking anchors; keeping the decorative Tiled cars would
    // render a second car underneath every spawned vehicle.
    if (object.name.startsWith("car-")) continue;
    if (object.name === "scoreboard") continue;
    const atlasTexture = ({ x, y, width, height }: typeof object.frame) =>
      new Texture({ source: objectsAtlas.source, frame: new Rectangle(x, y, width, height) });
    const sprite = new Sprite({ texture: atlasTexture(object.frame), x: object.x, y: object.y });
    sprite.zIndex = objectDepth(object);
    depthSorted.addChild(sprite);
    if (object.glow) {
      const texture = object.glow.kind === "warm" ? lampGlowTexture : stageGlowTexture;
      const glowSprite = new Sprite(texture);
      if (object.glow.kind === "warm") {
        glowSprite.texture = lampGlowFrames[0] as Texture;
      }
      glowSprite.position.set(object.x + object.glow.offset.x, object.y + object.glow.offset.y);
      lightLayer.addChild(glowSprite);
      const startFrame = object.animation
        ? ambientStartFrame({ x: object.x, y: object.base }, object.animation.length)
        : 0;
      lightSprites.push({
        sprite: glowSprite,
        level: object.glow.kind === "warm" ? "lampGlow" : "stageGlow",
        threshold: 0,
        target: false,
        from: 0,
        changedAt: lightStateStart,
        lamp:
          object.glow.kind === "warm" && object.animation
            ? { durations: object.animation.map(({ duration }) => duration), startFrame }
            : undefined,
      });
    }
    if (object.windows) {
      const windowTexture = windowTextures.get(object.windows);
      if (!windowTexture) throw new Error(`missing generated window mask: ${object.windows}`);
      const windowLayer = new Container();
      lightLayer.addChild(windowLayer);
      windowViews.push({
        facade: {
          bounds: {
            x: object.x,
            y: object.y,
            width: object.frame.width,
            height: object.frame.height,
          },
          base: object.base,
        },
        texture: windowTexture,
        layer: windowLayer,
        threshold: 0,
        target: false,
        from: 0,
        changedAt: lightStateStart,
      });
    }
    // Every frame is the size of the first, so the object keeps its base and depth order.
    if (object.animation)
      ambientObjects.push({
        sprite,
        textures: object.animation.map(({ frame }) => atlasTexture(frame)),
        durations: object.animation.map(({ duration }) => duration),
        startFrame: ambientStartFrame({ x: object.x, y: object.base }, object.animation.length),
        speaker: object.name === "speaker" || object.name === "speaker-low",
      });
  }
  const scoreboard = new Sprite(
    new Texture({
      source: objectsAtlas.source,
      frame: new Rectangle(
        scoreboardObject.frame.x,
        scoreboardObject.frame.y,
        scoreboardObject.frame.width,
        scoreboardObject.frame.height,
      ),
    }),
  );
  scoreboard.position.set(scoreboardObject.x, scoreboardObject.y);
  scoreboard.zIndex = objectDepth(scoreboardObject);
  const scoreboardMarks = new Graphics();
  scoreboardMarks.zIndex = objectDepth(scoreboardObject) + 1;
  depthSorted.addChild(scoreboard, scoreboardMarks);
  // Thrown confetti flies above every player and object.
  const confettiLayer = new Container();
  const confetti = new ConfettiThrowSprites(confettiLayer, confettiProjectile, confettiImpact);
  const drawnThrows: DrawnConfettiThrow[] = [];
  const tennisLayer = new Container({ sortableChildren: true });
  const tennisParticipants = new Map<string, TennisParticipantView>();
  const tennisBallTextures = Array.from(
    { length: 3 },
    (_, index) =>
      new Texture({ source: tennisBall.source, frame: new Rectangle(index * 8, 0, 8, 8) }),
  ) as [Texture, Texture, Texture];
  const tennisTrailTextures = Array.from(
    { length: 2 },
    (_, index) =>
      new Texture({ source: tennisBallTrail.source, frame: new Rectangle(index * 16, 0, 16, 16) }),
  ) as [Texture, Texture];
  const tennisImpactTextures = Array.from(
    { length: 3 },
    (_, index) =>
      new Texture({ source: tennisImpact.source, frame: new Rectangle(index * 16, 0, 16, 16) }),
  ) as [Texture, Texture, Texture];
  const tennisBallSprite = new Sprite(tennisBallTextures[0]);
  tennisBallSprite.anchor.set(0.5);
  tennisBallSprite.visible = false;
  const tennisBallShadowSprite = new Sprite(tennisBallShadow);
  tennisBallShadowSprite.anchor.set(0.5);
  tennisBallShadowSprite.visible = false;
  const tennisTrailSprite = new Sprite(tennisTrailTextures[0]);
  tennisTrailSprite.anchor.set(0.5);
  tennisTrailSprite.visible = false;
  const tennisImpactSprite = new Sprite(tennisImpactTextures[0]);
  tennisImpactSprite.anchor.set(0.5);
  tennisImpactSprite.visible = false;
  tennisLayer.addChild(
    tennisTrailSprite,
    tennisBallShadowSprite,
    tennisBallSprite,
    tennisImpactSprite,
  );
  lightThresholds(lightSprites.map(({ sprite }) => ({ x: sprite.x, y: sprite.y }))).forEach(
    (threshold, index) => {
      const light = lightSprites[index];
      if (light) light.threshold = threshold;
    },
  );
  lightThresholds(windowViews.map(({ facade }) => facade.bounds)).forEach((threshold, index) => {
    const light = windowViews[index];
    if (light) light.threshold = threshold;
  });
  // The Ambient light casts the Time of day over the scene, which it renders at the camera's
  // scene resolution: whole texels per art pixel keep pixel art sharp at a fraction of the fill
  // (ADR-0031). Nicknames and speech bubbles live outside it.
  const ambientLight = new ColorMatrixFilter();
  const scene = new Container({ filters: [ambientLight] });
  scene.addChild(new Sprite(floor), depthSorted, tennisLayer, confettiLayer);
  // The lamps' glow brightens whatever lies beneath it, avatars and confetti included, and stays
  // out of the Ambient light so it keeps its colour as the scene darkens.
  for (const light of lightSprites) light.sprite.blendMode = "add";
  world.addChild(scene, lightLayer);
  const labels = new Container();
  app.stage.addChild(world, labels);
  const ambientNpcViews: AmbientNpcView[] = [...AMBIENT_NPCS, TENNIS_COACH_NPC].map((npc) => {
    const sprite = new AvatarSprite(textures, npc.avatar, soundNotes, confettiHand);
    const label = drawNickname(npc.name);
    depthSorted.addChild(sprite.view);
    labels.addChild(label);
    return { npc, sprite, label };
  });
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
  let tennisState: RoomState["tennis"] | undefined;
  let predictor: StepPredictor | undefined;
  const repeater = new StepRepeater({
    stepIntervalMs: STEP_INTERVAL_MS,
    repeatDelayMs: REPEAT_DELAY_MS,
  });
  let walking = true;
  let topInset = 0;
  let localCarId = "";
  const stopListening = listenToDirectionKeys(repeater, () => walking);
  const stopTennisListening = listenToTennisDirectionKeys(
    (direction) => sendTennisSteer?.(direction),
    () => {
      const participant = tennisState?.participants.has(sessionId) ?? false;
      return (
        participant &&
        (tennisState?.matchStatus === "countdown" || tennisState?.matchStatus === "rally")
      );
    },
  );
  const steering = new Steering(repeater);
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let onAir = false;

  const nearestNpc = (): AmbientNpc | undefined => {
    const player = avatars.get(sessionId);
    return player ? findNearestAmbientNpc(player.glide.at(performance.now())) : undefined;
  };

  const racketTextures = Array.from(
    { length: 16 },
    (_, index) =>
      new Texture({
        source: tennisRacket.source,
        frame: new Rectangle((index % 4) * 48, Math.floor(index / 4) * 48, 48, 48),
      }),
  );

  const addTennisParticipant = (id: string, playerAvatar: Avatar): TennisParticipantView => {
    const avatar = new AvatarSprite(textures, playerAvatar, soundNotes, confettiHand);
    const racket = new Sprite(racketTextures[0]);
    racket.anchor.set(0.5, 1);
    tennisLayer.addChild(racket, avatar.view);
    const view = { avatar, racket };
    tennisParticipants.set(id, view);
    return view;
  };

  const drawTennis = (snapshot: TennisRenderSnapshot | undefined) => {
    if (!snapshot) return;
    drawTennisScoreboard(
      scoreboardMarks,
      snapshot.topScore,
      snapshot.bottomScore,
      scoreboardObject,
    );
    const participantIds = new Set(
      snapshot.participants.map((participant) => participant.sessionId),
    );
    for (const [id, view] of tennisParticipants) {
      if (participantIds.has(id)) continue;
      view.avatar.view.destroy({ children: true });
      view.racket.destroy();
      tennisParticipants.delete(id);
    }
    for (const participant of snapshot.participants) {
      const player = playerSnapshots.get(participant.sessionId);
      const view =
        tennisParticipants.get(participant.sessionId) ??
        addTennisParticipant(
          participant.sessionId,
          participant.kind === "coach"
            ? TENNIS_COACH_NPC.avatar
            : player
              ? avatarOf(player.avatar)
              : DEFAULT_AVATAR,
        );
      view.avatar.wear(
        participant.kind === "coach"
          ? TENNIS_COACH_NPC.avatar
          : player
            ? avatarOf(player.avatar)
            : DEFAULT_AVATAR,
      );
      view.avatar.draw(participant.side === "top" ? "down" : "up", "idle", 0);
      view.avatar.view.position.set(participant.x, participant.y);
      view.avatar.view.zIndex = 100_000 + participant.y;
      view.racket.tint = TENNIS_SIDE_COLORS[participant.side];
      view.racket.position.set(participant.x, participant.y);
      view.racket.zIndex = view.avatar.view.zIndex + (participant.side === "top" ? 1 : -1);
      const racketFrame = snapshot.rackets.find(
        (racket) => racket.sessionId === participant.sessionId,
      );
      if (racketFrame) {
        const texture = racketTextures[racketFrame.frame.row * 4 + racketFrame.frame.column];
        if (!texture) continue;
        view.racket.texture = texture;
      }
    }
    tennisTrailSprite.visible = Boolean(snapshot.ball?.pose.trail);
    tennisBallShadowSprite.visible = Boolean(snapshot.ball);
    tennisBallSprite.visible = Boolean(snapshot.ball);
    tennisImpactSprite.visible = Boolean(snapshot.ball?.pose.impactFrame !== undefined);
    if (!snapshot.ball) return;
    const { pose } = snapshot.ball;
    tennisBallSprite.texture = tennisBallTextures[pose.frame];
    tennisBallSprite.position.set(pose.position.x, pose.position.y);
    tennisBallShadowSprite.position.set(pose.shadow.x, pose.shadow.y);
    if (pose.trail) {
      tennisTrailSprite.texture = tennisTrailTextures[pose.trail.frame];
      tennisTrailSprite.rotation = pose.trail.angle;
      tennisTrailSprite.position.set(pose.position.x, pose.position.y);
    }
    if (pose.impactFrame !== undefined) {
      tennisImpactSprite.texture = tennisImpactTextures[pose.impactFrame];
      tennisImpactSprite.position.set(pose.ground.x, pose.ground.y);
    }
    tennisLayer.zIndex = 100;
  };

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
    for (const ambient of ambientObjects) {
      const frame =
        ambient.speaker && !onAir
          ? 0
          : ambientFrame(ambient.durations, now, ambient.startFrame, reducedMotion.matches);
      ambient.sprite.texture = ambient.textures[frame] ?? ambient.sprite.texture;
    }
    const tennisSnapshot = tennisState
      ? tennisRenderSnapshot(tennisState, serverNow() ?? Date.now())
      : undefined;
    drawTennis(tennisSnapshot);
    // Follows the glide, not the bump, so a blocked step does not shake the view.
    const localCar = localCarId ? carSnapshots.get(localCarId) : undefined;
    const tennisFocus = tennisState?.participants.has(sessionId)
      ? tennisSnapshot?.ball?.pose.position
      : undefined;
    const focus = tennisFocus
      ? { x: tennisFocus.x / TILE_SIZE - 0.5, y: tennisFocus.y / TILE_SIZE - 1 }
      : localCar
        ? { x: localCar.x / TILE_SIZE - 0.5, y: localCar.y / TILE_SIZE - 1 }
        : (avatars.get(sessionId)?.glide.at(now) ?? map.spawnPoint);
    const camera = cameraOn(map, app.screen, tileCentre(focus), app.renderer.resolution, topInset);
    world.scale.set(camera.scale);
    world.position.set(camera.x, camera.y);
    ambientLight.resolution = camera.sceneResolution;
    const daylight = daylightAt(timeOfDay());
    ambientLight.matrix = ambientLightMatrix(daylight.ambientLight);
    for (const light of lightSprites) {
      const level = daylight.lampGlow;
      const target = lightTarget(level, light.threshold);
      const current = lightAlpha(light.from, light.target ? 1 : 0, now - light.changedAt);
      if (target !== light.target) {
        light.from = current;
        light.target = target;
        light.changedAt = now;
      }
      const alpha = lightAlpha(light.from, target ? 1 : 0, now - light.changedAt);
      const flickerFrame = light.lamp
        ? ambientFrame(light.lamp.durations, now, light.lamp.startFrame, reducedMotion.matches)
        : 0;
      if (light.lamp) {
        light.sprite.texture = lampGlowFrames[flickerFrame] ?? (lampGlowFrames[0] as Texture);
      }
      light.sprite.alpha =
        alpha * (light.lamp ? lampIntensity(flickerFrame, reducedMotion.matches) : 1);
    }
    for (const light of windowViews) {
      const target = lightTarget(daylight.litWindows, light.threshold);
      const current = lightAlpha(light.from, light.target ? 1 : 0, now - light.changedAt);
      if (target !== light.target) {
        light.from = current;
        light.target = target;
        light.changedAt = now;
      }
      light.layer.alpha = lightAlpha(
        light.from,
        target ? daylight.litWindows : 0,
        now - light.changedAt,
      );
    }
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
    const npcFrame = reducedMotion.matches ? 0 : Math.floor(animationNow / IDLE_FRAME_MS) % 4;
    for (const { npc, sprite, label } of ambientNpcViews) {
      const isCoachInMatch =
        npc.id === TENNIS_COACH_NPC.id && (tennisState?.participants.has(TENNIS_COACH_ID) ?? false);
      sprite.view.visible = !isCoachInMatch;
      label.visible = !isCoachInMatch;
      if (isCoachInMatch) continue;
      const position = tileCentre(npc.position);
      const dance = npc.dance
        ? danceFrame(npc.dance, animationNow, reducedMotion.matches)
        : undefined;
      sprite.view.position.set(
        position.x + (dance?.dx ?? 0),
        position.y + TILE_SIZE / 2 + (dance?.dy ?? 0),
      );
      sprite.view.zIndex = playerDepth(npc.position);
      sprite.draw(
        dance?.direction ?? npc.direction,
        dance?.cycle ?? "idle",
        dance?.frame ?? npcFrame,
        dance?.mirrored ?? false,
      );
      label.position.set(
        world.x + sprite.view.x * world.scale.x,
        world.y + (sprite.view.y - FRAME_SIZE + AVATAR_TOP_INSET) * world.scale.y - LABEL_GAP,
      );
    }
    for (const [id, car] of cars) {
      const state = carSnapshots.get(id);
      if (!state) continue;
      const direction = isDirection(state.direction) ? state.direction : "down";
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
        car.avatar.view.position.set(...carAvatarPosition(direction));
      }
    }
    const occluders: WindowOccluder[] = [
      ...[...avatars.values()]
        .filter(({ sprite }) => sprite.view.visible)
        .map(({ sprite }) => ({
          kind: "player" as const,
          bounds: {
            x: sprite.view.x - FRAME_SIZE / 2,
            y: sprite.view.y - FRAME_SIZE,
            width: FRAME_SIZE,
            height: FRAME_SIZE,
          },
          feetY: sprite.view.y,
        })),
      ...[...cars.values()].map((car) => ({
        kind: "car" as const,
        bounds: { x: car.x - 16, y: car.y - 30, width: 32, height: 32 },
        feetY: car.y,
      })),
    ];
    for (const window of windowViews) {
      for (const child of window.layer.removeChildren())
        child.destroy({ texture: false, textureSource: false });
      for (const region of visibleWindowRegions(window.facade, occluders)) {
        const sprite = new Sprite({
          texture: new Texture({
            source: window.texture.source,
            frame: new Rectangle(
              region.texture.x,
              region.texture.y,
              region.texture.width,
              region.texture.height,
            ),
          }),
          x: region.world.x,
          y: region.world.y,
        });
        sprite.alpha = 1;
        window.layer.addChild(sprite);
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
      tennisState = state.tennis;
      const tennisParticipantIds = new Set(state.tennis.participants.keys());
      for (const [id, avatar] of avatars) {
        const player = state.players.get(id);
        const inTennisMatch = tennisParticipantIds.has(id);
        avatar.sprite.view.visible = Boolean(player && !player.carId && !inTennisMatch);
        avatar.label.visible = Boolean(player && !player.carId && !inTennisMatch);
      }
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
        const inTennisMatch = tennisParticipantIds.has(id);
        avatar.sprite.view.visible = !player.carId && !inTennisMatch;
        avatar.label.visible = !player.carId && !inTennisMatch;
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
    drawnTennis() {
      return tennisState
        ? tennisRenderSnapshot(tennisState, serverNow() ?? Date.now())
        : { status: "idle", topScore: 0, bottomScore: 0, participants: [], rackets: [] };
    },
    showBubble(id, text) {
      bubbles.show(id, text, performance.now());
    },
    setWalking(enabled) {
      walking = enabled;
      if (!enabled) repeater.releaseAll();
    },
    setOnAir(value) {
      onAir = value;
    },
    steer(direction) {
      steering.steer(walking ? direction : null, performance.now());
    },
    steerTennis(direction) {
      sendTennisSteer?.(direction);
    },
    nearestAmbientNpc() {
      return nearestNpc() ?? null;
    },
    interactWithNearestNpc() {
      const npc = nearestNpc();
      if (!npc) return false;
      onAmbientNpcInteract?.(npc);
      return true;
    },
    setTopInset(pixels) {
      topInset = pixels;
    },
    destroy() {
      stopListening();
      stopTennisListening();
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

/** The 24×24 avatar's feet aligned to the 32×32 car sheet's direction-specific offsets. */
function carAvatarPosition(direction: Direction): [number, number] {
  if (direction === "right") return [-2, -3];
  if (direction === "left") return [2, -3];
  if (direction === "up") return [0, -4];
  return [0, -5];
}

function sameAvatar(a: Avatar, b: AvatarState): boolean {
  return avatarsMatch(a, avatarFromStateOrDefault(b));
}

function drawTennisScoreboard(
  graphics: Graphics,
  topScore: number,
  bottomScore: number,
  scoreboard: { x: number; y: number },
): void {
  graphics.clear();
  // Hide the two decorative dashes baked into the base scoreboard before drawing the live score.
  graphics.rect(scoreboard.x + 9, scoreboard.y + 9, 11, 6).fill(0x000000);
  graphics.rect(scoreboard.x + 35, scoreboard.y + 9, 11, 6).fill(0x000000);
  drawScoreDigit(graphics, scoreboard.x + 13, scoreboard.y + 9, topScore, TENNIS_SIDE_COLORS.top);
  drawScoreDigit(
    graphics,
    scoreboard.x + 39,
    scoreboard.y + 9,
    bottomScore,
    TENNIS_SIDE_COLORS.bottom,
  );
}

function drawScoreDigit(
  graphics: Graphics,
  x: number,
  y: number,
  score: number,
  color: number,
): void {
  const glyphs = [
    ["111", "101", "101", "101", "111"],
    ["010", "110", "010", "010", "111"],
    ["111", "001", "111", "100", "111"],
    ["111", "001", "111", "001", "111"],
    ["101", "101", "111", "001", "001"],
    ["111", "100", "111", "001", "111"],
  ] as const;
  const glyph = glyphs[Math.max(0, Math.min(5, score))];
  if (!glyph) return;
  for (const [row, line] of glyph.entries()) {
    for (const [column, pixel] of [...line].entries()) {
      if (pixel === "1") graphics.rect(x + column, y + row, 1, 1).fill(color);
    }
  }
}
