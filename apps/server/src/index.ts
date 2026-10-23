import { musicSearchFromEnv } from "./radio/music-search-from-env.ts";
import { trackCatalogFromEnv } from "./radio/track-catalog-from-env.ts";
import { openLobby } from "./room/lobby-room.ts";
import { createServer } from "./server.ts";

const port = Number(process.env.PORT ?? 2567);

const server = createServer({
  catalog: trackCatalogFromEnv(process.env),
  search: musicSearchFromEnv(process.env),
});
await server.listen(port);
await openLobby();
console.log(`bumbadum server listening on port ${port}`);
