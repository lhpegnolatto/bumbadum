import { describe, expect, it } from "vitest";
import { DEFAULT_AVATAR, parseAvatar, randomAvatar } from "./index.ts";

describe("parseAvatar", () => {
  it("accepts one of four skin tones and discards obsolete fields", () => {
    expect(parseAvatar({ skinTone: 1 })).toEqual({ skinTone: 1 });
    expect(parseAvatar({ skinTone: 4, hair: 8, outfit: 6 })).toEqual({ skinTone: 4 });
  });

  it("rejects a choice outside its range", () => {
    expect(parseAvatar({ skinTone: 0 })).toBeUndefined();
    expect(parseAvatar({ skinTone: 5 })).toBeUndefined();
  });

  it("rejects an avatar missing its skin tone", () => {
    expect(parseAvatar({ hair: 1, outfit: 1 })).toBeUndefined();
  });

  it("rejects choices that are not whole numbers", () => {
    expect(parseAvatar({ skinTone: 1.5 })).toBeUndefined();
    expect(parseAvatar({ skinTone: "1" })).toBeUndefined();
    expect(parseAvatar({ skinTone: Number.NaN })).toBeUndefined();
  });

  it("rejects anything that is not an object", () => {
    expect(parseAvatar(undefined)).toBeUndefined();
    expect(parseAvatar(null)).toBeUndefined();
    expect(parseAvatar("1,1,1")).toBeUndefined();
    expect(parseAvatar([1, 1, 1])).toBeUndefined();
  });

  it("keeps only the current appearance choice", () => {
    expect(parseAvatar({ skinTone: 2, hair: 3, outfit: 4, hat: 1 })).toEqual({
      skinTone: 2,
    });
  });
});

describe("randomAvatar", () => {
  it("picks one of the four skin tones from the random number it is given", () => {
    expect(randomAvatar(() => 0)).toEqual({ skinTone: 1 });
    expect(randomAvatar(() => 0.999)).toEqual({ skinTone: 4 });
    expect(randomAvatar(() => 0.5)).toEqual({ skinTone: 3 });
  });
});

describe("DEFAULT_AVATAR", () => {
  it("is a valid avatar", () => {
    expect(parseAvatar(DEFAULT_AVATAR)).toEqual(DEFAULT_AVATAR);
  });
});
