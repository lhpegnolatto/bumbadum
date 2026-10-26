import type { ColorMatrix } from "pixi.js";

/** A colour as red, green and blue, each in [0, 1]. */
export type Rgb = readonly [number, number, number];

/** The colour cast over the whole Map at a Time of day. */
export interface AmbientLight {
  /** 1 leaves colours as drawn, 0 turns them grey, above 1 deepens them. */
  saturation: number;
  /** Scales each channel after saturation: below 1 darkens and tints the Map. */
  multiply: Rgb;
  /** The colour mixed over the Map, at `overlayStrength`. */
  overlay: Rgb;
  /** How much of `overlay` replaces the Map's colour, in [0, 1]. */
  overlayStrength: number;
}

/** How the Map looks at a Time of day. */
export interface Daylight {
  ambientLight: AmbientLight;
  /** The Lamp glow level, from 0 (off by day) to 1 (fully on at night). */
  lampGlow: number;
}

interface DayPeriod {
  /** The Day period's name, a label for this table only: never shown to Players. */
  name: string;
  /** The Time of day it peaks at, in hours since midnight. */
  at: number;
  lampGlow: number;
  saturation: number;
  multiply: Rgb;
  /** A 0xRRGGBB colour. */
  overlay: number;
  overlayStrength: number;
}

const NEUTRAL = {
  saturation: 1,
  multiply: [1, 1, 1],
  overlay: 0xffffff,
  overlayStrength: 0,
} as const;

/** Night: a cool, desaturated blue that still keeps Avatars, Cars and the Ball clearly visible. */
const NIGHT = {
  saturation: 0.7,
  multiply: [0.62, 0.68, 0.86],
  overlay: 0x1c2550,
  overlayStrength: 0.1,
} as const;

/**
 * The Day period table, in order through the day. Between neighbours every value moves linearly.
 * The times and Lamp glow levels are fixed; the colours are tuned by eye with `?time=HH:MM`.
 */
const DAY_PERIODS: readonly DayPeriod[] = [
  { name: "Night", at: 0, lampGlow: 1, ...NIGHT },
  { name: "Late night", at: 4.5, lampGlow: 1, ...NIGHT },
  {
    name: "Dawn",
    at: 6,
    lampGlow: 0.45,
    saturation: 0.85,
    multiply: [0.94, 0.84, 0.86],
    overlay: 0xffa08c,
    overlayStrength: 0.12,
  },
  { name: "Morning", at: 8, lampGlow: 0, ...NEUTRAL },
  { name: "Midday", at: 12.5, lampGlow: 0, ...NEUTRAL },
  {
    name: "Afternoon",
    at: 15.5,
    lampGlow: 0,
    saturation: 1.05,
    multiply: [1, 0.98, 0.94],
    overlay: 0xffd9a0,
    overlayStrength: 0.05,
  },
  {
    name: "Sunset",
    at: 17.8,
    lampGlow: 0.15,
    saturation: 1.1,
    multiply: [1, 0.86, 0.72],
    overlay: 0xff9a3c,
    overlayStrength: 0.16,
  },
  {
    name: "Dusk",
    at: 19,
    lampGlow: 0.6,
    saturation: 0.9,
    multiply: [0.84, 0.72, 0.7],
    overlay: 0xd9784a,
    overlayStrength: 0.14,
  },
  { name: "Night", at: 20.5, lampGlow: 1, ...NIGHT },
];

const HOURS_PER_DAY = 24;
/** The Day periods with the first again at midnight, so the last Night moves towards it. */
const KEYFRAMES: readonly DayPeriod[] = [
  ...DAY_PERIODS,
  { ...(DAY_PERIODS[0] as DayPeriod), at: HOURS_PER_DAY },
];
/** Relative luminance of red, green and blue (Rec. 709): what saturation keeps of each pixel. */
const LUMA: Rgb = [0.2126, 0.7152, 0.0722];

/**
 * How the Map looks at `timeOfDay`, in hours since midnight with minutes as a fraction of the
 * hour (18.5 is 18:30). Any number is folded into one day.
 */
export function daylightAt(timeOfDay: number): Daylight {
  let time = ((timeOfDay % HOURS_PER_DAY) + HOURS_PER_DAY) % HOURS_PER_DAY;
  // Rounding can fold a hair before midnight onto 24, and a broken clock gives NaN.
  if (!(time < HOURS_PER_DAY)) time = 0;
  const next = KEYFRAMES.findIndex((period) => period.at > time);
  const from = KEYFRAMES[next - 1] as DayPeriod;
  const to = KEYFRAMES[next] as DayPeriod;
  const t = (time - from.at) / (to.at - from.at);
  const mix = (a: number, b: number) => a + (b - a) * t;
  const mixRgb = (a: Rgb, b: Rgb): Rgb => [mix(a[0], b[0]), mix(a[1], b[1]), mix(a[2], b[2])];
  return {
    lampGlow: mix(from.lampGlow, to.lampGlow),
    ambientLight: {
      saturation: mix(from.saturation, to.saturation),
      multiply: mixRgb(from.multiply, to.multiply),
      overlay: mixRgb(rgbOf(from.overlay), rgbOf(to.overlay)),
      overlayStrength: mix(from.overlayStrength, to.overlayStrength),
    },
  };
}

/**
 * The `ColorMatrixFilter` matrix that casts `light`: each pixel is saturated, multiplied, then
 * mixed with the overlay colour. Alpha passes through untouched.
 */
export function ambientLightMatrix({
  saturation,
  multiply,
  overlay,
  overlayStrength,
}: AmbientLight): ColorMatrix {
  const keep = 1 - overlayStrength;
  const row = (channel: 0 | 1 | 2) => {
    const scale = keep * multiply[channel];
    const weight = (input: 0 | 1 | 2) =>
      scale * ((1 - saturation) * LUMA[input] + (input === channel ? saturation : 0));
    return [weight(0), weight(1), weight(2), 0, overlayStrength * overlay[channel]] as const;
  };
  return [...row(0), ...row(1), ...row(2), 0, 0, 0, 1, 0];
}

/** Whether `light` leaves every colour as drawn, so the Ambient light can be skipped. */
export function isNeutralAmbientLight(light: AmbientLight): boolean {
  return (
    light.saturation === 1 && light.overlayStrength === 0 && light.multiply.every((c) => c === 1)
  );
}

function rgbOf(hex: number): Rgb {
  return [((hex >> 16) & 0xff) / 255, ((hex >> 8) & 0xff) / 255, (hex & 0xff) / 255];
}
