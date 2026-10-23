import type { Page } from "@playwright/test";
import { expect, test } from "./join-lobby.ts";
import { freshVideoId, say, screenVideoId } from "./radio-helpers.ts";

const chat = (page: Page) => page.getByRole("log", { name: "Chat" });

/** The video on `page`'s screen, once it shows one. */
async function onAir(page: Page): Promise<string | undefined> {
  await expect.poll(() => screenVideoId(page)).toBeDefined();
  return screenVideoId(page);
}

test("a skip vote passes with more than half of the players present, or at once from the submitter", async ({
  joinLobby,
}) => {
  const nina = await joinLobby("Nina");
  const otto = await joinLobby("Otto");
  const pia = await joinLobby("Pia");
  const ninas = freshVideoId();
  const ottos = freshVideoId();
  await say(nina, `/play ${ninas}`);
  await expect(chat(pia)).toContainText(`Nina queued “Fake track ${ninas}”.`);
  await say(otto, `/play ${ottos}`);
  await expect(chat(pia)).toContainText(`Otto queued “Fake track ${ottos}”.`);

  // Earlier tests' tracks may still be ahead of Nina's: Nina and Pia, two of
  // the three present, vote each of them off.
  for (let ahead = 5; ahead > 0; ahead--) {
    const current = await onAir(pia);
    if (current === ninas) break;
    await say(nina, "/skip");
    await say(pia, "/skip");
    await expect.poll(() => screenVideoId(pia)).not.toBe(current);
  }
  expect(await onAir(nina)).toBe(ninas);

  await say(otto, "/skip");
  await expect(chat(nina)).toContainText("Otto voted to skip (1 of 2).");
  await expect(nina.getByText("Skip votes: 1 of 2")).toBeVisible();
  await say(pia, "/pular");

  await expect(chat(nina)).toContainText(`Skipped “Fake track ${ninas}”, from Nina.`);
  await expect.poll(() => screenVideoId(nina)).toBe(ottos);
  await expect.poll(() => screenVideoId(pia)).toBe(ottos);
  await expect(nina.getByText(/Skip votes/)).toBeHidden();

  // Otto's own vote skips his track at once.
  await say(otto, "/skip");
  await expect(chat(pia)).toContainText(`Skipped “Fake track ${ottos}”, from Otto.`);
  await expect(pia.getByText("Nothing playing")).toBeVisible();
});
