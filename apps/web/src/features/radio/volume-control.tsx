"use client";

import { Volume2Icon, VolumeXIcon } from "lucide-react";
import { useId, useRef } from "react";
import { useTranslations } from "use-intl";
import { Button } from "@/components/ui/button.tsx";
import { Slider } from "@/components/ui/slider.tsx";
import { useRadioContext } from "./radio-provider.tsx";

/** This player's own volume and mute; nobody else hears the difference. */
export function VolumeControl() {
  const t = useTranslations("radio");
  const { state, actions } = useRadioContext();
  const Icon = state.muted ? VolumeXIcon : Volume2Icon;
  const labelId = useId();
  const usedPointer = useRef(false);

  // Used with the mouse, the controls hand focus back to the room, so the walking
  // keys, Enter and C work again; reached with Tab, they keep it like any control.
  function returnFocusAfterPointer() {
    if (!usedPointer.current) return;
    usedPointer.current = false;
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  }

  return (
    <div
      className="flex w-36 shrink-0 items-center gap-2"
      onPointerDown={() => {
        usedPointer.current = true;
      }}
    >
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={t("mute")}
        aria-pressed={state.muted}
        onClick={() => {
          actions.setMuted(!state.muted);
          returnFocusAfterPointer();
        }}
      >
        <Icon />
      </Button>
      <span id={labelId} className="sr-only">
        {t("volume")}
      </span>
      <Slider
        aria-labelledby={labelId}
        min={0}
        max={100}
        value={[state.volume]}
        onValueChange={(volume) => actions.setVolume(single(volume))}
        onValueCommitted={(volume) => {
          actions.keepVolume(single(volume));
          returnFocusAfterPointer();
        }}
      />
    </div>
  );
}

/** The slider has one thumb, so its value is one number. */
function single(value: number | readonly number[]): number {
  return typeof value === "number" ? value : (value[0] ?? 0);
}
