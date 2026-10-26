import { type TennisEvent, TennisState } from "@bumbadum/protocol";
import { PLAZA_V2_TENNIS_LINE } from "@bumbadum/world";
import { beforeEach, describe, expect, it } from "vitest";
import {
  TennisActivity,
  type TennisActivityPlayer,
  type TennisActivityRoom,
} from "./tennis-activity.ts";

const PLAYERS = ["alice", "bob", "carol"] as const;

describe("TennisActivity lifecycle", () => {
  let now: number;
  let room: FakeTennisRoom;
  let activity: TennisActivity;

  beforeEach(() => {
    now = 1_000;
    room = new FakeTennisRoom(PLAYERS);
    activity = new TennisActivity(room, {
      now: () => now,
      random: { next: () => 0 },
    });
  });

  it("keeps a dropped participant in the match during the reconnection grace", () => {
    activity.join("alice", now);
    activity.join("bob", now);
    activity.drop("alice", now);

    activity.update(0, now + 19_999);

    expect(activity.isInMatch("alice")).toBe(true);
    expect(room.state.matchStatus).toBe("rally");
  });

  it("starts an immediate Coach match when the Lobby has one Player", () => {
    room = new FakeTennisRoom(["alice"]);
    activity = new TennisActivity(room, { now: () => now, random: { next: () => 0 } });

    activity.join("alice", now);

    expect(room.state.matchStatus).toBe("countdown");
    expect([...room.state.queue]).toEqual([]);
    expect(room.state.participants.get("coach")).toMatchObject({ kind: "coach" });
    expect(room.state.participants.get("alice")).toMatchObject({ kind: "player" });
  });

  it("starts a Coach match after one queued Player waits fifteen seconds", () => {
    room = new FakeTennisRoom(["alice", "bob"]);
    activity = new TennisActivity(room, { now: () => now, random: { next: () => 0 } });

    activity.join("alice", now);
    activity.update(0, now + 14_999);
    expect(room.state.matchStatus).toBe("idle");

    activity.update(0, now + 15_000);

    expect(room.state.matchStatus).toBe("countdown");
    expect(room.state.participants.get("coach")).toMatchObject({ kind: "coach" });
  });

  it("moves the Coach toward an incoming ball instead of teleporting", () => {
    room = new FakeTennisRoom(["alice"]);
    activity = new TennisActivity(room, { now: () => now, random: { next: () => 0 } });

    activity.join("alice", now);
    activity.update(0, now + 3_000);

    for (let attempt = 0; attempt < 4; attempt += 1) {
      const ball = room.state.ball;
      if (!ball) throw new Error("expected an active Rally");
      const coach = room.state.participants.get("coach");
      if (!coach) throw new Error("expected the Coach participant");
      const coachSide = coach.side;
      if (coachSide === ball.receivingSide && Math.abs(ball.targetX - coach.x) > 4) {
        const distanceBefore = Math.abs(ball.targetX - coach.x);
        activity.update(16, ball.contactAt - 16);
        const distanceAfter = Math.abs(ball.targetX - coach.x);
        expect(distanceAfter).toBeLessThan(distanceBefore);
        expect(coach.x).not.toBe(ball.targetX);
        return;
      }
      activity.update(0, ball.contactAt);
      if (room.state.matchStatus === "countdown") {
        activity.update(0, ball.contactAt + 2_000);
      }
    }

    throw new Error("expected a Rally received by the Coach");
  });

  it("prioritizes a human match when another queued Player joins first", () => {
    room = new FakeTennisRoom(["alice", "bob"]);
    activity = new TennisActivity(room, { now: () => now, random: { next: () => 0 } });

    activity.join("alice", now);
    activity.join("bob", now + 1);

    expect(room.state.matchStatus).toBe("countdown");
    expect(room.state.participants.has("coach")).toBe(false);
    expect(room.state.participants.has("alice")).toBe(true);
    expect(room.state.participants.has("bob")).toBe(true);
  });

  it("awards abandonment to the connected opponent after grace expires", () => {
    activity.join("alice", now);
    activity.join("bob", now);
    activity.drop("alice", now);

    activity.update(0, now + 20_000);

    expect(room.state.matchStatus).toBe("complete");
    expect(room.state.winnerId).toBe("bob");
    expect(room.events).toContainEqual({
      code: "match-complete",
      params: { winnerId: "bob", reason: "abandonment" },
    });
  });

  it("cancels abandonment when the participant reconnects during grace", () => {
    activity.join("alice", now);
    activity.join("bob", now);
    activity.drop("alice", now);
    activity.reconnect("alice");

    activity.update(0, now + 20_000);

    expect(room.state.matchStatus).not.toBe("complete");
    expect(activity.isInMatch("alice")).toBe(true);
  });

  it("freezes participants during the pause between points", () => {
    activity.join("alice", now);
    activity.join("bob", now);
    activity.update(0, now + 3_000);

    const ball = room.state.ball;
    if (!ball) throw new Error("expected an active Rally");
    const receiverId = [...room.state.participants].find(
      ([, participant]) => participant.side === ball.receivingSide,
    )?.[0];
    if (!receiverId) throw new Error("expected a receiving participant");
    const receiver = room.state.participants.get(receiverId);
    if (!receiver) throw new Error("expected the receiving participant state");
    const xAfterPoint = receiver.x;

    activity.update(0, ball.contactAt);
    expect(room.state.matchStatus).toBe("countdown");
    activity.steer(receiverId, "left");
    activity.update(1_000, ball.contactAt + 1_000);

    expect(receiver.x).toBe(xAfterPoint);
  });

  it("awards an immediate point-based exit when a participant leaves explicitly", () => {
    activity.join("alice", now);
    activity.join("bob", now);

    activity.leave("alice", now);

    expect(room.state.matchStatus).toBe("complete");
    expect(room.state.winnerId).toBe("bob");
    expect(activity.isInMatch("alice")).toBe(false);
    expect(room.events).toContainEqual({
      code: "match-complete",
      params: { winnerId: "bob", reason: "abandonment" },
    });
    expect(room.events).toContainEqual({
      throwerId: "bob",
      direction: "down",
      target: { at: { x: room.player("bob")?.x, y: room.player("bob")?.y }, onPlayer: true },
    });
  });

  it("sends finished players to the hall and starts the next queued match", () => {
    activity.join("alice", now);
    activity.join("bob", now);
    activity.join("carol", now);
    activity.update(0, now + 3_000);

    const loserId = "alice";
    for (let point = 0; point < 20; point += 1) {
      const ball = room.state.ball;
      if (!ball) throw new Error("expected an active Rally");
      const receiverId = [...room.state.participants].find(
        ([, participant]) => participant.side === ball.receivingSide,
      )?.[0];
      if (!receiverId) throw new Error("expected a receiving participant");
      if (receiverId !== loserId) {
        const participant = room.state.participants.get(receiverId);
        if (!participant) throw new Error("expected the receiving participant state");
        participant.x = ball.targetX;
      }
      activity.update(0, ball.contactAt + 2_000);
      if (room.state.ball === undefined && room.state.matchStatus === "countdown") {
        activity.update(0, ball.contactAt + 4_000);
      }
      if (room.state.matchStatus === "complete") break;
    }

    expect(room.state.matchStatus).toBe("complete");
    expect([...room.state.participants]).toHaveLength(0);
    expect(room.player("alice")?.x).toBe(Math.floor((PLAZA_V2_TENNIS_LINE[0]?.x ?? 0) / 16));
    expect(room.player("bob")?.x).toBe(Math.floor((PLAZA_V2_TENNIS_LINE[1]?.x ?? 0) / 16));

    activity.update(0, 100_000);

    expect(room.state.matchStatus).toBe("countdown");
    expect([...room.state.queue]).toEqual([]);
    expect(room.state.participants.get("carol")).toMatchObject({ kind: "player" });
    expect(room.state.participants.get("coach")).toMatchObject({ kind: "coach" });
  });
});

class FakeTennisRoom implements TennisActivityRoom {
  readonly state = new TennisState();
  readonly events: TennisEvent[] = [];
  readonly #players = new Map<string, TennisActivityPlayer>();

  constructor(sessionIds: readonly string[]) {
    for (const sessionId of sessionIds) {
      this.#players.set(sessionId, {
        x: PLAZA_V2_TENNIS_LINE[0]?.x ?? 0,
        y: PLAZA_V2_TENNIS_LINE[0]?.y ?? 0,
        direction: "down",
        dance: "",
        carId: "",
      });
    }
  }

  player(sessionId: string): TennisActivityPlayer | undefined {
    return this.#players.get(sessionId);
  }

  playerCount(): number {
    return this.#players.size;
  }

  client() {
    return undefined;
  }

  broadcast(_type: string, message: unknown): void {
    this.events.push(message as TennisEvent);
  }
}
