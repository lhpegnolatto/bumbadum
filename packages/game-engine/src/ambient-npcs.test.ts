import { isWalkable, lobbyMap } from "@bumbadum/world";
import { describe, expect, it } from "vitest";
import {
  AMBIENT_NPC_INTERACTION_RADIUS,
  AMBIENT_NPCS,
  ambientNpcTiles,
  isAmbientNpcRosterValid,
  nearestAmbientNpc,
  TENNIS_COACH_NPC,
} from "./ambient-npcs.ts";

describe("Ambient NPC roster", () => {
  it("contains six named tributes on valid walkable tiles", () => {
    expect(AMBIENT_NPCS).toHaveLength(6);
    expect(isAmbientNpcRosterValid()).toBe(true);
    expect(ambientNpcTiles()).toHaveLength(6);
  });

  it("keeps the permanent Tennis Coach in the Tennis hall", () => {
    expect(TENNIS_COACH_NPC.position.y).toBeGreaterThan(25);
    expect(isWalkable(lobbyMap, TENNIS_COACH_NPC.position)).toBe(true);
  });

  it("finds the nearest NPC only inside the interaction radius", () => {
    const npc = AMBIENT_NPCS[0];
    if (!npc) throw new Error("the roster is empty");

    expect(nearestAmbientNpc(npc.position)?.id).toBe(npc.id);
    expect(
      nearestAmbientNpc({
        x: npc.position.x + AMBIENT_NPC_INTERACTION_RADIUS + 0.1,
        y: npc.position.y,
      }),
    ).toBeUndefined();
  });

  it("prefers the closest NPC when several are in range", () => {
    const first = AMBIENT_NPCS[0];
    const second = AMBIENT_NPCS[1];
    if (!first || !second) throw new Error("the roster has fewer than two NPCs");
    const npcs = [
      { ...first, position: { x: 10, y: 10 } },
      { ...second, position: { x: 11, y: 10 } },
    ];

    expect(nearestAmbientNpc({ x: 10.8, y: 10 }, npcs)?.id).toBe(npcs[1]?.id);
  });
});
