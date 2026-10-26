"use client";

import { type Avatar, DEFAULT_AVATAR } from "@bumbadum/avatar";
import {
  CHAT_MESSAGE,
  type ChatMessage,
  CONFETTI_THROW_MESSAGE,
  NICKNAME_MAX_LENGTH,
  type RoomState,
} from "@bumbadum/protocol";
import type { Room } from "@colyseus/sdk";
import {
  CarFrontIcon,
  LogOutIcon,
  MonitorIcon,
  PartyPopperIcon,
  ShirtIcon,
  SmartphoneIcon,
  SparklesIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type CSSProperties, useEffect, useRef, useState } from "react";
import { useTranslations } from "use-intl";
import { Alert, AlertDescription } from "@/components/ui/alert.tsx";
import { Button } from "@/components/ui/button.tsx";
import { useDance } from "@/features/avatar/use-dance.ts";
import { useWearAvatar } from "@/features/avatar/use-wear-avatar.ts";
import { WardrobePanel } from "@/features/avatar/wardrobe-panel.tsx";
import { ChatHistoryPanel } from "@/features/chat/chat-panel.tsx";
import { NowPlayingCaption } from "@/features/radio/now-playing.tsx";
import { QueueList } from "@/features/radio/queue-list.tsx";
import { RadioProvider } from "@/features/radio/radio-provider.tsx";
import { RadioScreen } from "@/features/radio/radio-screen.tsx";
import { useServerClock } from "@/features/radio/use-server-clock.ts";
import { VolumeControl } from "@/features/radio/volume-control.tsx";
import { SettingsControl } from "@/features/settings/settings-control.tsx";
import { ThemeToggle } from "@/features/theme/theme-toggle.tsx";
import { useSettings } from "@/lib/local-settings.ts";
import { AnalogueStick } from "./analogue-stick.tsx";
import { type CarContext, GameCanvas, type GameCanvasHandle } from "./game-canvas.tsx";
import { PlayerList } from "./player-list.tsx";
import {
  useCompactLayout,
  useCompactTopInset,
  useRoomNotice,
  useVisibleViewport,
} from "./room-layout.ts";
import {
  ChatComposerDock,
  COMPACT_SHEET,
  type RoomPanel,
  RoomPanelControls,
  RoomPanelFrame,
} from "./room-panel-dock.tsx";
import { useChangeNickname } from "./use-change-nickname.ts";
import { useExitPresence } from "./use-exit-presence.ts";
import { type PresentPlayer, useRoom } from "./use-room.ts";
import { WaitingScreen, WaitingTimedOut } from "./waiting-screen.tsx";

export function RoomView({ slug }: { slug: string }) {
  const settings = useSettings();
  const nickname = settings?.nickname;
  const avatar = settings?.avatar ?? DEFAULT_AVATAR;
  const router = useRouter();
  const [clickedJoin, setClickedJoin] = useState(hasClickedOnPage);

  useEffect(() => {
    if (!nickname) router.replace("/");
  }, [nickname, router]);

  if (!nickname) return null;
  if (!clickedJoin) return <JoinGate nickname={nickname} onJoin={() => setClickedJoin(true)} />;
  return <ConnectedRoom slug={slug} nickname={nickname} avatar={avatar} />;
}

/**
 * Browsers unlock autoplay only after a click on the page. Coming from the
 * home page's Join button that click already happened; a shared link or a
 * reload asks for it here, before joining.
 */
function hasClickedOnPage(): boolean {
  return typeof navigator !== "undefined" && navigator.userActivation?.hasBeenActive === true;
}

function JoinGate({ nickname, onJoin }: { nickname: string; onJoin: () => void }) {
  const t = useTranslations("room");
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 p-6">
      <FloatingThemeToggle />
      <p>{t("joinGate", { nickname })}</p>
      <Button onClick={onJoin}>{t("join")}</Button>
    </main>
  );
}

function ConnectedRoom({
  slug,
  nickname,
  avatar,
}: {
  slug: string;
  nickname: string;
  avatar: Avatar;
}) {
  const t = useTranslations();
  const { status, players, retry } = useRoom(slug, nickname, avatar);

  if (!status) return null;
  if (status.kind === "waiting") {
    return (
      <>
        <FloatingThemeToggle />
        <WaitingScreen {...status} />
      </>
    );
  }
  if (status.kind === "timed-out") {
    return (
      <>
        <FloatingThemeToggle />
        <WaitingTimedOut onRetry={retry} />
      </>
    );
  }
  if (status.kind === "rejected") {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 p-6">
        <FloatingThemeToggle />
        <Alert variant="destructive">
          <AlertDescription>
            {t(`joinRejection.${status.rejection}`, { max: NICKNAME_MAX_LENGTH })}
          </AlertDescription>
        </Alert>
        <Button render={<Link href="/" />} nativeButton={false} variant="outline">
          {t("room.backHome")}
        </Button>
      </main>
    );
  }

  return <JoinedRoom room={status.room} players={players} worn={avatar} nickname={nickname} />;
}

function JoinedRoom({
  room,
  players,
  worn,
  nickname,
}: {
  room: Room<unknown, RoomState>;
  players: PresentPlayer[];
  worn: Avatar;
  nickname: string;
}) {
  const t = useTranslations("wardrobe");
  const roomT = useTranslations("room");
  const notice = useRoomNotice();
  const screenBlockRef = useRef<HTMLDivElement>(null);
  const topInset = useCompactTopInset(screenBlockRef);
  const visibleViewport = useVisibleViewport();
  const compact = useCompactLayout();
  const [activeInterface, setActiveInterface] = useState<RoomInterface>(null);
  const [hasUnreadChat, setHasUnreadChat] = useState(false);
  const [carContext, setCarContext] = useState<CarContext>({ carId: "", nearbyCarId: null });
  const activePanel: RoomPanel = isRoomPanel(activeInterface) ? activeInterface : null;
  const wardrobeOpen = activeInterface === "wardrobe";
  // In the compact layout an open panel or the Wardrobe is a sheet over the world: the player
  // stands still and the floating controls step aside.
  const sheetOpen = compact && activePanel !== null;
  const hiddenUnderSheet = activePanel || wardrobeOpen ? "compact:hidden" : "";
  const visiblePanel = useExitPresence(activePanel);
  const visibleWardrobe = useExitPresence(wardrobeOpen ? "wardrobe" : null);
  // Each opening starts a fresh draft, even one during the previous closing animation.
  const [wardrobeOpenings, setWardrobeOpenings] = useState(0);
  const activePanelRef = useRef(activePanel);
  const wear = useWearAvatar(room);
  const changeNickname = useChangeNickname(room);
  const dance = useDance(room);
  const serverNow = useServerClock(room);
  const { stop: stopDancing, toggle: toggleDance } = dance;
  const canvasRef = useRef<GameCanvasHandle>(null);
  const wardrobeOpenRef = useRef(wardrobeOpen);

  useEffect(() => {
    wardrobeOpenRef.current = wardrobeOpen;
    // Trying on clothes ends a dance.
    if (wardrobeOpen) {
      stopDancing();
      setWardrobeOpenings((openings) => openings + 1);
    }
  }, [wardrobeOpen, stopDancing]);

  useEffect(() => {
    function danceOnF(event: KeyboardEvent) {
      if (event.key.toLowerCase() !== "f" || event.repeat || event.defaultPrevented) return;
      if (event.ctrlKey || event.metaKey || event.altKey || isTextField(event.target)) return;
      if (wardrobeOpenRef.current) return;
      toggleDance();
    }
    document.addEventListener("keydown", danceOnF);
    return () => document.removeEventListener("keydown", danceOnF);
  }, [toggleDance]);

  useEffect(() => {
    function throwConfettiOnE(event: KeyboardEvent) {
      if (event.key.toLowerCase() !== "e" || event.repeat || event.defaultPrevented) return;
      if (event.ctrlKey || event.metaKey || event.altKey || isTextField(event.target)) return;
      if (wardrobeOpenRef.current) return;
      room.send(CONFETTI_THROW_MESSAGE);
    }
    document.addEventListener("keydown", throwConfettiOnE);
    return () => document.removeEventListener("keydown", throwConfettiOnE);
  }, [room]);

  useEffect(() => {
    activePanelRef.current = activePanel;
    if (activePanel === "chat") setHasUnreadChat(false);
  }, [activePanel]);

  useEffect(
    () =>
      room.onMessage<ChatMessage>(CHAT_MESSAGE, (message) => {
        if (message.senderId !== room.sessionId && activePanelRef.current !== "chat") {
          setHasUnreadChat(true);
        }
      }),
    [room],
  );

  useEffect(() => {
    // C opens the Wardrobe, and closes it again discarding the draft.
    function toggleWardrobeOnC(event: KeyboardEvent) {
      if (event.key.toLowerCase() !== "c" || event.repeat || event.defaultPrevented) return;
      if (event.ctrlKey || event.metaKey || event.altKey || isTextField(event.target)) return;
      setActiveInterface((current) => (current === "wardrobe" ? null : "wardrobe"));
    }
    document.addEventListener("keydown", toggleWardrobeOnC);
    return () => document.removeEventListener("keydown", toggleWardrobeOnC);
  }, []);

  useEffect(() => {
    function closePanel(event: KeyboardEvent) {
      if (event.key !== "Escape" || event.defaultPrevented || isTextField(event.target)) return;
      setActiveInterface(null);
    }
    document.addEventListener("keydown", closePanel);
    return () => document.removeEventListener("keydown", closePanel);
  }, []);

  function togglePanel(panel: Exclude<RoomPanel, null>) {
    setActiveInterface((current) => (current === panel ? null : panel));
  }

  function setSettings(nextOpen: boolean) {
    setActiveInterface((current) => {
      if (nextOpen) return "settings";
      return current === "settings" ? null : current;
    });
  }

  return (
    // Compact viewports (ADR-0018) restyle this same tree, so crossing the boundary never remounts
    // the Screen, the canvas or the connection.
    <main
      style={
        {
          "--room-top-inset": `${topInset}px`,
          // Above iOS Safari's on-screen keyboard (see useVisibleViewport).
          ...(visibleViewport && { top: visibleViewport.top, height: visibleViewport.height }),
        } as CSSProperties
      }
      // On desktop the rail and the Wardrobe end one gap above the bottom buttons (at most h-8), so
      // they and the Message input docked in Chat never sit under them.
      className="relative h-dvh overflow-hidden [--room-above-controls:calc(var(--room-safe-bottom)_+_3.25rem)] [--room-overlay-edge:1.5rem] [--room-overlay-gap:1rem] [--room-rail-bottom:calc(var(--room-overlay-edge)_+_2rem_+_var(--room-overlay-gap))] [--room-rail-width:clamp(400px,32vw,480px)] [--room-safe-bottom:calc(env(safe-area-inset-bottom)_+_0.75rem)]"
    >
      <div
        aria-hidden={notice !== null}
        inert={notice !== null}
        className={`relative h-full ${notice ? "invisible pointer-events-none" : ""}`}
      >
        {/* The world owns the viewport; room interface overlays it without changing its scale (ADR-0014). */}
        <div className="absolute inset-0">
          <GameCanvas
            ref={canvasRef}
            room={room}
            walking={!wardrobeOpen && !sheetOpen && !carContext.carId}
            topInset={topInset}
            serverNow={serverNow}
            onCarContextChange={setCarContext}
          />
          {visibleWardrobe.present && (
            <WardrobePanel
              key={wardrobeOpenings}
              worn={worn}
              nickname={nickname}
              open={visibleWardrobe.open}
              onWear={wear}
              onRename={changeNickname}
              onClose={() => setActiveInterface(null)}
              // Beside the rail on desktop, at most 34rem wide and as tall as its content, scrolling
              // once it would reach the Wardrobe and Settings buttons; in the compact layout, the
              // sheet below the Radio strip, above the rail's box.
              className={`absolute top-[var(--room-overlay-edge)] right-[calc(var(--room-rail-width)_+_var(--room-overlay-edge)_+_var(--room-overlay-gap))] left-[var(--room-overlay-edge)] z-10 max-h-[calc(100%_-_var(--room-overlay-edge)_-_var(--room-rail-bottom))] max-w-[34rem] compact:inset-x-0 compact:top-[var(--room-top-inset)] compact:bottom-0 compact:z-30 compact:max-h-none compact:max-w-none compact:backdrop-blur-none ${COMPACT_SHEET}`}
            />
          )}
        </div>
        {(carContext.carId || carContext.nearbyCarId) && (
          <div className="absolute bottom-[var(--room-overlay-edge)] left-1/2 z-30 -translate-x-1/2 compact:bottom-[calc(var(--room-safe-bottom)_+_8rem)]">
            <Button
              variant="secondary"
              size="sm"
              aria-label={carContext.carId ? roomT("car.exit") : roomT("car.enter")}
              onClick={() =>
                carContext.carId ? canvasRef.current?.exitCar() : canvasRef.current?.enterCar()
              }
            >
              {carContext.carId ? <LogOutIcon /> : <CarFrontIcon />}
              {carContext.carId ? roomT("car.exit") : roomT("car.enter")}
            </Button>
          </div>
        )}
        <div
          className={`absolute bottom-[var(--room-overlay-edge)] left-[var(--room-overlay-edge)] z-20 flex items-center gap-2 compact:bottom-[var(--room-safe-bottom)] compact:left-3 compact:flex-col ${hiddenUnderSheet}`}
        >
          <Button
            variant="secondary"
            size="sm"
            className="compact:size-11 compact:px-0"
            aria-expanded={wardrobeOpen}
            aria-keyshortcuts="C"
            title={t("shortcut")}
            onClick={() =>
              setActiveInterface((current) => (current === "wardrobe" ? null : "wardrobe"))
            }
          >
            <ShirtIcon />
            <span className="compact:sr-only">{t("open")}</span>
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="compact:size-11 compact:px-0"
            aria-pressed={dance.dancing}
            aria-keyshortcuts="F"
            // Trying on clothes ends a dance, so none starts while the Wardrobe is open.
            disabled={wardrobeOpen}
            title={roomT("danceShortcut")}
            onClick={toggleDance}
          >
            <PartyPopperIcon />
            <span className="compact:sr-only">{roomT("dance")}</span>
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="compact:size-11 compact:px-0"
            aria-keyshortcuts="E"
            // A throw ends a dance, so, like one, none starts while the Wardrobe is open.
            disabled={wardrobeOpen}
            title={roomT("confettiShortcut")}
            onClick={() => room.send(CONFETTI_THROW_MESSAGE)}
          >
            <SparklesIcon />
            <span className="compact:sr-only">{roomT("confetti")}</span>
          </Button>
          <SettingsControl open={activeInterface === "settings"} onOpenChange={setSettings} />
        </div>
        <ChatComposerDock room={room} active={activePanel} hidden={wardrobeOpen} />
        <div
          className={`absolute right-[var(--room-overlay-edge)] bottom-[var(--room-overlay-edge)] z-20 compact:right-3 compact:bottom-[var(--room-safe-bottom)] ${hiddenUnderSheet}`}
        >
          <RoomPanelControls
            active={activePanel}
            hasUnreadChat={hasUnreadChat}
            onToggle={togglePanel}
          />
        </div>
        {/* Bottom centre on a phone; above the Wardrobe and Settings buttons on a touch tablet. */}
        <AnalogueStick
          hidden={activeInterface !== null}
          onSteer={(direction) => canvasRef.current?.steer(direction)}
          className="absolute bottom-[calc(var(--room-overlay-edge)_+_env(safe-area-inset-bottom)_+_2.75rem)] left-[var(--room-overlay-edge)] z-20 compact:bottom-[var(--room-safe-bottom)] compact:left-[calc(50%_-_3.5rem)]"
        />
        {/* The Screen and Radio stay visible; one optional room panel uses the space beneath them. */}
        <aside
          className={`absolute top-[var(--room-overlay-edge)] right-[var(--room-overlay-edge)] bottom-[var(--room-rail-bottom)] z-10 flex w-[var(--room-rail-width)] flex-col gap-[var(--room-overlay-gap)] compact:inset-x-0 compact:top-0 compact:w-auto compact:gap-0 compact:pt-[env(safe-area-inset-top)] ${
            // In the compact layout the open panel is a sheet down to the bottom edge.
            visiblePanel.present
              ? "compact:bottom-0"
              : "compact:bottom-[var(--room-above-controls)]"
          }`}
        >
          <RadioProvider room={room}>
            <div ref={screenBlockRef} className="flex shrink-0 flex-col gap-2 compact:gap-0">
              <RadioScreen paused={notice !== null} serverNow={serverNow} />
              <div className="flex items-center justify-end gap-2 rounded-lg border bg-background/95 p-2 shadow-lg backdrop-blur-sm compact:rounded-none compact:border-x-0 compact:border-t-0 compact:px-3 compact:py-1 compact:shadow-none">
                <NowPlayingCaption />
                <VolumeControl />
              </div>
            </div>
            {visiblePanel.present ? (
              <RoomPanelFrame
                panel={visiblePanel.present}
                open={visiblePanel.open}
                hasUnreadChat={hasUnreadChat}
                onSelect={setActiveInterface}
                onClose={() => setActiveInterface(null)}
              >
                {visiblePanel.present === "chat" ? (
                  // Room for the Message input docked over the panel's bottom.
                  <div className="flex min-h-0 flex-1 pb-20">
                    <ChatHistoryPanel room={room} />
                  </div>
                ) : null}
                {visiblePanel.present === "queue" ? <QueueList /> : null}
                {visiblePanel.present === "players" ? (
                  <PlayerList players={players} me={room.sessionId} />
                ) : null}
              </RoomPanelFrame>
            ) : null}
          </RadioProvider>
        </aside>
      </div>
      {notice && (
        <div className="absolute inset-0 z-50 grid place-items-center bg-background p-6">
          <Alert className="max-w-md">
            {notice === "rotate" ? <SmartphoneIcon /> : <MonitorIcon />}
            <AlertDescription>{roomT(notice)}</AlertDescription>
          </Alert>
        </div>
      )}
    </main>
  );
}

type RoomInterface = Exclude<RoomPanel, null> | "settings" | "wardrobe" | null;

function isRoomPanel(value: RoomInterface): value is Exclude<RoomPanel, null> {
  return value === "chat" || value === "queue" || value === "players";
}

function FloatingThemeToggle() {
  return (
    <div className="fixed top-6 right-6 z-10">
      <ThemeToggle />
    </div>
  );
}

/** Keys typed into a text field, such as the chat, are text, not shortcuts. */
function isTextField(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || target.closest("input, textarea, select") !== null;
}
