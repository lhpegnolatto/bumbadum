import type { Metadata } from "next";
import "./globals.css";
import { Geist } from "next/font/google";
import { themeInitScript } from "@/features/theme/theme-init-script.ts";
import { I18nProvider } from "@/i18n/i18n-provider.tsx";
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "bumbadum",
  icons: "/bumbadum.svg",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)} suppressHydrationWarning>
      <head>
        <script>{themeInitScript}</script>
      </head>
      <body>
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
