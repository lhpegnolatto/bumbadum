import type { TennisState } from "@bumbadum/protocol";
import { describe, expect, it } from "vitest";
import { tennisRenderSnapshot } from "../index.ts";

function tennisState(): TennisState {
  return {
    matchStatus: "rally",
    score: { top: 0, bottom: 0 },
    participants: new Map([
      ["top-id", { kind: "player", side: "top", x: 120 }],
      ["bottom-id", { kind: "player", side: "bottom", x: 208 }],
    ]),
    ball: {
      fromSide: "top",
      receivingSide: "bottom",
      startX: 120,
      targetX: 208,
      speed: 96,
      reboundCount: 0,
      launchedAt: 1_000,
      bounceAt: 4_640,
      contactAt: 6_000,
    },
  } as TennisState;
}

describe("tennisRenderSnapshot", () => {
  it("exposes both participants on their authoritative horizontal baselines", () => {
    const snapshot = tennisRenderSnapshot(tennisState(), 2_000);

    expect(snapshot.participants).toEqual([
      { sessionId: "top-id", kind: "player", side: "top", x: 120, y: 66 },
      { sessionId: "bottom-id", kind: "player", side: "bottom", x: 208, y: 582 },
    ]);
  });

  it("interpolates the ball with the server-provided bounce and prepares rackets", () => {
    const snapshot = tennisRenderSnapshot(tennisState(), 4_640);

    expect(snapshot.ball?.pose.phase).toBe("bounce");
    expect(snapshot.ball?.pose.ground.x).toBeCloseTo(184.064);
    expect(snapshot.ball?.pose.ground.y).toBeCloseTo(441.648);
    expect(snapshot.ball?.pose.frame).toBe(2);
    expect(snapshot.rackets).toEqual([
      { sessionId: "top-id", frame: { side: "top", stroke: "forehand", row: 2, column: 0 } },
      {
        sessionId: "bottom-id",
        frame: { side: "bottom", stroke: "backhand", row: 1, column: 0 },
      },
    ]);
  });

  it("does not expose a ball or rackets outside a countdown state", () => {
    const state = tennisState();
    state.matchStatus = "countdown";
    state.ball = undefined;

    expect(tennisRenderSnapshot(state, 2_000)).toMatchObject({
      status: "countdown",
      participants: expect.any(Array),
      ball: undefined,
      rackets: [],
    });
  });
});
