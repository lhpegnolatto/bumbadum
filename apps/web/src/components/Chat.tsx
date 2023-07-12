"use client";

import { ChangeEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import { useSocket } from "@/hooks/useSocket";

import { CaretDown, MapTrifold } from "@/components/Icons";
import { Input } from "@/components/ui/input";
import { Player } from "@/components/Player";
import { ScrollArea } from "@/components/ui/scroll-area";

type Message = {
  sendedAt: string;
  author: string;
  authorColor: "pink" | "green" | "blue" | "orange";
  message: string;
};

export function Chat() {
  const scrollAreaRef = useRef<HTMLDivElement | null>(null);

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
    const viewportElement = scrollAreaRef.current?.querySelector(
      "[data-radix-scroll-area-viewport]"
    );

    if (viewportElement) {
      viewportElement.scrollTo({
        top: viewportElement.scrollHeight,
      });
    }
  }, [messages]);

  return (
    <div className="flex w-80 flex-col gap-6 overflow-hidden rounded-xl bg-slate-900 shadow">
      <div className="flex h-24 items-center justify-between bg-slate-800 px-4 shadow">
        <button className="flex items-center p-2">
          <p className="text-sm font-semibold text-slate-100">Room 1 🤘</p>

          <CaretDown className="text-white" />
        </button>

        <button className="p-2 text-xl">
          <MapTrifold className="text-white" />
        </button>
      </div>
      <ScrollArea ref={scrollAreaRef} className="h-full max-h-full px-6">
        {messages.map(({ sendedAt, author, authorColor, message }, index) => {
          const asCommand = message.includes("/play");

          return (
            <p
              key={index}
              className={`leading-none ${index > 0 ? "mt-2" : ""}`}
            >
              <text className="mr-1 text-xs text-slate-400">
                {new Date(sendedAt).toLocaleTimeString("pt", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </text>
              <text className="mr-1 text-xs text-slate-50">
                <strong className={authorColorsStyles[authorColor]}>
                  {author}
                </strong>
                :
              </text>
              <text
                className={`text-xs ${
                  asCommand ? "text-orange-300" : "text-slate-50"
                }`}
              >
                {message}
              </text>
            </p>
          );
        })}
      </ScrollArea>
      <div className="px-6">
        <div className="relative">
          <Input
            className={`bg-slate-800 text-xs ${
              inputValue.includes("/play")
                ? "text-orange-300"
                : "text-slate-400"
            } shadow`}
            placeholder="Type here your message :)"
            onKeyDown={handleOnInputKeyDown}
            value={inputValue}
            onChange={handleOnInputChange}
          />
        </div>
        <p className="mt-2 px-2 text-[10px] text-slate-100">
          <text>Type</text>
          <text className="text-orange-300">{" /play <music-name> "}</text>
          <text>to listen your musics now!</text>
        </p>
      </div>
      <Player />
    </div>
  );
}
