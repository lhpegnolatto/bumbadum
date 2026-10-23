"use client";

import { useTranslations } from "use-intl";
import type { PresentPlayer } from "./use-room.ts";

export function PlayerList({ players, me }: { players: PresentPlayer[]; me: string }) {
  const t = useTranslations("room");
  return (
    <section aria-labelledby="players-heading" className="flex flex-col gap-2">
      <h2 id="players-heading" className="font-medium">
        {t("players", { count: players.length })}
      </h2>
      <ul className="flex flex-col gap-1 text-sm">
        {players.map((player) => (
          <li key={player.sessionId}>
            {player.sessionId === me ? t("you", { nickname: player.nickname }) : player.nickname}
          </li>
        ))}
      </ul>
    </section>
  );
}
