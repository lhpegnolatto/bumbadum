import { describe, expect, it } from "vitest";
import { clockPingSchema } from "../index.ts";

describe("clockPingSchema", () => {
  it("accepts a send time", () => {
    expect(clockPingSchema.safeParse({ sentAt: 1234.5 }).success).toBe(true);
  });

  it("refuses anything that is not a finite number", () => {
    expect(clockPingSchema.safeParse({ sentAt: "1234" }).success).toBe(false);
    expect(clockPingSchema.safeParse({ sentAt: Number.POSITIVE_INFINITY }).success).toBe(false);
    expect(clockPingSchema.safeParse({}).success).toBe(false);
  });
});
