import type { Locator } from "@playwright/test";
import { drawnPlayer, expect, test } from "./join-lobby.ts";
import { say } from "./radio-helpers.ts";

test("the Chat button opens a sheet with Chat, Queue and Players tabs, and X closes it", async ({
  joinLobby,
}) => {
  // A high-ratio phone page on software WebGL runs close to the default timeout.
  test.slow();
  const page = await joinLobby("Tito");
  await expect.poll(() => drawnPlayer(page, "Tito")).toBeDefined();
  const start = await drawnPlayer(page, "Tito");
  const viewport = page.viewportSize();
  if (!start || !viewport) throw new Error("Tito's page has no player or no viewport");
  const input = page.getByLabel("Message");
  const chatButton = page.getByRole("button", { name: "Chat", exact: true });
  const floatingControls = [
    chatButton,
    page.getByRole("button", { name: "Wardrobe" }),
    page.getByRole("button", { name: "Settings" }),
    page.getByRole("application", { name: "Movement stick" }),
  ];
  await expect(input).toBeHidden();

  await chatButton.tap();
  const sheet = page.getByRole("region", { name: "Chat" });
  await expect(sheet).toBeVisible();
  await expect(page.getByRole("tab", { name: "Chat" })).toHaveAttribute("aria-selected", "true");
  for (const control of floatingControls) await expect(control).toBeHidden();

  // Below the Radio strip, across the width and down to the bottom edge.
  const strip = await boundsOf(page.getByRole("region", { name: "Screen" }).locator(".."));
  const sheetBounds = await boundsOf(sheet);
  expect(sheetBounds.y).toBeGreaterThanOrEqual(Math.floor(strip.y + strip.height));
  expect(sheetBounds.x).toBe(0);
  expect(sheetBounds.width).toBe(viewport.width);
  expect(sheetBounds.y + sheetBounds.height).toBeCloseTo(viewport.height, 0);

  // The Message input sits at the bottom of the Chat tab, waiting for a tap.
  await expect(input).toBeVisible();
  await expect(input).not.toBeFocused();
  const inputBounds = await boundsOf(input);
  expect(inputBounds.y).toBeGreaterThan(sheetBounds.y + sheetBounds.height / 2);
  expect(inputBounds.y + inputBounds.height).toBeLessThanOrEqual(viewport.height);

  // The sheet covers the world, so the walking keys do nothing.
  await page.keyboard.press("ArrowLeft");

  await page.getByRole("tab", { name: "Queue" }).tap();
  await expect(page.getByRole("tab", { name: "Queue" })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("heading", { name: /Up next/ })).toBeVisible();
  await expect(input).toBeHidden();

  await page.getByRole("tab", { name: "Players" }).tap();
  await expect(page.getByRole("heading", { name: /In the room/ })).toBeVisible();
  await expect(page.getByRole("region", { name: "Players" })).toContainText("Tito (you)");

  await page.getByRole("tab", { name: "Chat" }).tap();
  await input.tap();
  await input.fill("hello from a phone");
  await input.press("Enter");
  await expect(page.getByRole("log", { name: "Chat" })).toContainText("Tito: hello from a phone");
  expect(await drawnPlayer(page, "Tito")).toMatchObject({ x: start.x, y: start.y });

  await page.getByRole("button", { name: "Close Chat" }).tap();
  await expect(sheet).toBeHidden();
  await expect(input).toBeHidden();
  for (const control of floatingControls) await expect(control).toBeVisible();
});

test("a Message from someone else marks the closed Chat until the Chat tab opens", async ({
  joinLobby,
}) => {
  const phone = await joinLobby("Vivi");
  const friend = await joinLobby("Wes", { desktop: true });
  const chatButton = phone.getByRole("button", { name: "Chat", exact: true });
  const unread = phone.getByRole("status", { name: "New message" });

  await say(friend, "anyone on a phone?");
  await expect(chatButton.getByRole("status", { name: "New message" })).toBeVisible();

  await chatButton.tap();
  await expect(unread).toBeHidden();
  await expect(phone.getByRole("log", { name: "Chat" })).toContainText("Wes: anyone on a phone?");
  await expect(phone.getByLabel("Message")).not.toBeFocused();

  // On another tab, the Chat tab carries the mark.
  const chatTab = phone.getByRole("tab", { name: "Chat" });
  await phone.getByRole("tab", { name: "Queue" }).tap();
  await say(friend, "still there?");
  await expect(chatTab.getByRole("status", { name: "New message" })).toBeVisible();
  await chatTab.tap();
  await expect(unread).toBeHidden();
  await expect(phone.getByRole("log", { name: "Chat" })).toContainText("Wes: still there?");
});

async function boundsOf(locator: Locator) {
  const bounds = await locator.boundingBox();
  if (!bounds) throw new Error(`${locator} has no visible bounds`);
  return bounds;
}
