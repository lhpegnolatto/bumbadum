"use client";

import { CaretDown, MapTrifold, Smiley } from "@/components/Icons";
import { ChangeEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import { useSocket } from "@/hooks/useSocket";

import { Player } from "./Player";

type Message = {
  sendedAt: string;
  author: string;
  authorColor: "pink" | "green" | "blue" | "orange";
  message: string;
};

export function Chat() {
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);

  const { socket } = useSocket({ namespace: "chat" });
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState<string>("");

  const authorColorsStyles = {
    pink: "text-pink-400",
    blue: "text-blue-400",
    green: "text-green-400",
    orange: "text-orange-400",
  };

  function handleOnInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    const profileStorage = JSON.parse(
      localStorage?.getItem("bumbadum-profile") || "{}"
    );

    if (event.key === "Enter") {
      socket &&
        socket.emit("message", {
          author: profileStorage.name,
          authorColor: profileStorage.color,
          message: inputValue,
        });
      setInputValue("");
    }
  }

  function handleOnInputChange(event: ChangeEvent<HTMLInputElement>) {
    setInputValue(event.target.value);
  }

  useEffect(() => {
    const newMessageEvent = (payload: any) => {
      setMessages((curr) => [...curr, payload]);
    };

    socket && socket.on("message", newMessageEvent);

    return () => {
      socket && socket.off("message", newMessageEvent);
    };
  }, [socket]);

  useEffect(() => {
    messagesContainerRef.current?.scrollTo({
      top: messagesContainerRef.current.scrollHeight,
    });
  }, [messages]);

  return (
    <div className="flex w-80 flex-col gap-6 overflow-hidden rounded-xl bg-gray-800 shadow">
      <div className="flex h-24 items-center justify-between bg-gray-700 px-4 shadow">
        <button className="flex items-center p-2">
          <p className="text-sm font-semibold text-gray-100">Room 1 🤘</p>

          <CaretDown className="text-white" />
        </button>

        <button className="p-2 text-xl">
          <MapTrifold className="text-white" />
        </button>
      </div>
      <div
        ref={messagesContainerRef}
        // eslint-disable-next-line tailwindcss/no-custom-classname
        className="scrollbar scrollbar-w-[8px] relative flex h-full max-h-full flex-col gap-2 overflow-auto px-6"
      >
        {messages.map(({ sendedAt, author, authorColor, message }, index) => (
          <p key={index} className="leading-none">
            <text className="mr-1 text-xs text-gray-400">
              {new Date(sendedAt).toLocaleTimeString("pt", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </text>
            <text className="mr-1 text-xs text-gray-50">
              <strong className={authorColorsStyles[authorColor]}>
                {author}
              </strong>
              :
            </text>
            <text className="text-xs text-gray-50">{message}</text>
          </p>
        ))}
      </div>
      <div className="px-6">
        <div className="relative ">
          <input
            className="flex h-10 w-full cursor-text items-center rounded-lg bg-gray-700 pl-4 pr-14 text-xs font-semibold text-gray-400 shadow"
            placeholder="Type here your message :)"
            onKeyDown={handleOnInputKeyDown}
            value={inputValue}
            onChange={handleOnInputChange}
          />
          <button className="absolute right-0 top-[50%] translate-y-[-50%] rounded-lg bg-gray-700 p-3 transition-colors hover:bg-gray-600">
            <Smiley className="text-white" />
          </button>
        </div>
        <p className="mt-1 px-2 text-[10px] text-gray-100">
          <text>Type</text>
          <text className="text-orange-300">{" /play <music-name> "}</text>
          <text>to listen your musics now!</text>
        </p>
      </div>
      <Player />
    </div>
  );
}
