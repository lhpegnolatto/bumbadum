import { SETTINGS_KEY } from "@/lib/settings-key.ts";

export const themeInitScript = `
let storedTheme;
try {
  const settings = JSON.parse(localStorage.getItem(${JSON.stringify(SETTINGS_KEY)}) || "{}");
  if (settings.theme === "light" || settings.theme === "dark") storedTheme = settings.theme;
} catch {}
const theme = storedTheme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
document.documentElement.classList.toggle("dark", theme === "dark");
document.documentElement.style.colorScheme = theme;
`;
