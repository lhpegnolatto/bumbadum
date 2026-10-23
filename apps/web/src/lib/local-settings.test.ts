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

  it("reads the avatar and discards obsolete appearance fields", () => {
    const stored = { skinTone: 4, hair: 8, outfit: 2 };
    expect(parseSettings(JSON.stringify({ nickname: "Ana", avatar: stored }))).toEqual({
      nickname: "Ana",
      avatar: { skinTone: 4 },
    });
  });

  it("migrates old skin tones 5 and 6 to tone 1", () => {
    for (const skinTone of [5, 6]) {
      expect(parseSettings(JSON.stringify({ avatar: { skinTone, hair: 1, outfit: 1 } }))).toEqual({
        avatar: { skinTone: 1 },
      });
    }
  });

  it("drops an invalid avatar, keeping the rest", () => {
    for (const avatar of [{ skinTone: 7 }, { hair: 1, outfit: 1 }, "1,1,1"]) {
      expect(parseSettings(JSON.stringify({ nickname: "Ana", avatar }))).toEqual({
        nickname: "Ana",
      });
    }
  });

  it("reads the volume and mute", () => {
    expect(parseSettings(JSON.stringify({ volume: 35, muted: true }))).toEqual({
      volume: 35,
      muted: true,
    });
  });

  it("drops a volume outside 0 to 100 or a mute that is not a yes or no, keeping the rest", () => {
    for (const volume of [-1, 101, 50.5, "50"]) {
      expect(parseSettings(JSON.stringify({ nickname: "Ana", volume }))).toEqual({
        nickname: "Ana",
      });
    }
    expect(parseSettings(JSON.stringify({ nickname: "Ana", muted: "yes" }))).toEqual({
      nickname: "Ana",
    });
  });

  it("lives under a versioned key", () => {
    expect(SETTINGS_KEY).toMatch(/v\d+$/);
  });
});
