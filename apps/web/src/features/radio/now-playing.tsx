"use client";

import { useTranslations } from "use-intl";
import { useRadioContext } from "./radio-provider.tsx";

/** The title on air and who sent it, under the screen (never over it). */
export function NowPlayingCaption() {
  const t = useTranslations("radio");
  const { nowPlaying } = useRadioContext().state;
  if (!nowPlaying) return null;
  const { track } = nowPlaying;
  return (
    <p className="min-w-0 flex-1 truncate text-sm" title={track.title}>
      <span className="text-muted-foreground">{t("nowPlaying")}</span>{" "}
      <span className="font-medium">{track.title}</span>{" "}
      <span className="text-muted-foreground">
        {t("from", { nickname: track.submitter.nickname })}
      </span>
    </p>
  );
}
