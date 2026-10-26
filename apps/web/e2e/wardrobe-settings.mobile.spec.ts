import type { Locator, Page } from "@playwright/test";
import { centreCard, centredCard } from "./avatar-editor.ts";
import { drawnPlayer, expect, test } from "./join-lobby.ts";

test("the Wardrobe opens as a sheet below the Radio strip, keeps its draft private and wears on Apply", async ({
  joinLobby,
}) => {
  const page = await joinLobby("Ondina");
  const friend = await joinLobby("Pedrinho", { desktop: true });
  const viewport = page.viewportSize();
  if (!viewport) throw new Error("Ondina's page has no viewport");
  await expect.poll(() => drawnPlayer(friend, "Ondina")).toBeDefined();
  const start = await drawnPlayer(page, "Ondina");
  if (!start) throw new Error("Ondina's canvas does not draw her");

  const wardrobeButton = page.getByRole("button", { name: "Wardrobe", exact: true });
  const settingsButton = page.getByRole("button", { name: "Settings" });
  const wardrobe = page.getByRole("dialog", { name: "Wardrobe" });

  // Stacked at the bottom left, Wardrobe above Settings, clear of the bottom safe area.
  const wardrobeBounds = await boundsOf(wardrobeButton);
  const settingsBounds = await boundsOf(settingsButton);
  expect(wardrobeBounds.y + wardrobeBounds.height).toBeLessThanOrEqual(settingsBounds.y);
  expect(Math.abs(wardrobeBounds.x - settingsBounds.x)).toBeLessThan(1);
  expect(settingsBounds.y + settingsBounds.height).toBeLessThan(viewport.height);
  expect(wardrobeBounds.x).toBeLessThan(viewport.width / 4);

  await wardrobeButton.tap();
  await expect(wardrobe).toBeVisible();
  // The sheet spans the width from the strip down to the bottom; the floating controls step aside.
  const strip = await screenAndStripBottom(page);
  await expect
    .poll(async () => {
      const sheet = await boundsOf(wardrobe);
      return { x: sheet.x, width: sheet.width, bottom: sheet.y + sheet.height };
    })
    .toEqual({ x: 0, width: viewport.width, bottom: viewport.height });
  // The strip ends on a fraction of a pixel; the sheet starts on the next whole one.
  expect(Math.abs((await boundsOf(wardrobe)).y - strip)).toBeLessThan(1);
  for (const control of [
    wardrobeButton,
    settingsButton,
    page.getByRole("button", { name: "Chat", exact: true }),
    page.getByRole("application", { name: "Movement stick" }),
  ]) {
    await expect(control).toBeHidden();
  }

  // A draft is only Ondina's, and she does not walk while the sheet is open.
  const skinTone = (start.avatar.skinTone % 4) + 1;
  await page.keyboard.press("ArrowLeft");
  await centreCard(wardrobe, `Skin tone ${skinTone}`);
  expect(await drawnPlayer(friend, "Ondina")).toMatchObject({ avatar: start.avatar });
  expect(await drawnPlayer(page, "Ondina")).toMatchObject({ x: start.x, y: start.y });

  // Closing discards the draft.
  await wardrobe.getByRole("button", { name: "Close the wardrobe" }).tap();
  await expect(wardrobe).toBeHidden();
  await expect(wardrobeButton).toBeVisible();
  await wardrobeButton.tap();
  await expect(centredCard(wardrobe)).toHaveAccessibleName(`Skin tone ${start.avatar.skinTone}`);

  // Apply wears it for everyone and closes the sheet.
  await centreCard(wardrobe, `Skin tone ${skinTone}`);
  await wardrobe.getByRole("button", { name: "Apply" }).tap();
  await expect(wardrobe).toBeHidden();
  const worn = { ...start.avatar, skinTone };
  await expect.poll(async () => (await drawnPlayer(friend, "Ondina"))?.avatar).toEqual(worn);
  await expect(page.getByRole("application", { name: "Movement stick" })).toBeVisible();
});

test("Settings fits a 360 px phone and switches theme and language", async ({ joinLobby }) => {
  const page = await joinLobby("Quitéria");
  await page.setViewportSize({ width: 360, height: 740 });
  const strip = await screenAndStripBottom(page);

  await page.getByRole("button", { name: "Settings" }).tap();
  const settings = page.getByRole("region", { name: "Settings" });
  await expect(settings).toBeVisible();
  const bounds = await boundsOf(settings);
  expect(bounds.x).toBeGreaterThanOrEqual(0);
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(360);
  expect(bounds.y).toBeGreaterThanOrEqual(strip);
  expect(bounds.y + bounds.height).toBeLessThanOrEqual(740);

  await settings.getByRole("button", { name: "Use dark mode" }).tap();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await settings.getByRole("button", { name: "Português (Brasil)" }).tap();
  await expect(page.getByRole("button", { name: "Configurações" })).toBeVisible();
  // The icon-only buttons are named in Portuguese too.
  await expect(page.getByRole("button", { name: "Guarda-roupa", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Silenciar" })).toBeVisible();
});

test("a touch screen mutes the radio with a toggle instead of a volume slider, and keeps it", async ({
  joinLobby,
}) => {
  const page = await joinLobby("Rosalvo");
  const mute = page.getByRole("button", { name: "Mute" });
  await expect(mute).toHaveAttribute("aria-pressed", "false");
  await expect(page.getByRole("group", { name: "Volume" })).toBeHidden();
  await expect.poll(() => screenSound(page)).toMatchObject({ muted: false });

  await mute.tap();
  await expect(mute).toHaveAttribute("aria-pressed", "true");
  await expect.poll(() => screenSound(page)).toMatchObject({ muted: true });

  await page.reload();
  await expect(page.getByRole("img", { name: "The room" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Mute" })).toHaveAttribute("aria-pressed", "true");
  await expect.poll(() => screenSound(page)).toMatchObject({ muted: true });

  await page.getByRole("button", { name: "Mute" }).tap();
  await expect.poll(() => screenSound(page)).toMatchObject({ muted: false });
});

function screenSound(page: Page) {
  return page.evaluate(() => window.bumbadumE2E?.screenSound?.());
}

/** Where the Screen and the Radio strip beneath it end. */
async function screenAndStripBottom(page: Page): Promise<number> {
  const block = await boundsOf(page.getByRole("region", { name: "Screen" }).locator(".."));
  return block.y + block.height;
}

async function boundsOf(locator: Locator) {
  const bounds = await locator.boundingBox();
  if (!bounds) throw new Error(`${locator} has no visible bounds`);
  return bounds;
}
