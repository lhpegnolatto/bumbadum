import { type TennisEvent, TennisState } from "@bumbadum/protocol";
import { beforeEach, describe, expect, it } from "vitest";
import { PLAZA_V2_TENNIS_LINE } from "../../../../packages/world/src/plaza-v2-map.generated.ts";
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

  it("awards an immediate point-based exit when a participant leaves explicitly", () => {
    activity.join("alice", now);
    activity.join("bob", now);

    activity.leave("alice", now);

    expect(room.state.matchStatus).toBe("complete");
    expect(room.state.winnerId).toBe("bob");
    expect(activity.isInMatch("alice")).toBe(true);
    expect(room.events.at(-1)).toEqual({
      code: "match-complete",
      params: { winnerId: "bob", reason: "abandonment" },
    });
  });

  it("returns present enrolled players to the line after celebration and starts the next match", () => {
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
      activity.update(0, ball.contactAt);
      if (room.state.matchStatus === "complete") break;
    }

    expect(room.state.matchStatus).toBe("complete");
    expect([...room.state.participants]).toHaveLength(2);

    activity.update(0, 100_000);

    expect(room.state.matchStatus).toBe("countdown");
    expect([...room.state.queue]).toEqual(["bob"]);
    expect([...room.state.participants]).toHaveLength(2);
    expect(room.state.countdownEndsAt).toBeGreaterThan(100_000);
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

  client() {
    return undefined;
  }

  broadcast(_type: string, message: unknown): void {
    this.events.push(message as TennisEvent);
  }
}
