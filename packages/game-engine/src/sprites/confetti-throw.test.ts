import { describe, expect, it } from "vitest";
import { confettiThrowFrame, flightMs, flightPoint, landingPoint } from "./confetti-throw.ts";

const FLIGHT_MS = 200;

describe("confettiThrowFrame", () => {
  it("holds the confetti, winds up, flies, then bursts through four impact frames", () => {
    const at = (elapsed: number) => confettiThrowFrame(elapsed, FLIGHT_MS, false);

    expect(at(0)).toEqual({ phase: "hand", frame: 0 });
    expect(at(119)).toEqual({ phase: "hand", frame: 0 });
    expect(at(120)).toEqual({ phase: "hand", frame: 1 });
    expect(at(230)).toMatchObject({ phase: "flight", progress: 0 });
    expect(at(330)).toMatchObject({ phase: "flight", progress: 0.5 });
    expect(at(430)).toEqual({ phase: "impact", frame: 0 });
    expect(at(500)).toEqual({ phase: "impact", frame: 1 });
    expect(at(590)).toEqual({ phase: "impact", frame: 2 });
    expect(at(700)).toEqual({ phase: "impact", frame: 3 });
    expect(at(839)).toEqual({ phase: "impact", frame: 3 });
    expect(at(840)).toEqual({ phase: "done" });
  });

  it("under reduced motion, only holds one burst frame for 600 ms, without hand or flight", () => {
    const at = (elapsed: number) => confettiThrowFrame(elapsed, FLIGHT_MS, true);

    expect(at(0)).toEqual({ phase: "impact", frame: 2 });
    expect(at(300)).toEqual({ phase: "impact", frame: 2 });
    expect(at(599)).toEqual({ phase: "impact", frame: 2 });
    expect(at(600)).toEqual({ phase: "done" });
  });
});

describe("flightMs", () => {
  it("takes about 105 ms a tile, and at least 70 ms for a throw against a wall right ahead", () => {
    expect(flightMs(48)).toBe(315);
    expect(flightMs(16)).toBe(105);
    expect(flightMs(8)).toBe(70);
  });
});

describe("flightPoint", () => {
  const hand = { x: 0, y: 0 };

  it("leaves the hand and lands on the target", () => {
    const target = { x: 0, y: 48 };

    expect(flightPoint(hand, target, 0)).toMatchObject({ x: 0, y: 0 });
    expect(flightPoint(hand, target, 1)).toMatchObject({ x: 0, y: 48 });
  });

  it("arcs about 13 px high over two tiles, level at its peak", () => {
    const peak = flightPoint(hand, { x: 32, y: 0 }, 0.5);

    expect(peak).toMatchObject({ x: 16, y: -13, mirrored: false });
    expect(peak.rotation).toBeCloseTo(0);
  });

  it("mirrors the confetti flying left, so its trail never turns upside down", () => {
    const peak = flightPoint(hand, { x: -32, y: 0 }, 0.5);

    expect(peak).toMatchObject({ x: -16, y: -13, mirrored: true });
    expect(peak.rotation).toBeCloseTo(0);
  });
});

describe("landingPoint", () => {
  it("bursts at chest height over a Player, and over the middle of a floor tile", () => {
    // The tile at (3, 4) spans x 48–64 and y 64–80; feet stand on its bottom edge.
    expect(landingPoint({ at: { x: 3, y: 4 }, onPlayer: true })).toEqual({ x: 56, y: 68 });
    expect(landingPoint({ at: { x: 3, y: 4 }, onPlayer: false })).toEqual({ x: 56, y: 72 });
  });

  it("bursts on the edge of a blocked tile right ahead", () => {
    expect(landingPoint({ at: { x: 3, y: 3.5 }, onPlayer: false })).toEqual({ x: 56, y: 64 });
  });
});
