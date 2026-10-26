import type { Direction } from "@bumbadum/world";

export interface CarPoint {
  x: number;
  y: number;
}

export interface CarVelocity {
  x: number;
  y: number;
}

export interface CarPose extends CarPoint {
  direction: Direction;
  velocity: CarVelocity;
  speed: number;
  drifting: boolean;
}

/** The temporary client-side driving input until the server protocol owns cars. */
export interface CarDriveInput {
  direction: Direction | null;
  accelerating: boolean;
  braking: boolean;
}

export interface CarDrivingTuning {
  maxSpeed: number;
  acceleration: number;
  brakeDeceleration: number;
  drag: number;
  turnRate: number;
  driftThreshold: number;
}

export const DEFAULT_CAR_DRIVING_TUNING: CarDrivingTuning = {
  maxSpeed: 7.5,
  acceleration: 18,
  brakeDeceleration: 30,
  drag: 8,
  turnRate: 9,
  driftThreshold: 0.7,
};

const AXIS: Record<Direction, CarVelocity> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

/**
 * Advances a car in tile units. Cars deliberately do not consult walkability: the server's car
 * simulation will decide where cars may go, while this adapter gives the renderer a lively local
 * prediction until that protocol exists.
 */
export function driveCar(
  pose: CarPose,
  input: CarDriveInput,
  deltaSeconds: number,
  tuning: CarDrivingTuning = DEFAULT_CAR_DRIVING_TUNING,
): CarPose {
  const dt = Math.max(0, Math.min(deltaSeconds, 0.1));
  const wanted = input.direction ? AXIS[input.direction] : undefined;
  const acceleration = input.braking
    ? tuning.brakeDeceleration
    : input.accelerating && wanted
      ? tuning.acceleration
      : tuning.drag;
  const targetSpeed = input.accelerating && wanted ? tuning.maxSpeed : 0;
  const currentSpeed = Math.hypot(pose.velocity.x, pose.velocity.y);
  const nextSpeed = approach(currentSpeed, targetSpeed, acceleration * dt);
  const direction = input.direction ?? pose.direction;
  const axis = AXIS[direction];
  const momentumLength = Math.max(currentSpeed, 0.001);
  const coastAxis = {
    x: pose.velocity.x / momentumLength,
    y: pose.velocity.y / momentumLength,
  };
  const targetAxis = wanted ?? coastAxis;
  const blend = wanted ? Math.min(1, tuning.turnRate * dt) : 1;
  const directionVelocity = {
    x: approach(pose.velocity.x, targetAxis.x * nextSpeed, blend * Math.max(nextSpeed, 1)),
    y: approach(pose.velocity.y, targetAxis.y * nextSpeed, blend * Math.max(nextSpeed, 1)),
  };
  const speed = Math.hypot(directionVelocity.x, directionVelocity.y);
  const drifting =
    speed > tuning.driftThreshold &&
    wanted !== undefined &&
    Math.abs(directionVelocity.x * axis.y - directionVelocity.y * axis.x) > 0.15;

  return {
    x: pose.x + directionVelocity.x * dt,
    y: pose.y + directionVelocity.y * dt,
    direction,
    velocity: directionVelocity,
    speed,
    drifting,
  };
}

function approach(value: number, target: number, amount: number): number {
  if (value < target) return Math.min(value + amount, target);
  return Math.max(value - amount, target);
}
