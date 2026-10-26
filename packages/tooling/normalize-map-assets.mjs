import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const repositoryRoot = path.resolve(import.meta.dirname, "../..");
const originalMap = path.join(repositoryRoot, "assets/mapa_praca_v2");
const canonicalMap = path.join(repositoryRoot, "assets/map/plaza-v2");
const originalCars = path.join(repositoryRoot, "assets/autodromo/carros");
const canonicalCars = path.join(repositoryRoot, "assets/autodromo/cars");
const publicCars = path.join(repositoryRoot, "apps/web/public/sprites/plaza-v2/cars");

const words = {
  arbusto: "shrub",
  flor: "flower",
  arquibancada: "grandstand",
  arvore: "tree",
  alta: "tall",
  jovem: "young",
  rosa: "pink",
  roxa: "purple",
  banco: "bench",
  vertical: "vertical",
  bandeira: "flag",
  quadriculada: "checkered",
  bandeirinhas: "bunting",
  curta: "short",
  barreira: "barrier",
  cadeira: "chair",
  caixa: "speaker",
  som: "speaker",
  baixa: "low",
  carro: "car",
  conversivel: "convertible",
  kart: "kart",
  cerca: "fence",
  cone: "cone",
  food: "food",
  truck: "truck",
  hidrante: "hydrant",
  jardineira: "planter",
  lixeira: "trash",
  mesa: "table",
  guarda: "sun",
  sol: "shade",
  piquenique: "picnic",
  palco: "stage",
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
  predio: "building",
  cafe: "cafe",
  discos: "records",
  radio: "radio",
  tijolo: "brick",
  quiosque: "kiosk",
  tenda: "tent",
  amarelo: "yellow",
  amarela: "yellow",
  azul: "blue",
  branco: "white",
  branca: "white",
  preto: "black",
  roxo: "purple",
  verde: "green",
  vermelho: "red",
  listrado: "striped",
};

const translate = (value) =>
  `${value
    .replace(/\.png$/, "")
    .split("_")
    .map((part) => words[part] ?? part)
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
      for (const property of object.properties ?? []) {
        if (property.name === "colisao") property.name = "collision";
        if (property.name === "direcao") property.name = "direction";
        if (property.name === "ocupada") property.name = "occupied";
        if (property.value === "cima") property.value = "up";
        if (property.value === "baixo") property.value = "down";
      }
    }
    // These objects were intentionally removed from the v2 playable layout.
    layer.objects = layer.objects.filter(
      (object) =>
        object.name !== "chair" &&
        !(object.name === "tires" && object.x >= 1250 && object.x <= 1256 && object.y <= 110),
    );
  }
}
// The source preview contains one isolated walkable pixel inside the north wall.
// Keep the canonical Tiled collision layer connected so reachability validation is meaningful.
const canonicalCollision = originalTiled.layers.find(({ name }) => name === "collision");
canonicalCollision.data[14 * originalTiled.width + 43] = 674;
// The center chairs were removed from the object layers; clear their baked tile collision too.
const removedChairCollisionTiles = [
  [23, 14],
  [28, 14],
  [31, 14],
  [34, 14],
  [23, 16],
  [28, 16],
  [31, 16],
  [34, 16],
  [23, 18],
  [28, 18],
  [31, 18],
  [34, 18],
];
for (const [x, y] of removedChairCollisionTiles) {
  canonicalCollision.data[y * originalTiled.width + x] = 0;
}
// Keep the top parking exit open so cars can pull out into the autodrome approach.
for (let x = 61; x <= 73; x += 1) {
  canonicalCollision.data[22 * originalTiled.width + x] = 0;
}
originalTiled.layers.push({
  id: 9,
  name: "spawn",
  type: "objectgroup",
  draworder: "topdown",
  objects: [
    {
      id: 7000,
      name: "spawn",
      type: "spawn",
      // Keep the shared Lobby spawn in the plaza at tile (30, 22).
      x: 488,
      y: 360,
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
lights.image = "lights.png";
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
await cp(path.join(originalMap, "camada_3_luzes.png"), path.join(canonicalMap, "lights.png"));
for (const tile of JSON.parse(await readFile(path.join(originalMap, "objetos.tsj"), "utf8")).tiles)
  await cp(
    path.join(originalMap, tile.image),
    path.join(canonicalMap, "objects", translate(path.basename(tile.image))),
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
