"use client";

import { useTranslations } from "use-intl";
import { useRadioContext } from "./radio-provider.tsx";

/**
 * The title on air and who sent it, under the screen (never over it), with
 * the skip vote once anyone has voted.
 */
export function NowPlayingCaption() {
  const t = useTranslations("radio");
  const { nowPlaying, skipVote } = useRadioContext().state;
  if (!nowPlaying) return null;
  const { track } = nowPlaying;
  return (
    <div className="flex min-w-0 flex-1 flex-col text-sm">
      <p className="truncate" title={track.title}>
        <span className="text-muted-foreground">{t("nowPlaying")}</span>{" "}
        <span className="font-medium">{track.title}</span>{" "}
        <span className="text-muted-foreground">
          {t("from", { nickname: track.submitter.nickname })}
        </span>
      </p>
      {skipVote.votes > 0 && (
        <p className="text-muted-foreground text-xs">{t("skipVotes", { ...skipVote })}</p>
      )}
    </div>
  );
}
