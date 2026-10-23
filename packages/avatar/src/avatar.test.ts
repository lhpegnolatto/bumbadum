import { describe, expect, it } from "vitest";
import { DEFAULT_AVATAR, parseAvatar, randomAvatar } from "./index.ts";

describe("parseAvatar", () => {
  it("accepts a skin tone 1–6, a hair 1–8 and an outfit 1–6", () => {
    expect(parseAvatar({ skinTone: 1, hair: 1, outfit: 1 })).toEqual({
      skinTone: 1,
      hair: 1,
      outfit: 1,
    });
    expect(parseAvatar({ skinTone: 6, hair: 8, outfit: 6 })).toEqual({
      skinTone: 6,
      hair: 8,
      outfit: 6,
    });
  });

  it("rejects a choice outside its range", () => {
    expect(parseAvatar({ skinTone: 0, hair: 1, outfit: 1 })).toBeUndefined();
    expect(parseAvatar({ skinTone: 7, hair: 1, outfit: 1 })).toBeUndefined();
    expect(parseAvatar({ skinTone: 1, hair: 9, outfit: 1 })).toBeUndefined();
    expect(parseAvatar({ skinTone: 1, hair: 1, outfit: 7 })).toBeUndefined();
  });

  it("rejects an avatar missing a layer", () => {
    expect(parseAvatar({ skinTone: 1, hair: 1 })).toBeUndefined();
    expect(parseAvatar({ hair: 1, outfit: 1 })).toBeUndefined();
  });

  it("rejects choices that are not whole numbers", () => {
    expect(parseAvatar({ skinTone: 1.5, hair: 1, outfit: 1 })).toBeUndefined();
    expect(parseAvatar({ skinTone: "1", hair: 1, outfit: 1 })).toBeUndefined();
    expect(parseAvatar({ skinTone: Number.NaN, hair: 1, outfit: 1 })).toBeUndefined();
  });

  it("rejects anything that is not an object", () => {
    expect(parseAvatar(undefined)).toBeUndefined();
    expect(parseAvatar(null)).toBeUndefined();
    expect(parseAvatar("1,1,1")).toBeUndefined();
    expect(parseAvatar([1, 1, 1])).toBeUndefined();
  });

  it("keeps only the three layers", () => {
    expect(parseAvatar({ skinTone: 2, hair: 3, outfit: 4, hat: 1 })).toEqual({
      skinTone: 2,
      hair: 3,
      outfit: 4,
    });
  });
});

describe("randomAvatar", () => {
  it("picks every layer from the random number it is given", () => {
    expect(randomAvatar(() => 0)).toEqual({ skinTone: 1, hair: 1, outfit: 1 });
    expect(randomAvatar(() => 0.999)).toEqual({ skinTone: 6, hair: 8, outfit: 6 });
    expect(randomAvatar(() => 0.5)).toEqual({ skinTone: 4, hair: 5, outfit: 4 });
  });
});

describe("DEFAULT_AVATAR", () => {
  it("is a valid avatar", () => {
    expect(parseAvatar(DEFAULT_AVATAR)).toEqual(DEFAULT_AVATAR);
  });
});
