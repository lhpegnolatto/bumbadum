"use client";

import { useEffect, useState } from "react";

const EXIT_DURATION_MS = 200;

/** Keeps the last non-null value mounted while its exit animation finishes. */
export function useExitPresence<T>(value: T | null) {
  const [present, setPresent] = useState<T | null>(value);

  useEffect(() => {
    if (value !== null) {
      setPresent(value);
      return;
    }
    if (present === null) return;
    const timeout = window.setTimeout(() => setPresent(null), EXIT_DURATION_MS);
    return () => window.clearTimeout(timeout);
  }, [value, present]);

  return { present, open: value !== null };
}
