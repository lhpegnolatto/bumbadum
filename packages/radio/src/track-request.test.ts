import { describe, expect, it } from "vitest";
import { readTrackRequest } from "./index.ts";

const video = (videoId: string) => ({ kind: "video", videoId });

describe("readTrackRequest", () => {
  it("reads a bare 11-character word as a video ID that may also be a name to search for", () => {
    expect(readTrackRequest("dQw4w9WgXcQ")).toEqual({
      kind: "video-or-name",
      videoId: "dQw4w9WgXcQ",
      name: "dQw4w9WgXcQ",
    });
    expect(readTrackRequest("  rickrolling ")).toEqual({
      kind: "video-or-name",
      videoId: "rickrolling",
      name: "rickrolling",
    });
  });

  it("reads the video of every common YouTube link", () => {
    const links = [
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      "http://youtube.com/watch?v=dQw4w9WgXcQ&t=42s",
      "https://m.youtube.com/watch?v=dQw4w9WgXcQ",
      "https://music.youtube.com/watch?v=dQw4w9WgXcQ&feature=share",
      "https://youtu.be/dQw4w9WgXcQ?si=abc",
      "https://www.youtube.com/embed/dQw4w9WgXcQ",
      "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
      "https://www.youtube.com/shorts/dQw4w9WgXcQ",
      "https://www.youtube.com/live/dQw4w9WgXcQ?feature=shared",
      "www.youtube.com/watch?v=dQw4w9WgXcQ",
      "youtu.be/dQw4w9WgXcQ",
      "HTTPS://WWW.YOUTUBE.COM/watch?v=dQw4w9WgXcQ",
    ];
    for (const link of links) expect(readTrackRequest(link), link).toEqual(video("dQw4w9WgXcQ"));
  });

  it("plays only the video a playlist link names", () => {
    expect(
      readTrackRequest("https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PL1234567890&index=3"),
    ).toEqual(video("dQw4w9WgXcQ"));
  });

  it("refuses a link that names no video, such as a bare playlist or a channel", () => {
    expect(readTrackRequest("https://www.youtube.com/playlist?list=PL1234567890")).toEqual({
      kind: "not-a-video",
    });
    expect(readTrackRequest("https://www.youtube.com/@somechannel")).toEqual({
      kind: "not-a-video",
    });
    expect(readTrackRequest("https://www.youtube.com/watch?v=short")).toEqual({
      kind: "not-a-video",
    });
  });

  it("refuses a link to any other site", () => {
    expect(readTrackRequest("https://example.com/watch?v=dQw4w9WgXcQ")).toEqual({
      kind: "not-a-video",
    });
    expect(readTrackRequest("https://youtube.com.evil.example/watch?v=dQw4w9WgXcQ")).toEqual({
      kind: "not-a-video",
    });
  });

  it("reads anything else as a name to search for", () => {
    expect(readTrackRequest("  never gonna   give you up ")).toEqual({
      kind: "name",
      name: "never gonna   give you up",
    });
    expect(readTrackRequest("despacito")).toEqual({ kind: "name", name: "despacito" });
  });

  it("reports a request with nothing in it", () => {
    expect(readTrackRequest("")).toEqual({ kind: "missing" });
    expect(readTrackRequest("   ")).toEqual({ kind: "missing" });
  });
});
