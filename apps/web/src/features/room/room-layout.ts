"use client";

import { type RefObject, useEffect, useState, useSyncExternalStore } from "react";

/** The compact layout (ADR-0018); the `compact` Tailwind variant in `globals.css` must match. */
const COMPACT_LAYOUT_QUERY = "(width < 1024px), (height < 640px)";

function subscribeToCompactLayout(onChange: () => void) {
  const query = window.matchMedia(COMPACT_LAYOUT_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/** Whether the viewport calls for the compact layout, for behaviour that CSS alone cannot change. */
export function useCompactLayout(): boolean {
  return useSyncExternalStore(
    subscribeToCompactLayout,
    () => window.matchMedia(COMPACT_LAYOUT_QUERY).matches,
    () => false,
  );
}

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

/** The part of the page the Player sees, in CSS pixels from the page's top. */
export interface VisibleViewport {
  top: number;
  height: number;
}

/**
 * The visual viewport while it differs from the layout viewport, or `null`. iOS Safari ignores
 * `interactive-widget=resizes-content`: its on-screen keyboard covers the page and pans it to the
 * focused field. Fitting the room to this box keeps the Screen at the top and the Message input
 * just above the keyboard. Chromium resizes the layout viewport instead, so the two match there.
 */
export function useVisibleViewport(): VisibleViewport | null {
  const [visible, setVisible] = useState<VisibleViewport | null>(null);
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const measure = () => {
      const next = visibleViewportOf(viewport, document.documentElement.clientHeight);
      setVisible((current) =>
        current?.top === next?.top && current?.height === next?.height ? current : next,
      );
    };
    measure();
    viewport.addEventListener("resize", measure);
    viewport.addEventListener("scroll", measure);
    return () => {
      viewport.removeEventListener("resize", measure);
      viewport.removeEventListener("scroll", measure);
    };
  }, []);
  return visible;
}

function visibleViewportOf(viewport: VisualViewport, layoutHeight: number): VisibleViewport | null {
  // A pinch zoom shrinks the visual viewport too; the room then keeps its size and the Player pans.
  if (Math.abs(viewport.scale - 1) > 0.01) return null;
  if (viewport.pageTop === 0 && Math.abs(viewport.height - layoutHeight) < 1) return null;
  return { top: viewport.pageTop, height: viewport.height };
}
