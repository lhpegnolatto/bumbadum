import { createMap } from "./map.ts";
import { PLAZA_ROWS } from "./plaza-map.generated.ts";

/** The lobby's map: the music plaza, generated from its Tiled project (ADR-0016). */
export const lobbyMap = createMap(PLAZA_ROWS);
