import { centreCard, centredCard } from "./avatar-editor.ts";
import { drawnPlayer, expect, test } from "./join-lobby.ts";

test("the wardrobe is a wide exclusive overlay that leaves the Screen available", async ({
  joinLobby,
}) => {
  const page = await joinLobby("Nara");
  const wardrobeButton = page.getByRole("button", { name: "Wardrobe", exact: true });
  const settingsButton = page.getByRole("button", { name: "Settings" });
  const chatButton = page.getByRole("button", { name: "Chat", exact: true });
  const room = page.getByRole("img", { name: "The room" });
  const screen = page.getByRole("region", { name: "Screen" });
  const wardrobe = page.getByRole("dialog", { name: "Wardrobe" });
  const initialRoomBounds = await room.boundingBox();

  await settingsButton.click();
  await expect(page.getByRole("region", { name: "Settings" })).toBeVisible();
  await wardrobeButton.click();
  await expect(page.getByRole("region", { name: "Settings" })).toBeHidden();
  await expect(wardrobe).toBeVisible();
  await expect(wardrobeButton).toBeVisible();
  await expect(page.getByRole("dialog", { name: "Wardrobe" })).toHaveCount(1);
  await expect(screen).toBeVisible();
  expect(await room.boundingBox()).toEqual(initialRoomBounds);

  const wardrobeBounds = await wardrobe.boundingBox();
  const screenBounds = await screen.boundingBox();
  if (!wardrobeBounds || !screenBounds) throw new Error("Room overlays have no bounds");
  expect(wardrobeBounds.width).toBeGreaterThan(352);
  // At most 34rem wide and as tall as its content, ending well above the Wardrobe button.
  expect(wardrobeBounds.width).toBeLessThanOrEqual(544);
  expect(wardrobeBounds.x + wardrobeBounds.width).toBeLessThanOrEqual(screenBounds.x);
  const buttonBounds = await wardrobeButton.boundingBox();
  if (!buttonBounds) throw new Error("The Wardrobe button has no bounds");
  expect(wardrobeBounds.y + wardrobeBounds.height).toBeLessThan(buttonBounds.y - 32);

  await chatButton.click();
  await expect(wardrobe).toBeHidden();
  await expect(page.getByRole("region", { name: "Chat" })).toBeVisible();

  await page.keyboard.press("KeyC");
  await expect(page.getByRole("region", { name: "Chat" })).toBeHidden();
  await expect(wardrobe).toBeVisible();

  await settingsButton.click();
  await expect(wardrobe).toBeHidden();
  await expect(page.getByRole("region", { name: "Settings" })).toBeVisible();
});

test("the wardrobe keeps layered drafts private and publishes the whole avatar", async ({
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
  await iris.keyboard.press("ArrowLeft");
  // The editor opens on the skin tones, centred on the one worn.
  await expect(centredCard(wardrobe)).toHaveAccessibleName(`Skin tone ${start.avatar.skinTone}`);
  await centreCard(wardrobe, `Skin tone ${skinTone}`);
  await wardrobe.getByRole("tab", { name: "One-piece" }).click();
  await centreCard(wardrobe, "Dress");
  await expect(wardrobe.getByRole("radio", { name: "Dress, Pink" })).toBeVisible();
  await wardrobe.getByRole("tab", { name: "Top" }).click();
  await centreCard(wardrobe, "T-shirt");
  await wardrobe.getByRole("radio", { name: "T-shirt, Black" }).check({ force: true });
  await wardrobe.getByRole("tab", { name: "Headwear" }).click();
  await centreCard(wardrobe, "Cap");

  // The arrows and the arrow keys move the centre, which is what is worn; a tap on a card in view
  // brings it back.
  await wardrobe.getByRole("button", { name: "Next style" }).click();
  await expect(centredCard(wardrobe)).not.toHaveAccessibleName("Cap");
  await wardrobe.getByRole("button", { name: "Previous style" }).click();
  await expect(centredCard(wardrobe)).toHaveAccessibleName("Cap");
  await centredCard(wardrobe).press("ArrowRight");
  await expect(centredCard(wardrobe)).not.toHaveAccessibleName("Cap");
  await wardrobe.getByRole("button", { name: "Cap", exact: true }).click();
  await expect(centredCard(wardrobe)).toHaveAccessibleName("Cap");
  await wardrobe.getByRole("radio", { name: "Cap, Black" }).check({ force: true });

  // Only Iris previews it, and she has not moved while the wardrobe is open.
  expect(await drawnPlayer(joca, "Iris")).toMatchObject({ avatar: start.avatar });
  expect(await drawnPlayer(iris, "Iris")).toMatchObject({ x: start.x, y: start.y });

  await wardrobe.getByRole("button", { name: "Apply" }).click();
  await expect(wardrobe).toBeHidden();
  const worn = {
    ...start.avatar,
    skinTone,
    top: "t-shirt-black",
    overgarment: "dress-black",
    headwear: "cap-black",
  };
  await expect.poll(async () => (await drawnPlayer(joca, "Iris"))?.avatar).toEqual(worn);
  await expect.poll(async () => (await drawnPlayer(iris, "Iris"))?.avatar).toEqual(worn);
  const stored = await iris.evaluate(() => localStorage.getItem("bumbadum:settings:v1"));
  expect(JSON.parse(stored ?? "{}").avatar).toEqual(worn);

  // Cancel, the close button, C and Escape each discard a draft.
  const cancelledTone = (skinTone % 4) + 1;
  const discards = [
    () => wardrobe.getByRole("button", { name: "Cancel" }).click(),
    () => wardrobe.getByRole("button", { name: "Close the wardrobe" }).click(),
    () => iris.keyboard.press("KeyC"),
    () => iris.keyboard.press("Escape"),
  ];
  for (const discard of discards) {
    await iris.getByRole("button", { name: "Wardrobe", exact: true }).click();
    await expect(wardrobe).toBeVisible();
    await expect(centredCard(wardrobe)).toHaveAccessibleName(`Skin tone ${skinTone}`);
    await centreCard(wardrobe, `Skin tone ${cancelledTone}`);
    await discard();
    await expect(wardrobe).toBeHidden();
  }
  await expect.poll(async () => (await drawnPlayer(joca, "Iris"))?.avatar).toEqual(worn);
  expect(
    JSON.parse((await iris.evaluate(() => localStorage.getItem("bumbadum:settings:v1"))) ?? "{}")
      .avatar,
  ).toEqual(worn);

  // The directional keys walk again once it is closed.
  await iris.keyboard.press("ArrowLeft");
  await expect.poll(() => drawnPlayer(iris, "Iris")).toMatchObject({ x: start.x - 1 });
});
