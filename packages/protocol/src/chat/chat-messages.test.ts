import { describe, expect, it } from "vitest";
import { chatInputSchema } from "../index.ts";

describe("chatInputSchema", () => {
  it("accepts text up to 200 characters", () => {
    expect(chatInputSchema.safeParse({ text: "a".repeat(200) }).success).toBe(true);
  });

  it("refuses longer text and anything that is not text", () => {
    expect(chatInputSchema.safeParse({ text: "a".repeat(201) }).success).toBe(false);
    expect(chatInputSchema.safeParse({ text: 42 }).success).toBe(false);
    expect(chatInputSchema.safeParse("hello").success).toBe(false);
  });
});
