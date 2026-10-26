import { describe, expect, it } from "vitest";
import type { Clock } from "./connection.ts";
import { createNicknameSender } from "./nickname-sender.ts";

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

function setup() {
  const { clock, advance } = fakeClock();
  const sent: string[] = [];
  const sender = createNicknameSender({
    clock,
    intervalMs: 10_000,
    send: (nickname) => sent.push(nickname),
  });
  return { sender, sent, advance };
}

describe("createNicknameSender", () => {
  it("sends the first change at once", () => {
    const { sender, sent } = setup();
    sender.rename("Lu");
    expect(sent).toEqual(["Lu"]);
  });

  it("holds a change that comes too soon until the interval has passed", () => {
    const { sender, sent, advance } = setup();
    sender.rename("Lu");
    advance(3000);
    sender.rename("Lulu");
    expect(sent).toEqual(["Lu"]);

    advance(6999);
    expect(sent).toEqual(["Lu"]);
    advance(1);
    expect(sent).toEqual(["Lu", "Lulu"]);
  });

  it("sends only the latest of several held changes", () => {
    const { sender, sent, advance } = setup();
    sender.rename("Lu");
    sender.rename("Lulu");
    sender.rename("Luiz");
    advance(10_000);
    expect(sent).toEqual(["Lu", "Luiz"]);
  });

  it("sends at once again after a quiet interval", () => {
    const { sender, sent, advance } = setup();
    sender.rename("Lu");
    advance(10_000);
    sender.rename("Lulu");
    expect(sent).toEqual(["Lu", "Lulu"]);
  });

  it("drops a held change when stopped", () => {
    const { sender, sent, advance } = setup();
    sender.rename("Lu");
    sender.rename("Lulu");
    sender.stop();
    advance(20_000);
    expect(sent).toEqual(["Lu"]);
  });
});
