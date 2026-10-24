"use client";

import { Volume2Icon, VolumeXIcon } from "lucide-react";
import { useId } from "react";
import { useTranslations } from "use-intl";
import { Button } from "@/components/ui/button.tsx";
import { Slider } from "@/components/ui/slider.tsx";
import { useRadioContext } from "./radio-provider.tsx";

/**
 * This player's own volume and mute; nobody else hears the difference. A coarse pointer gets the
 * mute toggle alone: iOS leaves the volume to the device's buttons and ignores the page's.
 */
export function VolumeControl() {
  const t = useTranslations("radio");
  const { state, actions } = useRadioContext();
  const Icon = state.muted ? VolumeXIcon : Volume2Icon;
  const labelId = useId();

  return (
    <div
      className="flex w-36 shrink-0 items-center gap-2 pointer-coarse:w-auto"
      // Pointer users hand focus back to the room; keyboard users keep normal control focus.
      onPointerUp={() => {
        window.setTimeout(() => {
          if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
        });
      }}
    >
      <Button
        variant="ghost"
        size="icon-sm"
        className="pointer-coarse:size-10"
        aria-label={t("mute")}
        aria-pressed={state.muted}
        onClick={() => actions.setMuted(!state.muted)}
      >
        <Icon />
      </Button>
      <span id={labelId} className="sr-only">
        {t("volume")}
      </span>
      <Slider
        className="pointer-coarse:hidden"
        aria-labelledby={labelId}
        min={0}
        max={100}
        value={[state.volume]}
        onValueChange={(volume) => actions.setVolume(single(volume))}
        onValueCommitted={(volume) => actions.keepVolume(single(volume))}
      />
    </div>
  );
}

/** The slider has one thumb, so its value is one number. */
function single(value: number | readonly number[]): number {
  return typeof value === "number" ? value : (value[0] ?? 0);
}
