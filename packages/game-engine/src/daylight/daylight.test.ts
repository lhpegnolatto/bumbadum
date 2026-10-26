import { describe, expect, it } from "vitest";
import { type AmbientLight, ambientLightMatrix, type Daylight, daylightAt } from "../index.ts";

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

/** A keyframe of the game's lighting table, with its overlay colour in 0–255. */
function keyframe(
  saturation: number,
  multiply: [number, number, number],
  [r, g, b]: [number, number, number],
  overlayStrength: number,
  lampGlow: number,
  litWindows: number,
): Daylight {
  return {
    ambientLight: { saturation, multiply, overlay: [r / 255, g / 255, b / 255], overlayStrength },
    lampGlow,
    litWindows,
  };
}

const NIGHT = keyframe(0.85, [0.44, 0.48, 0.74], [24, 26, 70], 0.22, 1, 1);

describe("daylight", () => {
  it.each([
    ["00:00 Night", at(0), NIGHT],
    ["04:30 Late night", at(4, 30), keyframe(0.85, [0.5, 0.52, 0.76], [40, 40, 96], 0.2, 1, 1)],
    ["06:00 Dawn", at(6), keyframe(0.95, [0.88, 0.74, 0.8], [250, 168, 150], 0.16, 0.45, 1)],
    ["08:00 Morning", at(8), keyframe(1, [1, 0.98, 0.95], [255, 240, 214], 0.06, 0, 0)],
    ["12:30 Midday", at(12, 30), keyframe(1.05, [1.04, 1.04, 1.02], [255, 255, 255], 0, 0, 0)],
    ["15:30 Afternoon", at(15, 30), keyframe(1, [1, 0.95, 0.86], [255, 214, 150], 0.08, 0, 0)],
    // The bundle puts Sunset at 17.8 h, which is 17:48.
    ["17:48 Sunset", at(17, 48), keyframe(1.03, [0.98, 0.86, 0.76], [250, 170, 120], 0.1, 0.55, 1)],
    ["19:00 Dusk", at(19), keyframe(0.95, [0.62, 0.58, 0.88], [96, 72, 170], 0.2, 0.85, 1)],
    ["20:30 Night", at(20, 30), NIGHT],
  ])("gives the lighting table's values at %s", (_, time, expected) => {
    const { ambientLight, lampGlow, litWindows } = daylightAt(time);
    expect(lampGlow).toBeCloseTo(expected.lampGlow, 10);
    expect(litWindows).toBeCloseTo(expected.litWindows, 10);
    expect(ambientLight.saturation).toBeCloseTo(expected.ambientLight.saturation, 10);
    expect(ambientLight.overlayStrength).toBeCloseTo(expected.ambientLight.overlayStrength, 10);
    expect(ambientLight.multiply).toEqual(
      expected.ambientLight.multiply.map((c) => expect.closeTo(c, 10)),
    );
    expect(ambientLight.overlay).toEqual(
      expected.ambientLight.overlay.map((c) => expect.closeTo(c, 10)),
    );
  });

  it("interpolates every value linearly halfway between two Day periods", () => {
    const sunset = daylightAt(at(17, 48));
    const dusk = daylightAt(at(19));
    const between = daylightAt(at(18, 24));
    const half = (a: number, b: number) => expect.closeTo((a + b) / 2, 10);
    // Halfway from Sunset (55%) to Dusk (85%).
    expect(between.lampGlow).toBeCloseTo(0.7, 10);
    expect(between.litWindows).toBe(1);
    const { ambientLight } = between;
    expect(ambientLight.saturation).toEqual(
      half(sunset.ambientLight.saturation, dusk.ambientLight.saturation),
    );
    expect(ambientLight.overlayStrength).toEqual(
      half(sunset.ambientLight.overlayStrength, dusk.ambientLight.overlayStrength),
    );
    expect(ambientLight.multiply).toEqual(
      sunset.ambientLight.multiply.map((c, i) => half(c, dusk.ambientLight.multiply[i] ?? 0)),
    );
    expect(ambientLight.overlay).toEqual(
      sunset.ambientLight.overlay.map((c, i) => half(c, dusk.ambientLight.overlay[i] ?? 0)),
    );
  });

  it("dims the lit windows gradually between Dawn and Morning", () => {
    expect(daylightAt(at(7)).litWindows).toBeCloseTo(0.5, 10);
    expect(daylightAt(at(16, 39)).litWindows).toBeCloseTo(0.5, 10);
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

  it("keeps the Night bright enough for Avatars, Cars and the Ball to stay clearly visible", () => {
    const night = daylightAt(at(0)).ambientLight;
    // White keeps at least 40% of its luminance (the bundle's Night leaves about 41%).
    expect(luminance(lit(night, [1, 1, 1]))).toBeGreaterThanOrEqual(0.4);
    // A mid-grey pixel keeps light in every channel, so no colour sinks into black.
    for (const channel of lit(night, [0.5, 0.5, 0.5])) expect(channel).toBeGreaterThanOrEqual(0.18);
    // A saturated red, such as a red Car, stays well off black.
    expect(luminance(lit(night, [0.8, 0.1, 0.1]))).toBeGreaterThanOrEqual(0.1);
  });

  it("casts a cool Night and a warm Dawn and Sunset", () => {
    const grey: [number, number, number] = [0.6, 0.6, 0.6];
    const [nightR, nightG, nightB] = lit(daylightAt(at(0)).ambientLight, grey);
    expect(nightB).toBeGreaterThan(nightG);
    expect(nightB).toBeGreaterThan(nightR);
    const [sunsetR, sunsetG, sunsetB] = lit(daylightAt(at(17, 48)).ambientLight, grey);
    expect(sunsetR).toBeGreaterThan(sunsetG);
    expect(sunsetG).toBeGreaterThan(sunsetB);
    const [dawnR, dawnG, dawnB] = lit(daylightAt(at(6)).ambientLight, grey);
    expect(dawnR).toBeGreaterThan(dawnG);
    expect(dawnR).toBeGreaterThan(dawnB);
  });
});

describe("ambientLightMatrix", () => {
  it("follows the bundle's recipe: saturate, multiply by multiplicar × (1 − alfa), add the overlay × alfa", () => {
    const light: AmbientLight = {
      saturation: 1,
      multiply: [0.5, 0.6, 0.8],
      overlay: [0.2, 0.4, 1],
      overlayStrength: 0.25,
    };
    expect(lit(light, [1, 0.5, 0])).toEqual(
      [1 * 0.5 * 0.75 + 0.05, 0.5 * 0.6 * 0.75 + 0.1, 0 + 0.25].map((c) => expect.closeTo(c, 10)),
    );
  });

  it("saturates around the bundle's grey (Rec. 601 luma) before multiplying", () => {
    const desaturated: AmbientLight = {
      saturation: 0,
      multiply: [1, 1, 1],
      overlay: [0, 0, 0],
      overlayStrength: 0,
    };
    const luma = 0.299 * 0.9 + 0.587 * 0.3 + 0.114 * 0.1;
    expect(lit(desaturated, [0.9, 0.3, 0.1])).toEqual(
      [luma, luma, luma].map((c) => expect.closeTo(c, 10)),
    );
    const half = { ...desaturated, saturation: 0.5, multiply: [2, 1, 1] as const };
    expect(lit(half, [0.9, 0.3, 0.1])[0]).toBeCloseTo(2 * (luma + 0.5 * (0.9 - luma)), 10);
  });

  it("never touches transparency", () => {
    const matrix = ambientLightMatrix(daylightAt(at(0)).ambientLight);
    expect(matrix.slice(15)).toEqual([0, 0, 0, 1, 0]);
  });
});
