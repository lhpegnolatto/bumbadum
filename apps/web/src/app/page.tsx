import { DesktopOnlyNotice } from "@/features/home/desktop-only-notice.tsx";
import { HomeTagline } from "@/features/home/home-tagline.tsx";
import { LanguageSwitcher } from "@/features/home/language-switcher.tsx";
import { ServerWakeUp } from "@/features/home/server-wake-up.tsx";
import { JoinForm } from "@/features/room/join-form.tsx";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 p-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-heading text-3xl font-semibold">bumbadum</h1>
        <HomeTagline />
      </header>
      <DesktopOnlyNotice />
      <JoinForm />
      <LanguageSwitcher />
      <ServerWakeUp />
    </main>
  );
}
