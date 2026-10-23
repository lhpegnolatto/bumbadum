import type { CreateScreenPlayer } from "./screen-player.ts";

/**
 * A stand-in screen for end-to-end runs (`NEXT_PUBLIC_E2E=1`): it plays by
 * the local clock and shows which video it plays, without loading YouTube.
 */
export const createFakeScreenPlayer: CreateScreenPlayer = async (host) => {
  const label = document.createElement("p");
  label.className = "flex size-full items-center justify-center bg-black text-sm text-white";
  host.append(label);

  let playing: { videoId: string; startSeconds: number; since: number; rate: number } | undefined;

  function position() {
    return (
      playing && playing.startSeconds + ((performance.now() - playing.since) / 1000) * playing.rate
    );
  }

  return {
    load(videoId, startSeconds) {
      playing = { videoId, startSeconds, since: performance.now(), rate: 1 };
      label.textContent = `Fake screen: ${videoId}`;
    },
    stop() {
      playing = undefined;
      label.textContent = "";
    },
    seek(seconds) {
      if (playing) playing = { ...playing, startSeconds: seconds, since: performance.now() };
    },
    setRate(rate) {
      const at = position();
      if (playing && at !== undefined) {
        playing = { ...playing, startSeconds: at, since: performance.now(), rate };
      }
    },
    position,
    setVolume() {},
    destroy() {
      label.remove();
    },
  };
};
