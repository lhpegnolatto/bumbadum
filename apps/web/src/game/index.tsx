"use client";

import { useEffect, useRef } from "react";
import { OverworldMap, overworldMaps } from "./OverworldMap";
import { DirectionInput } from "./DirectionInput";
import { Person } from "./Person";
import { io } from "socket.io-client";

export function Game() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const usersRef = useRef<Person[]>([]);

  useEffect(() => {
    function startGameLoop(map: OverworldMap, socket: any) {
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
          (user) => user.id === socket.id
        );
        if (cameraPerson) {
          Object.values(map.gameObjects).forEach((object: any) => {
            object.update({ arrow: directionInput.direction, map, socket });
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

      const socket = io("https://coffadio-api-production.up.railway.app", {
        extraHeaders: { "Access-Control-Allow-Origin": "*" },
      });

      socket.on("connect", () => {
        console.log("SOCKET CONNECTED!", socket.id);
      });

      socket.on("ON_USERS_UPDATE", (updatedUsers) => {
        const newUsers = JSON.parse(updatedUsers);

        usersRef.current
          .filter(
            (person) =>
              !Object.values(newUsers).some(
                (user: any) => user.id === person.id
              )
          )
          .forEach((person) => {
            map.removeObject(person.id);
          });

        Object.values(newUsers).forEach((user: any) => {
          const personIndex = usersRef.current.findIndex(
            (person) => person.id === user.id
          );

          if (personIndex >= 0) {
            if (
              usersRef.current[personIndex].x !== user.x ||
              usersRef.current[personIndex].y !== user.y
            ) {
              usersRef.current[personIndex].update({
                forceUpdate: true,
                arrow: user.direction,
                map,
              });
            }
          } else {
            const person = new Person({
              x: user.x,
              y: user.y,
              layers: [
                { src: "/char.png" },
                { src: "/hairs/gentleman.png", variant: 1 },
                { src: "/tops/shirt.png", variant: 5 },
                { src: "/bottoms/pants.png" },
                { src: "/footwear/shoes.png" },
              ],
              isPlayerControlled: user.id === socket.id,
            });
            person.id = user.id;
            usersRef.current.push(person);
            map.addObject(user.id, person);
          }
        });
      });

      socket.emit("ON_USER_SPAWN", {
        id: socket.id,
        x: map.spawn.x,
        y: map.spawn.y,
        direction: "down",
      });

      startGameLoop(map, socket);
    }
    init();
  }, []);

  return (
    <div ref={containerRef} style={{ height: "100%", width: "100%" }}>
      <canvas
        ref={canvasRef}
        className="relative"
        style={{
          imageRendering: "pixelated",
          transform: "scale(4)",
          transformOrigin: " 0 0",
        }}
      />
    </div>
  );
}
