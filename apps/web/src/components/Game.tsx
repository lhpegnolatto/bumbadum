"use client";

import { GameEngine } from "@/game";
import { FinnTheHuman } from "@/components/Icons";
import { useProfileContext } from "@/contexts/ProfileContext";

export function Game() {
  const { setIsProfileDialogOpen } = useProfileContext();

  return (
    <div className="relative w-full overflow-hidden rounded-xl bg-gray-800 shadow">
      <GameEngine />

      <button
        className="absolute bottom-3 left-3 rounded-lg bg-gray-700 p-3 text-white"
        onClick={() => setIsProfileDialogOpen(true)}
      >
        <FinnTheHuman size={20} />
      </button>
    </div>
  );
}
