import type { PlayerState, RoomState } from "@bumbadum/protocol";
import { Application, Container, Graphics, Text } from "pixi.js";

const TILE_SIZE = 32;
const COLUMNS = 20;
const ROWS = 15;
const DOT_RADIUS = 10;

export interface GameEngine {
  /** Redraws the room from the latest server state. */
  applyState(state: RoomState): void;
  destroy(): void;
}

/** Creates the PixiJS canvas inside `container` and returns the API React drives. */
export async function mountGameEngine(container: HTMLElement): Promise<GameEngine> {
  const app = new Application();
  await app.init({
    width: COLUMNS * TILE_SIZE,
    height: ROWS * TILE_SIZE,
    background: "#2b2238",
    antialias: true,
  });
  container.appendChild(app.canvas);

  const avatars = new Map<string, Container>();

  return {
    applyState(state) {
      for (const [sessionId, avatar] of avatars) {
        if (!state.players.has(sessionId)) {
          avatar.destroy({ children: true });
          avatars.delete(sessionId);
        }
      }
      state.players.forEach((player, sessionId) => {
        let avatar = avatars.get(sessionId);
        if (!avatar) {
          avatar = createAvatar(player);
          avatars.set(sessionId, avatar);
          app.stage.addChild(avatar);
        }
        avatar.position.set((player.x + 0.5) * TILE_SIZE, (player.y + 0.5) * TILE_SIZE);
      });
    },
    destroy() {
      app.destroy({ removeView: true }, { children: true });
    },
  };
}

function createAvatar(player: PlayerState): Container {
  const avatar = new Container();
  avatar.addChild(new Graphics().circle(0, 0, DOT_RADIUS).fill("#f4a259"));
  const label = new Text({
    text: player.nickname,
    style: { fontFamily: "sans-serif", fontSize: 12, fill: "#ffffff" },
  });
  label.anchor.set(0.5, 1);
  label.y = -DOT_RADIUS - 4;
  avatar.addChild(label);
  return avatar;
}
