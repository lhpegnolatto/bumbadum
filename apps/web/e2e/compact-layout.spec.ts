import type { Page } from "@playwright/test";
import { drawnPlayer, expect, test } from "./join-lobby.ts";

test("resizing across the compact layout's boundary keeps the connection, the canvas and the Screen", async ({
  joinLobby,
}) => {
  const page = await joinLobby("Uli");
  await expect.poll(() => drawnPlayer(page, "Uli")).toBeDefined();
  const sessionId = (await drawnPlayer(page, "Uli"))?.sessionId;
  const players = page.getByRole("button", { name: "Players", exact: true });
  await players.click();
  await markMountedElements(page);

  // Desktop: the Screen sits in the right rail, clear of the top edge; compact puts it at the top.
  await page.setViewportSize({ width: 1280, height: 720 });
  expect((await screenBounds(page)).y).toBeGreaterThan(0);

  // Compact, then desktop again, across each dimension's threshold.
  for (const size of [
    { width: 1023, height: 720 },
    { width: 1024, height: 720 },
    { width: 1280, height: 639 },
    { width: 1280, height: 720 },
  ]) {
    await page.setViewportSize(size);
    const compact = size.width < 1024 || size.height < 640;
    await expect
      .poll(
        async () => (await screenBounds(page)).y === 0,
        `compact at ${size.width}×${size.height}`,
      )
      .toBe(compact);
    await expect(page.getByRole("img", { name: "The room" })).toBeVisible();
    expect(await mountedElementsKept(page)).toBe(true);
  }

  expect((await drawnPlayer(page, "Uli"))?.sessionId).toBe(sessionId);
  await expect(players).toHaveAttribute("aria-expanded", "true");
});

/** The canvas and the Screen's player host: a remount replaces them. */
const MOUNTED = ["canvas", '[aria-label="Screen"] > div'];

function markMountedElements(page: Page) {
  return page.evaluate((selectors) => {
    for (const selector of selectors) {
      document.querySelector(selector)?.setAttribute("data-e2e-mounted", "");
    }
  }, MOUNTED);
}

function mountedElementsKept(page: Page) {
  return page.evaluate(
    (selectors) =>
      selectors.every((selector) =>
        document.querySelector(selector)?.hasAttribute("data-e2e-mounted"),
      ),
    MOUNTED,
  );
}

async function screenBounds(page: Page) {
  const bounds = await page.getByRole("region", { name: "Screen" }).boundingBox();
  if (!bounds) throw new Error("the Screen has no visible bounds");
  return bounds;
}
