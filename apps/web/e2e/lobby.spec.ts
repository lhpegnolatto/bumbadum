import { type Browser, expect, type Page, test } from "@playwright/test";

async function joinLobby(browser: Browser, nickname: string): Promise<Page> {
  const context = await browser.newContext({ locale: "en-US" });
  const page = await context.newPage();
  await page.goto("/");
  await page.getByLabel("Nickname").fill(nickname);
  await page.getByRole("button", { name: "Join" }).click();
  await expect(page).toHaveURL("/r/lobby");
  await expect(page.getByRole("img", { name: "The room" })).toBeVisible();
  return page;
}

/** Where `page`'s canvas draws the player called `nickname`. */
function drawnPlayer(page: Page, nickname: string) {
  return page.evaluate(
    (name) => window.bumbadumE2E?.drawnPlayers().find((player) => player.nickname === name),
    nickname,
  );
}

test("two players in the lobby see each other", async ({ browser }) => {
  const ana = await joinLobby(browser, "Ana");
  const bia = await joinLobby(browser, "Bia");

  await expect(ana.getByRole("listitem")).toHaveText(["Ana (you)", "Bia"]);
  await expect(bia.getByRole("listitem")).toHaveText(["Ana", "Bia (you)"]);
  await Promise.all([ana.context().close(), bia.context().close()]);
});

test("one player walks and the other sees it", async ({ browser }) => {
  const cris = await joinLobby(browser, "Cris");
  const duda = await joinLobby(browser, "Duda");
  await expect.poll(() => drawnPlayer(duda, "Cris")).toBeDefined();
  const start = await drawnPlayer(cris, "Cris");
  if (!start) throw new Error("Cris's canvas does not draw her");

  await cris.keyboard.press("ArrowLeft");
  await expect.poll(() => drawnPlayer(cris, "Cris")).toMatchObject({ x: start.x - 1 });
  await cris.keyboard.press("KeyA");

  const walked = { x: start.x - 2, y: start.y, direction: "left" };
  await expect.poll(() => drawnPlayer(cris, "Cris")).toMatchObject(walked);
  await expect.poll(() => drawnPlayer(duda, "Cris")).toMatchObject(walked);
  await Promise.all([cris.context().close(), duda.context().close()]);
});
