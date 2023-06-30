"use client";

import Image from "next/image";
import { CaretDown, MapTrifold, Smiley } from "@/components/Icons";
import { ChangeEvent, KeyboardEvent, useEffect, useState } from "react";
import { useSocket } from "@/hooks/useSocket";

type Message = {
  sendedAt: string;
  author: string;
  authorColor: "pink" | "green" | "blue" | "orange";
  message: string;
};

export function Chat() {
  const profileStorage = JSON.parse(
    localStorage.getItem("bumbadum-profile") || "{}"
  );

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

  return (
    <div className="flex w-80 flex-col gap-6 overflow-hidden rounded-xl bg-gray-800 shadow">
      <div className="flex h-24 items-center justify-between bg-gray-700 px-4 shadow">
        <button className="flex items-center p-2">
          <p className="text-sm font-semibold text-gray-100">
            Clássicos do Rock! 🤘
          </p>

          <CaretDown className="text-white" />
        </button>

        <button className="p-2 text-xl">
          <MapTrifold className="text-white" />
        </button>
      </div>
      <div
        id="chat"
        className="relative flex h-full max-h-full flex-col gap-2 overflow-hidden px-6"
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
      <div className="relative px-6">
        <input
          className="flex h-10 w-full cursor-text items-center rounded-lg bg-gray-700 px-4 text-xs font-semibold text-gray-400 shadow"
          placeholder="Type here your message :)"
          onKeyDown={handleOnInputKeyDown}
          value={inputValue}
          onChange={handleOnInputChange}
        />
        <button className="absolute right-6 top-[50%] translate-y-[-50%] rounded-lg bg-gray-700 p-3 transition-colors hover:bg-gray-600">
          <Smiley className="text-white" />
        </button>
      </div>
      <div className="bg-gray-700">
        <div className="h-1 w-full bg-gray-500">
          <div className="h-1 w-[65%] bg-indigo-600" />
        </div>

        <div className="flex items-center gap-3 p-6">
          <div className="h-10 w-10 overflow-hidden rounded-lg">
            <Image
              src="/smells_like_teen_spirit.jpg"
              width={40}
              height={40}
              alt="Nevermind album cover"
            />
          </div>
          <div className="flex flex-1 flex-col justify-center">
            <p className="text-sm font-semibold text-white">
              Smells Like Teen Spirit
            </p>
            <p className="text-xs text-gray-400">Nirvana • Nevermind</p>
          </div>
          <div className="text-xs text-gray-400">3:27/4:38</div>
        </div>
      </div>
    </div>
  );
}
