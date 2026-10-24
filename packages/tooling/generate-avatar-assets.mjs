import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const frameSize = 24;
const sheetWidth = 288;
const atlasColumns = 14;
const sourceRoot = path.resolve(import.meta.dirname, "../../assets/avatar");
const publicRoot = path.resolve(import.meta.dirname, "../../apps/web/public/sprites/avatar");
const generatedFile = path.resolve(import.meta.dirname, "../avatar/src/catalog.generated.ts");
const check = process.argv.includes("--check");
const layers = [
  "hair",
  "top",
  "bottom",
  "footwear",
  "overgarment",
  "neckwear",
  "eyewear",
  "headwear",
];
const cycles = ["idle", "walk"];
const kebabCase = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const retired = new Set(JSON.parse(await readFile(path.join(sourceRoot, "retired.json"), "utf8")));

const entries = [];
for (const layer of layers) {
  const layerPath = path.join(sourceRoot, layer);
  for (const styleEntry of await readdir(layerPath, { withFileTypes: true })) {
    if (!styleEntry.isDirectory() || !kebabCase.test(styleEntry.name))
      throw new Error(`invalid style directory: ${layer}/${styleEntry.name}`);
    const stylePath = path.join(layerPath, styleEntry.name);
    const files = await readdir(stylePath);
    for (const file of files.filter((name) => name.endsWith("-idle.png")).sort()) {
      const id = file.slice(0, -"-idle.png".length);
      if (!kebabCase.test(id) || !id.startsWith(`${styleEntry.name}-`))
        throw new Error(`invalid asset id: ${layer}/${styleEntry.name}/${id}`);
      for (const cycle of cycles) {
        const expected = `${id}-${cycle}.png`;
        if (!files.includes(expected))
          throw new Error(`missing pair: ${layer}/${styleEntry.name}/${expected}`);
      }
      entries.push({
        layer,
        style: styleEntry.name,
        color: id.slice(styleEntry.name.length + 1),
        id,
        stylePath,
      });
    }
    const expectedCount = files.filter((name) => name.endsWith("-idle.png")).length * 2;
    if (files.length !== expectedCount)
      throw new Error(`unpaired file in ${layer}/${styleEntry.name}`);
  }
}

entries.sort(
  (a, b) => layers.indexOf(a.layer) - layers.indexOf(b.layer) || a.id.localeCompare(b.id),
);
const atlasWidth = sheetWidth * atlasColumns;
const atlasHeight = Math.ceil(entries.length / atlasColumns) * frameSize;
const atlases = Object.fromEntries(
  cycles.map((cycle) => [cycle, Buffer.alloc(atlasWidth * atlasHeight * 4)]),
);
const warnings = [];

for (const [row, entry] of entries.entries()) {
  for (const cycle of cycles) {
    const file = path.join(entry.stylePath, `${entry.id}-${cycle}.png`);
    const image = sharp(await readFile(file));
    const metadata = await image.metadata();
    if (
      metadata.width !== sheetWidth ||
      metadata.height !== frameSize * 4 ||
      metadata.channels !== 4
    )
      throw new Error(`expected RGBA ${sheetWidth}x${frameSize}: ${file}`);
    const pixels = await image.raw().toBuffer();
    const firstRow = Buffer.from(pixels.subarray(0, sheetWidth * frameSize * 4));
    for (let tone = 1; tone < 4; tone++) {
      const offset = tone * sheetWidth * frameSize * 4;
      if (!pixels.subarray(offset, offset + firstRow.length).equals(firstRow))
        throw new Error(`appearance overlay differs by skin-tone row: ${file}`);
    }
    if ((entry.layer === "bottom" || entry.layer === "footwear") && cycle === "idle") {
      const missing = cell(firstRow, 5);
      if (missing.every((byte, index) => index % 4 !== 3 || byte === 0)) {
        copyCell(firstRow, 4, 5);
        warnings.push(`repaired empty lateral frame: ${entry.layer}/${entry.id}-${cycle}.png`);
      }
    }
    const left = (row % atlasColumns) * sheetWidth;
    const top = Math.floor(row / atlasColumns) * frameSize;
    for (let y = 0; y < frameSize; y++) {
      const sourceStart = y * sheetWidth * 4;
      const targetStart = ((top + y) * atlasWidth + left) * 4;
      firstRow.copy(atlases[cycle], targetStart, sourceStart, sourceStart + sheetWidth * 4);
    }
  }
}

await mkdir(publicRoot, { recursive: true });
for (const cycle of cycles) {
  const output = await sharp(atlases[cycle], {
    raw: { width: atlasWidth, height: atlasHeight, channels: 4 },
  })
    .png({ compressionLevel: 9, adaptiveFiltering: false, palette: false })
    .toBuffer();
  const target = path.join(publicRoot, `layers-${cycle}.png`);
  if (check) {
    if (!(await readFile(target)).equals(output))
      throw new Error(`stale generated atlas: ${target}`);
  } else {
    await writeFile(target, output);
  }
}

const catalog = Object.fromEntries(
  layers.map((layer) => [
    layer,
    entries
      .filter((entry) => entry.layer === layer)
      .map(({ layer: optionLayer, id, style, color }) => ({
        id,
        style,
        color,
        retired: retired.has(`${optionLayer}:${id}`),
      })),
  ]),
);
for (const retiredId of retired) {
  if (!entries.some(({ layer, id }) => `${layer}:${id}` === retiredId))
    throw new Error(`retired avatar asset is missing: ${retiredId}`);
}
const positions = Object.fromEntries(
  entries.map((entry, row) => [
    `${entry.layer}:${entry.id}`,
    { x: (row % atlasColumns) * sheetWidth, y: Math.floor(row / atlasColumns) * frameSize },
  ]),
);
const source =
  `// Generated by pnpm --filter @bumbadum/avatar assets:generate. Do not edit.\n` +
  `export const GENERATED_CATALOG = ${JSON.stringify(catalog, null, 2)} as const;\n\n` +
  `export const ASSET_POSITION_BY_ID: Readonly<Record<string, { x: number; y: number }>> = ${JSON.stringify(positions, null, 2)};\n`;
if (check) {
  if ((await readFile(generatedFile, "utf8")) !== source)
    throw new Error(`stale generated catalog: ${generatedFile}`);
} else {
  await writeFile(generatedFile, source);
}
for (const warning of warnings) console.warn(warning);
console.log(
  `${check ? "validated" : "generated"} ${entries.length} avatar variants in two atlases`,
);

function cell(buffer, column) {
  const result = Buffer.alloc(frameSize * frameSize * 4);
  for (let y = 0; y < frameSize; y++) {
    const start = (y * sheetWidth + column * frameSize) * 4;
    buffer.copy(result, y * frameSize * 4, start, start + frameSize * 4);
  }
  return result;
}

function copyCell(buffer, from, to) {
  const source = cell(buffer, from);
  for (let y = 0; y < frameSize; y++) {
    const start = y * frameSize * 4;
    source.copy(buffer, (y * sheetWidth + to * frameSize) * 4, start, start + frameSize * 4);
  }
}
