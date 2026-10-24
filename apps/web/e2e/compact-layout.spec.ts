import type { Page } from "@playwright/test";
import { drawnPlayer, expect, test } from "./join-lobby.ts";

test("resizing across the compact layout's boundary keeps the connection, the canvas and the Screen", async ({
  joinLobby,
}) => {
  const page = await joinLobby("Uli");
  await expect.poll(() => drawnPlayer(page, "Uli")).toBeDefined();
  const sessionId = (await drawnPlayer(page, "Uli"))?.sessionId;
  // A mouse walks with the keyboard, even in a window narrow enough for the compact layout.
  await page.setViewportSize({ width: 800, height: 720 });
  await expect.poll(async () => (await screenBounds(page)).y).toBe(0);
  await expect(page.getByRole("application", { name: "Movement stick" })).toBeHidden();
  // The compact layout reaches Players through the Chat sheet's tabs.
  await page.getByRole("button", { name: "Chat", exact: true }).click();
  await page.getByRole("tab", { name: "Players" }).click();
  const players = page.getByRole("button", { name: "Players", exact: true });
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

test("the open panel and the compact sheet's tab are one, across the boundary both ways", async ({
  joinLobby,
}) => {
  const page = await joinLobby("Vera");
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.getByRole("button", { name: "Queue", exact: true }).click();

  await page.setViewportSize({ width: 800, height: 720 });
  await expect(page.getByRole("tab", { name: "Queue" })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("heading", { name: /Up next/ })).toBeVisible();

  await page.setViewportSize({ width: 1280, height: 720 });
  await expect(page.getByRole("button", { name: "Queue", exact: true })).toHaveAttribute(
    "aria-expanded",
    "true",
  );
  await expect(page.getByRole("heading", { name: /Up next/ })).toBeVisible();

  await page.setViewportSize({ width: 800, height: 720 });
  await page.getByRole("tab", { name: "Players" }).click();
  await page.setViewportSize({ width: 1280, height: 720 });
  await expect(page.getByRole("button", { name: "Players", exact: true })).toHaveAttribute(
    "aria-expanded",
    "true",
  );
  await expect(page.getByRole("heading", { name: /In the room/ })).toBeVisible();
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
