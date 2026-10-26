import { describe, expect, it } from "vitest";
import {
  advanceCar,
  type CarMotion,
  createCar,
  createCarFleet,
  DEFAULT_CAR_CONFIG,
  dismountCar,
  enterNearestCar,
  lobbyCarCollisionWorld,
  lobbyParkingSpots,
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
    expect(moving.direction).toBe("right");
  });

  it("keeps its last driving direction after stopping and dismounting", () => {
    const moving = advanceCar(car({ input: "left", driverId: "player-1" }), 250, openWorld, []);
    const stopped = advanceCar({ ...moving, input: undefined }, 250, openWorld, []);
    const parked = dismountCar(stopped, 10_000);

    expect(stopped.direction).toBe("left");
    expect(parked.direction).toBe("left");
  });

  it("drifts briefly while changing direction", () => {
    const turning = advanceCar(
      car({ velocityX: 180, driverId: "player-1", input: "up" }),
      10,
      openWorld,
      [],
      DEFAULT_CAR_CONFIG,
    );

    expect(turning.velocityX).toBeGreaterThan(0);
    expect(turning.velocityY).toBeLessThan(0);
    expect(Math.hypot(turning.velocityX, turning.velocityY)).toBeGreaterThan(170);
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

  it("can leave the first parking space when a player is driving", () => {
    const spot = lobbyParkingSpots[0];
    if (!spot) throw new Error("expected a parking spot");
    const moving = advanceCar(
      car({ x: spot.x, y: spot.y, driverId: "player-1", input: "right" }),
      250,
      lobbyCarCollisionWorld,
      [],
    );

    expect(moving.x).toBeGreaterThan(spot.x);
  });

  it("keeps driving down instead of stopping after leaving the parking space", () => {
    const spot = lobbyParkingSpots[0];
    if (!spot) throw new Error("expected a parking spot");
    let moving = car({ x: spot.x, y: spot.y, driverId: "player-1", input: "down" });
    for (let i = 0; i < 100; i += 1) {
      moving = advanceCar(moving, 10, lobbyCarCollisionWorld, []);
    }

    expect(moving.y).toBeGreaterThan(spot.y + 100);
    expect(moving.velocityY).toBeGreaterThan(0);
  });

  it("spawns active cars with a free parking space between neighbours", () => {
    const fleet = createCarFleet([
      { x: 0, y: 0 },
      { x: 32, y: 0 },
      { x: 64, y: 0 },
      { x: 96, y: 0 },
    ]);

    expect(fleet.slice(0, 2).map(({ x, y }) => ({ x, y }))).toEqual([
      { x: 0, y: 0 },
      { x: 64, y: 0 },
    ]);
  });
});
