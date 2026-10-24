import type { Metadata, Viewport } from "next";
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

// The world reaches under a phone's notch and gesture bar, and the on-screen keyboard shrinks the
// layout instead of covering the chat (ADR-0018).
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
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
