import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const repositoryRoot = path.resolve(import.meta.dirname, "../..");
const originalMap = path.join(repositoryRoot, "assets/mapa_praca_v7");
const canonicalMap = path.join(repositoryRoot, "assets/map/plaza-v2");
const originalCars = path.join(repositoryRoot, "assets/autodromo/carros");
const canonicalCars = path.join(repositoryRoot, "assets/autodromo/cars");
const publicCars = path.join(repositoryRoot, "apps/web/public/sprites/plaza-v2/cars");

const words = {
  alambrado: "tennis-fence",
  arbusto: "shrub",
  balcao: "queue-counter",
  bolinhas: "basket",
  flor: "flower",
  arquibancada: "",
  arvore: "tree",
  alta: "tall",
  jovem: "young",
  rosa: "pink",
  roxa: "purple",
  banco: "bench",
  vertical: "vertical",
  h: "horizontal",
  bandeira: "flag",
  quadriculada: "checkered",
  bandeirinhas: "bunting",
  curta: "short",
  barreira: "barrier",
  cadeira: "chair",
  cesto: "ball-basket",
  caixa: "speaker",
  som: "",
  tenis: "",
  baixa: "low",
  carro: "car",
  conversivel: "convertible",
  kart: "kart",
  cerca: "fence",
  cone: "cone",
  corda: "queue-rope",
  food: "food",
  truck: "truck",
  hidrante: "hydrant",
  jardineira: "planter",
  grade: "grandstand-fence",
  lixeira: "trash",
  mesa: "table",
  guarda: "sun",
  sol: "shade",
  piquenique: "picnic",
  placar: "scoreboard",
  palco: "stage",
  painel: "grandstand-sign",
  pinheiro: "pine",
  placa: "sign",
  cardapio: "menu",
  corrida: "race",
  estacionamento: "parking",
  vaga: "parking-spot",
  grid: "grid",
  pneus: "tires",
  podio: "podium",
  portico: "starting",
  largada: "grid",
  poste: "lamp",
  portao: "tennis-gate",
  portal: "match-portal",
  predio: "building",
  cafe: "cafe",
  discos: "records",
  radio: "radio",
  tijolo: "brick",
  quiosque: "kiosk",
  quadra: "court",
  rede: "tennis-net",
  tenda: "tent",
  telao: "match-screen",
  amarelo: "yellow",
  amarela: "yellow",
  azul: "blue",
  branco: "white",
  branca: "white",
  preto: "black",
  roxo: "purple",
  verde: "green",
  cima: "top",
  baixo: "bottom",
  direita: "right",
  esquerda: "left",
  fila: "line",
  zona: "zone",
  acesso: "access",
  durante: "during",
  evento: "event",
  olhando: "facing",
  jogador: "player",
  vermelho: "red",
  listrado: "striped",
};

const translate = (value) =>
  `${value
    .replace(/\.png$/, "")
    .split("_")
    .map((part) => words[part] ?? part)
    .filter(Boolean)
    .join("-")}.png`;

await rm(canonicalMap, { recursive: true, force: true });
await rm(canonicalCars, { recursive: true, force: true });
await mkdir(path.join(canonicalMap, "objects"), { recursive: true });
await mkdir(canonicalCars, { recursive: true });

const originalTiled = JSON.parse(await readFile(path.join(originalMap, "mapa_praca.tmj"), "utf8"));
const layers = {
  chao: "floor",
  objetos: "objects",
  luzes: "lights",
  colisao_tiles: "collision",
  colisao_objetos: "collision-objects",
  zona_pista: "track",
  vagas: "parking",
  largada: "starting-grid",
  quadra_tenis: "tennis-court",
  fila_hall: "tennis-line",
};
for (const layer of originalTiled.layers) {
  layer.name = layers[layer.name] ?? layer.name;
  for (const property of layer.properties ?? []) {
    if (property.name === "colisao") property.name = "collision";
  }
  if (layer.type === "objectgroup") {
    for (const object of layer.objects) {
      if (object.name !== "spawn") object.name = translate(object.name ?? "object").slice(0, -4);
      if (object.type === "colisao") object.type = "collision";
      if (object.type === "vaga") object.type = "parking-spot";
      if (object.type === "largada") object.type = "starting-grid";
      if (object.type === "zona") object.type = "zone";
      for (const property of object.properties ?? []) {
        if (property.name === "colisao") property.name = "collision";
        if (property.name === "direcao") property.name = "direction";
        if (property.name === "ocupada") property.name = "occupied";
        if (property.name === "x_min") property.name = "xMin";
        if (property.name === "x_max") property.name = "xMax";
        if (property.value === "cima") property.value = "up";
        if (property.value === "baixo") property.value = "down";
        if (property.value === "direita") property.value = "right";
        if (property.value === "esquerda") property.value = "left";
      }
    }
  }
}
// The v7 source contains one isolated empty collision cell inside the autodrome wall.
// Mark it blocked so the generated map's reachability invariant describes playable space.
const canonicalCollision = originalTiled.layers.find(({ name }) => name === "collision");
canonicalCollision.data[20 * originalTiled.width + 83] = 1775;
const tennisCourt = originalTiled.layers
  .find(({ name }) => name === "tennis-court")
  ?.objects.find(({ name }) => name === "zone-court");
if (!tennisCourt) throw new Error("v7 map is missing the Tennis court zone");
// Pedestrians use the tile collision grid, while the Tennis activity places players directly
// on its own court spawns. Block the whole fenced court so its interior cannot become reachable.
for (let y = tennisCourt.y / 16; y < (tennisCourt.y + tennisCourt.height) / 16; y += 1) {
  for (let x = tennisCourt.x / 16; x < (tennisCourt.x + tennisCourt.width) / 16; x += 1) {
    canonicalCollision.data[y * originalTiled.width + x] ||= 1775;
  }
}
originalTiled.layers.push({
  id: originalTiled.nextlayerid++,
  name: "spawn",
  type: "objectgroup",
  draworder: "topdown",
  objects: [
    {
      id: 7000,
      name: "spawn",
      type: "spawn",
      // Keep the shared Lobby spawn in the plaza immediately below the stage at tile (70, 25).
      x: 1120,
      y: 412,
      point: true,
      width: 0,
      height: 0,
      rotation: 0,
      visible: true,
    },
  ],
});
for (const tileset of originalTiled.tilesets) {
  if (tileset.name === "chao") {
    tileset.name = "floor";
    tileset.image = "floor-tiles.png";
  } else if (tileset.source === "objetos.tsj") {
    tileset.source = "objects.tsj";
  } else if (tileset.name === "colisao") {
    tileset.name = "collision";
    tileset.image = "collision-tile.png";
  }
}
const lights = originalTiled.layers.find(({ name }) => name === "lights");
// The v7 light layer is source material for the generated stage glow. It is not a runtime layer:
// keeping it in the canonical Tiled map would make the renderer draw the old, static lighting.
originalTiled.layers = originalTiled.layers.filter((layer) => layer !== lights);
await writeFile(
  path.join(canonicalMap, "plaza-v2.tmj"),
  `${JSON.stringify(originalTiled, null, 2)}\n`,
);

const originalObjects = JSON.parse(await readFile(path.join(originalMap, "objetos.tsj"), "utf8"));
originalObjects.name = "objects";
for (const tile of originalObjects.tiles) {
  const originalImage = tile.image;
  tile.type = translate(tile.type ?? "object").slice(0, -4);
  tile.image = `objects/${translate(path.basename(originalImage))}`;
  if (tile.type === "lamp" && !tile.properties?.some(({ name }) => name === "glow")) {
    tile.properties = [
      { name: "glow", type: "string", value: "warm" },
      { name: "glowOffsetX", type: "int", value: -34 },
      { name: "glowOffsetY", type: "int", value: -14 },
    ];
  }
  if (tile.type === "stage" && !tile.properties?.some(({ name }) => name === "glow")) {
    tile.properties = [
      { name: "glow", type: "string", value: "stage" },
      { name: "glowOffsetX", type: "int", value: 0 },
      { name: "glowOffsetY", type: "int", value: 0 },
    ];
  }
  if (
    ["building-cafe", "building-brick", "food-truck"].includes(tile.type) &&
    !tile.properties?.some(({ name }) => name === "windows")
  ) {
    tile.properties = [{ name: "windows", type: "string", value: `windows-${tile.type}.png` }];
  }
}
await writeFile(
  path.join(canonicalMap, "objects.tsj"),
  `${JSON.stringify(originalObjects, null, 2)}\n`,
);

await cp(
  path.join(originalMap, "tileset_chao_16x16.png"),
  path.join(canonicalMap, "floor-tiles.png"),
);
await cp(
  path.join(originalMap, "colisao_tile_16.png"),
  path.join(canonicalMap, "collision-tile.png"),
);
await sharp(path.join(originalMap, "animacoes/brilho_poste_anim.png"))
  .png({ compressionLevel: 9, adaptiveFiltering: false, palette: false })
  .toFile(path.join(canonicalMap, "lamp-glow.png"));
const rawObjectLayer = originalTiled.layers.find(({ name }) => name === "objects");
const rawObjectTileset = originalTiled.tilesets.find(({ source }) => source === "objects.tsj");
const rawStage = rawObjectLayer.objects.find(({ gid }) => gid === 36 + rawObjectTileset.firstgid);
if (!rawStage) throw new Error("cannot find the stage placement in the v7 map");
await sharp(path.join(originalMap, "camada_3_luzes.png"))
  .extract({
    left: rawStage.x,
    top: rawStage.y - rawStage.height,
    width: rawStage.width,
    height: rawStage.height,
  })
  .png({ compressionLevel: 9, adaptiveFiltering: false, palette: false })
  .toFile(path.join(canonicalMap, "stage-glow.png"));
for (const tile of JSON.parse(await readFile(path.join(originalMap, "objetos.tsj"), "utf8")).tiles)
  await cp(
    path.join(originalMap, tile.image),
    path.join(canonicalMap, "objects", translate(path.basename(tile.image))),
  );

const sourceObjects = originalTiled.layers.find(({ name }) => name === "objects").objects;
const sourceTileset = originalTiled.tilesets.find(({ source }) => source === "objects.tsj");
const dayPixels = await sharp(path.join(originalMap, "camada_2_objetos_dia.png"))
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
const nightPixels = await sharp(path.join(originalMap, "camada_2_objetos_noite.png"))
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
for (const tile of originalObjects.tiles.filter((candidate) =>
  candidate.properties?.some(({ name }) => name === "windows"),
)) {
  const sourceTileId = tile.id;
  const object = sourceObjects.find(({ gid }) => gid === sourceTileId + sourceTileset.firstgid);
  if (!object) throw new Error(`cannot find a map placement for windows tile ${sourceTileId}`);
  const left = object.x;
  const top = object.y - tile.imageheight;
  const pixels = Buffer.alloc(tile.imagewidth * tile.imageheight * 4);
  for (let y = 0; y < tile.imageheight; y++) {
    for (let x = 0; x < tile.imagewidth; x++) {
      const source = ((top + y) * dayPixels.info.width + left + x) * 4;
      const target = (y * tile.imagewidth + x) * 4;
      const different = [0, 1, 2].some(
        (channel) => dayPixels.data[source + channel] !== nightPixels.data[source + channel],
      );
      if (different) {
        pixels[target] = nightPixels.data[source];
        pixels[target + 1] = nightPixels.data[source + 1];
        pixels[target + 2] = nightPixels.data[source + 2];
        pixels[target + 3] = nightPixels.data[source + 3];
      }
    }
  }
  await sharp(pixels, { raw: { width: tile.imagewidth, height: tile.imageheight, channels: 4 } })
    .png({ compressionLevel: 9, adaptiveFiltering: false, palette: false })
    .toFile(path.join(canonicalMap, tile.properties.find(({ name }) => name === "windows").value));
}
const nextSpeakerTileId = Math.max(...originalObjects.tiles.map((tile) => tile.id)) + 1;
let speakerFrameTileId = nextSpeakerTileId;
for (const tile of originalObjects.tiles) {
  if (tile.type !== "speaker" && tile.type !== "speaker-low") continue;
  const source = path.join(canonicalMap, tile.image);
  const animation = [];
  for (const [frame, brightness] of [1, 1.18].entries()) {
    const frameImage = tile.image.replace(/\.png$/, `-f${frame}.png`);
    await sharp(source).modulate({ brightness }).png().toFile(path.join(canonicalMap, frameImage));
    originalObjects.tiles.push({
      id: speakerFrameTileId,
      type: `${tile.type}-f${frame}`,
      image: frameImage,
      imagewidth: tile.imagewidth,
      imageheight: tile.imageheight,
    });
    animation.push({ tileid: speakerFrameTileId, duration: 125 });
    speakerFrameTileId += 1;
  }
  tile.animation = animation;
}
await writeFile(
  path.join(canonicalMap, "objects.tsj"),
  `${JSON.stringify(originalObjects, null, 2)}\n`,
);

const originalCarsMetadata = JSON.parse(
  await readFile(path.join(repositoryRoot, "assets/autodromo/carros.json"), "utf8"),
);
const [carCellWidth, carCellHeight] = originalCarsMetadata.celula_carro;
const anchorMatch = originalCarsMetadata.ancora_carro.match(/\((\d+),(\d+)\)/);
if (!anchorMatch) throw new Error("carros.json must define ancora_carro as (x,y)");
const carsMetadata = {
  cellSize: [carCellWidth, carCellHeight],
  directions: ["down", "right", "up", "left"],
  frames: { idle: 0, driveA: 1, driveB: 2 },
  layers: ["car-back", "avatar", "car-front"],
  avatarOffsets: {
    down: originalCarsMetadata.avatar_no_carro.baixo,
    right: originalCarsMetadata.avatar_no_carro.direita,
    up: originalCarsMetadata.avatar_no_carro.cima,
  },
  anchor: [Number(anchorMatch[1]), Number(anchorMatch[2])],
  animation: { normalMilliseconds: 100, highSpeedMilliseconds: 60 },
  models: ["kart", "convertible"],
};
const carsJson = JSON.stringify(carsMetadata, null, 2).replace(
  /\[\n([\s\S]*?)\n\s+\]/g,
  (match, contents) =>
    contents.includes("{") ? match : `[${contents.replace(/\s*,\s*\n\s*/g, ", ").trim()}]`,
);
await writeFile(path.join(repositoryRoot, "assets/autodromo/cars.json"), `${carsJson}\n`);
await rm(publicCars, { recursive: true, force: true });
await mkdir(publicCars, { recursive: true });
for (const model of ["kart", "conversivel"]) {
  const destinationModel = model === "conversivel" ? "convertible" : model;
  await mkdir(path.join(canonicalCars, destinationModel), { recursive: true });
  for (const file of await (await import("node:fs/promises")).readdir(
    path.join(originalCars, model),
  )) {
    const destination = file
      .replace("conversivel", "convertible")
      .replace("amarelo", "yellow")
      .replace("azul", "blue")
      .replace("branco", "white")
      .replace("preto", "black")
      .replace("rosa", "pink")
      .replace("roxo", "purple")
      .replace("verde", "green")
      .replace("vermelho", "red")
      .replace("_", "-")
      .replaceAll("_", "-")
      .replace("-frente", "-front")
      .replace("-fundo", "-back")
      .replace("-completo", "-idle-complete")
      .replace("-parado-completo", "-idle-complete");
    await cp(
      path.join(originalCars, model, file),
      path.join(canonicalCars, destinationModel, destination),
    );
    await cp(
      path.join(originalCars, model, file),
      path.join(publicCars, destinationModel, destination),
    );
  }
}

console.log("normalized plaza-v2 map and autodrome car assets into canonical paths");
const effects = [
  ["fx_fumaca.png", "exhaust-smoke-48.png"],
  ["fx_poeira.png", "drift-dust-48.png"],
  ["fx_velocidade.png", "speed-lines-48.png"],
];
for (const [source, destination] of effects) {
  await cp(
    path.join(repositoryRoot, "assets/autodromo/fx", source),
    path.join(canonicalCars, destination),
  );
  await cp(
    path.join(repositoryRoot, "assets/autodromo/fx", source),
    path.join(publicCars, destination),
  );
}
