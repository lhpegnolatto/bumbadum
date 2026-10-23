import type { PlayerState, RoomState } from "@bumbadum/protocol";
import {
  type Direction,
  type GameMap,
  isWalkable,
  lobbyMap,
  STEPS_PER_SECOND,
} from "@bumbadum/world";
import { Application, Container, Graphics, Text, TextureStyle } from "pixi.js";
import { listenToDirectionKeys } from "./keyboard.ts";
import { type Bump, bumpOffset, Glide } from "./movement/glide.ts";
import { type Pose, StepPredictor } from "./movement/step-predictor.ts";
import { StepRepeater } from "./movement/step-repeater.ts";
import { SpeechBubbles } from "./speech-bubbles.ts";

/** Pixels per tile, before the whole-number scale that fits the map to its container. */
const TILE_SIZE = 16;
const DOT_RADIUS = 5;
/** Screen pixels between a player's nickname and their speech bubble. */
const BUBBLE_GAP = 2;

// The movement feel chosen in the movement prototype (ticket 02).
const STEP_INTERVAL_MS = 1000 / STEPS_PER_SECOND;
const REPEAT_DELAY_MS = 200;
const CORRECTION_SLIDE_MS = 120;

const COLORS = {
  background: "#2b2238",
  floor: ["#e9d8bd", "#e2cfb1"],
  wall: "#3b3346",
  wallTop: "#4d4459",
  furniture: "#8a6f5a",
  furnitureTop: "#a3876f",
  spawnPoint: "#c9b08a",
  me: "#7fd1b9",
  others: "#f4a259",
  outline: "#2a2433",
  label: "#ffffff",
} as const;

/** Rotation of the direction marker, which points up when unrotated. */
const ANGLE: Record<Direction, number> = {
  up: 0,
  right: Math.PI / 2,
  down: Math.PI,
  left: -Math.PI / 2,
};

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
}

export interface GameEngine {
  /** Updates the room from the latest server state. */
  applyState(state: RoomState): void;
  /** What the canvas shows, for end-to-end tests that cannot read pixels. */
  drawnPlayers(): DrawnPlayer[];
  /** Shows `text` in a bubble over the player for a few seconds. */
  showBubble(sessionId: string, text: string): void;
  destroy(): void;
}

interface Avatar {
  nickname: string;
  body: Container;
  label: Text;
  glide: Glide;
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

  const world = new Container();
  world.addChild(drawMap(map));
  const labels = new Container();
  app.stage.addChild(world, labels);
  // Last on the stage, so bubbles stay above every avatar and label.
  const bubbles = new SpeechBubbles(app.stage, app.screen);

  const fitToContainer = () => {
    const scale = fittingScale(map, container.clientWidth, container.clientHeight);
    world.scale.set(scale);
    app.renderer.resize(map.width * TILE_SIZE * scale, map.height * TILE_SIZE * scale);
  };
  fitToContainer();
  const resizeObserver = new ResizeObserver(fitToContainer);
  resizeObserver.observe(container);

  const avatars = new Map<string, Avatar>();
  let predictor: StepPredictor | undefined;
  const repeater = new StepRepeater({
    stepIntervalMs: STEP_INTERVAL_MS,
    repeatDelayMs: REPEAT_DELAY_MS,
  });
  const stopListening = listenToDirectionKeys(repeater);

  const addAvatar = (id: string, player: PlayerState): Avatar => {
    const body = createDot(id === sessionId ? COLORS.me : COLORS.others);
    const label = new Text({
      text: player.nickname,
      style: { fontFamily: "sans-serif", fontSize: 12, fill: COLORS.label },
    });
    label.anchor.set(0.5, 1);
    world.addChild(body);
    labels.addChild(label);
    const avatar: Avatar = {
      nickname: player.nickname,
      body,
      label,
      glide: new Glide({ x: player.x, y: player.y }),
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
    walkLocalPlayer(now);
    for (const avatar of avatars.values()) {
      const at = avatar.glide.at(now);
      const nudge = avatar.bump ? bumpOffset(avatar.bump, now) : { x: 0, y: 0 };
      avatar.body.position.set(
        (at.x + nudge.x + 0.5) * TILE_SIZE,
        (at.y + nudge.y + 0.5) * TILE_SIZE,
      );
      avatar.body.rotation = ANGLE[avatar.direction];
      avatar.label.position.set(
        avatar.body.x * world.scale.x,
        (avatar.body.y - DOT_RADIUS - 2) * world.scale.y,
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
          avatar.body.destroy({ children: true });
          avatar.label.destroy();
          avatars.delete(id);
        }
      }
      state.players.forEach((player, id) => {
        const avatar = avatars.get(id) ?? addAvatar(id, player);
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
        ...avatar.glide.target,
        direction: avatar.direction,
      }));
    },
    showBubble(id, text) {
      bubbles.show(id, text, performance.now());
    },
    destroy() {
      stopListening();
      resizeObserver.disconnect();
      app.destroy({ removeView: true }, { children: true });
    },
  };
}

/** The largest whole-number scale at which the map fits, so pixels stay square. */
function fittingScale(map: GameMap, width: number, height: number): number {
  const fit = Math.min(width / (map.width * TILE_SIZE), height / (map.height * TILE_SIZE));
  return Math.max(1, Math.floor(fit));
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

/** A dot with a notch pointing where the player faces (sprites come with the avatar). */
function createDot(color: string): Container {
  const dot = new Container();
  dot.addChild(
    new Graphics()
      .circle(0, 0, DOT_RADIUS)
      .fill(color)
      .stroke({ width: 1, color: COLORS.outline })
      .poly([0, -DOT_RADIUS - 3, -3, -DOT_RADIUS + 1, 3, -DOT_RADIUS + 1])
      .fill(COLORS.outline),
  );
  return dot;
}
