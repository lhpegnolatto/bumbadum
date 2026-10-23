import { type BrowserContext, test as base, expect, type Page } from "@playwright/test";

/**
 * `joinLobby(nickname)` opens a fresh English browser and joins the lobby.
 * Every spec shares one server, and a closed browser keeps its seat for the
 * reconnection window, so specs use their own nicknames and must not expect
 * the lobby to be empty.
 */
export const test = base.extend<{ joinLobby: (nickname: string) => Promise<Page> }>({
  joinLobby: async ({ browser }, use) => {
    const contexts: BrowserContext[] = [];
    await use(async (nickname) => {
      const context = await browser.newContext({ locale: "en-US" });
      contexts.push(context);
      const page = await context.newPage();
      await page.goto("/");
      await page.getByLabel("Nickname").fill(nickname);
      await page.getByRole("button", { name: "Join" }).click();
      await expect(page).toHaveURL("/r/lobby");
      await expect(page.getByRole("img", { name: "The room" })).toBeVisible();
      return page;
    });
    await Promise.all(contexts.map((context) => context.close()));
  },
});

/** Where `page`'s canvas draws the player called `nickname`. */
export function drawnPlayer(page: Page, nickname: string) {
  return page.evaluate(
    (name) => window.bumbadumE2E?.drawnPlayers?.().find((player) => player.nickname === name),
    nickname,
  );
}

export { expect };
