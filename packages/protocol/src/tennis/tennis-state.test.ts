import { describe, expect, it } from "vitest";
import {
  RoomState,
  TENNIS_COACH_ID,
  TennisBallState,
  TennisParticipantState,
  TennisState,
} from "../index.ts";

describe("Tennis schemas", () => {
  it("is present in the shared room state", () => {
    expect(new RoomState().tennis).toBeInstanceOf(TennisState);
  });

  it("starts with an empty line and an idle match", () => {
    const state = new TennisState();

    expect([...state.queue]).toEqual([]);
    expect(state.matchStatus).toBe("idle");
    expect(state.countdownEndsAt).toBe(0);
    expect([...state.participants]).toEqual([]);
    expect(state.score.top).toBe(0);
    expect(state.score.bottom).toBe(0);
    expect(state.winnerId).toBe("");
    expect(state.ball).toBeUndefined();
  });

  it("represents participant position and a renderable ball trajectory", () => {
    const state = new TennisState();
    const participant = new TennisParticipantState();
    participant.side = "bottom";
    participant.x = 168;
    state.participants.set("player-1", participant);

    const ball = new TennisBallState();
    ball.fromSide = "top";
    ball.receivingSide = "bottom";
    ball.startX = 160;
    ball.targetX = 224;
    ball.speed = 96;
    ball.reboundCount = 1;
    ball.launchedAt = 1_000;
    ball.bounceAt = 1_680;
    ball.contactAt = 2_000;
    state.ball = ball;
    state.matchStatus = "rally";

    expect(state.participants.get("player-1")).toMatchObject({ side: "bottom", x: 168 });
    expect(state.ball).toMatchObject({
      fromSide: "top",
      receivingSide: "bottom",
      startX: 160,
      targetX: 224,
      launchedAt: 1_000,
      bounceAt: 1_680,
      contactAt: 2_000,
    });
  });

  it("distinguishes the permanent Tennis Coach from human session participants", () => {
    const state = new TennisState();
    const coach = new TennisParticipantState();
    coach.kind = "coach";
    coach.side = "top";
    coach.x = 160;
    state.participants.set(TENNIS_COACH_ID, coach);

    expect(TENNIS_COACH_ID).toBe("coach");
    expect(state.participants.get(TENNIS_COACH_ID)).toMatchObject({
      kind: "coach",
      side: "top",
      x: 160,
    });
  });
});
