import type { Locale } from "./locale.ts";
import type { Messages } from "./messages.ts";

declare module "use-intl" {
  interface AppConfig {
    Locale: Locale;
    Messages: Messages;
  }
}
