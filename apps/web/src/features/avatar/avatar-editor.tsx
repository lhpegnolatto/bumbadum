"use client";

import {
  APPEARANCE_LAYERS,
  type AppearanceLayer,
  type Avatar,
  availableAvatarOptions,
  compatibleAvatar,
  OPTIONAL_LAYERS,
} from "@bumbadum/avatar";
import { useId, useState } from "react";
import { useTranslations } from "use-intl";
import { AvatarSprite } from "./avatar-sprite.tsx";

const PREVIEW_SCALE = 5;
const CHOICE_SCALE = 2;
type EditorLayer = "skinTone" | AppearanceLayer;

/** Edits a complete avatar without deciding when the draft is published. */
export function AvatarEditor({
  value,
  onChange,
}: {
  value: Avatar;
  onChange: (avatar: Avatar) => void;
}) {
  const t = useTranslations("avatar");
  const [layer, setLayer] = useState<EditorLayer>("skinTone");
  const layers: readonly EditorLayer[] = ["skinTone", ...APPEARANCE_LAYERS];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-center rounded-lg bg-muted py-3">
        <AvatarSprite avatar={value} scale={PREVIEW_SCALE} animated />
        <span className="sr-only">{t("label")}</span>
      </div>
      <div role="tablist" aria-label={t("layersLabel")} className="flex gap-1 overflow-x-auto pb-1">
        {layers.map((candidate) => (
          <button
            key={candidate}
            type="button"
            role="tab"
            aria-selected={layer === candidate}
            className="shrink-0 rounded-md border px-2 py-1 text-sm aria-selected:border-primary aria-selected:bg-accent"
            onClick={() => setLayer(candidate)}
          >
            {t(`layers.${candidate}`)}
          </button>
        ))}
      </div>
      {layer === "skinTone" ? (
        <SkinTonePicker value={value} onChange={onChange} />
      ) : (
        <AppearancePicker layer={layer} value={value} onChange={onChange} />
      )}
    </div>
  );
}

function SkinTonePicker({
  value,
  onChange,
}: {
  value: Avatar;
  onChange: (avatar: Avatar) => void;
}) {
  const t = useTranslations("avatar");
  const name = useId();
  return (
    <fieldset className="flex flex-wrap gap-1.5">
      <legend className="sr-only">{t("layers.skinTone")}</legend>
      {[1, 2, 3, 4].map((skinTone) => (
        <Choice
          key={skinTone}
          name={name}
          checked={value.skinTone === skinTone}
          label={t("choice.skinTone", { number: skinTone })}
          avatar={{ ...value, skinTone }}
          onChoose={() => onChange({ ...value, skinTone })}
        />
      ))}
    </fieldset>
  );
}

function AppearancePicker({
  layer,
  value,
  onChange,
}: {
  layer: AppearanceLayer;
  value: Avatar;
  onChange: (avatar: Avatar) => void;
}) {
  const t = useTranslations("avatar");
  const selected = value[layer];
  const options = availableAvatarOptions(layer);
  const styles = [...new Set(options.map(({ style }) => style))];
  const selectedStyle = options.find(({ id }) => id === selected)?.style ?? styles[0];
  const visible = options.filter(({ style }) => style === selectedStyle);
  const name = useId();

  function chooseStyle(style: string) {
    const currentColor = options.find(({ id }) => id === selected)?.color;
    const option =
      options.find((candidate) => candidate.style === style && candidate.color === currentColor) ??
      options.find((candidate) => candidate.style === style);
    if (option) choose(option.id);
  }

  function choose(choice: string | null) {
    const candidate = { ...value, [layer]: choice } as Avatar;
    if (compatibleAvatar(candidate)) onChange(candidate);
  }

  return (
    <div className="flex flex-col gap-3">
      <fieldset className="flex flex-wrap gap-1.5">
        <legend className="mb-1 font-medium text-sm">{t("style")}</legend>
        {OPTIONAL_LAYERS.includes(layer as never) ? (
          <button
            type="button"
            className="rounded-md border px-2 py-1 text-sm"
            aria-pressed={selected === null}
            onClick={() => choose(null)}
          >
            {t("none")}
          </button>
        ) : null}
        {styles.map((style) => {
          const disabled = options
            .filter((option) => option.style === style)
            .every((option) => !compatibleAvatar({ ...value, [layer]: option.id } as Avatar));
          return (
            <button
              key={style}
              type="button"
              disabled={disabled}
              className="rounded-md border px-2 py-1 text-sm aria-pressed:border-primary aria-pressed:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
              aria-pressed={selectedStyle === style && selected !== null}
              onClick={() => chooseStyle(style)}
            >
              {t(`styles.${style}`)}
            </button>
          );
        })}
      </fieldset>
      {selected !== null ? (
        <fieldset className="flex flex-wrap gap-1.5">
          <legend className="mb-1 font-medium text-sm">{t("color")}</legend>
          {visible.map((option) => {
            const avatar = { ...value, [layer]: option.id } as Avatar;
            const disabled = !compatibleAvatar(avatar);
            return (
              <Choice
                key={option.id}
                name={name}
                checked={selected === option.id}
                disabled={disabled}
                label={t("choice.appearance", {
                  style: t(`styles.${option.style}`),
                  color: t(`colors.${option.color}`),
                })}
                avatar={avatar}
                onChoose={() => choose(option.id)}
              />
            );
          })}
        </fieldset>
      ) : null}
    </div>
  );
}

function Choice({
  name,
  checked,
  disabled = false,
  label,
  avatar,
  onChoose,
}: {
  name: string;
  checked: boolean;
  disabled?: boolean;
  label: string;
  avatar: Avatar;
  onChoose: () => void;
}) {
  return (
    <label className="cursor-pointer rounded-md border border-transparent p-1 hover:bg-accent has-checked:border-primary has-checked:bg-accent has-focus-visible:ring-3 has-focus-visible:ring-ring/50 has-disabled:cursor-not-allowed has-disabled:opacity-40">
      <input
        type="radio"
        className="sr-only"
        name={name}
        checked={checked}
        disabled={disabled}
        onChange={onChoose}
        aria-label={label}
      />
      <AvatarSprite avatar={avatar} scale={CHOICE_SCALE} />
    </label>
  );
}
