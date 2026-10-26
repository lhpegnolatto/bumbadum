import type { Clock } from "./connection.ts";

/**
 * A little over the server's limit of one Nickname change every 10 seconds, so
 * network jitter never bunches two sends closer than it accepts.
 */
export const NICKNAME_CHANGE_INTERVAL_MS = 10_250;

export interface NicknameSender {
  /** Sends `nickname` now, or once the interval since the last send has passed. */
  rename(nickname: string): void;
  /** Drops a change still waiting to be sent. */
  stop(): void;
}

/**
 * Spaces Nickname changes out so the server never refuses one, keeping the
 * room in step with local settings: a change that comes too soon waits, and
 * only the latest waiting change is sent.
 */
export function createNicknameSender({
  clock,
  intervalMs,
  send,
}: {
  clock: Clock;
  intervalMs: number;
  send: (nickname: string) => void;
}): NicknameSender {
  let lastSentAt = Number.NEGATIVE_INFINITY;
  let waiting: string | undefined;
  let timer: unknown;

  function sendNow(nickname: string) {
    waiting = undefined;
    lastSentAt = clock.now();
    send(nickname);
  }

  return {
    rename(nickname) {
      const wait = lastSentAt + intervalMs - clock.now();
      if (wait <= 0 && waiting === undefined) {
        sendNow(nickname);
        return;
      }
      if (waiting === undefined) {
        timer = clock.setTimeout(() => waiting && sendNow(waiting), wait);
      }
      waiting = nickname;
    },
    stop() {
      clock.clearTimeout(timer);
      waiting = undefined;
    },
  };
}
