import { Person } from "./Person";
import { asGridCoors, nextPosition, withGrid } from "./utils";

export class OverworldMap {
  constructor(config) {
    this.gameObjects = config.gameObjects;
    this.walls = config.walls || {};
    this.spawn = config.spawn || { x: 0, y: 0 };

    this.lowerImage = new Image();
    this.lowerImage.src = config.lowerSrc;

    this.upperImage = new Image();
    this.upperImage.src = config.upperSrc;
  }

  drawLowerImage(ctx, cameraPerson) {
    ctx.drawImage(
      this.lowerImage,
      withGrid(10.5) - cameraPerson.x,
      withGrid(6) - cameraPerson.y
    );
  }

  drawUpperImage(ctx, cameraPerson) {
    ctx.drawImage(
      this.upperImage,
      withGrid(10.5) - cameraPerson.x,
      withGrid(6) - cameraPerson.y
    );
  }

  isSpaceTaken(currentX, currentY, direction) {
    const { x, y } = nextPosition(currentX, currentY, direction);
    return this.walls[`${x},${y}`] || false;
  }

  addObject(id, object) {
    this.gameObjects = { ...this.gameObjects, [id]: object };
  }
  removeObject(id) {
    delete this.gameObjects[id];
  }

  mountObjects() {
    Object.keys(this.gameObjects).forEach((key) => {
      let object = this.gameObjects[key];
      object.id = key;

      object.mount(this);
    });
  }

  addWall(x, y) {
    this.walls[`${x},${y}`] = true;
  }
  removeWall(x, y) {
    delete this.walls[`${x},${y}`];
  }
  moveWall(wasX, wasY, direction) {
    this.removeWall(wasX, wasY);
    const { x, y } = nextPosition(wasX, wasY, direction);
    this.addWall(x, y);
  }
}

export const overworldMaps = {
  default: {
    lowerSrc: "/room_map.png",
    upperSrc: "",
    spawn: { x: withGrid(15), y: withGrid(13) },
    gameObjects: {
      npc1: new Person({
        x: withGrid(20),
        y: withGrid(13),
        behaviorLoop: [
          { type: "stand", direction: "down", time: 1200 },
          { type: "walk", direction: "left" },
          { type: "walk", direction: "down" },
          { type: "walk", direction: "down" },
          { type: "walk", direction: "right" },
          { type: "walk", direction: "right" },
          { type: "walk", direction: "right" },
          { type: "walk", direction: "up" },
          { type: "walk", direction: "up" },
          { type: "walk", direction: "left" },
          { type: "walk", direction: "left" },
        ],
        layers: [
          { src: "/char.png", variant: 3 },
          { src: "/hairs/extra_long.png", variant: 8 },
          { src: "/tops/shirt.png", variant: 9 },
          { src: "/bottoms/skirt.png", variant: 7 },
          { src: "/footwear/shoes.png", variant: 7 },
        ],
      }),
      npc2: new Person({
        x: withGrid(16),
        y: withGrid(18),
        behaviorLoop: [
          { type: "stand", direction: "down", time: 2000 },
          { type: "stand", direction: "left", time: 400 },
          { type: "stand", direction: "right", time: 400 },
        ],
        layers: [
          { src: "/char.png", variant: 3 },
          { src: "/hairs/extra_long.png" },
          { src: "/tops/dress.png", variant: 8 },
          { src: "/footwear/shoes.png", variant: 8 },
        ],
      }),
    },
    walls: {
      ...Array.from(Array(15)).reduce(
        (acc, _, index) => ({
          ...acc,
          [asGridCoors(13, 13 + index)]: true,
        }),
        {}
      ),
      ...Array.from(Array(41)).reduce(
        (acc, _, index) => ({
          ...acc,
          [asGridCoors(14 + index, 12)]: true,
        }),
        {}
      ),
      ...Array.from(Array(15)).reduce(
        (acc, _, index) => ({
          ...acc,
          [asGridCoors(55, 13 + index)]: true,
        }),
        {}
      ),
      ...Array.from(Array(41)).reduce(
        (acc, _, index) => ({
          ...acc,
          [asGridCoors(14 + index, 28)]: true,
        }),
        {}
      ),
    },
  },
};
