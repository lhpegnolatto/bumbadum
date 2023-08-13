"use client";

import { useEffect, useRef } from "react";
import { OverworldMap, overworldMaps } from "./OverworldMap";
import { DirectionInput } from "./DirectionInput";
import { Person } from "./Person";
import { useSocket } from "@/hooks/useSocket";
import { Socket } from "socket.io-client";
import { getLayersFromAvatar } from "@/utils/getLayersFromAvatar";

export function GameEngine() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const usersRef = useRef<Person[]>([]);
  const currentSocket = useRef<Socket | null>(null);

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

          map.drawBgImage(ctx);

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

      document.addEventListener("respawnUser", () => {
        function emitUserRespawn() {
          if (currentSocket.current) {
            const profileStorage = JSON.parse(
              localStorage?.getItem("bumbadum-profile") || "{}"
            );
            const avatarStorage = JSON.parse(
              localStorage?.getItem("bumbadum-avatar") || "{}"
            );

            const user = usersRef.current.find(
              (user) => user.id === currentSocket.current?.id
            );

            user &&
              currentSocket.current.emit("event", {
                id: user.id,
                x: user.x,
                y: user.y,
                type: "respawn",
                avatar: avatarStorage,
                name: profileStorage?.name,
              });
          }
        }

        emitUserRespawn();
      });

      document.addEventListener("spawnUser", () => {
        const tries = 3;

        function emitUserSpawn(remainingTries: number) {
          if (currentSocket.current) {
            const profileStorage = JSON.parse(
              localStorage?.getItem("bumbadum-profile") || "{}"
            );
            const avatarStorage = JSON.parse(
              localStorage?.getItem("bumbadum-avatar") || "{}"
            );

            currentSocket.current.emit("event", {
              id: currentSocket.current.id,
              x: map.spawn.x,
              y: map.spawn.y,
              type: "spawn",
              avatar: avatarStorage,
              name: profileStorage?.name,
            });

            return;
          }

          if (remainingTries - 1 >= 0) {
            setTimeout(
              () => emitUserSpawn(remainingTries - 1),
              (remainingTries - tries) * -1 * 1000
            );
          } else {
            return;
          }
        }

        let remainingTries = 3;
        emitUserSpawn(remainingTries);
      });

      socket &&
        socket.on("connect", () => {
          currentSocket.current = socket;
        });

      socket &&
        socket.on("event", (event) => {
          if (event.type === "spawn") {
            (event.players || []).forEach((player: any) => {
              if (!usersRef.current.some((user) => user.id === player.id)) {
                const person = new Person({
                  x: player.x,
                  y: player.y,
                  layers:
                    getLayersFromAvatar(player.avatar),
                  isPlayerControlled: player.id === socket.id,
                  name: player.name,
                });
                person.id = player.id;
                usersRef.current.push(person);
                map.addObject(player.id, person);
              }
            });
          } else if (event.type === "respawn") {
            const userIndex = usersRef.current.findIndex(
              (user) => user.id === event.id
            );

            map.removeObject(event.id);
            usersRef.current.splice(userIndex, 1);

            const person = new Person({
              x: event.x,
              y: event.y,
              layers: getLayersFromAvatar(event.avatar),
              isPlayerControlled: event.id === socket.id,
              name: event.name,
            });
            person.id = event.id;
            usersRef.current.push(person);
            map.addObject(event.id, person);
          } else if (event.id === socket.id) {
            return;
          } else if (event.type === "disconnect") {
            usersRef.current = usersRef.current.filter(
              (user) => user.id !== event.id
            );
            map.removeObject(event.id);
          } else if (event.type === "walk") {
            const user = usersRef.current.find((user) => user.id === event.id);

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

    return () => { };
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
