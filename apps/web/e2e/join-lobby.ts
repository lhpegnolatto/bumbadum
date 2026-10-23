import { type BrowserContext, test as base, expect, type Page } from "@playwright/test";

/** How long a page gets to leave the lobby before its browser is closed anyway. */
const LEAVE_TIMEOUT_MS = 5000;

/**
 * `joinLobby(nickname)` opens a fresh English browser and joins the lobby.
 * Every spec shares one server, so specs use their own nicknames and must not
 * expect the lobby to be empty. After the test each page leaves the lobby
 * before its browser closes, freeing its seat at once: a browser that just
 * closed would hold it for the whole reconnection window.
 */
export const test = base.extend<{ joinLobby: (nickname: string) => Promise<Page> }>({
  joinLobby: async ({ browser }, use) => {
    const contexts: BrowserContext[] = [];
    const pages: Page[] = [];
    await use(async (nickname) => {
      const context = await browser.newContext({ locale: "en-US" });
      contexts.push(context);
      const page = await context.newPage();
      pages.push(page);
      await page.goto("/");
      await page.getByLabel("Nickname").fill(nickname);
      await page.getByRole("button", { name: "Join" }).click();
      await expect(page).toHaveURL("/r/lobby");
      await expect(page.getByRole("img", { name: "The room" })).toBeVisible();
      return page;
    });
    await Promise.all(pages.map(leaveLobby));
    await Promise.all(contexts.map((context) => context.close()));
  },
});

/** Leaves the lobby through the page's e2e hook; a page that cannot is closed anyway. */
async function leaveLobby(page: Page) {
  await page
    .evaluate(
      (timeoutMs) =>
        Promise.race([
          window.bumbadumE2E?.leave?.(),
          new Promise((resolve) => setTimeout(resolve, timeoutMs)),
        ]),
      LEAVE_TIMEOUT_MS,
    )
    .catch(() => {});
}

/** Where `page`'s canvas draws the player called `nickname`. */
export function drawnPlayer(page: Page, nickname: string) {
  return page.evaluate(
    (name) => window.bumbadumE2E?.drawnPlayers?.().find((player) => player.nickname === name),
    nickname,
  );
}

export { expect };
