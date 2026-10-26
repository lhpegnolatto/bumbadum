import { z } from "zod";

/** Client → server: explicitly interact with the nearest Ambient NPC. */
export const AMBIENT_NPC_INTERACT_MESSAGE = "ambient-npc-interact";

const ambientNpcIdSchema = z.enum([
  "david-bowie",
  "aretha-franklin",
  "bob-marley",
  "freddie-mercury",
  "whitney-houston",
  "prince",
  "raul-seixas",
  "michael-jackson",
  "rita-lee",
  "luiz-gonzaga",
]);

export type AmbientNpcId = z.infer<typeof ambientNpcIdSchema>;

export function parseAmbientNpcInteractIntent(input: unknown): AmbientNpcId | undefined {
  const result = ambientNpcIdSchema.safeParse(input);
  return result.success ? result.data : undefined;
}
