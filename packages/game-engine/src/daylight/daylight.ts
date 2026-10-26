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
  /** The lit-windows level, from 0 (dark by day) to 1 (every window lit). */
  litWindows: number;
}

/** A keyframe of the v7 bundle's lighting table, in the bundle's own units. */
interface DayPeriod {
  /** The Day period's name, a label for this table only: never shown to Players. */
  name: string;
  /** The Time of day it peaks at, in hours since midnight (`hora`). */
  at: number;
  /** `saturacao`. */
  saturation: number;
  /** `multiplicar`. */
  multiply: Rgb;
  /** `sobreposicao.cor`, each channel in 0–255. */
  overlay: readonly [number, number, number];
  /** `sobreposicao.alfa`. */
  overlayStrength: number;
  /** `luzes`. */
  lampGlow: number;
  /** `janelas_acesas`. */
  litWindows: number;
}

const NIGHT = {
  saturation: 0.85,
  multiply: [0.44, 0.48, 0.74],
  overlay: [24, 26, 70],
  overlayStrength: 0.22,
  lampGlow: 1,
  litWindows: 1,
} as const;

/**
 * The Day period table, copied from `assets/mapa_praca_v7/iluminacao/iluminacao.json`, in order
 * through the day. Between neighbours every value moves linearly.
 */
const DAY_PERIODS: readonly DayPeriod[] = [
  { name: "Night", at: 0, ...NIGHT },
  {
    name: "Late night",
    at: 4.5,
    saturation: 0.85,
    multiply: [0.5, 0.52, 0.76],
    overlay: [40, 40, 96],
    overlayStrength: 0.2,
    lampGlow: 1,
    litWindows: 1,
  },
  {
    name: "Dawn",
    at: 6,
    saturation: 0.95,
    multiply: [0.88, 0.74, 0.8],
    overlay: [250, 168, 150],
    overlayStrength: 0.16,
    lampGlow: 0.45,
    litWindows: 1,
  },
  {
    name: "Morning",
    at: 8,
    saturation: 1,
    multiply: [1, 0.98, 0.95],
    overlay: [255, 240, 214],
    overlayStrength: 0.06,
    lampGlow: 0,
    litWindows: 0,
  },
  {
    name: "Midday",
    at: 12.5,
    saturation: 1.05,
    multiply: [1.04, 1.04, 1.02],
    overlay: [255, 255, 255],
    overlayStrength: 0,
    lampGlow: 0,
    litWindows: 0,
  },
  {
    name: "Afternoon",
    at: 15.5,
    saturation: 1,
    multiply: [1, 0.95, 0.86],
    overlay: [255, 214, 150],
    overlayStrength: 0.08,
    lampGlow: 0,
    litWindows: 0,
  },
  {
    // The bundle gives 17.8 h (17:48); softened here so the sunset tint stays subtle in-game.
    name: "Sunset",
    at: 17.8,
    saturation: 1.03,
    multiply: [0.98, 0.86, 0.76],
    overlay: [250, 170, 120],
    overlayStrength: 0.1,
    lampGlow: 0.55,
    litWindows: 1,
  },
  {
    name: "Dusk",
    at: 19,
    saturation: 0.95,
    multiply: [0.62, 0.58, 0.88],
    overlay: [96, 72, 170],
    overlayStrength: 0.2,
    lampGlow: 0.85,
    litWindows: 1,
  },
  { name: "Night", at: 20.5, ...NIGHT },
];

const HOURS_PER_DAY = 24;
/** The Day periods with the first again at midnight, so the last Night moves towards it. */
const KEYFRAMES: readonly DayPeriod[] = [
  ...DAY_PERIODS,
  { ...(DAY_PERIODS[0] as DayPeriod), at: HOURS_PER_DAY },
];
/**
 * The grey that saturation moves away from: Rec. 601 luma, which the bundle's previews were
 * rendered with (they match within 1/255 on every unlit pixel).
 */
const LUMA: Rgb = [0.299, 0.587, 0.114];

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
  const mixRgb = (a: Rgb, b: Rgb, scale = 1): Rgb => [
    mix(a[0], b[0]) / scale,
    mix(a[1], b[1]) / scale,
    mix(a[2], b[2]) / scale,
  ];
  return {
    ambientLight: {
      saturation: mix(from.saturation, to.saturation),
      multiply: mixRgb(from.multiply, to.multiply),
      overlay: mixRgb(from.overlay, to.overlay, 255),
      overlayStrength: mix(from.overlayStrength, to.overlayStrength),
    },
    lampGlow: mix(from.lampGlow, to.lampGlow),
    litWindows: mix(from.litWindows, to.litWindows),
  };
}

/**
 * The `ColorMatrixFilter` matrix that casts `light`, by the bundle's recipe: each pixel is
 * saturated, multiplied by `multiply × (1 − overlayStrength)`, then the overlay colour ×
 * `overlayStrength` is added (PixiJS takes the offset column in [0, 1]). Alpha passes through.
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
