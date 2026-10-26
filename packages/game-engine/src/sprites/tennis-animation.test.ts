import { describe, expect, it } from "vitest";
import { createTennisBallTimeline, tennisBallPose, tennisRacketFrame } from "../index.ts";

const timeline = createTennisBallTimeline({
  from: { x: 100, y: 100 },
  to: { x: 220, y: 500 },
  launchedAt: 1_000,
  contactAt: 2_000,
});

describe("tennisBallPose", () => {
  it("follows the ground path and rises above it before the bounce", () => {
    expect(tennisBallPose(timeline, 1_000)).toMatchObject({
      phase: "flight-before-bounce",
      ground: { x: 100, y: 100 },
      position: { x: 100, y: 100 },
      height: 0,
      frame: 0,
      shadow: { x: 100, y: 100 },
    });

    const beforeBounce = tennisBallPose(timeline, 1_340);
    expect(beforeBounce.ground).toEqual({ x: 140.8, y: 236 });
    expect(beforeBounce.height).toBe(30);
    expect(beforeBounce.height).toBeGreaterThan(0);
    expect(beforeBounce.position.y).toBe(beforeBounce.ground.y - beforeBounce.height);
  });

  it("uses the 68% bounce point and the flattened ball frame", () => {
    expect(timeline.bounceAt).toBe(1_680);

    const bounce = tennisBallPose(timeline, timeline.bounceAt);
    expect(bounce.phase).toBe("bounce");
    expect(bounce.ground.x).toBeCloseTo(181.6);
    expect(bounce.ground.y).toBe(372);
    expect(bounce.position).toEqual(bounce.ground);
    expect(bounce.height).toBe(0);
    expect(bounce.frame).toBe(2);
    expect(bounce.shadow).toEqual(bounce.ground);
    expect(bounce.trail).toBeUndefined();
  });

  it("exposes alternating flight frames, directional trail and contact effects", () => {
    expect(tennisBallPose(timeline, 1_100).frame).toBe(1);
    expect(tennisBallPose(timeline, 1_200).frame).toBe(0);
    expect(tennisBallPose(timeline, 1_250).trail).toEqual({ frame: 1, mirrored: false });

    expect(tennisBallPose(timeline, 2_000)).toMatchObject({
      phase: "contact",
      ground: { x: 220, y: 500 },
      position: { x: 220, y: 500 },
      height: 0,
      contact: true,
      impactFrame: 0,
    });
    expect(tennisBallPose(timeline, 2_050).impactFrame).toBe(1);
    expect(tennisBallPose(timeline, 2_150).impactFrame).toBeUndefined();
  });

  it("keeps the ball at the last ground position after the contact effect", () => {
    expect(tennisBallPose(timeline, 3_000)).toMatchObject({
      phase: "complete",
      ground: { x: 220, y: 500 },
      position: { x: 220, y: 500 },
      height: 0,
      contact: false,
    });
  });
});

describe("tennisRacketFrame", () => {
  it("maps bottom-player forehand and backhand to the first two rows", () => {
    expect(
      tennisRacketFrame({
        side: "bottom",
        playerX: 160,
        ballX: 120,
        now: 1_750,
        contactAt: 2_000,
      }),
    ).toEqual({ side: "bottom", stroke: "forehand", row: 0, column: 1 });

    expect(
      tennisRacketFrame({
        side: "bottom",
        playerX: 160,
        ballX: 200,
        now: 2_000,
        contactAt: 2_000,
      }),
    ).toEqual({ side: "bottom", stroke: "backhand", row: 1, column: 2 });
  });

  it("maps top-player forehand and backhand to the last two rows", () => {
    expect(
      tennisRacketFrame({
        side: "top",
        playerX: 160,
        ballX: 200,
        now: 1_749,
        contactAt: 2_000,
      }),
    ).toEqual({ side: "top", stroke: "forehand", row: 2, column: 0 });

    expect(
      tennisRacketFrame({
        side: "top",
        playerX: 160,
        ballX: 120,
        now: 2_040,
        contactAt: 2_000,
      }),
    ).toEqual({ side: "top", stroke: "backhand", row: 3, column: 2 });
  });

  it("starts preparation five frames before contact and finishes after the hit", () => {
    const frame = (now: number) =>
      tennisRacketFrame({
        side: "bottom",
        playerX: 160,
        ballX: 120,
        now,
        contactAt: 2_000,
      });

    expect(frame(1_749).column).toBe(0);
    expect(frame(1_750).column).toBe(1);
    expect(frame(1_999).column).toBe(1);
    expect(frame(2_000).column).toBe(2);
    expect(frame(2_049).column).toBe(2);
    expect(frame(2_050).column).toBe(3);
  });
});
