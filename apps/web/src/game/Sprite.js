import { withGrid } from "./utils";

export class Sprite {
  constructor(config) {
    if (typeof window === "undefined") {
      return;
    }

    this.layers = config.layers || [];
    this.loadedLayers =
      this.layers.forEach(({ src, variant = 0 }, index) => {
        const layerImage = new Image();
        layerImage.src = src;
        layerImage.onload = () => {
          this.loadedLayers[index] = { image: layerImage, variant };
        };
      }) || [];

    // Set up the shadow
    this.shadow = new Image();
    this.useShadow = true;
    if (this.useShadow) {
      this.shadow.src = "/shadow.png";
    }
    this.shadow.onload = () => {
      this.isShadowLoaded = true;
    };

    // Configuring animation & initial state
    this.animations = config.animation || {
      "idle-down": [[0, 0]],
      "idle-up": [[0, 1]],
      "idle-right": [[0, 2]],
      "idle-left": [[0, 3]],
      "walk-down": [
        [1, 0],
        [2, 0],
        [3, 0],
        [4, 0],
        [5, 0],
        [7, 0],
        [0, 0],
      ],
      "walk-up": [
        [1, 1],
        [2, 1],
        [3, 1],
        [4, 1],
        [5, 1],
        [7, 1],
        [0, 1],
      ],
      "walk-right": [
        [1, 2],
        [2, 2],
        [3, 2],
        [4, 2],
        [5, 2],
        [7, 2],
        [0, 2],
      ],
      "walk-left": [
        [1, 3],
        [2, 3],
        [3, 3],
        [4, 3],
        [5, 3],
        [7, 3],
        [0, 3],
      ],
    };
    this.currentAnimation = config.currentAnimation || "idle-down";
    this.currentAnimationFrame = 0;

    this.animationFrameLimit = config.animationFrameLimit || 8;
    this.animationFrameProgress = this.animationFrameLimit;

    // Reference the game object
    this.gameObject = config.gameObject;
  }

  get frame() {
    return this.animations[this.currentAnimation][this.currentAnimationFrame];
  }

  setAnimation(key) {
    if (this.currentAnimation !== key) {
      this.currentAnimation = key;
      this.currentAnimationFrame = 0;
      this.animationFrameProgress = this.animationFrameLimit;
    }
  }

  updateAnimationProgress() {
    if (this.animationFrameProgress > 0) {
      this.animationFrameProgress -= 1;
      return;
    }

    this.animationFrameProgress = this.animationFrameLimit;
    this.currentAnimationFrame += 1;

    if (this.frame === undefined) {
      this.currentAnimationFrame = 0;
    }
  }

  draw(ctx, cameraPerson) {
    const x = this.gameObject?.x - 8 + withGrid(10.5) - cameraPerson.x;
    const y = this.gameObject?.y - 22 + withGrid(6) - cameraPerson.y;

    this.isShadowLoaded && ctx.drawImage(this.shadow, x, y + 3);

    const [frameX, frameY] = this.frame;

    this.loadedLayers.forEach(({ image, variant }) =>
      ctx.drawImage(
        image,
        frameX * 32 + variant * 256,
        frameY * 32,
        32,
        32,
        x,
        y,
        32,
        32
      )
    );

    this.updateAnimationProgress();
  }
}
