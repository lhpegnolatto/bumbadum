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

/**
 * Hairstyles and fabric wearables are one base pair painted in reserved key colors: grey keys
 * take the shades of each palette color, blue-grey keys the shades of the style's accent
 * (ADR-0022). Every other wearable is one pair per color.
 */
const palettes = JSON.parse(await readFile(path.join(sourceRoot, "palettes.json"), "utf8"));
const keys = {
  main: ["d8d8d8", "a8a8a8", "787878", "484848"],
  accent: ["d8d8ff", "a8a8ff", "7878ff"],
};
const fabricRamp = (id) => {
  const color = palettes.fabricColors.find((candidate) => candidate.id === id);
  if (!color) throw new Error(`unknown fabric color: ${id}`);
  return color.ramp;
};
for (const [styleKey, { accent, fallback }] of Object.entries(palettes.accents)) {
  fabricRamp(accent);
  fabricRamp(fallback);
  if (accent === fallback) throw new Error(`accent needs a different fallback: ${styleKey}`);
}

const entries = [];
const paletted = new Set();
for (const layer of layers) {
  const layerPath = path.join(sourceRoot, layer);
  for (const styleEntry of await readdir(layerPath, { withFileTypes: true })) {
    if (!styleEntry.isDirectory() || !kebabCase.test(styleEntry.name))
      throw new Error(`invalid style directory: ${layer}/${styleEntry.name}`);
    const style = styleEntry.name;
    const stylePath = path.join(layerPath, style);
    const files = (await readdir(stylePath)).sort();
    if (files.includes(`${style}-idle.png`)) {
      if (files.join() !== cycles.map((cycle) => `${style}-${cycle}.png`).join())
        throw new Error(`a base pair must be alone in ${layer}/${style}`);
      paletted.add(`${layer}/${style}`);
      const colors = layer === "hair" ? palettes.hairColors : palettes.fabricColors;
      const accent = palettes.accents[`${layer}/${style}`];
      for (const [order, color] of colors.entries()) {
        const accentId = accent && (accent.accent === color.id ? accent.fallback : accent.accent);
        entries.push({
          layer,
          style,
          color: color.id,
          id: `${style}-${color.id}`,
          order,
          file: (cycle) => path.join(stylePath, `${style}-${cycle}.png`),
          ramps: { main: color.ramp, accent: accentId ? fabricRamp(accentId) : [] },
        });
      }
      continue;
    }
    for (const [order, file] of files.filter((name) => name.endsWith("-idle.png")).entries()) {
      const id = file.slice(0, -"-idle.png".length);
      if (!kebabCase.test(id) || !id.startsWith(`${style}-`))
        throw new Error(`invalid asset id: ${layer}/${style}/${id}`);
      for (const cycle of cycles) {
        const expected = `${id}-${cycle}.png`;
        if (!files.includes(expected))
          throw new Error(`missing pair: ${layer}/${style}/${expected}`);
      }
      entries.push({
        layer,
        style,
        color: id.slice(style.length + 1),
        id,
        order,
        file: (cycle) => path.join(stylePath, `${id}-${cycle}.png`),
      });
    }
    const expectedCount = files.filter((name) => name.endsWith("-idle.png")).length * 2;
    if (files.length !== expectedCount) throw new Error(`unpaired file in ${layer}/${style}`);
  }
}
for (const styleKey of Object.keys(palettes.accents)) {
  if (!paletted.has(styleKey))
    throw new Error(`accent for a style without a base pair: ${styleKey}`);
}

entries.sort(
  (a, b) =>
    layers.indexOf(a.layer) - layers.indexOf(b.layer) ||
    a.style.localeCompare(b.style) ||
    a.order - b.order,
);
const atlasWidth = sheetWidth * atlasColumns;
const atlasHeight = Math.ceil(entries.length / atlasColumns) * frameSize;
const atlases = Object.fromEntries(
  cycles.map((cycle) => [cycle, Buffer.alloc(atlasWidth * atlasHeight * 4)]),
);
const warnings = new Set();

for (const [row, entry] of entries.entries()) {
  for (const cycle of cycles) {
    const file = entry.file(cycle);
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
    if (entry.ramps) recolor(firstRow, entry.ramps, file);
    if ((entry.layer === "bottom" || entry.layer === "footwear") && cycle === "idle") {
      const missing = cell(firstRow, 5);
      if (missing.every((byte, index) => index % 4 !== 3 || byte === 0)) {
        copyCell(firstRow, 4, 5);
        warnings.add(`repaired empty lateral frame: ${path.relative(sourceRoot, file)}`);
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
      .map(({ id, style, color }) => ({ id, style, color })),
  ]),
);
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

/** Replaces a base sheet's key colors with the shades of its ramps. */
function recolor(buffer, ramps, file) {
  let keyed = false;
  for (let index = 0; index < buffer.length; index += 4) {
    if (buffer[index + 3] === 0) continue;
    const color = buffer.subarray(index, index + 3).toString("hex");
    for (const role of ["main", "accent"]) {
      const shade = keys[role].indexOf(color);
      if (shade === -1) continue;
      const replacement = ramps[role][shade];
      if (!replacement)
        throw new Error(`${file} uses ${role} shade ${shade + 1}, which has no color`);
      Buffer.from(replacement.slice(1), "hex").copy(buffer, index);
      keyed ||= role === "main";
    }
  }
  if (!keyed) throw new Error(`base sheet has no palette keys: ${file}`);
}

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
