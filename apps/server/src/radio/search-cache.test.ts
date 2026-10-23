import { describe, expect, it } from "vitest";
import { SearchCache } from "./search-cache.ts";

const found = (videoId: string) => ({ kind: "found", videoId }) as const;

describe("SearchCache", () => {
  it("keeps answers until it is full, then forgets the least recently used first", () => {
    const cache = new SearchCache(2);
    cache.set("one", found("aaaaaaaaaaa"));
    cache.set("two", { kind: "nothing-found" });
    expect(cache.get("one")).toEqual(found("aaaaaaaaaaa"));

    cache.set("three", found("ccccccccccc"));

    expect(cache.get("two")).toBeUndefined();
    expect(cache.get("one")).toEqual(found("aaaaaaaaaaa"));
    expect(cache.get("three")).toEqual(found("ccccccccccc"));
  });
});
