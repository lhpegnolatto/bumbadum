import type { Avatar } from "@bumbadum/avatar";
import {
  AMBIENT_NPC_POSITIONS,
  type AmbientNpcId,
  isWalkable,
  lobbyMap,
  type Tile,
} from "@bumbadum/world";

/** The distance, in tiles, at which a Player may talk to an Ambient NPC. */
export const AMBIENT_NPC_INTERACTION_RADIUS = 1.5;

export interface AmbientNpc {
  id: AmbientNpcId;
  name: string;
  position: Tile;
  avatar: Avatar;
  direction: "up" | "down" | "left" | "right";
}

const avatar = (
  skinTone: number,
  hair: string,
  top: string,
  bottom: string,
  extras: Partial<Pick<Avatar, "overgarment" | "eyewear" | "headwear">> = {},
): Avatar => ({
  skinTone,
  hair,
  top,
  bottom,
  footwear: "sneakers-black",
  overgarment: extras.overgarment ?? null,
  neckwear: null,
  eyewear: extras.eyewear ?? null,
  headwear: extras.headwear ?? null,
});

/** A small, fixed set of original avatar-style tributes placed on walkable plaza tiles. */
export const AMBIENT_NPCS: readonly AmbientNpc[] = [
  {
    id: "david-bowie",
    name: "David Bowie",
    position: npcPosition("david-bowie"),
    avatar: avatar(1, "short-blonde", "t-shirt-red", "trousers-black", {
      eyewear: "round-glasses-black",
    }),
    direction: "down",
  },
  {
    id: "aretha-franklin",
    name: "Aretha Franklin",
    position: npcPosition("aretha-franklin"),
    avatar: avatar(4, "afro-black", "t-shirt-purple", "flared-skirt-purple"),
    direction: "down",
  },
  {
    id: "bob-marley",
    name: "Bob Marley",
    position: npcPosition("bob-marley"),
    avatar: avatar(4, "dreads-black", "t-shirt-green", "trousers-red", {
      headwear: "beanie-green",
    }),
    direction: "down",
  },
  {
    id: "freddie-mercury",
    name: "Freddie Mercury",
    position: npcPosition("freddie-mercury"),
    avatar: avatar(2, "short-black", "tank-top-white", "trousers-black", {
      eyewear: "sunglasses-black",
    }),
    direction: "down",
  },
  {
    id: "whitney-houston",
    name: "Whitney Houston",
    position: npcPosition("whitney-houston"),
    avatar: avatar(3, "long-pigtails-black", "t-shirt-blue", "flared-skirt-white"),
    direction: "up",
  },
  {
    id: "prince",
    name: "Prince",
    position: npcPosition("prince"),
    avatar: avatar(3, "long-pigtails-purple", "jacket-purple", "trousers-black", {
      headwear: "top-hat-purple",
    }),
    direction: "up",
  },
];

/** The permanent Tennis Coach is rendered in the hall but is not a music tribute. */
export const TENNIS_COACH_NPC: AmbientNpc = {
  id: "tennis-coach",
  name: "Tennis Coach",
  position: npcPosition("tennis-coach"),
  avatar: avatar(2, "short-brown", "t-shirt-blue", "trousers-white"),
  direction: "down",
};

const distance = (a: Tile, b: Tile): number => Math.hypot(a.x - b.x, a.y - b.y);

function npcPosition(id: string): Tile {
  const position = AMBIENT_NPC_POSITIONS[id];
  if (!position) throw new Error(`Missing generated Ambient NPC position: ${id}`);
  return position;
}

/** Returns the nearest NPC within interaction distance, if one is available. */
export function nearestAmbientNpc(
  position: Tile,
  npcs: readonly AmbientNpc[] = AMBIENT_NPCS,
  radius = AMBIENT_NPC_INTERACTION_RADIUS,
): AmbientNpc | undefined {
  return npcs.reduce<AmbientNpc | undefined>((nearest, npc) => {
    if (distance(position, npc.position) > radius) return nearest;
    if (!nearest || distance(position, npc.position) < distance(position, nearest.position)) {
      return npc;
    }
    return nearest;
  }, undefined);
}

/** The roster's occupied tiles are the conceptual collision footprint for the client renderer. */
export function ambientNpcTiles(npcs: readonly AmbientNpc[] = AMBIENT_NPCS): readonly Tile[] {
  return npcs.map(({ position }) => position);
}

export function isAmbientNpcRosterValid(npcs: readonly AmbientNpc[] = AMBIENT_NPCS): boolean {
  const ids = new Set<string>();
  return npcs.every(
    (npc) =>
      !ids.has(npc.id) &&
      ids.add(npc.id) &&
      npc.name.length > 0 &&
      isWalkable(lobbyMap, npc.position),
  );
}
