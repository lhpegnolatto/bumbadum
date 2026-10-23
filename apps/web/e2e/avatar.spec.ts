import { drawnPlayer, expect, test } from "./join-lobby.ts";

test("an outfit picked in the wardrobe shows only once worn, for everyone", async ({
  joinLobby,
}) => {
  const iris = await joinLobby("Iris");
  const joca = await joinLobby("Joca");
  await expect.poll(() => drawnPlayer(joca, "Iris")).toBeDefined();
  const start = await drawnPlayer(iris, "Iris");
  if (!start) throw new Error("Iris's canvas does not draw her");
  const outfit = (start.avatar.outfit % 6) + 1;

  await iris.keyboard.press("KeyC");
  const wardrobe = iris.getByRole("dialog", { name: "Wardrobe" });
  await expect(wardrobe).toBeVisible();
  await iris.keyboard.press("ArrowLeft");
  await iris.getByRole("radio", { name: `Outfit ${outfit}` }).check({ force: true });

  // Only Iris previews it, and she has not moved while the wardrobe is open.
  expect(await drawnPlayer(joca, "Iris")).toMatchObject({ avatar: start.avatar });
  expect(await drawnPlayer(iris, "Iris")).toMatchObject({ x: start.x, y: start.y });

  await wardrobe.getByRole("button", { name: "Wear" }).click();
  await expect(wardrobe).toBeHidden();
  const worn = { ...start.avatar, outfit };
  await expect.poll(async () => (await drawnPlayer(joca, "Iris"))?.avatar).toEqual(worn);
  await expect.poll(async () => (await drawnPlayer(iris, "Iris"))?.avatar).toEqual(worn);
  const stored = await iris.evaluate(() => localStorage.getItem("bumbadum:settings:v1"));
  expect(JSON.parse(stored ?? "{}").avatar).toEqual(worn);

  // Esc closes it again; the keys walk once it is closed.
  await iris.getByRole("button", { name: "Wardrobe" }).click();
  await expect(wardrobe).toBeVisible();
  await iris.keyboard.press("Escape");
  await expect(wardrobe).toBeHidden();
  await iris.keyboard.press("ArrowLeft");
  await expect.poll(() => drawnPlayer(iris, "Iris")).toMatchObject({ x: start.x - 1 });
});
