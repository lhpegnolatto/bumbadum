import { DEFAULT_AVATAR } from "@bumbadum/avatar";
import { describe, expect, it } from "vitest";
import { avatarFromStateOrDefault, avatarStateValue } from "../index.ts";
import type { AvatarState } from "./avatar-state.ts";

describe("avatarFromStateOrDefault", () => {
  it("falls back to the default avatar for an incomplete old state", () => {
    const oldState = {
      ...avatarStateValue(DEFAULT_AVATAR),
      top: "",
      bottom: "",
    } as AvatarState;

    expect(avatarFromStateOrDefault(oldState)).toEqual(DEFAULT_AVATAR);
  });

  it("repairs an avatar wearing choices this client no longer offers", () => {
    const state = {
      ...avatarStateValue({ ...DEFAULT_AVATAR, skinTone: 2 }),
      hair: "bowl-black",
      bottom: "joggers-black",
    } as AvatarState;

    expect(avatarFromStateOrDefault(state)).toEqual({ ...DEFAULT_AVATAR, skinTone: 2, hair: null });
  });

  it("keeps a valid avatar unchanged", () => {
    const state = avatarStateValue({ ...DEFAULT_AVATAR, skinTone: 4 }) as AvatarState;

    expect(avatarFromStateOrDefault(state)).toEqual({ ...DEFAULT_AVATAR, skinTone: 4 });
  });
});
