import { describe, expect, it } from "vitest";
import { parseTennisJoinIntent, parseTennisLeaveIntent, parseTennisSteerIntent } from "../index.ts";

describe("Tennis intents", () => {
  it("accepts empty join and leave intents only", () => {
    expect(parseTennisJoinIntent(undefined)).toBe(true);
    expect(parseTennisLeaveIntent(undefined)).toBe(true);
    expect(parseTennisJoinIntent(null)).toBeUndefined();
    expect(parseTennisLeaveIntent({})).toBeUndefined();
  });

  it("accepts horizontal steering or null to release the input", () => {
    expect(parseTennisSteerIntent("left")).toBe("left");
    expect(parseTennisSteerIntent("right")).toBe("right");
    expect(parseTennisSteerIntent(null)).toBeNull();
  });

  it("rejects vertical steering, positions, and timestamps", () => {
    expect(parseTennisSteerIntent("up")).toBeUndefined();
    expect(parseTennisSteerIntent({ direction: "left" })).toBeUndefined();
    expect(parseTennisSteerIntent({ x: 120, sentAt: 42 })).toBeUndefined();
    expect(parseTennisSteerIntent(undefined)).toBeUndefined();
  });
});
