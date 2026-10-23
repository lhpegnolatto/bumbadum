import { describe, expect, it } from "vitest";
import { parseAvatarChange } from "../index.ts";

describe("parseAvatarChange", () => {
  it("returns the avatar a change carries", () => {
    expect(parseAvatarChange({ skinTone: 4 })).toEqual({ skinTone: 4 });
  });

  it("rejects an avatar missing its tone or out of range", () => {
    expect(parseAvatarChange({ hair: 8 })).toBeUndefined();
    expect(parseAvatarChange({ skinTone: 5 })).toBeUndefined();
    expect(parseAvatarChange("outfit-2")).toBeUndefined();
    expect(parseAvatarChange(undefined)).toBeUndefined();
  });
});
