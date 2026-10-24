import { type Avatar, DEFAULT_AVATAR } from "@bumbadum/avatar";
import { describe, expect, it } from "vitest";
import type { Clock } from "../room/connection.ts";
import { createAvatarSender } from "./avatar-sender.ts";

function fakeClock() {
  let now = 0;
  let timers: { id: number; at: number; run: () => void }[] = [];
  let nextId = 0;
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
  function advance(ms: number) {
    now += ms;
    const due = timers.filter((timer) => timer.at <= now);
    timers = timers.filter((timer) => timer.at > now);
    for (const timer of due) timer.run();
  }
  return { clock, advance };
}

const a: Avatar = DEFAULT_AVATAR;
const b: Avatar = { ...DEFAULT_AVATAR, skinTone: 2 };
const c: Avatar = { ...DEFAULT_AVATAR, skinTone: 3 };

function setup() {
  const { clock, advance } = fakeClock();
  const sent: Avatar[] = [];
  const sender = createAvatarSender({
    clock,
    intervalMs: 2000,
    send: (avatar) => sent.push(avatar),
  });
  return { sender, sent, advance };
}

describe("createAvatarSender", () => {
  it("sends the first change at once", () => {
    const { sender, sent } = setup();
    sender.wear(a);
    expect(sent).toEqual([a]);
  });

  it("holds a change that comes too soon until the interval has passed", () => {
    const { sender, sent, advance } = setup();
    sender.wear(a);
    advance(500);
    sender.wear(b);
    expect(sent).toEqual([a]);

    advance(1499);
    expect(sent).toEqual([a]);
    advance(1);
    expect(sent).toEqual([a, b]);
  });

  it("sends only the latest of several held changes", () => {
    const { sender, sent, advance } = setup();
    sender.wear(a);
    sender.wear(b);
    sender.wear(c);
    advance(2000);
    expect(sent).toEqual([a, c]);
  });

  it("sends at once again after a quiet interval", () => {
    const { sender, sent, advance } = setup();
    sender.wear(a);
    advance(2000);
    sender.wear(b);
    expect(sent).toEqual([a, b]);
  });

  it("drops a held change when stopped", () => {
    const { sender, sent, advance } = setup();
    sender.wear(a);
    sender.wear(b);
    sender.stop();
    advance(5000);
    expect(sent).toEqual([a]);
  });
});
