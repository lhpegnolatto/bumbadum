import { drawnPlayer, expect, test } from "./join-lobby.ts";

test("a player renames from the Wardrobe and everyone sees the new Nickname", async ({
  joinLobby,
}) => {
  const lia = await joinLobby("Lia");
  const nuno = await joinLobby("Nuno");
  const wardrobe = lia.getByRole("button", { name: "Wardrobe", exact: true });
  const nickname = lia.getByLabel("Nickname");
  const apply = lia.getByRole("button", { name: "Apply" });

  // An invalid Nickname keeps Apply disabled, and Cancel discards the draft.
  await wardrobe.click();
  await nickname.fill("   ");
  await expect(apply).toBeDisabled();
  await expect(lia.getByText("Pick a nickname with 1 to 16 characters.")).toBeVisible();
  await lia.getByRole("button", { name: "Cancel" }).click();
  await wardrobe.click();
  await expect(nickname).toHaveValue("Lia");

  await nickname.fill("  Liana ");
  await apply.click();

  await expect.poll(async () => (await drawnPlayer(nuno, "Liana"))?.nickname).toBe("Liana");
  await nuno.getByRole("button", { name: "Players", exact: true }).click();
  await expect(nuno.getByRole("region", { name: "Players" })).toContainText("Liana");
  await nuno.getByRole("button", { name: "Chat", exact: true }).click();
  await expect(nuno.getByRole("log", { name: "Chat" })).toContainText("Lia is now Liana.");

  // The new Nickname is remembered and signs the next message.
  const stored = await lia.evaluate(() => localStorage.getItem("bumbadum:settings:v1"));
  expect(JSON.parse(stored ?? "{}")).toMatchObject({ nickname: "Liana" });
  const message = lia.getByLabel("Message");
  await message.fill("oi");
  await message.press("Enter");
  await expect(nuno.getByRole("log", { name: "Chat" })).toContainText("Liana");
});
