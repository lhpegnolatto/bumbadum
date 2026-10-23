"use client";

import { AVATAR_CHOICES, AVATAR_LAYERS, type Avatar, type AvatarLayer } from "@bumbadum/avatar";
import { useId } from "react";
import { useTranslations } from "use-intl";
import { AvatarSprite } from "./avatar-sprite.tsx";

const PREVIEW_SCALE = 5;
const CHOICE_SCALE = 2;

/**
 * Edits an avatar: a large preview and a picker per layer, each choice shown
 * as the whole avatar wearing it. Controlled: the caller decides when a change
 * is kept, saved or sent.
 */
export function AvatarEditor({
  value,
  onChange,
}: {
  value: Avatar;
  onChange: (avatar: Avatar) => void;
}) {
  const t = useTranslations("avatar");
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-center rounded-lg bg-muted py-3">
        <AvatarSprite avatar={value} scale={PREVIEW_SCALE} animated />
        <span className="sr-only">{t("label")}</span>
      </div>
      {AVATAR_LAYERS.map((layer) => (
        <LayerPicker key={layer} layer={layer} value={value} onChange={onChange} />
      ))}
    </div>
  );
}

function LayerPicker({
  layer,
  value,
  onChange,
}: {
  layer: AvatarLayer;
  value: Avatar;
  onChange: (avatar: Avatar) => void;
}) {
  const t = useTranslations("avatar");
  const name = useId();
  const choices = Array.from({ length: AVATAR_CHOICES[layer] }, (_, i) => i + 1);

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 font-medium text-sm">{t(`layers.${layer}`)}</legend>
      <div className="flex flex-wrap gap-1.5">
        {choices.map((choice) => {
          const option = { ...value, [layer]: choice };
          return (
            <label
              key={choice}
              className="cursor-pointer rounded-md border border-transparent p-1 hover:bg-accent has-checked:border-primary has-checked:bg-accent has-focus-visible:ring-3 has-focus-visible:ring-ring/50"
            >
              <input
                type="radio"
                className="sr-only"
                name={name}
                value={choice}
                checked={value[layer] === choice}
                onChange={() => onChange(option)}
                aria-label={t(`choice.${layer}`, { number: choice })}
              />
              <AvatarSprite avatar={option} scale={CHOICE_SCALE} />
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
