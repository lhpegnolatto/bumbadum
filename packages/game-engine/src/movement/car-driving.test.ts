import { describe, expect, it } from "vitest";
import {
  type CarDriveInput,
  type CarPose,
  DEFAULT_CAR_DRIVING_TUNING,
  driveCar,
} from "./car-driving.ts";

const stopped: CarPose = {
  x: 2,
  y: 3,
  direction: "right",
  velocity: { x: 0, y: 0 },
  speed: 0,
  drifting: false,
};

const throttle: CarDriveInput = { direction: "right", accelerating: true, braking: false };

describe("driveCar", () => {
  it("accelerates continuously instead of moving in tile-sized steps", () => {
    const first = driveCar(stopped, throttle, 1 / 60);
    const second = driveCar(first, throttle, 1 / 60);

    expect(first.x).toBeGreaterThan(stopped.x);
    expect(first.x - stopped.x).toBeLessThan(1);
    expect(second.speed).toBeGreaterThan(first.speed);
  });

  it("brakes faster than coasting and never exceeds the tuning limit", () => {
    const fast = {
      ...stopped,
      velocity: { x: DEFAULT_CAR_DRIVING_TUNING.maxSpeed, y: 0 },
      speed: DEFAULT_CAR_DRIVING_TUNING.maxSpeed,
    };

    const coast = driveCar(fast, { direction: null, accelerating: false, braking: false }, 0.1);
    const brake = driveCar(fast, { direction: null, accelerating: false, braking: true }, 0.1);

    expect(brake.speed).toBeLessThan(coast.speed);
    expect(brake.speed).toBeLessThanOrEqual(DEFAULT_CAR_DRIVING_TUNING.maxSpeed);
  });

  it("keeps momentum briefly when turning, exposing a drift state", () => {
    const fast = driveCar(stopped, throttle, 0.5);
    const turning = driveCar(
      fast,
      { direction: "down", accelerating: true, braking: false },
      1 / 60,
    );

    expect(turning.velocity.x).toBeGreaterThan(0);
    expect(turning.velocity.y).toBeGreaterThan(0);
    expect(turning.drifting).toBe(true);
  });
});
