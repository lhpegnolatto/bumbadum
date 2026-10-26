import { expect, type Locator, type Page } from "@playwright/test";

/**
 * Brings the named card of the avatar editor's carousel to the centre, which wears it. A card can
 * sit beyond the carousel's clipped edges, where a pointer cannot reach it, so this clicks it
 * through its handler, as a tap on a card in view does.
 */
export async function centreCard(scope: Page | Locator, name: string) {
  const card = scope.getByRole("button", { name, exact: true });
  await card.dispatchEvent("click");
  await expect(card).toHaveAttribute("aria-pressed", "true");
}

/** The card the draft wears, named by its style or skin tone. */
export function centredCard(scope: Page | Locator) {
  return scope.locator("[data-slot=carousel-item] button[aria-pressed=true]");
}
