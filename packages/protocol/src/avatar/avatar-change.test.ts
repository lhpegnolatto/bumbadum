import { DEFAULT_AVATAR } from "@bumbadum/avatar";
import { describe, expect, it } from "vitest";
import { parseAvatarChange } from "../index.ts";

describe("parseAvatarChange", () => {
  it("returns the avatar a change carries", () => {
    expect(parseAvatarChange({ ...DEFAULT_AVATAR, skinTone: 4 })).toEqual({
      ...DEFAULT_AVATAR,
      skinTone: 4,
    });
  });

  it("rejects an avatar missing its tone or out of range", () => {
    expect(parseAvatarChange({ ...DEFAULT_AVATAR, hair: "unknown" })).toBeUndefined();
    expect(parseAvatarChange({ skinTone: 5 })).toBeUndefined();
    expect(parseAvatarChange("outfit-2")).toBeUndefined();
    expect(parseAvatarChange(undefined)).toBeUndefined();
  });
});
