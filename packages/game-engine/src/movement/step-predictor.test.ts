import { createMap } from "@bumbadum/world";
import { describe, expect, it } from "vitest";
import { StepPredictor } from "./step-predictor.ts";

const map = createMap([
  "######", //
  "#S...#",
  "######",
]);
const spawn = { x: 1, y: 1, direction: "down" } as const;

describe("StepPredictor", () => {
  it("moves the player at once and sends the step", () => {
    const predictor = new StepPredictor(map, spawn, 0);

    expect(predictor.step("right")).toEqual({ send: true, moved: true });
    expect(predictor.pose).toEqual({ x: 2, y: 1, direction: "right" });
  });

  it("only turns towards a blocked tile, and sends nothing when already facing it", () => {
    const predictor = new StepPredictor(map, spawn, 0);

    expect(predictor.step("up")).toEqual({ send: true, moved: false });
    expect(predictor.pose).toEqual({ x: 1, y: 1, direction: "up" });
    expect(predictor.step("up")).toEqual({ send: false, moved: false });
  });

  it("keeps steps still in flight when the room agrees", () => {
    const predictor = new StepPredictor(map, spawn, 0);
    predictor.step("right");
    predictor.step("right");

    const corrected = predictor.reconcile({ x: 2, y: 1, direction: "right" }, 1);

    expect(corrected).toBe(false);
    expect(predictor.pose).toEqual({ x: 3, y: 1, direction: "right" });
  });

  it("replays unhandled steps from the room's tile after a refused step", () => {
    const predictor = new StepPredictor(map, spawn, 0);
    predictor.step("right");
    predictor.step("right");
    predictor.step("right");

    // The room refused the first step and has handled the second one.
    const corrected = predictor.reconcile({ x: 2, y: 1, direction: "right" }, 2);

    expect(corrected).toBe(true);
    expect(predictor.pose).toEqual({ x: 3, y: 1, direction: "right" });
  });

  it("follows the room's direction without calling it a correction", () => {
    const predictor = new StepPredictor(map, spawn, 0);

    expect(predictor.reconcile({ x: 1, y: 1, direction: "left" }, 0)).toBe(false);
    expect(predictor.pose).toEqual({ x: 1, y: 1, direction: "left" });
  });

  it("adopts the room's pose when its count does not match the steps sent", () => {
    const predictor = new StepPredictor(map, spawn, 5);
    predictor.step("right");

    expect(predictor.reconcile({ x: 1, y: 1, direction: "down" }, 0)).toBe(true);
    expect(predictor.pose).toEqual(spawn);
    predictor.step("right");
    expect(predictor.reconcile({ x: 2, y: 1, direction: "right" }, 1)).toBe(false);
  });
});
