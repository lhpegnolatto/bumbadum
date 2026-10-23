import { describe, expect, it } from "vitest";
import { parseJoinOptions, parseNickname } from "../index.ts";

describe("parseNickname", () => {
  it("trims surrounding whitespace", () => {
    expect(parseNickname("  Luiz  ")).toBe("Luiz");
  });

  it("accepts 1 and 16 characters", () => {
    expect(parseNickname("a")).toBe("a");
    expect(parseNickname("abcdefghijklmnop")).toBe("abcdefghijklmnop");
  });

  it("rejects an empty or blank nickname", () => {
    expect(parseNickname("")).toBeUndefined();
    expect(parseNickname("    ")).toBeUndefined();
  });

  it("rejects more than 16 characters after trimming", () => {
    expect(parseNickname(" abcdefghijklmnop ")).toBe("abcdefghijklmnop");
    expect(parseNickname("abcdefghijklmnopq")).toBeUndefined();
  });

  it("rejects control characters", () => {
    expect(parseNickname("a\nb")).toBeUndefined();
  });

  it("rejects non-strings", () => {
    expect(parseNickname(42)).toBeUndefined();
  });
});

describe("parseJoinOptions", () => {
  it("returns the slug and trimmed nickname", () => {
    expect(parseJoinOptions({ slug: "lobby", nickname: " Ana " })).toEqual({
      slug: "lobby",
      nickname: "Ana",
    });
  });

  it("rejects options without a valid nickname", () => {
    expect(parseJoinOptions({ slug: "lobby", nickname: "" })).toBeUndefined();
    expect(parseJoinOptions({ slug: "lobby" })).toBeUndefined();
    expect(parseJoinOptions(undefined)).toBeUndefined();
  });
});
