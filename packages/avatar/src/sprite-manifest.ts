import { AVATAR_CHOICES, type Avatar } from "./avatar.ts";

/**
 * Where a frame faces: the same four directions as the world's, restated here
 * so this package imports no other domain (ADR-0003).
 */
export type Direction = "up" | "down" | "left" | "right";

/** Every frame of every sheet is a 32×32 square. */
export const FRAME_SIZE = 32;

/** Walking frames per direction. */
export const WALK_FRAMES = 6;

/** The walking frame an avatar stands still on. */
export const IDLE_FRAME = 0;

/**
 * The first of the 6 columns each direction is drawn from, and whether they are
 * flipped. Columns 0–5 face down, 6–11 right, 12–17 up. The pack's 18–23 face
 * left as mirror images of 6–11, except the first frame of hairs 6–8, which is
 * a copy facing right; so left is drawn from 6–11, flipped.
 */
const COLUMNS: Record<Direction, { first: number; mirrored: boolean }> = {
  down: { first: 0, mirrored: false },
  right: { first: 6, mirrored: false },
  up: { first: 12, mirrored: false },
  left: { first: 6, mirrored: true },
};

const SHADOW_SHEET = "/sprites/shadow.png";
const BODY_SHEET = "/sprites/body.png";
const HAIR_SHEET = "/sprites/hairs.png";
const outfitSheet = (outfit: number) => `/sprites/outfits/outfit-${outfit}.png`;

/** Every sheet an avatar can be drawn from, as URL paths served by the web app. */
export const SPRITE_SHEETS: readonly string[] = [
  SHADOW_SHEET,
  BODY_SHEET,
  HAIR_SHEET,
  ...Array.from({ length: AVATAR_CHOICES.outfit }, (_, i) => outfitSheet(i + 1)),
];

/** One layer's frame: the 32×32 square at (`x`, `y`) of `sheet`, flipped horizontally when `mirrored`. */
export interface LayerFrame {
  layer: "shadow" | "body" | "outfit" | "hair";
  sheet: string;
  x: number;
  y: number;
  mirrored: boolean;
}

/**
 * The frames that draw `avatar` facing `direction` on walking frame `walkFrame`
 * (0–5), from the bottom layer to the top: shadow, body, outfit, hair.
 */
export function avatarFrames(
  avatar: Avatar,
  direction: Direction,
  walkFrame: number,
): LayerFrame[] {
  const { first, mirrored } = COLUMNS[direction];
  const x = (first + walkFrame) * FRAME_SIZE;
  return [
    { layer: "shadow", sheet: SHADOW_SHEET, x: 0, y: 0, mirrored: false },
    { layer: "body", sheet: BODY_SHEET, x, y: (avatar.skinTone - 1) * FRAME_SIZE, mirrored },
    { layer: "outfit", sheet: outfitSheet(avatar.outfit), x, y: 0, mirrored },
    { layer: "hair", sheet: HAIR_SHEET, x, y: (avatar.hair - 1) * FRAME_SIZE, mirrored },
  ];
}
