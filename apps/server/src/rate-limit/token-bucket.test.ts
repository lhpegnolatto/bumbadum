import { describe, expect, it } from "vitest";
import { TokenBucket } from "./token-bucket.ts";

describe("TokenBucket", () => {
  it("allows a burst up to its capacity, then refuses", () => {
    const bucket = new TokenBucket({ capacity: 3, perSecond: 3 }, 0);

    expect([1, 2, 3, 4].map(() => bucket.take(0))).toEqual([true, true, true, false]);
  });

  it("refills at its rate, never above its capacity", () => {
    const bucket = new TokenBucket({ capacity: 2, perSecond: 4 }, 0);
    bucket.take(0);
    bucket.take(0);

    expect(bucket.take(100)).toBe(false);
    expect(bucket.take(250)).toBe(true);
    expect([1, 2, 3].map(() => bucket.take(10_000))).toEqual([true, true, false]);
  });
});
