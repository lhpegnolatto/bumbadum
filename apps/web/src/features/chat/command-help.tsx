"use client";

import { type CommandId, commands } from "@bumbadum/chat";
import { useTranslations } from "use-intl";
import { useLocale } from "@/i18n/i18n-provider.tsx";

interface CommandHelp {
  id: CommandId;
  /** The command as typed in the UI language, with its argument hint: `/tocar <link ou nome>`. */
  usage: string;
  description: string;
}

/**
 * Every command from the command table, named in the UI language. A command
 * appears here once `chat.commands.<id>` has its strings.
 */
function useCommandHelp(): CommandHelp[] {
  const t = useTranslations("chat.commands");
  const { locale } = useLocale();
  return commands.all.map(({ id, names }) => {
    const args = t(`${id}.args`);
    return {
      id,
      usage: args ? `/${names[locale]} <${args}>` : `/${names[locale]}`,
      description: t(`${id}.description`),
    };
  });
}

/** The fixed line under the chat input: `/tocar <link ou nome> · /pular · /ajuda`. */
export function CommandHint({ id }: { id: string }) {
  const help = useCommandHelp();
  return (
    <p id={id} className="text-xs text-muted-foreground">
      {help.map(({ usage }) => usage).join(" · ")}
    </p>
  );
}

/** The answer to `/help`: the server sends only the code (ADR-0009). */
export function HelpNotice() {
  const t = useTranslations("chat.notice");
  const help = useCommandHelp();
  return (
    <div className="border-l-2 border-primary/40 pl-2 text-muted-foreground">
      <p>{t("help")}</p>
      <ul>
        {help.map(({ id, usage, description }) => (
          <li key={id}>
            <code className="font-medium text-foreground">{usage}</code> {description}
          </li>
        ))}
      </ul>
    </div>
  );
}
