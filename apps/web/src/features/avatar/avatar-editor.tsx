"use client";

import {
  type AppearanceLayer,
  AVATAR_CATALOG,
  type Avatar,
  OPTIONAL_LAYERS,
} from "@bumbadum/avatar";
import { useId, useState } from "react";
import { useTranslations } from "use-intl";
import { AvatarSprite } from "./avatar-sprite.tsx";

const PREVIEW_SCALE = 5;
const CHOICE_SCALE = 2;
type EditorSection = "skinTone" | "hair" | "clothing" | "accessories";

const SECTION_LAYERS = {
  hair: ["hair"],
  clothing: ["top", "bottom", "overgarment"],
  accessories: ["footwear", "neckwear", "eyewear", "headwear"],
} as const satisfies Readonly<
  Record<Exclude<EditorSection, "skinTone">, readonly AppearanceLayer[]>
>;

function layersFor(section: Exclude<EditorSection, "skinTone">): readonly AppearanceLayer[] {
  return SECTION_LAYERS[section];
}

/** Edits a complete avatar without deciding when the draft is published. */
export function AvatarEditor({
  value,
  onChange,
}: {
  value: Avatar;
  onChange: (avatar: Avatar) => void;
}) {
  const t = useTranslations("avatar");
  const [section, setSection] = useState<EditorSection>("skinTone");
  const [layer, setLayer] = useState<AppearanceLayer>("top");

  function chooseSection(next: EditorSection) {
    setSection(next);
    if (next !== "skinTone") {
      const firstLayer = layersFor(next)[0];
      if (firstLayer) setLayer(firstLayer);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-center rounded-lg bg-muted py-3">
        <AvatarSprite avatar={value} scale={PREVIEW_SCALE} animated />
        <span className="sr-only">{t("label")}</span>
      </div>
      <div
        role="tablist"
        aria-label={t("sectionsLabel")}
        className="flex gap-1 overflow-x-auto pb-1"
      >
        {(["skinTone", "hair", "clothing", "accessories"] as const).map((candidate) => (
          <button
            key={candidate}
            type="button"
            role="tab"
            aria-selected={section === candidate}
            className="shrink-0 rounded-md border px-2 py-1 text-sm aria-selected:border-primary aria-selected:bg-accent pointer-coarse:min-h-11 pointer-coarse:min-w-11"
            onClick={() => chooseSection(candidate)}
          >
            {t(`sections.${candidate}`)}
          </button>
        ))}
      </div>
      {section === "skinTone" ? (
        <SkinTonePicker value={value} onChange={onChange} />
      ) : (
        <>
          {layersFor(section).length > 1 ? (
            <div
              role="tablist"
              aria-label={section === "clothing" ? t("clothingLabel") : t("accessoriesLabel")}
              className="flex gap-1 overflow-x-auto pb-1"
            >
              {layersFor(section).map((candidate) => (
                <button
                  key={candidate}
                  type="button"
                  role="tab"
                  aria-selected={layer === candidate}
                  className="shrink-0 rounded-md border px-2 py-1 text-sm aria-selected:border-primary aria-selected:bg-accent pointer-coarse:min-h-11 pointer-coarse:min-w-11"
                  onClick={() => setLayer(candidate)}
                >
                  {t(`layers.${candidate}`)}
                </button>
              ))}
            </div>
          ) : null}
          <AppearancePicker layer={layer} value={value} onChange={onChange} />
        </>
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
  const options = AVATAR_CATALOG[layer];
  const styles = [...new Set(options.map(({ style }) => style))];
  const selectedStyle = options.find(({ id }) => id === selected)?.style ?? styles[0];
  const visible = options.filter(({ style }) => style === selectedStyle);
  const name = useId();

  /** The option a style switches to: the current colour when the style has it. */
  function optionOfStyle(style: string) {
    const currentColor = options.find(({ id }) => id === selected)?.color;
    return (
      options.find((candidate) => candidate.style === style && candidate.color === currentColor) ??
      options.find((candidate) => candidate.style === style)
    );
  }

  function chooseStyle(style: string) {
    const option = optionOfStyle(style);
    if (option) choose(option.id);
  }

  function choose(choice: string | null) {
    onChange({ ...value, [layer]: choice } as Avatar);
  }

  return (
    <div className="flex flex-col gap-3">
      <fieldset className="flex flex-wrap gap-1.5">
        <legend className="mb-1 font-medium text-sm">{t("style")}</legend>
        {OPTIONAL_LAYERS.includes(layer as never) ? (
          <StyleChoice
            label={t("none")}
            avatar={{ ...value, [layer]: null } as Avatar}
            pressed={selected === null}
            onChoose={() => choose(null)}
          />
        ) : null}
        {styles.map((style) => (
          <StyleChoice
            key={style}
            label={t(`styles.${style}`)}
            avatar={{ ...value, [layer]: optionOfStyle(style)?.id ?? null } as Avatar}
            pressed={selectedStyle === style && selected !== null}
            onChoose={() => chooseStyle(style)}
          />
        ))}
      </fieldset>
      {selected !== null ? (
        <fieldset className="flex flex-wrap gap-1.5">
          <legend className="mb-1 font-medium text-sm">{t("color")}</legend>
          {visible.map((option) => {
            const avatar = { ...value, [layer]: option.id } as Avatar;
            return (
              <Choice
                key={option.id}
                name={name}
                checked={selected === option.id}
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

/** A style shown on the avatar as it would look wearing it, named below by its accessible label. */
function StyleChoice({
  label,
  avatar,
  pressed,
  onChoose,
}: {
  label: string;
  avatar: Avatar;
  pressed: boolean;
  onChoose: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      className="flex w-20 flex-col items-center gap-1 rounded-md border p-1 text-center text-xs leading-tight hover:bg-accent aria-pressed:border-primary aria-pressed:bg-accent"
      onClick={onChoose}
    >
      <AvatarSprite avatar={avatar} scale={CHOICE_SCALE} />
      {label}
    </button>
  );
}

function Choice({
  name,
  checked,
  label,
  avatar,
  onChoose,
}: {
  name: string;
  checked: boolean;
  label: string;
  avatar: Avatar;
  onChoose: () => void;
}) {
  return (
    <label className="flex cursor-pointer justify-center rounded-md border border-transparent p-1 hover:bg-accent pointer-coarse:min-w-11 has-checked:border-primary has-checked:bg-accent has-focus-visible:ring-3 has-focus-visible:ring-ring/50">
      <input
        type="radio"
        className="sr-only"
        name={name}
        checked={checked}
        onChange={onChoose}
        aria-label={label}
      />
      <AvatarSprite avatar={avatar} scale={CHOICE_SCALE} />
    </label>
  );
}
