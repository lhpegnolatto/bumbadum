import { type Direction, OFFSETS } from "./step.ts";

export const CAR_COUNT = 12;
export const CAR_ABANDONMENT_MS = 120_000;
export const CAR_INTERACTION_RADIUS = 56;

export interface CarParkingSpot {
  x: number;
  y: number;
}

export interface CarCollisionWorld {
  isBlocked(x: number, y: number): boolean;
}

export interface CarConfig {
  readonly radius: number;
  readonly acceleration: number;
  readonly maxSpeed: number;
  readonly braking: number;
  readonly turnRateRadiansPerSecond: number;
  readonly simulationStepMs: number;
}

export const DEFAULT_CAR_CONFIG: CarConfig = {
  radius: 12,
  acceleration: 360,
  maxSpeed: 180,
  braking: 300,
  turnRateRadiansPerSecond: 7.5,
  simulationStepMs: 10,
};

export type CarModel = "kart" | "convertible";

export type CarColor = "red" | "yellow" | "green" | "blue" | "purple" | "pink" | "white" | "black";

export interface CarMotion {
  readonly id: string;
  readonly model: CarModel;
  readonly color: CarColor;
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  direction: Direction;
  input?: Direction;
  driverId?: string;
  respawnAt?: number;
}

export function createCar(input: {
  id: string;
  model: CarModel;
  color: CarColor;
  x: number;
  y: number;
}): CarMotion {
  return { ...input, velocityX: 0, velocityY: 0, direction: "down" };
}

/** Advances one authoritative car. Players are intentionally absent from this collision interface. */
export function advanceCar(
  car: CarMotion,
  elapsedMs: number,
  world: CarCollisionWorld,
  otherCars: readonly CarMotion[],
  config: CarConfig = DEFAULT_CAR_CONFIG,
): CarMotion {
  if (!car.driverId) return { ...car, velocityX: 0, velocityY: 0 };

  const next = { ...car };
  let remaining = Math.min(Math.max(elapsedMs, 0), 250);
  let collided = false;
  while (remaining > 0) {
    const dt = Math.min(config.simulationStepMs, remaining) / 1000;
    remaining -= config.simulationStepMs;
    const direction = next.input;
    if (direction) {
      next.direction = direction;
      const offset = OFFSETS[direction];
      const currentSpeed = Math.hypot(next.velocityX, next.velocityY);
      const speed = approach(currentSpeed, config.maxSpeed, config.acceleration * dt);
      const targetVelocity = { x: offset.x * speed, y: offset.y * speed };
      const steeredVelocity = steerVelocity(
        next.velocityX,
        next.velocityY,
        targetVelocity.x,
        targetVelocity.y,
        config.turnRateRadiansPerSecond * dt,
      );
      next.velocityX = steeredVelocity.x;
      next.velocityY = steeredVelocity.y;
    } else {
      next.velocityX = approach(next.velocityX, 0, config.braking * dt);
      next.velocityY = approach(next.velocityY, 0, config.braking * dt);
    }

    const candidateX = next.x + next.velocityX * dt;
    const candidateY = next.y + next.velocityY * dt;
    if (isCarPositionBlocked(candidateX, candidateY, world, otherCars, next.id, config.radius)) {
      next.velocityX = 0;
      next.velocityY = 0;
      collided = true;
    } else {
      next.x = candidateX;
      next.y = candidateY;
    }
  }
  if (collided) {
    next.velocityX = 0;
    next.velocityY = 0;
  }
  return next;
}

export function enterNearestCar(
  cars: readonly CarMotion[],
  playerPosition: { x: number; y: number },
  maxDistance = CAR_INTERACTION_RADIUS,
): CarMotion | undefined {
  return cars
    .filter((car) => !car.driverId && !car.respawnAt)
    .map((car) => ({
      car,
      distance: Math.hypot(car.x - playerPosition.x, car.y - playerPosition.y),
    }))
    .filter(({ distance }) => distance <= maxDistance)
    .sort(
      (left, right) => left.distance - right.distance || left.car.id.localeCompare(right.car.id),
    )[0]?.car;
}

export function mountCar(car: CarMotion, driverId: string): CarMotion {
  return { ...car, driverId, respawnAt: undefined };
}

export function dismountCar(car: CarMotion, nowMs: number): CarMotion {
  return {
    ...car,
    driverId: undefined,
    input: undefined,
    velocityX: 0,
    velocityY: 0,
    respawnAt: nowMs + CAR_ABANDONMENT_MS,
  };
}

export function respawnExpiredCars(
  cars: readonly CarMotion[],
  nowMs: number,
  parkingSpots: readonly CarParkingSpot[],
): CarMotion[] {
  if (parkingSpots.length === 0) return cars.map((car) => ({ ...car }));
  const occupied = cars.filter((car) => car.respawnAt === undefined).map(({ x, y }) => ({ x, y }));
  return cars.map((car) => {
    if (car.driverId || car.respawnAt === undefined || car.respawnAt > nowMs) return { ...car };
    const available = parkingSpots
      .filter((spot) => !occupied.some((other) => other.x === spot.x && other.y === spot.y))
      .sort(
        (left, right) =>
          Math.hypot(left.x - car.x, left.y - car.y) - Math.hypot(right.x - car.x, right.y - car.y),
      );
    const spot = available[0];
    if (!spot) return { ...car };
    occupied.push({ x: spot.x, y: spot.y });
    return {
      ...car,
      x: spot.x,
      y: spot.y,
      velocityX: 0,
      velocityY: 0,
      input: undefined,
      respawnAt: undefined,
    };
  });
}

export function createCarFleet(parkingSpots: readonly CarParkingSpot[]): CarMotion[] {
  const colors: readonly CarColor[] = [
    "red",
    "yellow",
    "green",
    "blue",
    "purple",
    "pink",
    "white",
    "black",
  ];
  return Array.from({ length: CAR_COUNT }, (_, index) => {
    // Leave one empty space between active cars so a parked car can pull out without spawning
    // inside its neighbour's collision radius. The remaining spaces are still used by respawns.
    const spot = parkingSpots[(index * 2) % parkingSpots.length] ?? { x: 0, y: 0 };
    return createCar({
      id: `car-${index + 1}`,
      model: index % 2 === 0 ? "kart" : "convertible",
      color: colors[index % colors.length] ?? "red",
      x: spot.x,
      y: spot.y,
    });
  });
}

function approach(value: number, target: number, amount: number): number {
  if (value < target) return Math.min(value + amount, target);
  return Math.max(value - amount, target);
}

function steerVelocity(
  velocityX: number,
  velocityY: number,
  targetX: number,
  targetY: number,
  maxTurnRadians: number,
): { x: number; y: number } {
  const speed = Math.hypot(targetX, targetY);
  const currentSpeed = Math.hypot(velocityX, velocityY);
  if (currentSpeed === 0 || maxTurnRadians <= 0) return { x: targetX, y: targetY };

  const currentAngle = Math.atan2(velocityY, velocityX);
  const targetAngle = Math.atan2(targetY, targetX);
  let angleDelta = targetAngle - currentAngle;
  if (angleDelta > Math.PI) angleDelta -= Math.PI * 2;
  if (angleDelta < -Math.PI) angleDelta += Math.PI * 2;

  const angle =
    currentAngle + Math.sign(angleDelta) * Math.min(Math.abs(angleDelta), maxTurnRadians);
  return { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed };
}

function isCarPositionBlocked(
  x: number,
  y: number,
  world: CarCollisionWorld,
  otherCars: readonly CarMotion[],
  currentId: string,
  radius: number,
): boolean {
  const points = [
    [x, y],
    [x - radius, y],
    [x + radius, y],
    [x, y - radius],
    [x, y + radius],
  ] as const;
  if (points.some(([pointX, pointY]) => world.isBlocked(pointX, pointY))) return true;
  return otherCars.some(
    (other) => other.id !== currentId && Math.hypot(other.x - x, other.y - y) < radius * 2,
  );
}
