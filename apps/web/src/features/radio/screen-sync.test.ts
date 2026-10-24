import type { NowPlaying } from "@bumbadum/radio";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ScreenPlayer } from "./screen-player.ts";
import { syncScreen } from "./screen-sync.ts";

/** The server clock runs this far ahead of the local one. */
const OFFSET = 1_000_000;

function onAir(videoId: string, startedAt: number): NowPlaying {
  return {
    track: {
      videoId,
      title: videoId,
      durationMs: 180_000,
      submitter: { id: "s", nickname: "Ana" },
    },
    startedAt,
  };
}

/** A screen that records what it is told and reports the position the test sets. */
function fakePlayer() {
  const calls: unknown[][] = [];
  const screen = { position: undefined as number | undefined };
  const player: ScreenPlayer = {
    load: (...args) => void calls.push(["load", ...args]),
    stop: () => void calls.push(["stop"]),
    seek: (...args) => void calls.push(["seek", ...args]),
    setRate: (...args) => void calls.push(["setRate", ...args]),
    position: () => screen.position,
    setVolume: () => {},
    destroy: () => {},
  };
  return { player, calls, screen };
}

let serverClockKnown: boolean;
const serverNow = () => (serverClockKnown ? Date.now() + OFFSET : undefined);

beforeEach(() => {
  vi.useFakeTimers({ now: 0 });
  serverClockKnown = true;
});
afterEach(() => {
  vi.useRealTimers();
});

function setup() {
  const fake = fakePlayer();
  const sync = syncScreen({ player: fake.player, serverNow, localNow: () => Date.now() });
  return { ...fake, sync };
}

describe("syncScreen", () => {
  it("waits for the server clock, then loads the track where the radio is", () => {
    serverClockKnown = false;
    const { sync, calls } = setup();
    sync.show(onAir("aaaaaaaaaaa", OFFSET - 5000));
    vi.advanceTimersByTime(100);
    expect(calls).toEqual([]);

    serverClockKnown = true;
    vi.advanceTimersByTime(20);
    expect(calls).toContainEqual(["load", "aaaaaaaaaaa", 5.12]);
  });

  it("seeks when the screen falls more than a second behind, once it has settled", () => {
    const { sync, calls, screen } = setup();
    sync.show(onAir("aaaaaaaaaaa", OFFSET));
    vi.advanceTimersByTime(20);
    calls.length = 0;

    // Stuck at the start while the radio moves on: behind by more and more.
    screen.position = 0;
    vi.advanceTimersByTime(1000);
    expect(calls).toEqual([]);
    vi.advanceTimersByTime(4000);

    expect(calls[0]).toEqual(["setRate", 1]);
    expect(calls[1]?.[0]).toBe("seek");
  });

  it("nudges the rate when the screen is a little ahead", () => {
    const { sync, calls, screen } = setup();
    sync.show(onAir("aaaaaaaaaaa", OFFSET));
    vi.advanceTimersByTime(2000);
    calls.length = 0;

    // Keeps 300 ms ahead of the radio.
    const ahead = () => (Date.now() + 300) / 1000;
    for (let i = 0; i < 40; i++) {
      screen.position = ahead();
      vi.advanceTimersByTime(20);
    }
    expect(calls).toContainEqual(["setRate", 0.95]);
  });

  it("loads the next track when it goes on air, and stops when the radio falls silent", () => {
    const { sync, calls } = setup();
    sync.show(onAir("aaaaaaaaaaa", OFFSET));
    vi.advanceTimersByTime(20);
    sync.show(onAir("bbbbbbbbbbb", OFFSET + 20));
    vi.advanceTimersByTime(20);
    sync.show(undefined);

    expect(calls.filter(([kind]) => kind !== "setRate")).toEqual([
      ["load", "aaaaaaaaaaa", 0],
      ["load", "bbbbbbbbbbb", 0],
      ["stop"],
    ]);
  });

  it("reports what the screen plays against where the radio is", () => {
    const { sync, screen } = setup();
    sync.show(onAir("aaaaaaaaaaa", OFFSET));
    vi.advanceTimersByTime(1000);
    screen.position = 0.9;

    expect(sync.reading()).toEqual({ videoId: "aaaaaaaaaaa", positionMs: 900, expectedMs: 1000 });
  });

  it("stops while paused, then resumes where the radio has moved on to", () => {
    const { sync, calls } = setup();
    sync.show(onAir("aaaaaaaaaaa", OFFSET));
    vi.advanceTimersByTime(20);
    sync.pause();
    vi.advanceTimersByTime(10_000);
    // A new track goes on air while the screen is covered.
    sync.show(onAir("bbbbbbbbbbb", OFFSET + 5000));
    vi.advanceTimersByTime(1000);
    expect(sync.reading()).toBeUndefined();

    sync.resume();
    expect(calls.filter(([kind]) => kind !== "setRate")).toEqual([
      ["load", "aaaaaaaaaaa", 0],
      ["stop"],
      ["load", "bbbbbbbbbbb", 6.02],
    ]);
  });
});
