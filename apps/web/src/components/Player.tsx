"use client";

import { useEffect, useRef, useState } from "react";
import Head from "next/head";
import Image from "next/image";
import YouTubePlayer from "youtube-player";
import { YouTubePlayer as YouTubePlayerType } from "youtube-player/dist/types";
import { useSocket } from "@/hooks/useSocket";
import { SpeakerSimpleHigh, SpeakerSimpleSlash } from "@/components/Icons";
import { Progress } from "@/components/ui/progress";

function formatTime(time: number): string {
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);

  const formattedMinutes = minutes < 10 ? `${minutes}` : minutes.toString();
  const formattedSeconds = seconds < 10 ? `0${seconds}` : seconds.toString();

  return `${formattedMinutes}:${formattedSeconds}`;
}

export function Player() {
  const { socket } = useSocket({ namespace: "chat" });

  const playerRef = useRef<YouTubePlayerType | null>(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [music, setMusic] = useState<any>(null);

  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState<number | undefined>(undefined);

  const percent = Math.round((currentTime / duration) * 100);

  useEffect(() => {
    playerRef.current = YouTubePlayer("youtube-player", {
      videoId: music?.videoId,
      width: 0,
      height: 0,
    });

    (async () => {
      const playerVolume = await playerRef.current?.getVolume();

      setVolume((old) => {
        if (!old) {
          return playerVolume;
        }

        return old;
      });
    })();

    playerRef.current.playVideo();

    playerRef.current.on("stateChange", (e) => {
      if (e.data === 0) {
        setMusic(null);
        setDuration(0);
        setCurrentTime(0);
      }
    });

    (async () => {
      playerRef.current && setDuration(await playerRef.current.getDuration());
    })();

    return () => {
      playerRef.current && playerRef.current.destroy();
    };
  }, [music]);

  useEffect(() => {
    const newMusicEvent = (payload: any) => {
      setMusic((curr: any) => payload.music || curr);
    };

    socket && socket.on("message", newMusicEvent);

    return () => {
      socket && socket.off("message", newMusicEvent);
    };
  }, [socket]);

  useEffect(() => {
    setInterval(async function () {
      if (playerRef.current)
        setCurrentTime(await playerRef.current.getCurrentTime());
    }, 1000);
  }, []);

  useEffect(() => {
    if (playerRef.current && typeof volume === "number") {
      playerRef.current.setVolume(isMuted ? 0 : volume);
    }
  }, [volume, isMuted]);

  return (
    <div>
      <Head>
        <script src="https://www.youtube.com/iframe_api" async />
      </Head>

      <div id="youtube-player" style={{ height: 0 }} />

      <div
        data-state={music ? "playing" : "waiting"}
        className="h-[0px] bg-slate-800 transition-all data-[state=playing]:h-[88px]"
      >
        {music && (
          <div className="relative">
            <Progress
              value={percent}
              className="absolute top-0 h-1 rounded-none"
            />

            <div className="flex items-center gap-3 p-6">
              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-black">
                <Image
                  src={music?.thumb}
                  width={40}
                  height={40}
                  alt="Nevermind album cover"
                  style={{ objectFit: "fill" }}
                />
              </div>
              <div className="flex flex-1 flex-col justify-center gap-1">
                <p
                  className="max-w-[140px] overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold text-white"
                  aria-label={music?.title}
                >
                  {music?.title}
                </p>
                <p className="text-xs text-slate-400">{music?.channel}</p>
              </div>
              <div className="flex flex-col items-end justify-center">
                <div className="text-xs text-slate-400">
                  {formatTime(currentTime)}/{formatTime(duration)}
                </div>

                <button
                  className="p-1 text-white"
                  onClick={() => setIsMuted((old) => !old)}
                >
                  {isMuted ? <SpeakerSimpleSlash /> : <SpeakerSimpleHigh />}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
