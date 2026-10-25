import type { Page } from "@playwright/test";
import { drawnPlayer, expect, leaveLobby, test } from "./join-lobby.ts";

/** The smallest target a fingertip hits reliably, in CSS pixels. */
const MIN_TOUCH_TARGET = 44;

// The narrowest phone bumbadum supports.
test.use({ locale: "en-US", viewport: { width: 360, height: 780 } });

test.afterEach(({ page }) => leaveLobby(page));

test("a player chooses a nickname and an avatar on a phone, then joins", async ({ page }) => {
  await page.goto("/");
  const nickname = page.getByLabel("Nickname");
  await expect(nickname).toBeVisible();
  await expectToFitThePhone(page);

  await nickname.tap();
  await nickname.fill("Teo");

  const currentTone = await page
    .getByRole("radio", { name: /^Skin tone \d$/, checked: true })
    .getAttribute("aria-label");
  const skinTone = (Number(currentTone?.at(-1)) % 4) + 1;
  await choice(page, `Skin tone ${skinTone}`).tap();
  await expect(page.getByRole("radio", { name: `Skin tone ${skinTone}` })).toBeChecked();

  await page.getByRole("tab", { name: "Clothing" }).tap();
  await page.getByRole("tab", { name: "One-piece" }).tap();
  await page.getByRole("button", { name: "Dress", exact: true }).tap();
  await expect(page.getByRole("radio", { name: "Dress, Pink" })).toBeVisible();

  await page.getByRole("tab", { name: "Accessories" }).tap();
  await page.getByRole("tab", { name: "Headwear" }).tap();
  const cap = page.getByRole("button", { name: "Cap", exact: true });
  await cap.tap();
  await expect(cap).toHaveAttribute("aria-pressed", "true");
  await choice(page, "Cap, Black").tap();
  await expect(page.getByRole("radio", { name: "Cap, Black" })).toBeChecked();
  await expectToFitThePhone(page);

  await page.getByRole("button", { name: "Join" }).tap();
  await expect(page).toHaveURL("/r/lobby");
  await expect
    .poll(async () => (await drawnPlayer(page, "Teo"))?.avatar)
    .toMatchObject({ skinTone, headwear: "cap-black" });
});

/** An avatar choice: a radio hidden inside the label the player taps. */
function choice(page: Page, name: string) {
  return page.locator("label").filter({ has: page.getByRole("radio", { name }) });
}

/** The page does not scroll sideways, and every control is big enough for a fingertip. */
async function expectToFitThePhone(page: Page) {
  const { pageWidth, viewportWidth } = await page.evaluate(() => ({
    pageWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth,
  }));
  expect(pageWidth).toBeLessThanOrEqual(viewportWidth);

  const targets = await page.evaluate(() =>
    [...document.querySelectorAll("main button, main input:not([type=radio]), main label")]
      .filter(
        (element) => element.matches("button, input") || element.querySelector("[type=radio]"),
      )
      .map((element) => {
        const { width, height } = element.getBoundingClientRect();
        const name =
          element.getAttribute("aria-label") ??
          element.querySelector("[aria-label]")?.getAttribute("aria-label") ??
          (element.textContent || element.id);
        return { name, width, height };
      }),
  );
  expect(targets.length).toBeGreaterThan(0);
  for (const { name, width, height } of targets) {
    expect.soft(width, `${name} is too narrow to tap`).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
    expect.soft(height, `${name} is too short to tap`).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
  }
}
