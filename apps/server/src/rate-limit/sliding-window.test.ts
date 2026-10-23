import { describe, expect, it } from "vitest";
import { SlidingWindow } from "./sliding-window.ts";

const MINUTE = 60_000;

describe("SlidingWindow", () => {
  it("allows the limit within any window, and the next action only once the oldest has left it", () => {
    const window = new SlidingWindow({ limit: 3, windowMs: MINUTE });

    expect(window.take(0)).toBe(true);
    expect(window.take(20_000)).toBe(true);
    expect(window.take(40_000)).toBe(true);
    expect(window.take(59_999)).toBe(false);
    expect(window.take(MINUTE)).toBe(true);
    expect(window.take(MINUTE + 1)).toBe(false);
    expect(window.take(20_000 + MINUTE)).toBe(true);
  });

  it("never lets more than the limit through in any one window, unlike a refilling bucket", () => {
    const window = new SlidingWindow({ limit: 3, windowMs: MINUTE });
    const allowed: number[] = [];
    for (let at = 0; at <= 5 * MINUTE; at += 1000) if (window.take(at)) allowed.push(at);

    for (const start of allowed) {
      const inWindow = allowed.filter((at) => at >= start && at < start + MINUTE);
      expect(inWindow.length, `window from ${start}`).toBeLessThanOrEqual(3);
    }
    // Three at the start of each of five minutes, and one at 5:00.
    expect(allowed).toHaveLength(16);
  });

  it("does not count refused actions", () => {
    const window = new SlidingWindow({ limit: 1, windowMs: MINUTE });

    expect(window.take(0)).toBe(true);
    for (let at = 1000; at < MINUTE; at += 1000) expect(window.take(at)).toBe(false);
    expect(window.take(MINUTE)).toBe(true);
  });
});
