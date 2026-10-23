import { drawnPlayer, expect, test } from "./join-lobby.ts";

test("two players in the lobby see each other", async ({ joinLobby }) => {
  const ana = await joinLobby("Ana");
  const bia = await joinLobby("Bia");

  await expect(ana.getByRole("listitem")).toContainText(["Ana (you)", "Bia"]);
  await expect(bia.getByRole("listitem")).toContainText(["Ana", "Bia (you)"]);
});

test("one player walks and the other sees it", async ({ joinLobby }) => {
  const cris = await joinLobby("Cris");
  const duda = await joinLobby("Duda");
  await expect.poll(() => drawnPlayer(duda, "Cris")).toBeDefined();
  const start = await drawnPlayer(cris, "Cris");
  if (!start) throw new Error("Cris's canvas does not draw her");

  await cris.keyboard.press("ArrowLeft");
  await expect.poll(() => drawnPlayer(cris, "Cris")).toMatchObject({ x: start.x - 1 });
  await cris.keyboard.press("KeyA");

  const walked = { x: start.x - 2, y: start.y, direction: "left" };
  await expect.poll(() => drawnPlayer(cris, "Cris")).toMatchObject(walked);
  await expect.poll(() => drawnPlayer(duda, "Cris")).toMatchObject(walked);
});
