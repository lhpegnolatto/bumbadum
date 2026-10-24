import { drawnPlayer, expect, test } from "./join-lobby.ts";
import { freshVideoId, say, screenVideoId } from "./radio-helpers.ts";

/** Where the web app keeps a player's settings (`apps/web/src/lib/local-settings.ts`). */
const SETTINGS_KEY = "bumbadum:settings:v1";

test("two players in the lobby see each other", async ({ joinLobby }) => {
  const ana = await joinLobby("Ana");
  const viewport = ana.viewportSize();
  if (!viewport) throw new Error("Ana's page has no viewport");
  const room = await ana.getByRole("img", { name: "The room" }).boundingBox();
  if (!room) throw new Error("Ana's room has no visible bounds");
  expect(room).toEqual({ x: 0, y: 0, width: viewport.width, height: viewport.height });

  const screen = await ana.getByRole("region", { name: "Screen" }).boundingBox();
  if (!screen) throw new Error("Ana's screen has no visible bounds");
  expect(screen.width).toBeCloseTo(viewport.width * 0.32, 0);
  expect(screen.height).toBeCloseTo(screen.width * (9 / 16), 0);
  expect(screen.x + screen.width).toBe(viewport.width - 24);
  expect(screen.y).toBe(24);

  const bia = await joinLobby("Bia");
  await ana.getByRole("button", { name: "Players", exact: true }).click();
  await bia.getByRole("button", { name: "Players", exact: true }).click();
  await expect(ana.getByRole("listitem")).toContainText(["Ana (you)", "Bia"]);
  expect(await ana.getByRole("img", { name: "The room" }).boundingBox()).toEqual(room);
  await expect(bia.getByRole("listitem")).toContainText(["Ana", "Bia (you)"]);
});

test("a viewport too narrow for the Screen keeps the joined room alive, its Screen paused, until it widens", async ({
  joinLobby,
}) => {
  const gui = await joinLobby("Gui");
  const hugo = await joinLobby("Hugo");
  const players = gui.getByRole("button", { name: "Players", exact: true });
  await players.click();
  await expect(gui.getByRole("listitem")).toContainText(["Gui (you)", "Hugo"]);
  await say(gui, `/play ${freshVideoId()}`);
  await expect.poll(() => screenVideoId(gui)).toBeDefined();

  const compatibilityNotice = gui.getByRole("alert").filter({
    hasText: "Make the window at least 360 pixels wide to return to the room.",
  });
  await gui.setViewportSize({ width: 359, height: 720 });
  await expect(compatibilityNotice).toBeVisible();
  await expect(gui.getByRole("img", { name: "The room" })).toBeHidden();
  await expect.poll(() => screenVideoId(gui)).toBeUndefined();

  await hugo.getByRole("button", { name: "Players", exact: true }).click();
  await expect(hugo.getByRole("listitem")).toContainText(["Gui", "Hugo (you)"]);

  await gui.setViewportSize({ width: 1024, height: 640 });
  await expect(compatibilityNotice).toBeHidden();
  await expect(gui.getByRole("img", { name: "The room" })).toBeVisible();
  await expect(players).toHaveAttribute("aria-expanded", "true");
  await expect(gui.getByRole("listitem")).toContainText(["Gui (you)", "Hugo"]);
  await expect.poll(() => screenVideoId(gui)).toBeDefined();
});

test("one player walks and the other sees it", async ({ joinLobby }) => {
  const cris = await joinLobby("Cris");
  const duda = await joinLobby("Duda");
  await expect.poll(() => drawnPlayer(duda, "Cris")).toBeDefined();
  const start = await drawnPlayer(cris, "Cris");
  if (!start) throw new Error("Cris's canvas does not draw her");

  await cris.keyboard.press("ArrowLeft");
  await expect.poll(() => drawnPlayer(cris, "Cris")).toMatchObject({ x: start.x - 1 });
  await cris.keyboard.press("KeyA");

  const walked = { x: start.x - 2, y: start.y, direction: "left" };
  await expect.poll(() => drawnPlayer(cris, "Cris")).toMatchObject(walked);
  await expect.poll(() => drawnPlayer(duda, "Cris")).toMatchObject(walked);
});

test("a shared link opened without a click asks for one before joining, so the screen may play", async ({
  browser,
}) => {
  // A browser that saved a nickname earlier but has not activated this page yet.
  const context = await browser.newContext({ locale: "en-US" });
  await context.addInitScript(() => {
    Object.defineProperty(navigator, "userActivation", {
      configurable: true,
      value: { hasBeenActive: false, isActive: false },
    });
  });
  await context.addInitScript(([key, settings]) => window.localStorage.setItem(key, settings), [
    SETTINGS_KEY,
    JSON.stringify({ nickname: "Elis" }),
  ] as const);
  const elis = await context.newPage();

  await elis.goto("/r/lobby");

  await expect(elis.getByText("Ready to join the room as Elis?")).toBeVisible();
  await expect(elis.getByRole("img", { name: "The room" })).toBeHidden();
  await elis.getByRole("button", { name: "Join" }).click();
  await expect(elis.getByRole("img", { name: "The room" })).toBeVisible();
  await elis.evaluate(() => window.bumbadumE2E?.leave?.());
  await context.close();
});

test("after the volume controls are used with the mouse, the room's keys work again", async ({
  joinLobby,
}) => {
  const fabi = await joinLobby("Fabi");
  await expect.poll(() => drawnPlayer(fabi, "Fabi")).toBeDefined();
  const start = await drawnPlayer(fabi, "Fabi");
  if (!start) throw new Error("Fabi's canvas does not draw her");

  await fabi.getByRole("group", { name: "Volume" }).click();
  await expect.poll(() => fabi.evaluate(() => document.activeElement?.tagName)).toBe("BODY");
  await fabi.keyboard.press("KeyA");
  await expect.poll(() => drawnPlayer(fabi, "Fabi")).toMatchObject({ x: start.x - 1 });

  await fabi.getByRole("button", { name: "Mute" }).click();
  await fabi.keyboard.press("Enter");
  await expect(fabi.getByRole("combobox", { name: "Message" })).toBeFocused();
});
