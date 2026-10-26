import type { AppearanceLayer } from "@bumbadum/avatar";
import palettes from "../../../../../assets/avatar/palettes.json";

/** The middle shade of each palette colour, as the generated sprites paint it (ADR-0022). */
const HAIR = Object.fromEntries(palettes.hairColors.map(({ id, ramp }) => [id, ramp[1]]));
const FABRIC = Object.fromEntries(palettes.fabricColors.map(({ id, ramp }) => [id, ramp[1]]));

/** Colours only material wearables (glasses, crowns, headphones…) come in, as drawn. */
const MATERIAL: Readonly<Record<string, string>> = {
  "baby-blue": "#8cb4ec",
  bronze: "#a8703a",
  "butter-yellow": "#f4d46e",
  caramel: "#aa744c",
  cherry: "#d24062",
  gold: "#deaa3a",
  iron: "#9294a0",
  lilac: "#b492de",
  mint: "#82ceaa",
  silver: "#c4c6d0",
  straw: "#dab668",
  "white-red": "linear-gradient(135deg, #f0ece8 50%, #c24240 50%)",
  wine: "#8a3244",
};

/** The CSS background a colour swatch shows, or `undefined` for a colour without one. */
export function swatchColor(layer: AppearanceLayer, color: string): string | undefined {
  if (layer === "hair") return HAIR[color];
  return MATERIAL[color] ?? FABRIC[color];
}
