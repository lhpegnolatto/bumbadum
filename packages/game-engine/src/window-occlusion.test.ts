import { describe, expect, it } from "vitest";
import { visibleWindowRegions, type WindowFacade, type WindowOccluder } from "./index.ts";

const facade: WindowFacade = {
  bounds: { x: 100, y: 40, width: 80, height: 40 },
  base: 96,
};

function actor(overrides: Partial<WindowOccluder>): WindowOccluder {
  return {
    kind: "player",
    bounds: { x: 120, y: 50, width: 16, height: 24 },
    feetY: 100,
    ...overrides,
  };
}

describe("window occlusion", () => {
  it("returns the complete mask when no actor is in front", () => {
    expect(visibleWindowRegions(facade, [])).toEqual([
      {
        world: facade.bounds,
        texture: { x: 0, y: 0, width: 80, height: 40 },
      },
    ]);
  });

  it("subtracts a Player in front into drawable regions", () => {
    expect(visibleWindowRegions(facade, [actor({})])).toEqual([
      {
        world: { x: 100, y: 40, width: 80, height: 10 },
        texture: { x: 0, y: 0, width: 80, height: 10 },
      },
      {
        world: { x: 100, y: 50, width: 20, height: 24 },
        texture: { x: 0, y: 10, width: 20, height: 24 },
      },
      {
        world: { x: 136, y: 50, width: 44, height: 24 },
        texture: { x: 36, y: 10, width: 44, height: 24 },
      },
      {
        world: { x: 100, y: 74, width: 80, height: 6 },
        texture: { x: 0, y: 34, width: 80, height: 6 },
      },
    ]);
  });

  it("applies the same occlusion to a Car and includes the depth tie", () => {
    const car = actor({
      kind: "car",
      bounds: facade.bounds,
      feetY: facade.base,
    });
    expect(visibleWindowRegions(facade, [car])).toEqual([]);
  });

  it("ignores actors behind the facade", () => {
    expect(visibleWindowRegions(facade, [actor({ feetY: facade.base - 0.01 })])).toEqual([
      {
        world: facade.bounds,
        texture: { x: 0, y: 0, width: 80, height: 40 },
      },
    ]);
  });

  it("does not double-subtract overlapping Players and Cars", () => {
    const regions = visibleWindowRegions(facade, [
      actor({ bounds: { x: 120, y: 50, width: 24, height: 24 } }),
      actor({ kind: "car", bounds: { x: 132, y: 58, width: 24, height: 18 } }),
    ]);
    expect(regions.every(({ world }) => world.width > 0 && world.height > 0)).toBe(true);
    expect(regions).toHaveLength(8);
    // 80×40 minus the union of the 24×24 Player and 24×18 Car, whose overlap is 12×16.
    expect(regions.reduce((total, { world }) => total + world.width * world.height, 0)).toBe(
      80 * 40 - (24 * 24 + 24 * 18 - 12 * 16),
    );
  });

  it("keeps regions deterministic when actors arrive in another order", () => {
    const players = [
      actor({ bounds: { x: 110, y: 48, width: 14, height: 24 } }),
      actor({ kind: "car", bounds: { x: 150, y: 52, width: 16, height: 20 } }),
    ];
    expect(visibleWindowRegions(facade, players)).toEqual(
      visibleWindowRegions(facade, [...players].reverse()),
    );
  });
});
