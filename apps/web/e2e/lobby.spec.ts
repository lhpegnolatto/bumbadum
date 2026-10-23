import { drawnPlayer, expect, test } from "./join-lobby.ts";

/** Where the web app keeps a player's settings (`apps/web/src/lib/local-settings.ts`). */
const SETTINGS_KEY = "bumbadum:settings:v1";

test("two players in the lobby see each other", async ({ joinLobby }) => {
  const ana = await joinLobby("Ana");
  const bia = await joinLobby("Bia");

  await expect(ana.getByRole("listitem")).toContainText(["Ana (you)", "Bia"]);
  await expect(bia.getByRole("listitem")).toContainText(["Ana", "Bia (you)"]);
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
