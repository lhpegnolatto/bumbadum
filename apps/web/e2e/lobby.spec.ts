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

test("two players in the lobby see each other", async ({ browser }) => {
  const ana = await joinLobby(browser, "Ana");
  const bia = await joinLobby(browser, "Bia");

  await expect(ana.getByRole("listitem")).toHaveText(["Ana (you)", "Bia"]);
  await expect(bia.getByRole("listitem")).toHaveText(["Ana", "Bia (you)"]);
});
