import type { Page } from "@playwright/test";
import { expect, test } from "./join-lobby.ts";
import { freshVideoId, randomLetters, say } from "./radio-helpers.ts";

/**
 * What `page`'s screen plays, with both its position and the radio's expected
 * one turned into the wall-clock moment the track started, so two pages can be
 * compared whenever each is read.
 */
function screenOf(page: Page) {
  return page.evaluate(() => {
    const reading = window.bumbadumE2E?.screen?.();
    if (!reading) return undefined;
    const now = Date.now();
    return {
      videoId: reading.videoId,
      radioStartedAt: now - reading.expectedMs,
      screenStartedAt: now - reading.positionMs,
    };
  });
}

async function play(page: Page, request: string) {
  await say(page, `/play ${request}`);
}

test("/play puts a track on every screen at the same position, a late joiner's too; a refusal reaches only its sender", async ({
  joinLobby,
}) => {
  const videoId = freshVideoId();
  const ivo = await joinLobby("Ivo");
  const screen = ivo.getByRole("region", { name: "Screen" });
  const box = await screen.boundingBox();
  expect(box?.width).toBeGreaterThanOrEqual(400);
  expect(box?.height).toBeGreaterThanOrEqual(225);

  await ivo.getByRole("button", { name: "Chat", exact: true }).click();
  await play(ivo, `https://www.youtube.com/watch?v=${videoId}&list=PLe2e`);
  await expect(ivo.getByRole("log", { name: "Chat" })).toContainText(
    `Ivo queued “Fake track ${videoId}”.`,
  );
  const juno = await joinLobby("Juno");
  await juno.getByRole("button", { name: "Queue", exact: true }).click();

  // Another test's track may still be on air, with Ivo's waiting behind it:
  // either way both players see it, and both screens play the same thing.
  await expect(juno.getByText(`Fake track ${videoId}`)).toBeVisible();
  await expect.poll(() => screenOf(ivo)).toBeDefined();
  await expect
    .poll(async () => (await screenOf(juno))?.videoId)
    .toBe((await screenOf(ivo))?.videoId);

  const [onIvo, onJuno] = [await screenOf(ivo), await screenOf(juno)];
  if (!onIvo || !onJuno) throw new Error("a screen stopped playing");
  // Both clocks agree on where the radio is, and each screen plays there.
  expect(Math.abs(onIvo.radioStartedAt - onJuno.radioStartedAt)).toBeLessThan(250);
  expect(Math.abs(onIvo.screenStartedAt - onIvo.radioStartedAt)).toBeLessThan(250);
  expect(Math.abs(onJuno.screenStartedAt - onJuno.radioStartedAt)).toBeLessThan(250);

  // A refusal is a notice for the sender alone.
  await juno.getByRole("button", { name: "Chat", exact: true }).click();
  await play(juno, "live0000001");
  await juno.getByLabel("Message").fill("after the refusal");
  await juno.getByLabel("Message").press("Enter");
  await expect(juno.getByRole("log", { name: "Chat" })).toContainText(
    "Live streams can't play on the radio.",
  );
  await expect(ivo.getByRole("log", { name: "Chat" })).toContainText("Juno: after the refusal");
  await expect(ivo.getByRole("log", { name: "Chat" })).not.toContainText("Live streams");
});

test("/play with a name plays what the search finds, for every player", async ({ joinLobby }) => {
  // The e2e server's fake search finds `srch` plus the query's last 7 letters.
  const tail = randomLetters(7);
  const title = `Fake track srch${tail}`;
  const kai = await joinLobby("Kai");
  const lia = await joinLobby("Lia");

  await lia.getByRole("button", { name: "Chat", exact: true }).click();
  await play(kai, `lofi beats ${tail}`);

  await expect(lia.getByRole("log", { name: "Chat" })).toContainText(`Kai queued “${title}”.`);
  // On air or waiting behind another test's track: either way both players see it.
  for (const page of [kai, lia]) {
    await page.getByRole("button", { name: "Queue", exact: true }).click();
    const onAir = page.getByText(title, { exact: true });
    const waiting = page.getByRole("region", { name: /Up next/ }).getByText(title);
    await expect(onAir.or(waiting)).toBeVisible();
  }
});
