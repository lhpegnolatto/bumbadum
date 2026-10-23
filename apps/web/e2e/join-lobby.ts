import { type BrowserContext, test as base, expect, type Page } from "@playwright/test";

/** How long a page gets to leave the lobby before its browser is closed anyway. */
const LEAVE_TIMEOUT_MS = 5000;

/** The home page's labels in each browser language a test can join with. */
const HOME_LABELS = {
  en: { browserLocale: "en-US", nickname: "Nickname", join: "Join", room: "The room" },
  "pt-BR": { browserLocale: "pt-BR", nickname: "Apelido", join: "Entrar", room: "A sala" },
} as const;

interface JoinOptions {
  /** The browser's language, which the page picks up: English unless asked. */
  locale?: keyof typeof HOME_LABELS;
}

/**
 * `joinLobby(nickname)` opens a fresh browser, English unless `locale` says
 * otherwise, and joins the lobby. Every spec shares one server, so specs use
 * their own nicknames and must not expect the lobby to be empty. After the
 * test each page leaves the lobby before its browser closes, freeing its seat
 * at once: a browser that just closed would hold it for the whole
 * reconnection window.
 */
export const test = base.extend<{
  joinLobby: (nickname: string, options?: JoinOptions) => Promise<Page>;
}>({
  joinLobby: async ({ browser }, use) => {
    const contexts: BrowserContext[] = [];
    const pages: Page[] = [];
    await use(async (nickname, { locale = "en" } = {}) => {
      const labels = HOME_LABELS[locale];
      const context = await browser.newContext({ locale: labels.browserLocale });
      contexts.push(context);
      const page = await context.newPage();
      pages.push(page);
      await page.goto("/");
      await page.getByLabel(labels.nickname).fill(nickname);
      await page.getByRole("button", { name: labels.join }).click();
      await expect(page).toHaveURL("/r/lobby");
      await expect(page.getByRole("img", { name: labels.room })).toBeVisible();
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
