declare global {
  /**
   * What the page exposes to end-to-end runs, since tests cannot read the
   * canvas or the screen. Each feature adds its own members, optional since
   * each appears only once that feature has mounted.
   */
  interface BumbadumE2E {}

  interface Window {
    /** Set only in end-to-end runs (`NEXT_PUBLIC_E2E=1`). */
    bumbadumE2E?: BumbadumE2E;
  }
}

export const isE2E = process.env.NEXT_PUBLIC_E2E === "1";

/** Adds `part` to `window.bumbadumE2E` in end-to-end runs; does nothing otherwise. */
export function exposeToE2E(part: BumbadumE2E) {
  if (!isE2E) return;
  window.bumbadumE2E = { ...window.bumbadumE2E, ...part };
}
