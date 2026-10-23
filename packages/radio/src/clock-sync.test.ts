import { describe, expect, it } from "vitest";
import { estimateClockOffset, expectedPositionMs, type NowPlaying } from "./index.ts";

describe("estimateClockOffset", () => {
  it("assumes the server read its clock halfway through the round trip", () => {
    // Sent at 1000 local, answered 1100 local; the server said 5050 in between.
    expect(estimateClockOffset([{ sentAt: 1000, serverTime: 5050, receivedAt: 1100 }])).toBe(4000);
  });

  it("trusts the sample with the shortest round trip, which jitter disturbed least", () => {
    const samples = [
      { sentAt: 0, serverTime: 4300, receivedAt: 400 }, // slow: says 4100
      { sentAt: 100, serverTime: 4110, receivedAt: 120 }, // fastest: says 4000
      { sentAt: 200, serverTime: 4150, receivedAt: 300 }, // says 3900
    ];
    expect(estimateClockOffset(samples)).toBe(4000);
  });

  it("has nothing to say without samples", () => {
    expect(estimateClockOffset([])).toBeUndefined();
  });
});

describe("expectedPositionMs", () => {
  const nowPlaying: NowPlaying = {
    track: {
      videoId: "aaaaaaaaaaa",
      title: "A",
      durationMs: 180_000,
      submitter: { id: "s", nickname: "Ana" },
    },
    startedAt: 10_000,
  };

  it("is how long ago, in server time, the track went on air", () => {
    expect(expectedPositionMs(nowPlaying, 12_500)).toBe(2500);
  });

  it("stays within the track", () => {
    expect(expectedPositionMs(nowPlaying, 9000)).toBe(0);
    expect(expectedPositionMs(nowPlaying, 500_000)).toBe(180_000);
  });
});
