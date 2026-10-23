import type { Avatar } from "@bumbadum/avatar";
import type { Clock } from "../room/connection.ts";

/**
 * A little over the server's limit of one avatar change every 2 seconds, so
 * network jitter never bunches two sends closer than it accepts.
 */
export const AVATAR_CHANGE_INTERVAL_MS = 2250;

export interface AvatarSender {
  /** Sends `avatar` now, or once the interval since the last send has passed. */
  wear(avatar: Avatar): void;
  /** Drops a change still waiting to be sent. */
  stop(): void;
}

/**
 * Spaces avatar changes out so the server never refuses one: a change that
 * comes too soon waits, and only the latest waiting change is sent.
 */
export function createAvatarSender({
  clock,
  intervalMs,
  send,
}: {
  clock: Clock;
  intervalMs: number;
  send: (avatar: Avatar) => void;
}): AvatarSender {
  let lastSentAt = Number.NEGATIVE_INFINITY;
  let waiting: Avatar | undefined;
  let timer: unknown;

  function sendNow(avatar: Avatar) {
    waiting = undefined;
    lastSentAt = clock.now();
    send(avatar);
  }

  return {
    wear(avatar) {
      const wait = lastSentAt + intervalMs - clock.now();
      if (wait <= 0 && waiting === undefined) {
        sendNow(avatar);
        return;
      }
      if (waiting === undefined) {
        timer = clock.setTimeout(() => waiting && sendNow(waiting), wait);
      }
      waiting = avatar;
    },
    stop() {
      clock.clearTimeout(timer);
      waiting = undefined;
    },
  };
}
