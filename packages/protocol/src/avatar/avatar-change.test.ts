import { describe, expect, it } from "vitest";
import { parseAvatarChange } from "../index.ts";

describe("parseAvatarChange", () => {
  it("returns the avatar a change carries", () => {
    expect(parseAvatarChange({ skinTone: 6, hair: 8, outfit: 1 })).toEqual({
      skinTone: 6,
      hair: 8,
      outfit: 1,
    });
  });

  it("rejects an avatar missing a layer or out of range", () => {
    expect(parseAvatarChange({ skinTone: 6, hair: 8 })).toBeUndefined();
    expect(parseAvatarChange({ skinTone: 7, hair: 8, outfit: 1 })).toBeUndefined();
    expect(parseAvatarChange("outfit-2")).toBeUndefined();
    expect(parseAvatarChange(undefined)).toBeUndefined();
  });
});
