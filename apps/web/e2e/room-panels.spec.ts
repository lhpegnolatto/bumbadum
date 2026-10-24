import type { Locator, Page } from "@playwright/test";
import { drawnPlayer, expect, test } from "./join-lobby.ts";

test("room panels are opt-in, exclusive and do not resize the world", async ({ joinLobby }) => {
  const page = await joinLobby("OrielPanels");
  const room = page.getByRole("img", { name: "The room" });
  const screen = page.getByRole("region", { name: "Screen" });
  const initialBounds = await room.boundingBox();

  const chat = page.getByRole("button", { name: "Chat", exact: true });
  const queue = page.getByRole("button", { name: "Queue", exact: true });
  const players = page.getByRole("button", { name: "Players", exact: true });
  await expect(chat).toHaveAttribute("aria-expanded", "false");
  await expect(page.getByRole("log", { name: "Chat" })).toBeHidden();

  await chat.click();
  await expect(chat).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByRole("log", { name: "Chat" })).toBeVisible();
  await expectOverlayLeavesWorldAndScreenStable(
    page,
    page.getByRole("region", { name: "Chat" }),
    initialBounds,
  );

  await queue.click();
  await expect(chat).toHaveAttribute("aria-expanded", "false");
  await expect(queue).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByRole("log", { name: "Chat" })).toBeHidden();
  await expect(page.getByRole("heading", { name: /Up next/ })).toBeVisible();
  await expectOverlayLeavesWorldAndScreenStable(
    page,
    page.getByRole("region", { name: "Queue" }),
    initialBounds,
  );

  await players.click();
  await expect(queue).toHaveAttribute("aria-expanded", "false");
  await expect(players).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByRole("heading", { name: /In the room/ })).toBeVisible();
  await expectOverlayLeavesWorldAndScreenStable(
    page,
    page.getByRole("region", { name: "Players" }),
    initialBounds,
  );
  await expect(screen).toBeVisible();

  await page.getByRole("button", { name: "Close Players" }).click();
  await expect(players).toHaveAttribute("aria-expanded", "false");
  await players.click();
  await page.keyboard.press("Escape");
  await expect(players).toHaveAttribute("aria-expanded", "false");
});

test("walking and clicking the world keep a room panel open", async ({ joinLobby }) => {
  const page = await joinLobby("Mia");
  await expect.poll(() => drawnPlayer(page, "Mia")).toBeDefined();
  const start = await drawnPlayer(page, "Mia");
  if (!start) throw new Error("Mia's canvas does not draw her");

  const players = page.getByRole("button", { name: "Players", exact: true });
  await players.click();
  await page.getByRole("img", { name: "The room" }).click({ position: { x: 10, y: 10 } });
  await page.keyboard.press("ArrowLeft");

  await expect(players).toHaveAttribute("aria-expanded", "true");
  await expect.poll(() => drawnPlayer(page, "Mia")).toMatchObject({ x: start.x - 1 });
});

test("room panel transitions respect reduced motion", async ({ joinLobby }) => {
  const page = await joinLobby("Nia");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.getByRole("button", { name: "Players", exact: true }).click();

  const panel = page.getByRole("region", { name: "Players" });
  await expect(panel).toBeVisible();
  expect(await panel.evaluate((element) => getComputedStyle(element).animationDuration)).toBe("0s");
});

async function expectOverlayLeavesWorldAndScreenStable(
  page: Page,
  overlay: Locator,
  initialWorldBounds: Awaited<ReturnType<Locator["boundingBox"]>>,
) {
  const world = page.getByRole("img", { name: "The room" });
  const screen = page.getByRole("region", { name: "Screen" });
  await expect(overlay).toBeVisible();
  await expect(screen).toBeVisible();
  expect(await world.boundingBox()).toEqual(initialWorldBounds);

  const overlayBounds = await overlay.boundingBox();
  const screenBounds = await screen.boundingBox();
  if (!overlayBounds || !screenBounds) throw new Error("Room overlays have no bounds");
  expect(rectanglesOverlap(overlayBounds, screenBounds)).toBe(false);
}

function rectanglesOverlap(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number },
) {
  return !(
    a.x + a.width <= b.x ||
    b.x + b.width <= a.x ||
    a.y + a.height <= b.y ||
    b.y + b.height <= a.y
  );
}
