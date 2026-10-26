import { describe, expect, it } from "vitest";
import { parseCarDriveIntent, parseCarEnterIntent, parseCarExitIntent } from "../index.ts";

describe("car intents", () => {
  it("accepts only cardinal persisted driving input", () => {
    expect(parseCarDriveIntent("left")).toBe("left");
    expect(parseCarDriveIntent("north")).toBeUndefined();
    expect(parseCarDriveIntent({ x: 1 })).toBeUndefined();
  });

  it("accepts empty enter and exit commands only", () => {
    expect(parseCarEnterIntent(undefined)).toBe(true);
    expect(parseCarExitIntent(undefined)).toBe(true);
    expect(parseCarEnterIntent({ carId: "car-1" })).toBeUndefined();
    expect(parseCarExitIntent("now")).toBeUndefined();
  });
});
