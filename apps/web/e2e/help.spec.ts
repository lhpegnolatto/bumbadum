import type { Page } from "@playwright/test";
import { expect, test } from "./join-lobby.ts";
import { say } from "./radio-helpers.ts";

const chat = (page: Page) => page.getByRole("log", { name: "Chat" });

test("/help gives the sender a notice listing the commands, and the other player sees nothing", async ({
  joinLobby,
}) => {
  const quim = await joinLobby("Quim");
  const rita = await joinLobby("Rita");

  await quim.getByRole("button", { name: "Chat", exact: true }).click();
  await rita.getByRole("button", { name: "Chat", exact: true }).click();

  await expect(quim.getByText("/play <link or name> · /skip · /dance · /confetti · /help")).toBeVisible();

  await say(quim, "/help");
  await say(quim, "after asking for help");

  const help = chat(quim).getByRole("listitem");
  await expect(help).toHaveText([
    "/play <link or name> Puts a track in the queue: a YouTube link, or a name to search for.",
    "/skip Votes to skip the track on air.",
    "/dance Starts or stops dancing, in step with everyone dancing.",
    "/confetti Throws confetti ahead of you, at the first person in the way.",
    "/help Lists the commands you can use.",
  ]);
  await expect(chat(quim)).toContainText("Commands you can use:");
  await expect(chat(rita)).toContainText("Quim: after asking for help");
  await expect(chat(rita)).not.toContainText("Commands you can use");
});

test("typing / offers command names; arrows, Tab, Enter and a click complete them", async ({
  joinLobby,
}) => {
  const sara = await joinLobby("Sara");
  const chatInput = sara.getByLabel("Message");
  const suggestions = sara.getByRole("listbox", { name: "Commands" }).getByRole("option");

  await sara.keyboard.press("Enter");
  await sara.keyboard.type("/pl");
  await expect(suggestions).toHaveText(["/play"]);
  await sara.keyboard.press("Enter");
  await expect(chatInput).toHaveValue("/play ");
  await expect(suggestions).toHaveCount(0);

  await chatInput.fill("");
  await sara.keyboard.type("/");
  await expect(suggestions).toHaveText(["/play", "/skip", "/dance", "/confetti", "/help"]);
  await sara.keyboard.press("ArrowDown");
  await sara.keyboard.press("ArrowDown");
  await sara.keyboard.press("ArrowDown");
  await sara.keyboard.press("ArrowDown");
  await expect(chatInput).toHaveAttribute("aria-activedescendant", /.+/);
  await expect(suggestions.nth(4)).toHaveAttribute("aria-selected", "true");
  await sara.keyboard.press("Tab");
  await expect(chatInput).toHaveValue("/help ");
  await expect(chatInput).toBeFocused();

  await chatInput.fill("");
  await sara.keyboard.type("/s");
  await suggestions.getByText("/skip").click();
  await expect(chatInput).toHaveValue("/skip ");
  await expect(chatInput).toBeFocused();

  await chatInput.fill("");
  await sara.keyboard.type("/h");
  await sara.keyboard.press("Escape");
  await expect(suggestions).toHaveCount(0);
  await expect(chatInput).not.toBeFocused();

  // A complete command name sends on Enter.
  await chatInput.fill("");
  await chatInput.pressSequentially("/help");
  await chatInput.press("Enter");
  await expect(chatInput).toHaveValue("");
  await sara.getByRole("button", { name: "Chat", exact: true }).click();
  await expect(chat(sara)).toContainText("Commands you can use:");
});

test("in Portuguese, the hint and help use the Portuguese names, and /pl still offers /play", async ({
  joinLobby,
}) => {
  const tati = await joinLobby("Tati", { locale: "pt-BR" });
  const chatInput = tati.getByLabel("Mensagem");
  const suggestions = tati.getByRole("listbox", { name: "Comandos" }).getByRole("option");

  await expect(tati.getByText("/tocar <link ou nome> · /pular · /dançar · /confete · /ajuda")).toBeVisible();

  await chatInput.pressSequentially("/");
  await expect(suggestions).toHaveText(["/tocar", "/pular", "/dançar", "/confete", "/ajuda"]);
  await chatInput.pressSequentially("pl");
  await expect(suggestions).toHaveText(["/play"]);

  await chatInput.fill("");
  await chatInput.pressSequentially("/to");
  await expect(suggestions).toHaveText(["/tocar"]);
  await chatInput.press("Tab");
  await expect(chatInput).toHaveValue("/tocar ");

  await chatInput.fill("/ajuda");
  await chatInput.press("Enter");
  await tati.getByRole("button", { name: "Chat", exact: true }).click();
  await expect(chat(tati)).toContainText("Comandos que você pode usar:");
  await expect(chat(tati).getByRole("listitem").first()).toHaveText(
    "/tocar <link ou nome> Coloca uma música na fila: um link do YouTube, ou um nome para buscar.",
  );
});
