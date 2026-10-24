"use client";

import { type RefObject, useEffect, useState, useSyncExternalStore } from "react";

/** The compact layout (ADR-0018); the `compact` Tailwind variant in `globals.css` must match. */
const COMPACT_LAYOUT_QUERY = "(width < 1024px), (height < 640px)";

/** What covers the room instead of squeezing it, keeping the connection (ADR-0018). */
export type RoomNotice = "compatibility" | "rotate";

/** In order: a viewport too narrow for the Screen's 200 px height asks for more width before rotating. */
const NOTICE_QUERIES: readonly [RoomNotice, string][] = [
  ["compatibility", "(width < 360px)"],
  ["rotate", "(orientation: landscape) and (height < 500px)"],
];

function subscribeToNotice(onChange: () => void) {
  const queries = NOTICE_QUERIES.map(([, query]) => window.matchMedia(query));
  for (const query of queries) query.addEventListener("change", onChange);
  return () => {
    for (const query of queries) query.removeEventListener("change", onChange);
  };
}

function getNotice(): RoomNotice | null {
  return NOTICE_QUERIES.find(([, query]) => window.matchMedia(query).matches)?.[0] ?? null;
}

/** The notice the viewport calls for, or `null` while the room fits. */
export function useRoomNotice(): RoomNotice | null {
  return useSyncExternalStore(subscribeToNotice, getNotice, () => null);
}

/**
 * How many CSS pixels at the top of the viewport `block` (the Screen and Radio strip) covers in
 * the compact layout, where it spans the viewport's width; 0 on desktop, where it sits beside the
 * world.
 */
export function useCompactTopInset(block: RefObject<HTMLElement | null>): number {
  const [inset, setInset] = useState(0);
  useEffect(() => {
    const element = block.current;
    if (!element) return;
    const compact = window.matchMedia(COMPACT_LAYOUT_QUERY);
    const measure = () =>
      setInset(compact.matches ? Math.ceil(element.getBoundingClientRect().bottom) : 0);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    compact.addEventListener("change", measure);
    return () => {
      observer.disconnect();
      compact.removeEventListener("change", measure);
    };
  }, [block]);
  return inset;
}
