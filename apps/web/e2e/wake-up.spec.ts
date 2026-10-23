import { expect, type Page, test } from "@playwright/test";

/** Makes the server look asleep: its health check never answers. */
async function putServerToSleep(page: Page) {
  await page.route("**/health", (route) => route.abort());
}

async function clickJoin(page: Page, nickname: string) {
  await page.goto("/");
  await page.getByLabel("Nickname").fill(nickname);
  await page.getByRole("button", { name: "Join" }).click();
  await expect(page).toHaveURL("/r/lobby");
}

test.use({ locale: "en-US" });

test("waits on a sleeping server, then joins by itself once it wakes", async ({ page }) => {
  await putServerToSleep(page);
  await clickJoin(page, "Ana");

  await expect(page.getByRole("listitem").filter({ hasText: "Waking the server" })).toHaveAttribute(
    "aria-current",
    "step",
  );
  await expect(page.getByText(/usually takes up to a minute/)).toBeVisible();

  await page.unroute("**/health");
  await expect(page.getByRole("img", { name: "The room" })).toBeVisible();
});

test("offers to try again when the server does not wake in 3 minutes", async ({ page }) => {
  await page.clock.install();
  await putServerToSleep(page);
  await clickJoin(page, "Ana");
  await expect(page.getByText("Waking the server")).toBeVisible();

  await page.clock.fastForward("03:00");
  const tryAgain = page.getByRole("button", { name: "Try again" });
  await expect(tryAgain).toBeVisible();

  await page.unroute("**/health");
  await tryAgain.click();
  await expect(page.getByRole("img", { name: "The room" })).toBeVisible();
});
