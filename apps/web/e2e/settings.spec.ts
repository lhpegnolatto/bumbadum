import { expect, test } from "./join-lobby.ts";

test("room settings stay available and persist language and theme without owning volume", async ({
  joinLobby,
}) => {
  const page = await joinLobby("Gael");
  const settings = page.getByRole("button", { name: "Settings" });

  await expect(settings).toBeVisible();
  await page.getByRole("button", { name: "Chat", exact: true }).click();
  await expect(settings).toBeVisible();

  await settings.click();
  await expect(page.getByRole("region", { name: "Settings" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Chat" })).toBeHidden();
  await expect(page.getByRole("region", { name: "Settings" }).getByText("Volume")).toBeHidden();

  await page.getByRole("button", { name: "Use dark mode" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.getByRole("button", { name: "Português (Brasil)" }).click();
  await expect(page.getByRole("button", { name: "Configurações" })).toBeVisible();

  await page.reload();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await expect(page.getByRole("button", { name: "Configurações" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Configurações" })).toBeHidden();
});
