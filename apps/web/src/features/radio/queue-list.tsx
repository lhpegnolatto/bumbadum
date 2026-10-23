"use client";

import { useTranslations } from "use-intl";
import { useRadioContext } from "./radio-provider.tsx";

/** The tracks waiting to go on air, next first. */
export function QueueList() {
  const t = useTranslations("radio");
  const { queue } = useRadioContext().state;

  return (
    <section aria-labelledby="queue-heading" className="flex max-h-36 shrink-0 flex-col gap-1">
      <h2 id="queue-heading" className="font-medium">
        {t("queue", { count: queue.length })}
      </h2>
      {queue.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t("queueEmpty")}</p>
      ) : (
        <ol className="flex flex-col gap-0.5 overflow-y-auto text-sm">
          {queue.map((track) => (
            <li key={track.videoId} className="truncate" title={track.title}>
              {track.title}{" "}
              <span className="text-muted-foreground">
                {t("from", { nickname: track.submitter.nickname })}
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
