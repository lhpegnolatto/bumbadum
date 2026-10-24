import { drawnPlayer, expect, test } from "./join-lobby.ts";

test("closed Chat signals a new Message until the Player opens it", async ({ joinLobby }) => {
  const cleo = await joinLobby("CleoUnread");
  const dora = await joinLobby("DoraUnread");
  const cleoChat = cleo.getByRole("button", { name: "Chat", exact: true });
  const doraChat = dora.getByRole("button", { name: "Chat", exact: true });

  await cleo.getByLabel("Message").fill("did you see this?");
  await cleo.getByLabel("Message").press("Enter");

  await expect(cleo.getByRole("status", { name: "New message" })).toBeHidden();
  await expect(dora.getByRole("status", { name: "New message" })).toBeVisible();
  await expect(doraChat).toHaveAttribute("aria-expanded", "false");

  await doraChat.click();
  await expect(dora.getByRole("status", { name: "New message" })).toBeHidden();
  await expect(dora.getByRole("log", { name: "Chat" })).toContainText(
    "CleoUnread: did you see this?",
  );
  await expect(cleoChat).toHaveAttribute("aria-expanded", "false");
});

test("open panels and the unread indicator reset when the Player re-enters", async ({
  joinLobby,
}) => {
  const recipient = await joinLobby("PavoEphemeral");
  const sender = await joinLobby("RumiEphemeral");
  const queue = recipient.getByRole("button", { name: "Queue", exact: true });

  await queue.click();
  await expect(queue).toHaveAttribute("aria-expanded", "true");
  await sender.getByLabel("Message").fill("ephemeral state check");
  await sender.getByLabel("Message").press("Enter");
  await expect(recipient.getByRole("status", { name: "New message" })).toBeVisible();

  await recipient.reload();
  await expect(recipient.getByRole("img", { name: "The room" })).toBeVisible();
  await expect(recipient.getByRole("button", { name: "Queue", exact: true })).toHaveAttribute(
    "aria-expanded",
    "false",
  );
  await expect(recipient.getByRole("status", { name: "New message" })).toBeHidden();
});

test("the Message input moves into open Chat and Escape releases focus before closing it", async ({
  joinLobby,
}) => {
  const page = await joinLobby("Iara");
  const input = page.getByLabel("Message");
  const closedBounds = await input.boundingBox();
  const chat = page.getByRole("button", { name: "Chat", exact: true });

  await chat.click();
  const panel = page.getByRole("region", { name: "Chat" });
  const panelBounds = await panel.boundingBox();
  const openBounds = await input.boundingBox();
  if (!closedBounds || !panelBounds || !openBounds) throw new Error("Chat has no visible bounds");
  expect(openBounds.x).toBeGreaterThanOrEqual(panelBounds.x);
  expect(openBounds.x + openBounds.width).toBeLessThanOrEqual(panelBounds.x + panelBounds.width);
  expect(openBounds.y).toBeGreaterThan(closedBounds.y);

  await page.getByRole("img", { name: "The room" }).click({ position: { x: 10, y: 10 } });
  await page.keyboard.press("Enter");
  await expect(input).toBeFocused();
  await input.fill("hello");
  await input.press("Enter");
  await expect(input).toHaveValue("");
  await expect(input).not.toBeFocused();

  await page.keyboard.press("Enter");
  await page.keyboard.press("Escape");
  await expect(input).not.toBeFocused();
  await expect(chat).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Escape");
  await expect(chat).toHaveAttribute("aria-expanded", "false");
});

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

  await cleo.getByRole("button", { name: "Chat", exact: true }).click();
  await expect(cleo.getByRole("log", { name: "Chat" })).toContainText("Dora joined the room.");

  await cleo.getByRole("img", { name: "The room" }).click({ position: { x: 10, y: 10 } });
  await cleo.keyboard.press("Enter");
  await expect(chatInput).toBeFocused();
  await cleo.keyboard.type("hello from Cleo");
  await cleo.keyboard.press("Enter");

  await dora.getByRole("button", { name: "Chat", exact: true }).click();
  await expect(dora.getByRole("log", { name: "Chat" })).toContainText("Cleo: hello from Cleo");
  await expect(chatInput).toHaveValue("");

  await cleo.keyboard.press("Escape");
  await expect(chatInput).not.toBeFocused();

  const gabi = await joinLobby("Gabi");
  await gabi.getByRole("button", { name: "Chat", exact: true }).click();
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

  await eva.getByRole("button", { name: "Chat", exact: true }).click();
  await fabi.getByRole("button", { name: "Chat", exact: true }).click();
  await expect(eva.getByRole("log", { name: "Chat" })).toContainText("There is no /fly command.");
  await expect(fabi.getByRole("log", { name: "Chat" })).toContainText("Eva: after the command");
  await expect(fabi.getByRole("log", { name: "Chat" })).not.toContainText("/fly");
});
