import { DEFAULT_AVATAR } from "@bumbadum/avatar";
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
  const avatar = { ...DEFAULT_AVATAR, skinTone: 2 };

  it("returns the slug, trimmed nickname and avatar", () => {
    expect(parseJoinOptions({ slug: "lobby", nickname: " Ana ", avatar })).toEqual({
      ok: true,
      options: { slug: "lobby", nickname: "Ana", avatar },
    });
  });

  it("rejects options without a valid nickname with invalid-nickname", () => {
    const invalid = { ok: false, rejection: "invalid-nickname" };
    expect(parseJoinOptions({ slug: "lobby", nickname: "", avatar })).toEqual(invalid);
    expect(parseJoinOptions({ slug: "lobby", avatar })).toEqual(invalid);
    expect(parseJoinOptions(undefined)).toEqual(invalid);
  });

  it("rejects options without a valid avatar with invalid-avatar", () => {
    const invalid = { ok: false, rejection: "invalid-avatar" };
    expect(parseJoinOptions({ slug: "lobby", nickname: "Ana" })).toEqual(invalid);
    expect(parseJoinOptions({ slug: "lobby", nickname: "Ana", avatar: { skinTone: 5 } })).toEqual(
      invalid,
    );
    expect(parseJoinOptions({ slug: "lobby", nickname: "Ana", avatar: { hair: 1 } })).toEqual(
      invalid,
    );
  });

  it("rejects a slug that is too long or not kebab-case with invalid-room", () => {
    const invalid = { ok: false, rejection: "invalid-room" };
    const nickname = "Ana";
    expect(parseJoinOptions({ slug: "a".repeat(65), nickname, avatar })).toEqual(invalid);
    expect(parseJoinOptions({ slug: "Lobby Room", nickname, avatar })).toEqual(invalid);
    expect(parseJoinOptions({ slug: "", nickname, avatar })).toEqual(invalid);
    expect(parseJoinOptions({ slug: "a".repeat(64), nickname, avatar }).ok).toBe(true);
  });

  it("keeps only the avatar's current appearance fields", () => {
    const result = parseJoinOptions({
      slug: "lobby",
      nickname: "Ana",
      avatar: { ...avatar, obsolete: true },
    });
    expect(result.ok && result.options.avatar).toEqual(avatar);
  });
});
