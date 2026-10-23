import { drawnPlayer, expect, test } from "./join-lobby.ts";

test("the wardrobe keeps drafts private and publishes only an applied skin tone", async ({
  joinLobby,
}) => {
  const iris = await joinLobby("Iris");
  const joca = await joinLobby("Joca");
  await expect.poll(() => drawnPlayer(joca, "Iris")).toBeDefined();
  const start = await drawnPlayer(iris, "Iris");
  if (!start) throw new Error("Iris's canvas does not draw her");
  const skinTone = (start.avatar.skinTone % 4) + 1;

  await iris.keyboard.press("KeyC");
  const wardrobe = iris.getByRole("dialog", { name: "Wardrobe" });
  await expect(wardrobe).toBeVisible();
  await expect(wardrobe.getByRole("radio")).toHaveCount(4);
  await expect(wardrobe.getByText("Hair", { exact: true })).toBeVisible();
  await expect(wardrobe.getByText("Outfit", { exact: true })).toBeVisible();
  await expect(wardrobe.getByText("Accessories", { exact: true })).toBeVisible();
  await expect(wardrobe.getByText("Coming soon")).toHaveCount(3);
  await iris.keyboard.press("ArrowLeft");
  await iris.getByRole("radio", { name: `Skin tone ${skinTone}` }).check({ force: true });

  // Only Iris previews it, and she has not moved while the wardrobe is open.
  expect(await drawnPlayer(joca, "Iris")).toMatchObject({ avatar: start.avatar });
  expect(await drawnPlayer(iris, "Iris")).toMatchObject({ x: start.x, y: start.y });

  await wardrobe.getByRole("button", { name: "Apply" }).click();
  await expect(wardrobe).toBeHidden();
  const worn = { skinTone };
  await expect.poll(async () => (await drawnPlayer(joca, "Iris"))?.avatar).toEqual(worn);
  await expect.poll(async () => (await drawnPlayer(iris, "Iris"))?.avatar).toEqual(worn);
  const stored = await iris.evaluate(() => localStorage.getItem("bumbadum:settings:v1"));
  expect(JSON.parse(stored ?? "{}").avatar).toEqual(worn);

  const cancelledTone = (skinTone % 4) + 1;
  await iris.getByRole("button", { name: "Wardrobe" }).click();
  await expect(wardrobe).toBeVisible();
  await iris.getByRole("radio", { name: `Skin tone ${cancelledTone}` }).check({ force: true });
  await wardrobe.getByRole("button", { name: "Close the wardrobe" }).click();
  await expect(wardrobe).toBeHidden();
  await expect.poll(async () => (await drawnPlayer(joca, "Iris"))?.avatar).toEqual(worn);
  expect(
    JSON.parse((await iris.evaluate(() => localStorage.getItem("bumbadum:settings:v1"))) ?? "{}")
      .avatar,
  ).toEqual(worn);

  // Escape also cancels, and the directional keys walk again once it is closed.
  await iris.getByRole("button", { name: "Wardrobe" }).click();
  await iris.getByRole("radio", { name: `Skin tone ${cancelledTone}` }).check({ force: true });
  await iris.keyboard.press("Escape");
  await expect(wardrobe).toBeHidden();
  await expect.poll(async () => (await drawnPlayer(joca, "Iris"))?.avatar).toEqual(worn);
  await iris.keyboard.press("ArrowLeft");
  await expect.poll(() => drawnPlayer(iris, "Iris")).toMatchObject({ x: start.x - 1 });
});
