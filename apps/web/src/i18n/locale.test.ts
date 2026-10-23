import { languages } from "@bumbadum/chat";
import { describe, expect, it } from "vitest";
import { detectLocale, locales } from "./locale.ts";

describe("locales", () => {
  it("match the languages every command has a name in", () => {
    expect([...locales].sort()).toEqual([...languages].sort());
  });
});

describe("detectLocale", () => {
  it("gives pt-BR to any Portuguese browser language", () => {
    expect(detectLocale(["pt-BR"])).toBe("pt-BR");
    expect(detectLocale(["pt-PT", "en"])).toBe("pt-BR");
    expect(detectLocale(["pt"])).toBe("pt-BR");
  });

  it("gives English to anything else", () => {
    expect(detectLocale(["en-US", "pt-BR"])).toBe("en");
    expect(detectLocale(["fr"])).toBe("en");
    expect(detectLocale([])).toBe("en");
  });
});
