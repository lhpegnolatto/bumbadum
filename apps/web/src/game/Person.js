import { GameObject } from "./GameObject";
import { emitEvent } from "./utils";

export class Person extends GameObject {
  constructor(config) {
    super(config);
    this.movingProgressRemaining = 0;

    this.isPlayerControlled = config.isPlayerControlled || false;

    this.directionUpdate = {
      up: ["y", -1],
      down: ["y", 1],
      left: ["x", -1],
      right: ["x", 1],
    };
  }

  update(state) {
    if (this.movingProgressRemaining > 0) {
      this.updatePosition();
    } else {
      if (
        (this.isPlayerControlled && state.direction) ||
        (state.eventUpdate && state.direction)
      ) {
        this.startBehavior(state, { type: "walk", direction: state.direction });
      }

      this.updateSprite(state);
    }
  }

  startBehavior(state, behavior) {
    this.direction = behavior.direction;

    if (behavior.type === "walk") {
      if (state.map.isSpaceTaken(this.x, this.y, this.direction)) {
        behavior.retry &&
          setTimeout(() => {
            this.startBehavior(state, behavior);
          }, 10);
        return;
      }

      if (this.isPlayerControlled) {
        state.socket.emit("event", {
          userId: this.id,
          userX: this.x,
          userY: this.y,
          type: "walk",
          direction: this.direction,
          avatarType: state.avatarType,
        });
      }

      state.map.moveWall(this.x, this.y, this.direction);
      this.movingProgressRemaining = 16;
      this.updateSprite(state);
    }

    if (behavior.type === "stand") {
      setTimeout(() => {
        emitEvent("PersonStandComplete", {
          whoId: this.id,
        });
      }, behavior.time);
    }
  }

  updatePosition() {
    const [property, change] = this.directionUpdate[this.direction];
    this[property] += change;
    this.movingProgressRemaining -= 1;

    if (this.movingProgressRemaining === 0) {
      emitEvent("PersonWalkingComplete", {
        whoId: this.id,
      });
    }
  }

  updateSprite() {
    if (this.movingProgressRemaining > 0) {
      this.sprite.setAnimation(`walk-${this.direction}`);
      return;
    }

    this.sprite.setAnimation(`idle-${this.direction}`);
  }
}
