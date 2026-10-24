import type { Page } from "@playwright/test";
import { drawnPlayer, expect, test } from "./join-lobby.ts";
import { freshVideoId, say } from "./radio-helpers.ts";

/** YouTube's minimum player height (ADR-0006). */
const MIN_SCREEN_HEIGHT = 200;

test("a phone shows the world across the viewport, the Screen on top and the player below it", async ({
  joinLobby,
}) => {
  const page = await joinLobby("Pia");
  const viewport = page.viewportSize();
  if (!viewport) throw new Error("Pia's page has no viewport");
  const meta = await page.locator('meta[name="viewport"]').getAttribute("content");
  expect(meta).toContain("viewport-fit=cover");
  expect(meta).toContain("interactive-widget=resizes-content");

  const room = await boundsOf(page.getByRole("img", { name: "The room" }));
  expect(room).toEqual({ x: 0, y: 0, width: viewport.width, height: viewport.height });

  const screen = await boundsOf(screenOf(page));
  expect(screen.x).toBe(0);
  expect(screen.y).toBe(0);
  expect(screen.width).toBe(viewport.width);
  expect(screen.height).toBeCloseTo((viewport.width * 9) / 16, 0);
  await expectNothingOver(page, screen);

  // The Radio strip sits right below the Screen, and the camera frames Pia below both.
  const topInset = await screenAndStripBottom(page);
  const mute = await boundsOf(page.getByRole("button", { name: "Mute" }));
  expect(mute.y).toBeGreaterThanOrEqual(screen.y + screen.height);
  expect(mute.y + mute.height).toBeLessThanOrEqual(topInset);
  await expect
    .poll(async () => (await drawnPlayer(page, "Pia"))?.canvasPosition.y)
    .toBeGreaterThan(topInset);
  const pia = await drawnPlayer(page, "Pia");
  if (!pia) throw new Error("Pia's canvas does not draw her");
  // Centred in the visible area beneath the strip, give or take the rounding of half a tile.
  expect(Math.abs(pia.canvasPosition.y - (topInset + viewport.height) / 2)).toBeLessThan(40);
  expect(Math.abs(pia.canvasPosition.x - viewport.width / 2)).toBeLessThan(40);
});

test("at 360 px wide the Screen stays 200 px tall and the room controls overlap nothing", async ({
  joinLobby,
}) => {
  const page = await joinLobby("Quim");
  await page.setViewportSize({ width: 360, height: 740 });

  const screen = await boundsOf(screenOf(page));
  expect(screen.width).toBe(360);
  expect(screen.height).toBeGreaterThanOrEqual(MIN_SCREEN_HEIGHT);
  await expectNothingOver(page, screen);

  const topInset = await screenAndStripBottom(page);
  const controls = await Promise.all(
    [
      page.getByRole("button", { name: "Wardrobe" }),
      page.getByRole("button", { name: "Settings" }),
      page.getByRole("button", { name: "Chat", exact: true }),
      page.getByRole("application", { name: "Movement stick" }),
    ].map(boundsOf),
  );
  for (const [index, control] of controls.entries()) {
    expect(control.y, `control ${index} sits under the Screen`).toBeGreaterThanOrEqual(topInset);
    expect(control.x).toBeGreaterThanOrEqual(0);
    expect(control.x + control.width).toBeLessThanOrEqual(360);
    expect(control.y + control.height).toBeLessThanOrEqual(740);
    for (const other of controls.slice(index + 1)) {
      expect(overlap(control, other), `control ${index} overlaps another`).toBe(false);
    }
  }

  // The Chat sheet sits under the strip and leaves the Screen alone.
  await page.getByRole("button", { name: "Chat", exact: true }).tap();
  const sheet = await boundsOf(page.getByRole("region", { name: "Chat" }));
  expect(sheet.y).toBeGreaterThanOrEqual(topInset);
  await expect(page.getByRole("application", { name: "Movement stick" })).toBeHidden();
  await expectNothingOver(page, screen);
});

test("turning a phone sideways covers the room with a notice that keeps it connected and pauses the Screen", async ({
  joinLobby,
}) => {
  const rui = await joinLobby("Rui");
  const viewport = rui.viewportSize();
  if (!viewport) throw new Error("Rui's page has no viewport");
  // A phone has a Message input only in the Chat sheet.
  await rui.getByRole("button", { name: "Chat", exact: true }).tap();
  await say(rui, `/play ${freshVideoId()}`);
  await expect.poll(() => screenReading(rui)).toBeDefined();
  const sessionId = (await drawnPlayer(rui, "Rui"))?.sessionId;
  // A reconnection or a remount would replace the canvas.
  await rui.locator("canvas").evaluate((canvas) => canvas.setAttribute("data-e2e-mounted", ""));

  const rotateNotice = rui.getByRole("alert").filter({
    hasText: "Turn your device upright, or make the window taller, to return to the room.",
  });
  await rui.setViewportSize({ width: viewport.height, height: viewport.width });
  await expect(rotateNotice).toBeVisible();
  await expect(rui.getByRole("img", { name: "The room" })).toBeHidden();
  await expect.poll(() => screenReading(rui)).toBeUndefined();

  await rui.setViewportSize(viewport);
  await expect(rotateNotice).toBeHidden();
  await expect(rui.getByRole("img", { name: "The room" })).toBeVisible();
  await expect(rui.locator("canvas")).toHaveAttribute("data-e2e-mounted");
  expect((await drawnPlayer(rui, "Rui"))?.sessionId).toBe(sessionId);
  // Back on the radio's time.
  await expect
    .poll(async () => {
      const reading = await screenReading(rui);
      return reading && Math.abs(reading.positionMs - reading.expectedMs);
    })
    .toBeLessThan(250);
});

test("holding the analogue stick walks, sliding turns and letting go stops", async ({
  joinLobby,
}) => {
  const page = await joinLobby("Stela");
  await expect.poll(() => drawnPlayer(page, "Stela")).toBeDefined();
  const start = await drawnPlayer(page, "Stela");
  if (!start) throw new Error("Stela's canvas does not draw her");
  const stick = await boundsOf(page.getByRole("application", { name: "Movement stick" }));
  const thumb = await touchscreen(page);
  const centre = { x: stick.x + stick.width / 2, y: stick.y + stick.height / 2 };
  const reach = stick.width * 0.4;

  // A tap past the dead zone takes one Step.
  await thumb.tap(centre.x + reach, centre.y);
  await expect.poll(() => drawnPlayer(page, "Stela")).toMatchObject({ x: start.x + 1 });

  // Holding keeps walking, and sliding the thumb turns without lifting it.
  await thumb.down(centre.x - reach, centre.y);
  await expect
    .poll(async () => (await drawnPlayer(page, "Stela"))?.x)
    .toBeLessThanOrEqual(start.x - 2);
  await thumb.move(centre.x, centre.y - reach);
  await expect
    .poll(async () => (await drawnPlayer(page, "Stela"))?.y)
    .toBeLessThanOrEqual(start.y - 2);
  await thumb.up();
  // A Step already due when the thumb lifts may still land, never one after it.
  await page.waitForTimeout(500);
  const stopped = await drawnPlayer(page, "Stela");
  expect(stopped?.direction).toBe("up");
  // Six Steps a second: a still player for most of a second has stopped walking.
  await page.waitForTimeout(700);
  expect(await drawnPlayer(page, "Stela")).toMatchObject({ x: stopped?.x, y: stopped?.y });

  // The walking keys still work alongside it.
  await page.keyboard.press("ArrowDown");
  await expect.poll(() => drawnPlayer(page, "Stela")).toMatchObject({ y: (stopped?.y ?? 0) + 1 });
});

test("the analogue stick hides while the Wardrobe is open and sits above its button on a tablet", async ({
  joinLobby,
}) => {
  const page = await joinLobby("Tuca");
  const stick = page.getByRole("application", { name: "Movement stick" });
  const wardrobe = page.getByRole("button", { name: "Wardrobe", exact: true });
  await expect(stick).toBeVisible();

  // Its shortcut, since the dev build's badge covers the bottom-left corner.
  await page.keyboard.press("c");
  await expect(wardrobe).toHaveAttribute("aria-expanded", "true");
  await expect(stick).toBeHidden();
  await page.keyboard.press("Escape");
  await expect(stick).toBeVisible();

  // A touch tablet in landscape gets the desktop layout, and still the stick.
  await page.setViewportSize({ width: 1280, height: 800 });
  await expect.poll(async () => (await boundsOf(screenOf(page))).y).toBeGreaterThan(0);
  const stickBounds = await boundsOf(stick);
  const wardrobeBounds = await boundsOf(wardrobe);
  expect(stickBounds.y + stickBounds.height).toBeLessThanOrEqual(wardrobeBounds.y);
  expect(overlap(stickBounds, await boundsOf(page.getByLabel("Message")))).toBe(false);
});

/**
 * A finger on the page's touchscreen, through Chromium's input pipeline, so the browser's own
 * touch handling (panning, zooming, `touch-action`) applies as on a phone.
 */
async function touchscreen(page: Page) {
  const cdp = await page.context().newCDPSession(page);
  const touch = (
    type: "touchStart" | "touchMove" | "touchEnd",
    points: { x: number; y: number }[],
  ) =>
    cdp.send("Input.dispatchTouchEvent", {
      type,
      touchPoints: points.map((point) => ({ ...point, id: 1 })),
    });
  return {
    down: (x: number, y: number) => touch("touchStart", [{ x, y }]),
    move: (x: number, y: number) => touch("touchMove", [{ x, y }]),
    up: () => touch("touchEnd", []),
    // Sent back to back, so a busy machine cannot stretch the tap into a hold.
    tap: (x: number, y: number) =>
      Promise.all([touch("touchStart", [{ x, y }]), touch("touchEnd", [])]),
  };
}

function screenOf(page: Page) {
  return page.getByRole("region", { name: "Screen" });
}

/** Where the Screen and the Radio strip beneath it end: the top of the visible world. */
async function screenAndStripBottom(page: Page): Promise<number> {
  const block = await boundsOf(screenOf(page).locator(".."));
  return block.y + block.height;
}

function screenReading(page: Page) {
  return page.evaluate(() => window.bumbadumE2E?.screen?.());
}

type Bounds = { x: number; y: number; width: number; height: number };

async function boundsOf(locator: ReturnType<Page["locator"]>): Promise<Bounds> {
  const bounds = await locator.boundingBox();
  if (!bounds) throw new Error(`${locator} has no visible bounds`);
  return bounds;
}

/** Every point of the Screen shows the Screen itself, never something drawn over it. */
async function expectNothingOver(page: Page, screen: Bounds) {
  const covered = await page.evaluate(({ x, y, width, height }) => {
    const section = document.querySelector('[aria-label="Screen"]');
    const points: [number, number][] = [];
    for (const fx of [0.02, 0.5, 0.98]) {
      for (const fy of [0.02, 0.5, 0.98]) points.push([x + width * fx, y + height * fy]);
    }
    return points.filter(([px, py]) => !section?.contains(document.elementFromPoint(px, py)));
  }, screen);
  expect(covered).toEqual([]);
}

function overlap(a: Bounds, b: Bounds): boolean {
  return a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
}
