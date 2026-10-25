import { drawnPlayer, expect, test } from "./join-lobby.ts";

test("players see each other dance, and walking or trying on clothes ends the dance", async ({
  joinLobby,
}) => {
  const iris = await joinLobby("Iris");
  const joca = await joinLobby("Joca");
  const danceOfIris = async () => (await drawnPlayer(joca, "Iris"))?.dance;
  await expect.poll(danceOfIris).toBe(null);
  const danceButton = iris.getByRole("button", { name: "Dance", exact: true });

  await iris.getByRole("img", { name: "The room" }).click({ position: { x: 10, y: 10 } });
  await iris.keyboard.press("f");
  await expect.poll(danceOfIris).toBe("side-step");
  await expect(danceButton).toHaveAttribute("aria-pressed", "true");

  await iris.keyboard.press("ArrowLeft");
  await expect.poll(danceOfIris).toBe(null);
  await expect(danceButton).toHaveAttribute("aria-pressed", "false");

  // The button, as on a phone, starts it again; opening the Wardrobe ends it.
  await danceButton.click();
  await expect.poll(danceOfIris).toBe("side-step");
  await iris.getByRole("button", { name: "Wardrobe", exact: true }).click();
  await expect.poll(danceOfIris).toBe(null);
  await iris.keyboard.press("Escape");

  // The command works too, in any language, with or without the cedilla.
  const message = iris.getByLabel("Message");
  await message.fill("/dancar");
  await message.press("Enter");
  await expect.poll(danceOfIris).toBe("side-step");
});
