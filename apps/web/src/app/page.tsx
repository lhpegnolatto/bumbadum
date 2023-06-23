import { Chat } from "@/components/Chat";
import { Game } from "@/components/Game";
import { ProfileDialog } from "@/components/ProfileDialog";

export default function Home() {
  return (
    <main className="h-screen bg-gray-900">
      <div className="m-auto grid h-full max-w-7xl grid-cols-[1fr_auto] gap-6 p-6">
        <Game />
        <Chat />

        <ProfileDialog />
      </div>
    </main>
  );
}
