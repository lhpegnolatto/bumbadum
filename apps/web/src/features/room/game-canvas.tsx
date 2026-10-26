"use client";

import type { Direction, DrawnConfettiThrow, DrawnPlayer, GameEngine } from "@bumbadum/game-engine";
import {
  CAR_DRIVE_MESSAGE,
  CAR_ENTER_MESSAGE,
  CAR_EXIT_MESSAGE,
  type CarState,
  CHAT_MESSAGE,
  type ChatMessage,
  CONFETTI_THROWN,
  type ConfettiThrown,
  type RoomState,
  STEP_MESSAGE,
} from "@bumbadum/protocol";
import type { Room } from "@colyseus/sdk";
import { type Ref, useEffect, useImperativeHandle, useRef } from "react";
import { useTranslations } from "use-intl";
import { exposeToE2E } from "@/lib/e2e.ts";

declare global {
  interface BumbadumE2E {
    /** What the canvas shows, since tests cannot read its pixels. */
    drawnPlayers?(): DrawnPlayer[];
    /** The latest Confetti throws the canvas drew, oldest first. */
    drawnConfettiThrows?(): DrawnConfettiThrow[];
    /** The latest authoritative cars, exposed for interaction E2E tests. */
    cars?(): CarSnapshot[];
  }
}

export interface CarSnapshot {
  id: string;
  model: string;
  color: string;
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  driverId: string;
  respawnAt: number;
}

export interface CarContext {
  carId: string;
  nearbyCarId: string | null;
}

/** What the room drives on the mounted engine besides its props. */
export interface GameCanvasHandle {
  /** Walks the local player towards `direction`, as a held walking key would, until steered elsewhere or `null`. */
  steer(direction: Direction | null): void;
  enterCar(): void;
  exitCar(): void;
}

/**
 * Mounts the PixiJS engine and feeds it every state patch, chat message (as
 * speech bubbles) and Confetti throw, without re-rendering React.
 */
export function GameCanvas({
  ref,
  room,
  walking,
  topInset,
  serverNow,
  onCarContextChange,
}: {
  ref?: Ref<GameCanvasHandle>;
  room: Room<unknown, RoomState>;
  /** The server's time now, or `undefined` until it is known: dancers keep in step with it (ADR-0021). */
  serverNow: () => number | undefined;
  /** Whether the walking keys move the local player; off while a panel such as the wardrobe is open. */
  walking: boolean;
  /** CSS pixels the Screen and Radio strip cover at the top: the camera frames the local player below them. */
  topInset: number;
  onCarContextChange: (context: CarContext) => void;
}) {
  const t = useTranslations("room");
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine>(undefined);
  const walkingRef = useRef(walking);
  const topInsetRef = useRef(topInset);
  const carContextRef = useRef<CarContext>({ carId: "", nearbyCarId: null });
  const onCarContextChangeRef = useRef(onCarContextChange);
  onCarContextChangeRef.current = onCarContextChange;

  useImperativeHandle(
    ref,
    () => ({
      steer: (direction) => {
        if (carContextRef.current.carId) room.send(CAR_DRIVE_MESSAGE, direction);
        else engineRef.current?.steer(direction);
      },
      enterCar: () => room.send(CAR_ENTER_MESSAGE),
      exitCar: () => room.send(CAR_EXIT_MESSAGE),
    }),
    [room],
  );

  useEffect(() => {
    walkingRef.current = walking;
    engineRef.current?.setWalking(walking);
  }, [walking]);

  useEffect(() => {
    topInsetRef.current = topInset;
    engineRef.current?.setTopInset(topInset);
  }, [topInset]);

  useEffect(() => {
    const directionByKey: Record<string, Direction> = {
      arrowup: "up",
      w: "up",
      arrowdown: "down",
      s: "down",
      arrowleft: "left",
      a: "left",
      arrowright: "right",
      d: "right",
    };
    function driveOnKey(event: KeyboardEvent) {
      if (event.repeat || event.defaultPrevented || isTextField(event.target)) return;
      const direction = directionByKey[event.key.toLowerCase()];
      if (!direction || !carContextRef.current.carId) return;
      event.preventDefault();
      room.send(CAR_DRIVE_MESSAGE, direction);
    }
    function stopDrivingOnKey(event: KeyboardEvent) {
      if (event.defaultPrevented || isTextField(event.target)) return;
      if (!directionByKey[event.key.toLowerCase()] || !carContextRef.current.carId) return;
      event.preventDefault();
      room.send(CAR_DRIVE_MESSAGE, null);
    }
    document.addEventListener("keydown", driveOnKey);
    document.addEventListener("keyup", stopDrivingOnKey);
    return () => {
      document.removeEventListener("keydown", driveOnKey);
      document.removeEventListener("keyup", stopDrivingOnKey);
    };
  }, [room.send]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let cancelled = false;
    let stop: (() => void) | undefined;

    // Loaded on demand: PixiJS only runs in the browser.
    import("@bumbadum/game-engine").then(async ({ mountGameEngine }) => {
      const engine = await mountGameEngine(container, {
        sessionId: room.sessionId,
        sendStep: (direction) => room.send(STEP_MESSAGE, direction),
        serverNow,
      });
      if (cancelled) {
        engine.destroy();
        return;
      }
      engine.setWalking(walkingRef.current);
      engine.setTopInset(topInsetRef.current);
      engineRef.current = engine;
      const onStateChange = (state: RoomState) => {
        engine.applyState(state);
        const me = state.players.get(room.sessionId);
        const carId = me?.carId ?? "";
        const playerX = ((me?.x ?? 0) + 0.5) * 16;
        const playerY = ((me?.y ?? 0) + 0.5) * 16;
        let nearbyCarId: string | null = null;
        let nearestDistance = 32;
        state.cars.forEach((car, id) => {
          if (car.driverId || car.respawnAt || carId) return;
          const distance = Math.hypot(car.x - playerX, car.y - playerY);
          if (distance <= nearestDistance) {
            nearestDistance = distance;
            nearbyCarId = id;
          }
        });
        if (
          carContextRef.current.carId !== carId ||
          carContextRef.current.nearbyCarId !== nearbyCarId
        ) {
          carContextRef.current = { carId, nearbyCarId };
          onCarContextChangeRef.current(carContextRef.current);
        }
      };
      onStateChange(room.state);
      room.onStateChange(onStateChange);
      const stopBubbles = room.onMessage<ChatMessage>(CHAT_MESSAGE, (message) =>
        engine.showBubble(message.senderId, message.text),
      );
      const stopConfetti = room.onMessage<ConfettiThrown>(CONFETTI_THROWN, (thrown) =>
        engine.throwConfetti(thrown),
      );
      exposeToE2E({
        drawnPlayers: () => engine.drawnPlayers(),
        drawnConfettiThrows: () => engine.drawnConfettiThrows(),
        cars: () => carsSnapshot(room.state.cars),
      });
      stop = () => {
        engineRef.current = undefined;
        room.onStateChange.remove(onStateChange);
        stopBubbles();
        stopConfetti();
        engine.destroy();
      };
    });

    return () => {
      cancelled = true;
      stop?.();
    };
  }, [room, serverNow]);

  return (
    <div ref={containerRef} role="img" aria-label={t("canvasLabel")} className="h-full w-full" />
  );
}

function carsSnapshot(cars: RoomState["cars"]): CarSnapshot[] {
  const result: CarSnapshot[] = [];
  cars.forEach((car, id) => {
    result.push(carSnapshot(id, car));
  });
  return result;
}

function carSnapshot(id: string, car: CarState): CarSnapshot {
  return {
    id,
    model: car.model,
    color: car.color,
    x: car.x,
    y: car.y,
    velocityX: car.velocityX,
    velocityY: car.velocityY,
    driverId: car.driverId,
    respawnAt: car.respawnAt,
  };
}

function isTextField(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || target.closest("input, textarea, select") !== null;
}
