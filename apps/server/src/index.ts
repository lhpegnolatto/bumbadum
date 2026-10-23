import { openLobby } from "./room/lobby-room.ts";
import { createServer } from "./server.ts";

const port = Number(process.env.PORT ?? 2567);

const server = createServer();
await server.listen(port);
await openLobby();
console.log(`bumbadum server listening on port ${port}`);
