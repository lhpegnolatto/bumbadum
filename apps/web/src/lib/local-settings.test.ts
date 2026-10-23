import { describe, expect, it } from "vitest";
import { parseSettings, SETTINGS_KEY } from "./local-settings.ts";

describe("parseSettings", () => {
  it("reads the nickname and locale", () => {
    expect(parseSettings(JSON.stringify({ nickname: "Ana", locale: "pt-BR" }))).toEqual({
      nickname: "Ana",
      locale: "pt-BR",
    });
  });

  it("returns empty settings when nothing is stored or the value is not JSON", () => {
    expect(parseSettings(null)).toEqual({});
    expect(parseSettings("{oops")).toEqual({});
  });

  it("drops an invalid field without losing the valid ones", () => {
    expect(parseSettings(JSON.stringify({ nickname: "Ana", locale: "fr" }))).toEqual({
      nickname: "Ana",
    });
  });

  it("lives under a versioned key", () => {
    expect(SETTINGS_KEY).toMatch(/v\d+$/);
  });
});
