import { describe, expect, it } from "vitest";
import { DEFAULT_AVATAR, parseAvatar, randomAvatar, repairAvatar } from "./index.ts";

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

describe("repairAvatar", () => {
  it("keeps a valid avatar unchanged", () => {
    expect(repairAvatar(dressed)).toEqual(dressed);
  });

  it("drops a removed style from an optional layer and keeps everything else", () => {
    const stored = {
      ...dressed,
      hair: "bowl-black",
      footwear: "boots-black",
      eyewear: "sunglasses-gold",
    };

    expect(repairAvatar(stored)).toEqual({ ...dressed, hair: null, eyewear: "sunglasses-gold" });
  });

  it("puts the default choice on a required layer whose style was removed", () => {
    const stored = { ...dressed, top: "tunic-blue", bottom: "joggers-black" };

    expect(repairAvatar(stored)).toEqual({
      ...dressed,
      top: "t-shirt-blue",
      bottom: "trousers-blue",
    });
  });

  it("does not repair something that is not an avatar", () => {
    expect(repairAvatar(undefined)).toBeUndefined();
    expect(repairAvatar([])).toBeUndefined();
    expect(repairAvatar({ ...dressed, skinTone: 5 })).toBeUndefined();
  });
});
