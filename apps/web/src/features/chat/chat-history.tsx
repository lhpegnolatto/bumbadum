"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "use-intl";
import type { ChatEntry } from "./chat-feed.ts";
import { HelpNotice } from "./command-help.tsx";

export function ChatHistory({ entries }: { entries: readonly ChatEntry[] }) {
  const t = useTranslations("chat");
  const logRef = useRef<HTMLDivElement>(null);

  // Keep the latest entry in view; `entries` is the trigger, not read inside.
  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll on every new entry
  useEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [entries]);

  return (
    <div
      ref={logRef}
      role="log"
      aria-label={t("historyLabel")}
      className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto text-sm"
    >
      {entries.map((entry) => (
        <ChatLine key={entry.id} entry={entry} />
      ))}
    </div>
  );
}

function ChatLine({ entry }: { entry: ChatEntry }) {
  const t = useTranslations("chat");
  switch (entry.kind) {
    case "message":
      // Player text is rendered as is, never through a translation (ADR-0009).
      return (
        <p className="break-words">
          <span className="font-medium">{entry.message.nickname}:</span> {entry.message.text}
        </p>
      );
    case "announcement":
      return (
        <p className="text-muted-foreground italic">
          {t(`announcement.${entry.announcement.code}`, entry.announcement.params)}
        </p>
      );
    case "notice":
      if (entry.notice.code === "help") return <HelpNotice />;
      return (
        <p className="border-l-2 border-primary/40 pl-2 text-muted-foreground">
          {t(`notice.${entry.notice.code}`, entry.notice.params)}
        </p>
      );
  }
}
