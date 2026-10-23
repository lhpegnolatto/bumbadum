import type { JoinRejection } from "@bumbadum/protocol";

/** Wait between health checks while the server sleeps, and after a failed join. */
export const RETRY_DELAY_MS = 2000;

/** Waking a sleeping Render server takes about a minute; past this, something else is wrong. */
export const WAKE_UP_TIMEOUT_MS = 3 * 60_000;

/** Waking: the server has not answered its health check yet. Joining: it has. */
export type WaitingStage = "waking" | "joining";

/** Why the player is waiting: a first join, or getting back in after a dropped connection. */
export type WaitingReason = "connecting" | "reconnecting";

export type ConnectionStatus<R> =
  | { kind: "waiting"; reason: WaitingReason; stage: WaitingStage; since: number }
  | { kind: "joined"; room: R }
  | { kind: "timed-out"; reason: WaitingReason }
  | { kind: "rejected"; rejection: JoinRejection };

/** The part of a joined Colyseus room the connection needs. */
export interface JoinedRoom {
  onDrop(listener: () => void): void;
  onReconnect(listener: () => void): void;
  onLeave(listener: () => void): void;
  leave(): void;
}

export type JoinOutcome<R> =
  | { kind: "joined"; room: R }
  | { kind: "rejected"; rejection: JoinRejection }
  | { kind: "failed" };

export interface Clock {
  now(): number;
  setTimeout(run: () => void, ms: number): unknown;
  clearTimeout(id: unknown): void;
}

export const browserClock: Clock = {
  now: () => Date.now(),
  setTimeout: (run, ms) => setTimeout(run, ms),
  clearTimeout: (id) => clearTimeout(id as ReturnType<typeof setTimeout>),
};

export interface ConnectionDeps<R extends JoinedRoom> {
  clock: Clock;
  /** Resolves false when the server does not answer (asleep, waking, unreachable). */
  isServerAwake: () => Promise<boolean>;
  join: () => Promise<JoinOutcome<R>>;
  onChange: (status: ConnectionStatus<R>) => void;
}

export interface RoomConnection {
  /** Starts over after a time-out. */
  retry(): void;
  /** Stops every attempt and leaves the room. */
  close(): void;
}

/**
 * Gets the player into the room and keeps them there: waits for a sleeping
 * server to wake, joins, and after a dropped connection waits again until the
 * SDK reconnects or, if the room is lost, joins it afresh.
 */
export function connectToRoom<R extends JoinedRoom>(deps: ConnectionDeps<R>): RoomConnection {
  const { clock } = deps;
  let status: ConnectionStatus<R>;
  /** Bumped whenever a wait starts or is abandoned, so late results from an older one are ignored. */
  let attempt = 0;
  let retryTimer: unknown;
  let deadlineTimer: unknown;
  /** The room the player is in, or reconnecting to. */
  let held: R | undefined;

  function set(next: ConnectionStatus<R>) {
    status = next;
    deps.onChange(next);
  }

  function setStage(stage: WaitingStage) {
    if (status.kind === "waiting" && status.stage !== stage) set({ ...status, stage });
  }

  function stopTimers() {
    clock.clearTimeout(retryTimer);
    clock.clearTimeout(deadlineTimer);
  }

  function startWaiting(reason: WaitingReason, stage: WaitingStage = "waking") {
    attempt += 1;
    stopTimers();
    set({ kind: "waiting", reason, stage, since: clock.now() });
    deadlineTimer = clock.setTimeout(() => timeOut(reason), WAKE_UP_TIMEOUT_MS);
  }

  function abandon() {
    attempt += 1;
    stopTimers();
    const room = held;
    held = undefined;
    room?.leave();
  }

  function timeOut(reason: WaitingReason) {
    abandon();
    set({ kind: "timed-out", reason });
  }

  function hold(room: R) {
    held = room;
    room.onDrop(() => {
      // The SDK reports a drop again for every failed reconnection attempt.
      if (room === held && status.kind === "joined") startWaiting("reconnecting", "joining");
    });
    room.onReconnect(() => {
      if (room !== held) return;
      stopTimers();
      set({ kind: "joined", room });
    });
    room.onLeave(() => {
      if (room !== held) return;
      held = undefined;
      // After a drop the wait already runs; a room lost outright starts one.
      if (status.kind !== "waiting") startWaiting("reconnecting");
      wake();
    });
    set({ kind: "joined", room });
  }

  async function wake() {
    const current = attempt;
    setStage("waking");
    const awake = await deps.isServerAwake();
    if (current !== attempt) return;
    if (!awake) {
      retryTimer = clock.setTimeout(wake, RETRY_DELAY_MS);
      return;
    }
    setStage("joining");
    const outcome = await deps.join();
    if (current !== attempt) {
      if (outcome.kind === "joined") outcome.room.leave();
      return;
    }
    switch (outcome.kind) {
      case "joined":
        stopTimers();
        hold(outcome.room);
        break;
      case "rejected":
        stopTimers();
        set({ kind: "rejected", rejection: outcome.rejection });
        break;
      case "failed":
        setStage("waking");
        retryTimer = clock.setTimeout(wake, RETRY_DELAY_MS);
        break;
    }
  }

  startWaiting("connecting");
  wake();

  return {
    retry() {
      if (status.kind !== "timed-out") return;
      startWaiting(status.reason);
      wake();
    },
    close: abandon,
  };
}
