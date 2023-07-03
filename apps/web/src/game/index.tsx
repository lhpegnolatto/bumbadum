"use client";

import { useEffect, useRef } from "react";
import { OverworldMap, overworldMaps } from "./OverworldMap";
import { DirectionInput } from "./DirectionInput";
import { Person } from "./Person";
import { useSocket } from "@/hooks/useSocket";

const assets = {
  "cute-girl": [
    { src: "/char.png", variant: 3 },
    { src: "/hairs/extra_long.png" },
    { src: "/tops/dress.png", variant: 8 },
    { src: "/footwear/shoes.png", variant: 8 },
  ],
  gentleman: [
    { src: "/char.png" },
    { src: "/hairs/gentleman.png", variant: 1 },
    { src: "/tops/shirt.png", variant: 5 },
    { src: "/bottoms/pants.png" },
    { src: "/footwear/shoes.png" },
  ],
};

export function GameEngine() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const usersRef = useRef<Person[]>([]);

  const { socket } = useSocket({ namespace: "game" });

  useEffect(() => {
    function startGameLoop(map: OverworldMap) {
      const directionInput = new DirectionInput();
      directionInput.init();

      function step() {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) {
          return;
        }

        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          return;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const cameraPerson = usersRef.current.find(
          (user) => user.id === socket?.id
        );
        if (cameraPerson) {
          Object.values(map.gameObjects).forEach((object: any) => {
            object.update({
              direction: directionInput.direction,
              map,
              socket,
            });
          });

          map.drawLowerImage(ctx, cameraPerson);

          Object.values(map.gameObjects)
            .sort((a: any, b: any) => a.y - b.y)
            .forEach((object: any) => {
              object.sprite.draw(ctx, cameraPerson);
            });

          map.drawUpperImage(ctx, cameraPerson);
        }
        requestAnimationFrame(step);
      }
      step();
    }

    function init() {
      const map = new OverworldMap(overworldMaps.default);
      map.mountObjects();

      document.addEventListener("spawnUser", () => {
        const profileStorage = JSON.parse(
          localStorage?.getItem("bumbadum-profile") || "{}"
        );

        socket &&
          socket.emit("event", {
            userId: socket.id,
            userX: map.spawn.x,
            userY: map.spawn.y,
            type: "spawn",
            avatarType: profileStorage?.avatarType,
          });
      });

      socket &&
        socket.on("event", (event) => {
          if (event.userId === socket.id) {
            return;
          }

          if (event.type === "spawn") {
            (event.players || []).forEach((player: any) => {
              if (!usersRef.current.some((user) => user.id === player.userId)) {
                const person = new Person({
                  x: player.userX,
                  y: player.userY,
                  layers:
                    assets[player.avatarType as "gentleman" | "cute-girl"],
                  isPlayerControlled: player.userId === socket.id,
                });
                person.id = player.userId;
                usersRef.current.push(person);
                map.addObject(player.userId, person);
              }
            });
          } else if (event.type === "disconnect") {
            usersRef.current = usersRef.current.filter(
              (user) => user.id !== event.userId
            );
            map.removeObject(event.userId);
          } else if (event.type === "walk") {
            const user = usersRef.current.find(
              (user) => user.id === event.userId
            );

            user &&
              user.update({
                map,
                direction: event.direction,
                eventUpdate: true,
              });
          }
        });

      startGameLoop(map);
    }
    init();
  }, [socket]);

  return (
    <div ref={containerRef} style={{ height: "100%", width: "100%" }}>
      <canvas
        ref={canvasRef}
        style={{
          imageRendering: "pixelated",
          transform: "scale(4)",
          transformOrigin: " 0 0",
        }}
      />
    </div>
  );
}
