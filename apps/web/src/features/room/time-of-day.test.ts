import { describe, expect, it } from "vitest";
import { deviceTimeOfDay, timeOfDayOverride } from "./time-of-day.ts";

describe("deviceTimeOfDay", () => {
  it("counts minutes and seconds as fractions of the hour on the device's clock", () => {
    expect(deviceTimeOfDay(new Date(2026, 9, 26, 18, 24, 36))).toBeCloseTo(18.41, 10);
    expect(deviceTimeOfDay(new Date(2026, 9, 26, 0, 0, 0))).toBe(0);
  });
});

describe("timeOfDayOverride", () => {
  it("fixes the Time of day from ?time=HH:MM outside production", () => {
    expect(timeOfDayOverride("?time=18:30", false)).toBe(18.5);
    expect(timeOfDayOverride("?foo=1&time=00:00", false)).toBe(0);
    expect(timeOfDayOverride("?time=23:59", false)).toBeCloseTo(23 + 59 / 60, 10);
  });

  it("is ignored in production builds", () => {
    expect(timeOfDayOverride("?time=18:30", true)).toBeUndefined();
  });

  it("is ignored when missing or malformed", () => {
    for (const search of ["", "?time=", "?time=7:30", "?time=24:00", "?time=12:60", "?time=noon"]) {
      expect(timeOfDayOverride(search, false)).toBeUndefined();
    }
  });
});
