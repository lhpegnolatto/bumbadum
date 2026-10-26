import type { Tile } from "./map.ts";
import { PLAZA_V2_AMBIENT_NPCS } from "./plaza-v2-map.generated.ts";

/** Map-authored positions for the Lobby's static Ambient NPCs. */
export const AMBIENT_NPC_POSITIONS = Object.fromEntries(
  PLAZA_V2_AMBIENT_NPCS.map(({ name, x, y }) => [
    name,
    { x: Math.floor(x / 16), y: Math.floor(y / 16) },
  ]),
) as Readonly<Record<string, Tile>>;

export type AmbientNpcId = keyof typeof AMBIENT_NPC_POSITIONS;
