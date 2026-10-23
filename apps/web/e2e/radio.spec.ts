import type { Page } from "@playwright/test";
import { expect, test } from "./join-lobby.ts";

/**
 * A video ID no other run has used, so the radio never refuses it as already
 * queued. The e2e server's fake catalog answers any ID with a 3-minute track.
 */
function freshVideoId(): string {
  return `e2e${Math.random().toString(36).slice(2, 10).padEnd(8, "0")}`;
}

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
  const chatInput = page.getByLabel("Message");
  await chatInput.fill(`/play ${request}`);
  await chatInput.press("Enter");
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

  await play(ivo, `https://www.youtube.com/watch?v=${videoId}&list=PLe2e`);
  await expect(ivo.getByRole("log", { name: "Chat" })).toContainText(
    `Ivo queued “Fake track ${videoId}”.`,
  );
  const juno = await joinLobby("Juno");

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

  // A refusal is a notice for the sender alone. (One test for both keeps the
  // run under the lobby's 16 seats, which closed browsers hold for a while.)
  await play(juno, "live0000001");
  await juno.getByLabel("Message").fill("after the refusal");
  await juno.getByLabel("Message").press("Enter");
  await expect(juno.getByRole("log", { name: "Chat" })).toContainText(
    "Live streams can't play on the radio.",
  );
  await expect(ivo.getByRole("log", { name: "Chat" })).toContainText("Juno: after the refusal");
  await expect(ivo.getByRole("log", { name: "Chat" })).not.toContainText("Live streams");
});
