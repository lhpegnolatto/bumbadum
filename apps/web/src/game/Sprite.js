import { withGrid } from "./utils";
import bitmapData from "./assets/fonts/3x3-bitmap.json";

function renderSpriteName(ctx, name, x, y) {
  const scale = 1;
  const charWidth = 3 * scale;
  const charHeight = 3 * scale;
  const charSpacing = 1 * scale;
  const margin = 2 * scale;

  // Calcula a largura total da palavra com a margem
  const totalWidth =
    name.length * charWidth + (name.length - 1) * charSpacing + 2 * margin;

  // Calcula a posição inicial de renderização para centralizar
  const startX = x - Math.floor(totalWidth / 2);

  let currentX = startX;

  // Salva o valor atual de opacidade
  const previousAlpha = ctx.globalAlpha;

  // Define a opacidade desejada
  ctx.globalAlpha = 0.4;

  // Define o fundo preto com a altura ajustada
  ctx.fillStyle = "black";
  ctx.fillRect(
    startX - margin,
    y - margin,
    totalWidth,
    charHeight + 2 * margin
  );

  // Restaura o valor anterior de opacidade
  ctx.globalAlpha = previousAlpha;

  // Define as letras como brancas
  ctx.fillStyle = "white";

  for (let i = 0; i < name.length; i++) {
    const character = name[i].toUpperCase();
    const bitmap = bitmapData[character];

    if (bitmap) {
      for (let row = 0; row < bitmap.length; row++) {
        const rowData = bitmap[row];

        for (let col = 0; col < rowData.length; col++) {
          const bit = rowData[col]; // Mantém a ordem dos bits

          if (bit === 1) {
            const pixelX = currentX + col * scale;
            const pixelY = y + row * scale;

            ctx.fillRect(pixelX, pixelY, scale, scale);
          }
        }
      }
    }

    currentX += charWidth + charSpacing;
  }
}

export class Sprite {
  constructor(config) {
    if (typeof window === "undefined") {
      return;
    }

    this.name = config.name;

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
    const x = this.gameObject?.x - 8 + withGrid(6.5) - cameraPerson.x;
    const y = this.gameObject?.y - 22 + withGrid(6.5) - cameraPerson.y;

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

    this.name && renderSpriteName(ctx, this.name, x + 16, y + 3);

    this.updateAnimationProgress();
  }
}
