import { describe, expect, it } from "vitest";
import {
  AVATAR_CATALOG,
  availableAvatarOptions,
  avatarFrames,
  DEFAULT_AVATAR,
  parseAvatar,
  randomAvatar,
} from "./index.ts";

const dressed = {
  skinTone: 2,
  hair: "short-brown",
  top: "t-shirt-blue",
  bottom: "trousers-blue",
  footwear: null,
  overgarment: null,
  neckwear: null,
  eyewear: null,
  headwear: null,
} as const;

describe("parseAvatar", () => {
  it("accepts a complete layered avatar", () => {
    expect(parseAvatar(dressed)).toEqual(dressed);
  });

  it("rejects unknown choices and missing required layers", () => {
    expect(parseAvatar({ ...dressed, hair: "unknown" })).toBeUndefined();
    expect(parseAvatar({ ...dressed, top: undefined })).toBeUndefined();
    expect(parseAvatar({ ...dressed, skinTone: 5 })).toBeUndefined();
  });

  it("rejects an incompatible tunic and overalls", () => {
    expect(
      parseAvatar({ ...dressed, top: "tunic-blue", overgarment: "overalls-blue" }),
    ).toBeUndefined();
  });

  it("rejects anything that is not an object", () => {
    expect(parseAvatar(undefined)).toBeUndefined();
    expect(parseAvatar(null)).toBeUndefined();
    expect(parseAvatar("avatar")).toBeUndefined();
    expect(parseAvatar([])).toBeUndefined();
  });
});

describe("randomAvatar", () => {
  it("randomizes the required appearance and starts without optional wearables", () => {
    expect(randomAvatar(() => 0)).toEqual({
      skinTone: 1,
      hair: "afro-auburn",
      top: "basketball-jersey-beige",
      bottom: "flared-skirt-baby-blue",
      footwear: null,
      overgarment: null,
      neckwear: null,
      eyewear: null,
      headwear: null,
    });
  });
});

describe("DEFAULT_AVATAR", () => {
  it("is the agreed fallback and is valid", () => {
    expect(DEFAULT_AVATAR).toEqual({
      skinTone: 1,
      hair: "short-brown",
      top: "t-shirt-blue",
      bottom: "trousers-blue",
      footwear: null,
      overgarment: null,
      neckwear: null,
      eyewear: null,
      headwear: null,
    });
    expect(parseAvatar(DEFAULT_AVATAR)).toEqual(DEFAULT_AVATAR);
  });
});

describe("retired appearance choices", () => {
  it("keeps a published choice parseable and renderable while hiding it from new selections", () => {
    const option = AVATAR_CATALOG.hair[0];
    const mutable = option as { retired: boolean };
    mutable.retired = true;
    try {
      const retired = { ...DEFAULT_AVATAR, hair: option.id };
      expect(availableAvatarOptions("hair").some(({ id }) => id === option.id)).toBe(false);
      expect(randomAvatar(() => 0).hair).not.toBe(option.id);
      expect(parseAvatar(retired)).toEqual(retired);
      expect(avatarFrames(retired, "down", "idle", 0).some(({ layer }) => layer === "hair")).toBe(
        true,
      );
    } finally {
      mutable.retired = false;
    }
  });
});
