import { describe, expect, it } from "vitest";
import {
  type Clock,
  type ConnectionStatus,
  connectToRoom,
  type JoinOutcome,
  RETRY_DELAY_MS,
  WAKE_UP_TIMEOUT_MS,
} from "./connection.ts";

/** Lets pending promise callbacks run. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

function fakeClock() {
  let now = 0;
  let nextId = 0;
  let timers: { id: number; at: number; run: () => void }[] = [];

  const clock: Clock = {
    now: () => now,
    setTimeout(run, ms) {
      nextId += 1;
      timers.push({ id: nextId, at: now + ms, run });
      return nextId;
    },
    clearTimeout(id) {
      timers = timers.filter((timer) => timer.id !== id);
    },
  };

  async function advance(ms: number) {
    const end = now + ms;
    for (;;) {
      await settle();
      const due = timers.filter((timer) => timer.at <= end).sort((a, b) => a.at - b.at)[0];
      if (!due) break;
      timers = timers.filter((timer) => timer !== due);
      now = due.at;
      due.run();
    }
    now = end;
    await settle();
  }

  return { clock, advance };
}

function fakeRoom(name: string) {
  const listeners = {
    drop: [] as (() => void)[],
    reconnect: [] as (() => void)[],
    leave: [] as (() => void)[],
  };
  const room = {
    name,
    left: false,
    onDrop: (listener: () => void) => void listeners.drop.push(listener),
    onReconnect: (listener: () => void) => void listeners.reconnect.push(listener),
    onLeave: (listener: () => void) => void listeners.leave.push(listener),
    leave() {
      room.left = true;
      for (const listener of listeners.leave) listener();
    },
    /** The socket closed unexpectedly; the SDK starts reconnecting. */
    drop: () => {
      for (const listener of listeners.drop) listener();
    },
    /** The SDK got the seat back. */
    reconnect: () => {
      for (const listener of listeners.reconnect) listener();
    },
    /** The room is gone (server restarted, or the SDK gave up). */
    lose: () => {
      for (const listener of listeners.leave) listener();
    },
  };
  return room;
}

type FakeRoom = ReturnType<typeof fakeRoom>;

function setup({ awake = false } = {}) {
  const { clock, advance } = fakeClock();
  const server = {
    awake,
    healthChecks: 0,
    joins: 0,
    nextOutcome: (): JoinOutcome<FakeRoom> | Promise<JoinOutcome<FakeRoom>> => ({
      kind: "joined",
      room: fakeRoom(`room-${server.joins}`),
    }),
  };
  const statuses: ConnectionStatus<FakeRoom>[] = [];

  const connection = connectToRoom<FakeRoom>({
    clock,
    isServerAwake: async () => {
      server.healthChecks += 1;
      return server.awake;
    },
    join: async () => {
      server.joins += 1;
      return server.nextOutcome();
    },
    onChange: (status) => statuses.push(status),
  });

  const status = () => statuses.at(-1);
  const joinedRoom = () => {
    const current = status();
    if (current?.kind !== "joined") throw new Error(`expected joined, got ${current?.kind}`);
    return current.room;
  };

  return { server, advance, connection, status, statuses, joinedRoom };
}

describe("connectToRoom", () => {
  it("waits in the waking stage until the server answers, then joins", async () => {
    const { server, advance, status, statuses } = setup();
    expect(status()).toEqual({ kind: "waiting", reason: "connecting", stage: "waking", since: 0 });

    await advance(10_000);
    expect(status()).toMatchObject({ kind: "waiting", stage: "waking" });
    expect(server.joins).toBe(0);

    server.awake = true;
    await advance(RETRY_DELAY_MS);
    expect(statuses.map((s) => (s.kind === "waiting" ? s.stage : s.kind)).slice(-2)).toEqual([
      "joining",
      "joined",
    ]);
    expect(server.joins).toBe(1);
  });

  it("stops at a join rejection", async () => {
    const { server, advance, status } = setup();
    server.awake = true;
    server.nextOutcome = () => ({ kind: "rejected", rejection: "room-full" });

    await advance(WAKE_UP_TIMEOUT_MS * 2);
    expect(status()).toEqual({ kind: "rejected", rejection: "room-full" });
    expect(server.joins).toBe(1);
  });

  it("goes back to waking the server when a join fails, and tries again", async () => {
    const { server, advance, status, joinedRoom } = setup();
    server.awake = true;
    const joined = server.nextOutcome;
    server.nextOutcome = () => ({ kind: "failed" });
    await advance(RETRY_DELAY_MS);
    expect(server.joins).toBe(1);
    expect(status()).toMatchObject({ kind: "waiting", stage: "waking" });

    server.nextOutcome = joined;
    await advance(RETRY_DELAY_MS);
    expect(joinedRoom().name).toBe("room-2");
  });

  it("times out after 3 minutes without joining and stops trying", async () => {
    const { server, advance, status } = setup();

    await advance(WAKE_UP_TIMEOUT_MS - 1);
    expect(status()).toMatchObject({ kind: "waiting" });

    await advance(1);
    expect(status()).toEqual({ kind: "timed-out", reason: "connecting" });
    const checks = server.healthChecks;
    server.awake = true;
    await advance(60_000);
    expect(server.healthChecks).toBe(checks);
    expect(server.joins).toBe(0);
  });

  it("starts a fresh wait when the player tries again after a time-out", async () => {
    const { server, advance, connection, status, joinedRoom } = setup();
    await advance(WAKE_UP_TIMEOUT_MS);

    connection.retry();
    expect(status()).toEqual({
      kind: "waiting",
      reason: "connecting",
      stage: "waking",
      since: WAKE_UP_TIMEOUT_MS,
    });
    server.awake = true;
    await advance(RETRY_DELAY_MS);
    expect(joinedRoom().name).toBe("room-1");
  });

  it("does not time out once joined", async () => {
    const { server, advance, status } = setup();
    server.awake = true;
    await advance(WAKE_UP_TIMEOUT_MS * 2);
    expect(status()?.kind).toBe("joined");
  });

  describe("after a dropped connection", () => {
    async function joined() {
      const context = setup({ awake: true });
      await context.advance(1000);
      return { ...context, room: context.joinedRoom() };
    }

    it("waits as reconnecting while the SDK gets the seat back, then is back in the same room", async () => {
      const { advance, status, room, joinedRoom } = await joined();

      room.drop();
      expect(status()).toEqual({
        kind: "waiting",
        reason: "reconnecting",
        stage: "joining",
        since: 1000,
      });

      await advance(5000);
      room.reconnect();
      expect(joinedRoom()).toBe(room);
    });

    it("keeps counting from the first drop while the SDK's attempts keep dropping", async () => {
      const { advance, status, room } = await joined();
      room.drop();
      await advance(WAKE_UP_TIMEOUT_MS / 2);

      room.drop();
      expect(status()).toMatchObject({ kind: "waiting", since: 1000 });
      await advance(WAKE_UP_TIMEOUT_MS / 2);
      expect(status()).toEqual({ kind: "timed-out", reason: "reconnecting" });
    });

    it("wakes the server and joins afresh when the room is lost, still counting from the drop", async () => {
      const { server, advance, status, room, joinedRoom } = await joined();
      room.drop();
      await advance(30_000);

      server.awake = false;
      room.lose();
      expect(status()).toEqual({
        kind: "waiting",
        reason: "reconnecting",
        stage: "waking",
        since: 1000,
      });

      server.awake = true;
      await advance(RETRY_DELAY_MS);
      expect(joinedRoom().name).toBe("room-2");
    });

    it("joins afresh as reconnecting when the room is lost without a drop", async () => {
      const { advance, status, room, joinedRoom } = await joined();

      room.lose();
      expect(status()).toMatchObject({ kind: "waiting", reason: "reconnecting", since: 1000 });
      await advance(0);
      expect(joinedRoom().name).toBe("room-2");
    });

    it("times out 3 minutes after the drop and leaves the room", async () => {
      const { server, advance, status, room } = await joined();
      room.drop();

      await advance(WAKE_UP_TIMEOUT_MS);
      expect(status()).toEqual({ kind: "timed-out", reason: "reconnecting" });
      expect(room.left).toBe(true);
      expect(server.joins).toBe(1);
    });
  });

  it("leaves the room on close and ignores a join that lands afterwards", async () => {
    const { server, advance, connection, statuses } = setup();
    let finishJoin: (outcome: JoinOutcome<FakeRoom>) => void = () => {};
    const pendingJoin = new Promise<JoinOutcome<FakeRoom>>((resolve) => {
      finishJoin = resolve;
    });
    const late = fakeRoom("late");
    server.awake = true;
    server.nextOutcome = () => pendingJoin;

    await advance(RETRY_DELAY_MS);
    connection.close();
    const seen = statuses.length;
    finishJoin({ kind: "joined", room: late });
    await advance(0);

    expect(late.left).toBe(true);
    expect(statuses).toHaveLength(seen);
  });

  it("leaves the joined room on close", async () => {
    const { advance, connection, joinedRoom } = setup({ awake: true });
    await advance(0);
    const room = joinedRoom();

    connection.close();
    expect(room.left).toBe(true);
  });
});
