import { describe, expect, it } from "vitest";
import {
  advanceCar,
  type CarMotion,
  createCar,
  DEFAULT_CAR_CONFIG,
  dismountCar,
  enterNearestCar,
  respawnExpiredCars,
} from "./index.ts";

const openWorld = {
  width: 20,
  height: 20,
  isBlocked(x: number, y: number) {
    return x < 0 || y < 0 || x >= 20 * 16 || y >= 20 * 16;
  },
};

function car(overrides: Partial<CarMotion> = {}): CarMotion {
  return {
    ...createCar({ id: "car-1", model: "kart", color: "red", x: 80, y: 80 }),
    ...overrides,
  };
}

describe("car driving", () => {
  it("accelerates in the persisted cardinal input direction", () => {
    const moving = advanceCar(
      car({ input: "right", driverId: "player-1" }),
      250,
      openWorld,
      [],
      DEFAULT_CAR_CONFIG,
    );

    expect(moving.x).toBeGreaterThan(80);
    expect(moving.velocityX).toBeGreaterThan(0);
    expect(moving.y).toBe(80);
    expect(moving.input).toBe("right");
  });

  it("stops at map collision without tunneling through the wall", () => {
    const blocked = {
      ...openWorld,
      isBlocked(x: number, _y: number) {
        return x >= 100;
      },
    };

    const stopped = advanceCar(
      car({ x: 80, input: "right", driverId: "player-1" }),
      1000,
      blocked,
      [],
      DEFAULT_CAR_CONFIG,
    );

    expect(stopped.x).toBeLessThan(100);
    expect(stopped.velocityX).toBe(0);
  });

  it("collides with another car but does not consider players", () => {
    const stopped = advanceCar(
      car({ x: 80, input: "right", driverId: "player-1" }),
      1000,
      openWorld,
      [car({ id: "car-2", x: 120, y: 80 })],
      DEFAULT_CAR_CONFIG,
    );

    expect(stopped.x).toBeLessThan(120);
  });

  it("lets a nearby player enter an unoccupied car", () => {
    const result = enterNearestCar([car({ x: 80, y: 80 })], { x: 82, y: 80 });

    expect(result?.id).toBe("car-1");
  });

  it("leaves a dismounted car in place until its expiry", () => {
    const parked = dismountCar(car({ driverId: "player-1" }), 10_000);

    expect(parked.driverId).toBeUndefined();
    expect(parked.respawnAt).toBe(130_000);
  });

  it("respawns an expired car at the nearest free parking space", () => {
    const fleet = [
      car({ id: "car-1", x: 80, y: 80, respawnAt: 1 }),
      car({ id: "car-2", x: 32, y: 32 }),
    ];

    const respawned = respawnExpiredCars(fleet, 2, [
      { x: 32, y: 32 },
      { x: 48, y: 32 },
    ]);

    expect(respawned[0]).toMatchObject({ x: 48, y: 32, respawnAt: undefined });
    expect(respawned[1]).toMatchObject({ x: 32, y: 32 });
  });
});
