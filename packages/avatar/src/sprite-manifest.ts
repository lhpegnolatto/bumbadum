import type { AppearanceLayer, Avatar } from "./avatar.ts";
import { ASSET_POSITION_BY_ID } from "./catalog.generated.ts";

/**
 * Where a frame faces: the same four directions as the world's, restated here
 * so this package imports no other domain (ADR-0003).
 */
export type Direction = "up" | "down" | "left" | "right";
export type AnimationCycle = "idle" | "walk";

/** Every frame of every sheet is a 24×24 square. */
export const FRAME_SIZE = 24;

/** Walking frames per direction. */
export const WALK_FRAMES = 4;

/** Idle frames per direction. */
export const IDLE_FRAMES = 4;

/** How long each idle frame is shown. */
export const IDLE_FRAME_MS = 250;

/** The walking frame an avatar stands still on. */
export const IDLE_FRAME = 0;

/**
 * The first of the four columns each direction is drawn from. Columns 0–3 face
 * down, 4–7 right and 8–11 up. Left mirrors the right-facing block.
 */
const COLUMNS: Record<Direction, { first: number; mirrored: boolean }> = {
  down: { first: 0, mirrored: false },
  right: { first: 4, mirrored: false },
  up: { first: 8, mirrored: false },
  left: { first: 4, mirrored: true },
};

const WALK_SHEET = "/sprites/avatar/walk.png";
const IDLE_SHEET = "/sprites/avatar/idle.png";
const LAYER_WALK_SHEET = "/sprites/avatar/layers-walk.png";
const LAYER_IDLE_SHEET = "/sprites/avatar/layers-idle.png";

/** Every sheet an avatar can be drawn from, as URL paths served by the web app. */
export const SPRITE_SHEETS: readonly string[] = [
  IDLE_SHEET,
  WALK_SHEET,
  LAYER_IDLE_SHEET,
  LAYER_WALK_SHEET,
];

/** One avatar frame: the 24×24 square at (`x`, `y`) of `sheet`, flipped when mirrored. */
export interface LayerFrame {
  layer: "body" | AppearanceLayer;
  sheet: string;
  x: number;
  y: number;
  mirrored: boolean;
}

/**
 * The frame that draws `avatar` facing `direction` in the selected animation cycle.
 */
export function avatarFrames(
  avatar: Avatar,
  direction: Direction,
  cycle: AnimationCycle,
  frame: number,
): LayerFrame[] {
  const { first, mirrored } = COLUMNS[direction];
  const x = (first + frame) * FRAME_SIZE;
  const sheet = cycle === "idle" ? IDLE_SHEET : WALK_SHEET;
  const layerSheet = cycle === "idle" ? LAYER_IDLE_SHEET : LAYER_WALK_SHEET;
  const frames: LayerFrame[] = [
    {
      layer: "body",
      sheet,
      x,
      y: (avatar.skinTone - 1) * FRAME_SIZE,
      mirrored,
    },
  ];
  const order = [
    "bottom",
    "footwear",
    "top",
    "overgarment",
    "neckwear",
    "hair",
    "eyewear",
    "headwear",
  ] as const;
  for (const layer of order) {
    const id = avatar[layer];
    if (!id) continue;
    const position = ASSET_POSITION_BY_ID[`${layer}:${id}`];
    if (!position) throw new Error(`missing avatar asset: ${layer}:${id}`);
    frames.push({
      layer,
      sheet: layerSheet,
      x: position.x + x,
      y: position.y,
      mirrored,
    });
  }
  return frames;
}
