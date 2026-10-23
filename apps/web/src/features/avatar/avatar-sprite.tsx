import { type Avatar, avatarFrames, FRAME_SIZE, IDLE_FRAME } from "@bumbadum/avatar";

/** The part of the 32×32 frame the avatar fills, so previews waste no space around it. */
const CROP = { x: 7, y: 2, width: 18, height: 30 };

/**
 * An avatar standing still and facing down, its layers stacked as the game
 * draws them, scaled up by a whole number so the pixels stay crisp.
 */
export function AvatarSprite({ avatar, scale }: { avatar: Avatar; scale: number }) {
  return (
    <div
      aria-hidden
      className="relative shrink-0 overflow-hidden"
      style={{ width: CROP.width * scale, height: CROP.height * scale }}
    >
      {avatarFrames(avatar, "down", IDLE_FRAME).map((frame) => (
        <div
          key={frame.layer}
          className="absolute top-0 left-0 origin-top-left [image-rendering:pixelated]"
          style={{
            width: FRAME_SIZE,
            height: FRAME_SIZE,
            backgroundImage: `url(${frame.sheet})`,
            backgroundPosition: `-${frame.x}px -${frame.y}px`,
            transform: `scale(${scale}) translate(-${CROP.x}px, -${CROP.y}px)`,
          }}
        />
      ))}
    </div>
  );
}
