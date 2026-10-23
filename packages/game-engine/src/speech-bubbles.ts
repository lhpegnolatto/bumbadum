import { Container, Graphics, Text } from "pixi.js";
import { type Point, placeBubble, type Size } from "./bubble-layout.ts";

/** How long a bubble stays over its speaker. */
const BUBBLE_DURATION_MS = 5000;
const MAX_TEXT_WIDTH = 160;
const PADDING = 6;
const CORNER_RADIUS = 6;

interface Bubble {
  view: Container;
  size: Size;
  hideAt: number;
}

/**
 * Speech bubbles over the players who just spoke, one per player: a new
 * message replaces the previous bubble. Drawn on a layer above every avatar.
 */
export class SpeechBubbles {
  readonly #layer = new Container();
  readonly #canvas: Size;
  readonly #bubbles = new Map<string, Bubble>();

  constructor(parent: Container, canvas: Size) {
    parent.addChild(this.#layer);
    this.#canvas = canvas;
  }

  show(speakerId: string, text: string, now: number) {
    this.#remove(speakerId);
    const view = drawBubble(text);
    this.#layer.addChild(view);
    this.#bubbles.set(speakerId, {
      view,
      size: { width: view.width, height: view.height },
      hideAt: now + BUBBLE_DURATION_MS,
    });
  }

  /** Follows each speaker, given the point over their head, and drops expired bubbles. */
  update(now: number, anchorOf: (speakerId: string) => Point | undefined) {
    for (const [speakerId, bubble] of this.#bubbles) {
      const anchor = anchorOf(speakerId);
      if (!anchor || now >= bubble.hideAt) {
        this.#remove(speakerId);
        continue;
      }
      const { x, y } = placeBubble(anchor, bubble.size, this.#canvas);
      bubble.view.position.set(Math.round(x), Math.round(y));
    }
  }

  #remove(speakerId: string) {
    this.#bubbles.get(speakerId)?.view.destroy({ children: true });
    this.#bubbles.delete(speakerId);
  }
}

function drawBubble(message: string): Container {
  const text = new Text({
    text: message,
    style: {
      fontFamily: "sans-serif",
      fontSize: 12,
      fill: "#2b2238",
      wordWrap: true,
      wordWrapWidth: MAX_TEXT_WIDTH,
      breakWords: true,
    },
  });
  text.position.set(PADDING, PADDING);
  const background = new Graphics()
    .roundRect(0, 0, text.width + PADDING * 2, text.height + PADDING * 2, CORNER_RADIUS)
    .fill({ color: "#ffffff", alpha: 0.95 });
  const bubble = new Container();
  bubble.addChild(background, text);
  return bubble;
}
