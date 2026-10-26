import { APPEARANCE_LAYERS, AVATAR_CATALOG } from "@bumbadum/avatar";
import { describe, expect, it } from "vitest";
import { swatchColor } from "./swatches.ts";

describe("swatchColor", () => {
  it("colours every option of the catalog", () => {
    const missing = APPEARANCE_LAYERS.flatMap((layer) =>
      AVATAR_CATALOG[layer]
        .filter(({ color }) => swatchColor(layer, color) === undefined)
        .map(({ id }) => `${layer}/${id}`),
    );
    expect(missing).toEqual([]);
  });

  it("tells a hair colour from the fabric colour of the same name", () => {
    expect(swatchColor("hair", "black")).not.toBe(swatchColor("top", "black"));
  });
});
