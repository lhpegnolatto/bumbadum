import { drawnPlayer, expect, test } from "./join-lobby.ts";

test("typing in the chat never moves the player; leaving it with Esc gives the keys back", async ({
  joinLobby,
}) => {
  const hana = await joinLobby("Hana");
  await expect.poll(() => drawnPlayer(hana, "Hana")).toBeDefined();
  const start = await drawnPlayer(hana, "Hana");
  if (!start) throw new Error("Hana's canvas does not draw her");

  await hana.keyboard.press("Enter");
  await hana.keyboard.type("wasd");
  await hana.keyboard.press("ArrowLeft");
  await expect(hana.getByLabel("Message")).toHaveValue("wasd");
  await hana.keyboard.press("Escape");
  expect(await drawnPlayer(hana, "Hana")).toMatchObject({ x: start.x, y: start.y });

  await hana.keyboard.press("ArrowLeft");
  await expect.poll(() => drawnPlayer(hana, "Hana")).toMatchObject({ x: start.x - 1 });
});

test("a message typed in one browser appears in the other's chat history", async ({
  joinLobby,
}) => {
  const cleo = await joinLobby("Cleo");
  const dora = await joinLobby("Dora");
  const chatInput = cleo.getByLabel("Message");

  await expect(cleo.getByRole("log", { name: "Chat" })).toContainText("Dora joined the room.");

  await cleo.keyboard.press("Enter");
  await expect(chatInput).toBeFocused();
  await cleo.keyboard.type("hello from Cleo");
  await cleo.keyboard.press("Enter");

  await expect(dora.getByRole("log", { name: "Chat" })).toContainText("Cleo: hello from Cleo");
  await expect(chatInput).toHaveValue("");

  await cleo.keyboard.press("Escape");
  await expect(chatInput).not.toBeFocused();

  const gabi = await joinLobby("Gabi");
  await expect(gabi.getByRole("log", { name: "Chat" })).toContainText("Cleo: hello from Cleo");
});

test("an unknown command gets a notice in the sender's chat only", async ({ joinLobby }) => {
  const eva = await joinLobby("Eva");
  const fabi = await joinLobby("Fabi");
  const chatInput = eva.getByLabel("Message");

  await chatInput.fill("/fly");
  await chatInput.press("Enter");
  await chatInput.fill("after the command");
  await chatInput.press("Enter");

  await expect(eva.getByRole("log", { name: "Chat" })).toContainText("There is no /fly command.");
  await expect(fabi.getByRole("log", { name: "Chat" })).toContainText("Eva: after the command");
  await expect(fabi.getByRole("log", { name: "Chat" })).not.toContainText("/fly");
});
