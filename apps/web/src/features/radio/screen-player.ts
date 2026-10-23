/**
 * The room's screen, as the radio sync drives it. The YouTube IFrame player
 * is the real one; end-to-end runs use a fake behind the same interface, so
 * they never touch YouTube.
 */
export interface ScreenPlayer {
  /** Loads `videoId` and plays it from `startSeconds`. */
  load(videoId: string, startSeconds: number): void;
  /** Stops playback and clears the screen. */
  stop(): void;
  seek(seconds: number): void;
  setRate(rate: number): void;
  /** Seconds into the video while it plays; `undefined` while loading, buffering or stopped. */
  position(): number | undefined;
  /** `volume` from 0 to 100. */
  setVolume(volume: number, muted: boolean): void;
  destroy(): void;
}

/** Builds the screen inside `host`, which it owns until `destroy`. */
export type CreateScreenPlayer = (host: HTMLElement) => Promise<ScreenPlayer>;
