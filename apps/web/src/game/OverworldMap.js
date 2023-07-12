import { asGridCoors, nextPosition, withGrid } from "./utils";

export class OverworldMap {
  constructor(config) {
    this.gameObjects = config.gameObjects;
    this.walls = config.walls || {};
    this.spawn = config.spawn || { x: 0, y: 0 };

    this.bgSrc = new Image();
    this.bgSrc.src = config.bgSrc;

    this.lowerImage = new Image();
    this.lowerImage.src = config.lowerSrc;

    this.upperImage = new Image();
    this.upperImage.src = config.upperSrc;
  }

  drawBgImage(ctx) {
    ctx.drawImage(this.bgSrc, 0, 0);
  }

  drawLowerImage(ctx, cameraPerson) {
    ctx.drawImage(
      this.lowerImage,
      withGrid(6.5) - cameraPerson.x,
      withGrid(6.5) - cameraPerson.y
    );
  }

  drawUpperImage(ctx, cameraPerson) {
    ctx.drawImage(
      this.upperImage,
      withGrid(6.5) - cameraPerson.x,
      withGrid(6.5) - cameraPerson.y
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
    bgSrc: "/stars_background.png",
    lowerSrc: "/room_map.png",
    upperSrc: "",
    spawn: { x: withGrid(15), y: withGrid(13) },
    gameObjects: {},
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
