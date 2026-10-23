import type { Page } from "@playwright/test";

/**
 * A video ID no other run has used, so the radio never refuses it as already
 * queued. The e2e server's fake catalog answers any ID with a 3-minute track.
 */
export function freshVideoId(): string {
  return `e2e${randomLetters(8)}`;
}

/** Lowercase letters and digits, as many as asked for. */
export function randomLetters(length: number): string {
  return Math.random()
    .toString(36)
    .slice(2, 2 + length)
    .padEnd(length, "0");
}

/** Types `text` into `page`'s chat and sends it. */
export async function say(page: Page, text: string) {
  const chatInput = page.getByLabel("Message");
  await chatInput.fill(text);
  await chatInput.press("Enter");
}

/** The video `page`'s screen plays, if any. */
export function screenVideoId(page: Page) {
  return page.evaluate(() => window.bumbadumE2E?.screen?.()?.videoId);
}
