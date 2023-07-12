"use client";

import { GameEngine } from "@/game";
import { FinnTheHuman } from "@/components/Icons";
import { useProfileContext } from "@/contexts/ProfileContext";
import { Button } from "@/components/ui/button";

export function Game() {
  const { setIsProfileDialogOpen } = useProfileContext();

  return (
    <div className="relative w-full overflow-hidden rounded-xl bg-slate-900 shadow">
      <GameEngine />

      <Button
        variant="secondary"
        className="absolute bottom-3 left-3"
        onClick={() => setIsProfileDialogOpen(true)}
      >
        <FinnTheHuman size={20} />
      </Button>
    </div>
  );
}
