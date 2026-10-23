import { CLOCK_PING, CLOCK_PONG, type ClockPing, type ClockPong } from "@bumbadum/protocol";
import { CLOCK_SYNC, estimateClockOffset, type PingSample } from "@bumbadum/radio";

/** Gives up on a burst's missing answers after this long. */
const BURST_TIMEOUT_MS = 2000;

/** The part of a joined room the clock talks through. */
export interface PingChannel {
  send(type: string, message: unknown): void;
  onMessage<T>(type: string, listener: (message: T) => void): () => void;
}

export interface ServerClock {
  /** The server's time now, or `undefined` until the first burst of pings is answered. */
  now(): number | undefined;
  stop(): void;
}

/** A steady local clock in epoch milliseconds: unlike `Date.now()`, it never jumps. */
export const localNow = () => performance.timeOrigin + performance.now();

/**
 * Keeps an estimate of the server clock (ADR-0004): a burst of pings now and
 * again every 30 s, trusting the answer with the shortest round trip.
 */
export function syncServerClock(channel: PingChannel): ServerClock {
  let offset: number | undefined;
  let samples: PingSample[] = [];
  let burstStartedAt = Number.POSITIVE_INFINITY;
  let timers: ReturnType<typeof setTimeout>[] = [];

  function burst() {
    samples = [];
    burstStartedAt = localNow();
    timers = Array.from({ length: CLOCK_SYNC.burstSize }, (_, index) =>
      setTimeout(
        () => channel.send(CLOCK_PING, { sentAt: localNow() } satisfies ClockPing),
        index * CLOCK_SYNC.burstSpacingMs,
      ),
    );
    timers.push(setTimeout(finishBurst, BURST_TIMEOUT_MS));
  }

  function finishBurst() {
    for (const timer of timers) clearTimeout(timer);
    offset = estimateClockOffset(samples) ?? offset;
    samples = [];
    burstStartedAt = Number.POSITIVE_INFINITY;
    timers = [setTimeout(burst, CLOCK_SYNC.resyncEveryMs)];
  }

  const stopListening = channel.onMessage<ClockPong>(CLOCK_PONG, ({ sentAt, serverTime }) => {
    // Answers to an earlier, abandoned burst would skew this one.
    if (sentAt < burstStartedAt) return;
    samples.push({ sentAt, serverTime, receivedAt: localNow() });
    if (samples.length === CLOCK_SYNC.burstSize) finishBurst();
  });

  burst();

  return {
    now: () => (offset === undefined ? undefined : localNow() + offset),
    stop() {
      stopListening();
      for (const timer of timers) clearTimeout(timer);
    },
  };
}
