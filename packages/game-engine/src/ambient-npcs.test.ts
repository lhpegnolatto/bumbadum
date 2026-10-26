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
  it("contains ten named tributes on valid walkable tiles", () => {
    expect(AMBIENT_NPCS).toHaveLength(10);
    expect(isAmbientNpcRosterValid()).toBe(true);
    expect(ambientNpcTiles()).toHaveLength(10);
  });

  it("keeps the plaza center open while placing tributes around its edges", () => {
    const edgeTributes = AMBIENT_NPCS.filter(({ id }) =>
      ["bob-marley", "michael-jackson", "luiz-gonzaga"].includes(id),
    );
    expect(edgeTributes.every(({ position }) => position.x < 50 || position.x > 84)).toBe(true);
    expect(AMBIENT_NPCS.some(({ dance }) => dance === "side-step")).toBe(true);
    expect(AMBIENT_NPCS.find(({ id }) => id === "david-bowie")?.direction).toBe("up");
    expect(AMBIENT_NPCS.find(({ id }) => id === "aretha-franklin")?.direction).toBe("up");
    expect(AMBIENT_NPCS.find(({ id }) => id === "bob-marley")?.direction).toBe("right");
    expect(AMBIENT_NPCS.find(({ id }) => id === "freddie-mercury")?.direction).toBe("right");
    expect(AMBIENT_NPCS.find(({ id }) => id === "rita-lee")?.dance).toBe("side-step");
  });

  it("anchors the four adjusted tributes to recognizable plaza landmarks", () => {
    expect(AMBIENT_NPCS.find(({ id }) => id === "bob-marley")?.position).toEqual({ x: 41, y: 26 });
    expect(AMBIENT_NPCS.find(({ id }) => id === "freddie-mercury")?.position).toEqual({
      x: 75,
      y: 38,
    });
    expect(AMBIENT_NPCS.find(({ id }) => id === "raul-seixas")?.position).toEqual({ x: 52, y: 30 });
    expect(AMBIENT_NPCS.find(({ id }) => id === "rita-lee")?.position).toEqual({ x: 80, y: 24 });
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
