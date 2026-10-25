import type { Page } from "@playwright/test";
import { drawnPlayer, expect, test } from "./join-lobby.ts";

/** Who threw the Confetti throws `page`'s canvas drew, and which way, oldest first. */
async function throwsSeenBy(page: Page) {
  const throws = await page.evaluate(() => window.bumbadumE2E?.drawnConfettiThrows?.() ?? []);
  return throws.map(({ nickname, direction }) => ({ nickname, direction }));
}

test("players see each other throw confetti, by key, button or command", async ({ joinLobby }) => {
  const zeca = await joinLobby("Zeca");
  const yara = await joinLobby("Yara");
  const byZeca = async () =>
    (await throwsSeenBy(yara)).filter(({ nickname }) => nickname === "Zeca");
  const throwDown = { nickname: "Zeca", direction: "down" };
  // Throws are passing: Yara sees only those that arrive once her canvas draws the room.
  await expect.poll(() => drawnPlayer(yara, "Zeca")).toBeDefined();

  await zeca.getByRole("img", { name: "The room" }).click({ position: { x: 10, y: 10 } });
  await zeca.keyboard.press("e");
  await expect.poll(byZeca).toEqual([throwDown]);

  // The button, as on a phone, and the command, in any language, throw too.
  await zeca.getByRole("button", { name: "Confetti", exact: true }).click();
  await expect.poll(byZeca).toEqual([throwDown, throwDown]);
  const message = zeca.getByLabel("Message");
  await message.fill("/confete");
  await message.press("Enter");
  await expect.poll(byZeca).toEqual([throwDown, throwDown, throwDown]);
});
