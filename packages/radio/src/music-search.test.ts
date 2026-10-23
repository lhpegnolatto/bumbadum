import { describe, expect, it } from "vitest";
import { normalizeSearchQuery } from "./index.ts";

describe("normalizeSearchQuery", () => {
  it("makes queries that differ only in case and spacing the same", () => {
    expect(normalizeSearchQuery("  Never  Gonna\tGIVE you   up ")).toBe("never gonna give you up");
    expect(normalizeSearchQuery("never gonna give you up")).toBe("never gonna give you up");
    expect(normalizeSearchQuery("ÁGUAS DE MARÇO")).toBe("águas de março");
  });
});
