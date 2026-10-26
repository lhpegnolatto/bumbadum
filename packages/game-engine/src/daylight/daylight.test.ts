import { describe, expect, it } from "vitest";
import {
  type AmbientLight,
  ambientLightMatrix,
  daylightAt,
  isNeutralAmbientLight,
} from "../index.ts";

/** The Time of day at `hours`:`minutes`. */
const at = (hours: number, minutes = 0) => hours + minutes / 60;

/** What the Ambient light turns an opaque colour into, each channel in [0, 1]. */
function lit(light: AmbientLight, [r, g, b]: [number, number, number]): [number, number, number] {
  const m = ambientLightMatrix(light);
  const row = (i: number) =>
    (m[i] ?? 0) * r + (m[i + 1] ?? 0) * g + (m[i + 2] ?? 0) * b + (m[i + 3] ?? 0) + (m[i + 4] ?? 0);
  return [row(0), row(5), row(10)];
}

const luminance = ([r, g, b]: [number, number, number]) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

describe("daylight", () => {
  it.each([
    ["00:00 Night", at(0), 1],
    ["04:30 Late night", at(4, 30), 1],
    ["06:00 Dawn", at(6), 0.45],
    ["08:00 Morning", at(8), 0],
    ["12:30 Midday", at(12, 30), 0],
    ["15:30 Afternoon", at(15, 30), 0],
    ["17:48 Sunset", at(17, 48), 0.15],
    ["19:00 Dusk", at(19), 0.6],
    ["20:30 Night", at(20, 30), 1],
  ])("gives the table's Lamp glow at %s", (_, time, lampGlow) => {
    expect(daylightAt(time).lampGlow).toBeCloseTo(lampGlow, 10);
  });

  it("interpolates linearly halfway between two Day periods", () => {
    // Halfway from Sunset (15%) to Dusk (60%).
    const sunset = daylightAt(at(17, 48));
    const dusk = daylightAt(at(19));
    const between = daylightAt(at(18, 24));
    expect(between.lampGlow).toBeCloseTo(0.375, 10);
    const { ambientLight } = between;
    expect(ambientLight.saturation).toBeCloseTo(
      (sunset.ambientLight.saturation + dusk.ambientLight.saturation) / 2,
      10,
    );
    expect(ambientLight.overlayStrength).toBeCloseTo(
      (sunset.ambientLight.overlayStrength + dusk.ambientLight.overlayStrength) / 2,
      10,
    );
    ambientLight.multiply.forEach((channel, i) => {
      expect(channel).toBeCloseTo(
        ((sunset.ambientLight.multiply[i] ?? 0) + (dusk.ambientLight.multiply[i] ?? 0)) / 2,
        10,
      );
    });
    ambientLight.overlay.forEach((channel, i) => {
      expect(channel).toBeCloseTo(
        ((sunset.ambientLight.overlay[i] ?? 0) + (dusk.ambientLight.overlay[i] ?? 0)) / 2,
        10,
      );
    });
  });

  it("treats minutes as a fraction of the hour", () => {
    // A quarter of the way from Late night (100%) to Dawn (45%).
    expect(daylightAt(at(4, 52.5)).lampGlow).toBeCloseTo(0.8625, 10);
    // Halfway: 05:15.
    expect(daylightAt(at(5, 15)).lampGlow).toBeCloseTo(0.725, 10);
  });

  it("wraps from 20:30 to 00:00, holding the Night all the way to midnight", () => {
    const midnight = daylightAt(at(0));
    expect(daylightAt(at(22, 15))).toEqual(midnight);
    expect(daylightAt(at(23, 59.99)).ambientLight.saturation).toBeCloseTo(
      midnight.ambientLight.saturation,
      10,
    );
    expect(daylightAt(24)).toEqual(midnight);
    expect(daylightAt(at(25, 30))).toEqual(daylightAt(at(1, 30)));
  });

  it("leaves the Map untouched from Morning to Midday", () => {
    for (const time of [at(8), at(10, 15), at(12, 30)]) {
      const { ambientLight } = daylightAt(time);
      expect(isNeutralAmbientLight(ambientLight)).toBe(true);
      expect(lit(ambientLight, [0.2, 0.5, 0.9])).toEqual(
        [0.2, 0.5, 0.9].map((c) => expect.closeTo(c, 10)),
      );
    }
  });

  it("tints the Map outside Morning and Midday", () => {
    for (const time of [at(0), at(6), at(15, 30), at(17, 48), at(19)]) {
      expect(isNeutralAmbientLight(daylightAt(time).ambientLight)).toBe(false);
    }
  });

  it("keeps the Night bright enough for Avatars, Cars and the Ball to stay clearly visible", () => {
    const night = daylightAt(at(0)).ambientLight;
    const white: [number, number, number] = [1, 1, 1];
    expect(luminance(lit(night, white))).toBeGreaterThanOrEqual(0.55);
    // Each channel keeps most of a mid-grey pixel's light, so no colour sinks into black.
    for (const channel of lit(night, [0.5, 0.5, 0.5])) expect(channel).toBeGreaterThanOrEqual(0.25);
  });

  it("casts a cool Night and a warm Dawn, Sunset and Dusk", () => {
    const grey: [number, number, number] = [0.6, 0.6, 0.6];
    const [nightR, , nightB] = lit(daylightAt(at(0)).ambientLight, grey);
    expect(nightB).toBeGreaterThan(nightR);
    for (const time of [at(17, 48), at(19)]) {
      const [r, g, b] = lit(daylightAt(time).ambientLight, grey);
      expect(r).toBeGreaterThan(g);
      expect(g).toBeGreaterThan(b);
    }
    const [dawnR, dawnG, dawnB] = lit(daylightAt(at(6)).ambientLight, grey);
    expect(dawnR).toBeGreaterThan(dawnG);
    expect(dawnR).toBeGreaterThan(dawnB);
  });

  it("never touches transparency", () => {
    const matrix = ambientLightMatrix(daylightAt(at(0)).ambientLight);
    expect(matrix.slice(15)).toEqual([0, 0, 0, 1, 0]);
  });
});
