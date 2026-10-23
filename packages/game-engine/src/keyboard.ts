import type { Direction } from "@bumbadum/world";
import type { StepRepeater } from "./movement/step-repeater.ts";

/** Physical keys, so WASD sits in the same place on every keyboard layout. */
const DIRECTION_KEYS: Record<string, Direction> = {
  KeyW: "up",
  ArrowUp: "up",
  KeyS: "down",
  ArrowDown: "down",
  KeyA: "left",
  ArrowLeft: "left",
  KeyD: "right",
  ArrowRight: "right",
};

/** Keys typed into a text field (such as the chat) never move the player. */
function isTextField(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || target.closest("input, textarea, select") !== null;
}

/**
 * Feeds WASD and the arrow keys to `repeater` while `enabled()` says so.
 * Returns a function that stops listening.
 */
export function listenToDirectionKeys(repeater: StepRepeater, enabled: () => boolean): () => void {
  const onKeyDown = (event: KeyboardEvent) => {
    const direction = DIRECTION_KEYS[event.code];
    if (!direction || event.ctrlKey || event.metaKey || event.altKey) return;
    if (!enabled() || isTextField(event.target)) return;
    event.preventDefault(); // keeps the arrows from scrolling the page
    repeater.press(direction, event.timeStamp);
  };
  // Releasing is always safe, wherever the focus went meanwhile.
  const onKeyUp = (event: KeyboardEvent) => {
    const direction = DIRECTION_KEYS[event.code];
    if (direction) repeater.release(direction, event.timeStamp);
  };
  const onFocusIn = (event: FocusEvent) => {
    if (isTextField(event.target)) repeater.releaseAll();
  };
  const onBlur = () => repeater.releaseAll();

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  window.addEventListener("focusin", onFocusIn);
  window.addEventListener("blur", onBlur);
  return () => {
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("keyup", onKeyUp);
    window.removeEventListener("focusin", onFocusIn);
    window.removeEventListener("blur", onBlur);
  };
}
