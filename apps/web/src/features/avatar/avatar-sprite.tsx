"use client";

import {
  type Avatar,
  avatarFrames,
  FRAME_SIZE,
  IDLE_FRAME,
  IDLE_FRAME_MS,
  IDLE_FRAMES,
} from "@bumbadum/avatar";
import { useEffect, useState } from "react";

/** The part of the 24×24 frame the avatar fills, so previews waste no space around it. */
const CROP = { x: 4, y: 4, width: 16, height: 20 };

/**
 * An avatar standing still and facing down, its layers stacked as the game
 * draws them, scaled up by a whole number so the pixels stay crisp.
 */
export function AvatarSprite({
  avatar,
  scale,
  animated = false,
}: {
  avatar: Avatar;
  scale: number;
  animated?: boolean;
}) {
  const frame = useIdleFrame(animated);

  return (
    <div
      aria-hidden
      className="relative shrink-0 overflow-hidden"
      style={{ width: CROP.width * scale, height: CROP.height * scale }}
    >
      {avatarFrames(avatar, "down", "idle", frame).map((layerFrame) => (
        <div
          key={layerFrame.layer}
          className="absolute top-0 left-0 origin-top-left [image-rendering:pixelated]"
          style={{
            width: FRAME_SIZE,
            height: FRAME_SIZE,
            backgroundImage: `url(${layerFrame.sheet})`,
            backgroundPosition: `-${layerFrame.x}px -${layerFrame.y}px`,
            transform: `scale(${scale}) translate(-${CROP.x}px, -${CROP.y}px)`,
          }}
        />
      ))}
    </div>
  );
}

function useIdleFrame(animated: boolean): number {
  const [frame, setFrame] = useState(IDLE_FRAME);

  useEffect(() => {
    if (!animated) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let interval: ReturnType<typeof setInterval> | undefined;

    const followPreference = () => {
      if (interval) clearInterval(interval);
      interval = undefined;
      setFrame(IDLE_FRAME);
      if (!reducedMotion.matches) {
        interval = setInterval(
          () => setFrame((current) => (current + 1) % IDLE_FRAMES),
          IDLE_FRAME_MS,
        );
      }
    };

    followPreference();
    reducedMotion.addEventListener("change", followPreference);
    return () => {
      if (interval) clearInterval(interval);
      reducedMotion.removeEventListener("change", followPreference);
    };
  }, [animated]);

  return frame;
}
