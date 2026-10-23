"use client";

import { CircleCheckIcon, CircleDashedIcon, LoaderCircleIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslations } from "use-intl";
import { Alert, AlertDescription } from "@/components/ui/alert.tsx";
import { Button } from "@/components/ui/button.tsx";
import { cn } from "@/lib/utils";
import type { WaitingReason, WaitingStage } from "./connection.ts";

const STAGES: readonly WaitingStage[] = ["waking", "joining"];

const PROGRESS_ICONS = {
  done: CircleCheckIcon,
  current: LoaderCircleIcon,
  pending: CircleDashedIcon,
};

const LINES = ["radio", "records", "cushions", "cables", "kettle", "speakers"] as const;

/** How long each light-hearted line stays up. */
const LINE_MS = 5000;

function formatElapsed(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

/** Shown while the server wakes up and the player joins, or gets back in after a drop. */
export function WaitingScreen({
  reason,
  stage,
  since,
}: {
  reason: WaitingReason;
  stage: WaitingStage;
  since: number;
}) {
  const t = useTranslations("waiting");
  const current = STAGES.indexOf(stage);

  return (
    <main className="mx-auto flex h-full max-w-md flex-col justify-center gap-6 p-6">
      <div role="status" className="flex flex-col gap-4">
        <h1 className="font-heading text-2xl font-semibold">{t(`title.${reason}`)}</h1>
        <ol className="flex flex-col gap-2">
          {STAGES.map((item, index) => {
            const progress = index < current ? "done" : index === current ? "current" : "pending";
            const Icon = PROGRESS_ICONS[progress];
            return (
              <li
                key={item}
                aria-current={progress === "current" ? "step" : undefined}
                className={cn(
                  "flex items-center gap-2",
                  progress === "current" && "font-medium",
                  progress === "pending" && "text-muted-foreground",
                )}
              >
                <Icon
                  aria-hidden
                  className={cn(
                    "size-5",
                    progress === "done" && "text-primary",
                    progress === "current" && "animate-spin",
                  )}
                />
                {t(`stages.${item}`)}
              </li>
            );
          })}
        </ol>
      </div>
      <WaitingTicker since={since} />
      <p className="text-muted-foreground text-sm">{t("usually")}</p>
    </main>
  );
}

/** Ticks every second on its own, so the rest of the screen does not re-render. */
function WaitingTicker({ since }: { since: number }) {
  const t = useTranslations("waiting");
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const elapsed = Math.max(0, now - since);
  const line = LINES[Math.floor(elapsed / LINE_MS) % LINES.length] ?? LINES[0];

  return (
    <div className="flex flex-col gap-1">
      <p className="text-lg">{t(`lines.${line}`)}</p>
      <p className="text-muted-foreground text-sm tabular-nums">
        {t("elapsed", { time: formatElapsed(elapsed) })}
      </p>
    </div>
  );
}

/** Shown once waiting has gone on far longer than a wake-up takes. */
export function WaitingTimedOut({ onRetry }: { onRetry: () => void }) {
  const t = useTranslations();
  return (
    <main className="mx-auto flex h-full max-w-md flex-col justify-center gap-4 p-6">
      <Alert variant="destructive">
        <AlertDescription>{t("waiting.timedOut")}</AlertDescription>
      </Alert>
      <Button onClick={onRetry}>{t("waiting.tryAgain")}</Button>
      <Button render={<Link href="/" />} nativeButton={false} variant="outline">
        {t("room.backHome")}
      </Button>
    </main>
  );
}
