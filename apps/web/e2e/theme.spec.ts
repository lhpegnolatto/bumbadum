import { expect, test } from "@playwright/test";

test("follows the system until the player chooses and then keeps and shares that theme", async ({
  context,
  page,
}) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/");

  const toggle = page.getByRole("button", { name: "Use light mode" });
  await expect(page.locator("html")).toHaveClass(/dark/);
  await toggle.click();
  await expect(page.locator("html")).not.toHaveClass(/dark/);

  await page.reload();
  await expect(page.locator("html")).not.toHaveClass(/dark/);

  const otherPage = await context.newPage();
  await otherPage.goto("/");
  await page.getByRole("button", { name: "Use dark mode" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await expect(otherPage.locator("html")).toHaveClass(/dark/);
});
