"use client";

import type { Direction } from "@bumbadum/game-engine";
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, ChevronUpIcon } from "lucide-react";
import { type PointerEvent, useEffect, useEffectEvent, useRef, useState } from "react";
import { useTranslations } from "use-intl";
import { cn } from "@/lib/utils.ts";
import { stickDirection } from "./stick-direction.ts";

const CENTRE = { x: 0, y: 0 };

/**
 * A fixed touch stick that steers the local player in four directions while a thumb holds it.
 * Shown only where the primary pointer is coarse; `hidden` also hides it and stops steering.
 */
export function AnalogueStick({
  hidden,
  onSteer,
  className,
}: {
  hidden: boolean;
  onSteer: (direction: Direction | null) => void;
  className?: string;
}) {
  const t = useTranslations("room");
  const baseRef = useRef<HTMLDivElement>(null);
  const pointerRef = useRef<number | null>(null);
  const directionRef = useRef<Direction | null>(null);
  // The thumb's offset from the centre in units of the stick's radius, kept within its rim.
  const [thumb, setThumb] = useState(CENTRE);

  function steer(direction: Direction | null) {
    if (direction === directionRef.current) return;
    directionRef.current = direction;
    onSteer(direction);
  }

  function follow(event: PointerEvent<HTMLDivElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const radius = bounds.width / 2;
    const offset = {
      x: (event.clientX - bounds.left - radius) / radius,
      y: (event.clientY - bounds.top - radius) / radius,
    };
    const length = Math.hypot(offset.x, offset.y);
    setThumb(length > 1 ? { x: offset.x / length, y: offset.y / length } : offset);
    steer(stickDirection(offset, directionRef.current));
  }

  function letGo(pointerId: number) {
    if (pointerId !== pointerRef.current) return;
    pointerRef.current = null;
    setThumb(CENTRE);
    steer(null);
  }

  const letGoOnHide = useEffectEvent(() => {
    const pointerId = pointerRef.current;
    if (pointerId === null) return;
    if (baseRef.current?.hasPointerCapture(pointerId)) {
      baseRef.current.releasePointerCapture(pointerId);
    }
    letGo(pointerId);
  });

  useEffect(() => {
    if (hidden) letGoOnHide();
  }, [hidden]);

  return (
    <div
      ref={baseRef}
      role="application"
      aria-label={t("stick")}
      aria-hidden={hidden}
      inert={hidden}
      className={cn(
        "relative hidden size-28 touch-none select-none rounded-full border bg-background/60 shadow-lg backdrop-blur-sm [-webkit-touch-callout:none] pointer-coarse:grid",
        hidden && "invisible",
        className,
      )}
      onPointerDown={(event) => {
        if (pointerRef.current !== null) return;
        pointerRef.current = event.pointerId;
        event.currentTarget.setPointerCapture(event.pointerId);
        follow(event);
      }}
      onPointerMove={(event) => {
        if (event.pointerId === pointerRef.current) follow(event);
      }}
      onPointerUp={(event) => letGo(event.pointerId)}
      onPointerCancel={(event) => letGo(event.pointerId)}
      onLostPointerCapture={(event) => letGo(event.pointerId)}
      onContextMenu={(event) => event.preventDefault()}
    >
      <ChevronUpIcon className="absolute top-1 left-1/2 size-5 -translate-x-1/2 text-muted-foreground" />
      <ChevronDownIcon className="absolute bottom-1 left-1/2 size-5 -translate-x-1/2 text-muted-foreground" />
      <ChevronLeftIcon className="absolute top-1/2 left-1 size-5 -translate-y-1/2 text-muted-foreground" />
      <ChevronRightIcon className="absolute top-1/2 right-1 size-5 -translate-y-1/2 text-muted-foreground" />
      <div
        className="size-12 place-self-center rounded-full bg-secondary shadow-md"
        // The knob travels 2rem, from the centre of the 7rem stick to its 1.5rem-wide rim.
        style={{ transform: `translate(${thumb.x * 2}rem, ${thumb.y * 2}rem)` }}
      />
    </div>
  );
}
