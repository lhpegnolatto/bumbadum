import type { Locale } from "./locale.ts";
import en from "./messages/en.json";
import ptBR from "./messages/pt-BR.json";

export type Messages = typeof en;

export const messages: Record<Locale, Messages> = { en, "pt-BR": ptBR };
