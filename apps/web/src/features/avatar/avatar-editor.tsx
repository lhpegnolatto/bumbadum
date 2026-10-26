"use client";

import {
  type AppearanceLayer,
  AVATAR_CATALOG,
  type Avatar,
  OPTIONAL_LAYERS,
} from "@bumbadum/avatar";
import { useEffect, useEffectEvent, useId, useState } from "react";
import { useTranslations } from "use-intl";
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel.tsx";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip.tsx";
import { cn } from "@/lib/utils.ts";
import { AvatarSprite } from "./avatar-sprite.tsx";
import { type EditorTab, LayerIcon, TAB_FAMILIES } from "./layer-icons.tsx";
import { swatchColor } from "./swatches.ts";

const CARD_SCALE = 2;
/** The centred card is the preview, so it is drawn twice as large. */
const CENTRED_SCALE = 4;

/** One card of the carousel: the draft avatar wearing one style, or one skin tone. */
interface Card {
  key: string;
  label: string;
  avatar: Avatar;
}

/** Edits a complete avatar without deciding when the draft is published (ADR-0023). */
export function AvatarEditor({
  value,
  onChange,
}: {
  value: Avatar;
  onChange: (avatar: Avatar) => void;
}) {
  const [tab, setTab] = useState<EditorTab>("skinTone");

  return (
    <div className="flex flex-col gap-3">
      <EditorTabs value={tab} onChange={setTab} />
      {/* A fresh carousel per tab, opening on what the draft wears. */}
      <StyleCarousel key={tab} tab={tab} value={value} onChange={onChange} />
      {tab !== "skinTone" && <ColorSwatches layer={tab} value={value} onChange={onChange} />}
    </div>
  );
}

function EditorTabs({ value, onChange }: { value: EditorTab; onChange: (tab: EditorTab) => void }) {
  const t = useTranslations("avatar");
  return (
    <TooltipProvider>
      {/* Families wrap as wholes when a phone has no room for all nine icons in one row. */}
      <div
        role="tablist"
        aria-label={t("sectionsLabel")}
        className="flex flex-wrap justify-center gap-x-3 gap-y-1"
      >
        {TAB_FAMILIES.map((family, familyIndex) => (
          <div key={family.join()} className="flex">
            {family.map((tab, index) => (
              <Tooltip key={tab}>
                <TooltipTrigger
                  render={
                    <button
                      type="button"
                      role="tab"
                      aria-selected={value === tab}
                      aria-label={t(`layers.${tab}`)}
                      className="grid size-9 place-items-center rounded-md border border-transparent text-muted-foreground transition-transform duration-200 fill-mode-both animate-in fade-in zoom-in-50 hover:text-foreground aria-selected:scale-110 aria-selected:border-primary aria-selected:bg-accent aria-selected:text-foreground pointer-coarse:size-11 motion-reduce:animate-none motion-reduce:transition-none"
                      // The icons pop out one after another as the editor opens.
                      style={{ animationDelay: `${(familyIndex * 3 + index) * 20}ms` }}
                      onClick={() => onChange(tab)}
                    />
                  }
                >
                  <LayerIcon tab={tab} className="size-6" />
                </TooltipTrigger>
                <TooltipContent>{t(`layers.${tab}`)}</TooltipContent>
              </Tooltip>
            ))}
          </div>
        ))}
      </div>
    </TooltipProvider>
  );
}

/** The centred card is the one worn: settling on a card wears it, tapping a card centres it. */
function StyleCarousel({
  tab,
  value,
  onChange,
}: {
  tab: EditorTab;
  value: Avatar;
  onChange: (avatar: Avatar) => void;
}) {
  const t = useTranslations("avatar");
  const { cards, worn } = useCards(tab, value);
  const [api, setApi] = useState<CarouselApi>();
  // Read once: later changes come from the carousel itself, and re-reading would restart it.
  const [startIndex] = useState(worn);

  const wearCentred = useEffectEvent((centred: number) => {
    const card = cards[centred];
    if (card && centred !== worn) onChange(card.avatar);
  });

  useEffect(() => {
    if (!api) return;
    const onSelect = () => wearCentred(api.selectedScrollSnap());
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  return (
    <Carousel
      setApi={setApi}
      opts={{ align: "center", containScroll: false, startIndex }}
      aria-label={t(`layers.${tab}`)}
      className="mx-12 animate-in fade-in slide-in-from-right-4 duration-200 motion-reduce:animate-none"
    >
      {/* Headroom above the cards, so the lifted centred card is never clipped. */}
      <CarouselContent className="-ml-2 items-center pt-4 pb-2">
        {cards.map((card, index) => {
          const centred = index === worn;
          return (
            <CarouselItem key={card.key} className="basis-20 pl-2">
              <button
                type="button"
                aria-pressed={centred}
                className={cn(
                  "flex w-full flex-col items-center gap-1 rounded-lg border p-1 text-[0.625rem] leading-tight transition-all duration-200 motion-reduce:transition-none",
                  centred
                    ? "-translate-y-1 scale-105 border-primary bg-accent shadow-md"
                    : "opacity-60 hover:opacity-100",
                )}
                onClick={() => api?.scrollTo(index)}
              >
                <AvatarSprite
                  avatar={card.avatar}
                  scale={centred ? CENTRED_SCALE : CARD_SCALE}
                  animated={centred}
                />
                <span className="w-full truncate text-center">{card.label}</span>
              </button>
            </CarouselItem>
          );
        })}
      </CarouselContent>
      <CarouselPrevious aria-label={t("previous")} className="-left-11 pointer-coarse:size-11" />
      <CarouselNext aria-label={t("next")} className="-right-11 pointer-coarse:size-11" />
    </Carousel>
  );
}

/** The cards of a tab, and which one the draft wears. */
function useCards(tab: EditorTab, value: Avatar): { cards: Card[]; worn: number } {
  const t = useTranslations("avatar");
  if (tab === "skinTone") {
    const cards = [1, 2, 3, 4].map((skinTone) => ({
      key: String(skinTone),
      label: t("choice.skinTone", { number: skinTone }),
      avatar: { ...value, skinTone },
    }));
    return { cards, worn: value.skinTone - 1 };
  }

  const options = AVATAR_CATALOG[tab];
  const current = options.find(({ id }) => id === value[tab]);
  const styles = [...new Set(options.map(({ style }) => style))];
  /** The option a style switches to: the current colour when the style has it. */
  const optionOfStyle = (style: string) =>
    options.find((option) => option.style === style && option.color === current?.color) ??
    options.find((option) => option.style === style);

  const cards: Card[] = styles.map((style) => ({
    key: style,
    label: t(`styles.${style}`),
    avatar: { ...value, [tab]: optionOfStyle(style)?.id ?? null } as Avatar,
  }));
  if (!OPTIONAL_LAYERS.includes(tab as never)) {
    return { cards, worn: Math.max(0, current ? styles.indexOf(current.style) : 0) };
  }
  cards.unshift({ key: "none", label: t("none"), avatar: { ...value, [tab]: null } as Avatar });
  return { cards, worn: current ? styles.indexOf(current.style) + 1 : 0 };
}

/** The colours of the worn style; none for "none" or a style that comes in one colour. */
function ColorSwatches({
  layer,
  value,
  onChange,
}: {
  layer: AppearanceLayer;
  value: Avatar;
  onChange: (avatar: Avatar) => void;
}) {
  const t = useTranslations("avatar");
  const name = useId();
  const options = AVATAR_CATALOG[layer];
  const current = options.find(({ id }) => id === value[layer]);
  const colors = current ? options.filter(({ style }) => style === current.style) : [];
  if (!current || colors.length < 2) return null;

  return (
    <fieldset className="flex flex-wrap justify-center gap-1">
      <legend className="sr-only">{t("color")}</legend>
      {colors.map((option) => (
        <label
          key={option.id}
          className="grid size-8 cursor-pointer place-items-center rounded-full has-focus-visible:ring-3 has-focus-visible:ring-ring/50 pointer-coarse:size-11"
        >
          <input
            type="radio"
            className="peer sr-only"
            name={name}
            checked={option.id === current.id}
            onChange={() => onChange({ ...value, [layer]: option.id } as Avatar)}
            aria-label={t("choice.appearance", {
              style: t(`styles.${option.style}`),
              color: t(`colors.${option.color}`),
            })}
          />
          <span
            aria-hidden
            className="size-6 rounded-full border ring-offset-2 ring-offset-background peer-checked:ring-2 peer-checked:ring-primary"
            style={{ background: swatchColor(layer, option.color) }}
          />
        </label>
      ))}
    </fieldset>
  );
}
