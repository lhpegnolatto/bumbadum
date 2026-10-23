import { describe, expect, it } from "vitest";
import { appendToHistory } from "./index.ts";

function historyOf(count: number): number[] {
  let history: number[] = [];
  for (let message = 1; message <= count; message++) {
    history = appendToHistory(history, message);
  }
  return history;
}

describe("appendToHistory", () => {
  it("keeps messages in the order they were sent", () => {
    expect(historyOf(3)).toEqual([1, 2, 3]);
  });

  it("keeps only the last 50 messages", () => {
    const history = historyOf(53);
    expect(history).toHaveLength(50);
    expect(history[0]).toBe(4);
    expect(history.at(-1)).toBe(53);
  });
});
