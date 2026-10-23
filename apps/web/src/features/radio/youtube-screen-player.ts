import type { CreateScreenPlayer } from "./screen-player.ts";

/** The slice of the YouTube IFrame Player API the screen uses. */
interface YouTubePlayer {
  loadVideoById(options: { videoId: string; startSeconds?: number }): void;
  stopVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  setPlaybackRate(rate: number): void;
  getCurrentTime(): number;
  getPlaybackRate(): number;
  getPlayerState(): number;
  setVolume(volume: number): void;
  mute(): void;
  unMute(): void;
  destroy(): void;
}

interface YouTubeApi {
  Player: new (
    element: HTMLElement,
    options: {
      width: string;
      height: string;
      playerVars: Record<string, string | number>;
      events: { onReady: () => void };
    },
  ) => YouTubePlayer;
}

declare global {
  interface Window {
    YT?: YouTubeApi;
    onYouTubeIframeAPIReady?: () => void;
  }
}

const API_URL = "https://www.youtube.com/iframe_api";
const PLAYING = 1;

let api: Promise<YouTubeApi> | undefined;

function loadApi(): Promise<YouTubeApi> {
  api ??= new Promise((resolve) => {
    window.onYouTubeIframeAPIReady = () => {
      if (window.YT) resolve(window.YT);
    };
    const script = document.createElement("script");
    script.src = API_URL;
    document.head.append(script);
  });
  return api;
}

/**
 * The real screen: the YouTube IFrame player, always visible and never covered
 * (ADR-0006, ADR-0010).
 */
export const createYouTubeScreenPlayer: CreateScreenPlayer = async (host) => {
  const YT = await loadApi();
  // The API replaces `mount` with its iframe. This player owns only `frame`,
  // so destroying it never touches another player in the same host.
  const frame = document.createElement("div");
  frame.className = "size-full";
  const mount = document.createElement("div");
  frame.append(mount);
  host.append(frame);
  const player = await new Promise<YouTubePlayer>((resolve) => {
    const created: YouTubePlayer = new YT.Player(mount, {
      width: "100%",
      height: "100%",
      playerVars: { playsinline: 1, rel: 0, origin: window.location.origin },
      events: { onReady: () => resolve(created) },
    });
  });

  // getCurrentTime() only changes when the iframe reports in, a few times a
  // second; between reports, extrapolate from the last change (ticket 06).
  let lastRaw: number | undefined;
  let lastRawAt = 0;

  return {
    load(videoId, startSeconds) {
      lastRaw = undefined;
      player.loadVideoById({ videoId, startSeconds });
    },
    stop() {
      lastRaw = undefined;
      player.stopVideo();
    },
    seek(seconds) {
      lastRaw = undefined;
      player.seekTo(seconds, true);
    },
    setRate(rate) {
      player.setPlaybackRate(rate);
    },
    position() {
      if (player.getPlayerState() !== PLAYING) return undefined;
      const raw = player.getCurrentTime();
      const now = performance.now();
      if (raw !== lastRaw) {
        lastRaw = raw;
        lastRawAt = now;
      }
      return raw + ((now - lastRawAt) / 1000) * player.getPlaybackRate();
    },
    setVolume(volume, muted) {
      player.setVolume(volume);
      if (muted) player.mute();
      else player.unMute();
    },
    destroy() {
      player.destroy();
      frame.remove();
    },
  };
};
