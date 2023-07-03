"use client";

import { useEffect, useRef, useState } from "react";
import Head from "next/head";
import Image from "next/image";
import YouTubePlayer from "youtube-player";
import { YouTubePlayer as YouTubePlayerType } from "youtube-player/dist/types";
import { useSocket } from "@/hooks/useSocket";

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

  const percent = Math.round((currentTime / duration) * 100);

  useEffect(() => {
    playerRef.current = YouTubePlayer("youtube-player", {
      videoId: music?.videoId,
      width: 0,
      height: 0,
    });
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

  return (
    <div>
      <Head>
        <script src="https://www.youtube.com/iframe_api" async />
      </Head>

      <div id="youtube-player" style={{ height: 0 }} />

      <div
        data-state={music ? "playing" : "waiting"}
        className="h-[0px] bg-gray-700 transition-all data-[state=playing]:h-[108px]"
      >
        {music && (
          <>
            <div className="h-1 w-full bg-gray-500">
              <div
                className="h-1 bg-indigo-600"
                style={{ width: `${percent}%` }}
              />
            </div>

            <div className="flex items-center gap-3 p-6">
              <div className="h-10 w-10 overflow-hidden rounded-lg">
                <Image
                  src={music?.thumb}
                  width={40}
                  height={40}
                  alt="Nevermind album cover"
                />
              </div>
              <div className="flex flex-1 flex-col justify-center">
                <p className="text-sm font-semibold text-white">
                  {music?.title}
                </p>
                <p className="text-xs text-gray-400">{music?.channel}</p>
              </div>
              <div className="text-xs text-gray-400">
                {formatTime(currentTime)}/{formatTime(duration)}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
