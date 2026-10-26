import { writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

/**
 * Draws the extra frames of the plaza's Ambient animations from each object's still image:
 * `objects/<name>.png` stays frame 0 and this writes `objects/<name>-1.png` onwards. Every frame
 * keeps its source's size and leaves its bottom rows untouched, so the object's base and depth
 * order never move. Pixels are only moved or repeated, never blended, so the art stays crisp.
 *
 * The frames are a starting point for a human to review and retouch; running this again
 * overwrites them. Tiled declares them as tile animations in `objects.tsj` (ADR-0016).
 */
const objectsRoot = path.resolve(import.meta.dirname, "../../assets/map/plaza-v2/objects");
const transparent = Buffer.alloc(4);

/**
 * Trees and shrubs sway: canopy rows shift sideways by one pixel, starting at the top and
 * reaching further down in the fuller lean. `fixedRows` counts the bottom rows that never move
 * (the trunk). Each lean shifts the rows whose height above the trunk reaches its `from`.
 */
const sways = {
  "tree-a": { fixedRows: 16 },
  "tree-b": { fixedRows: 16 },
  "tree-c": { fixedRows: 15 },
  "tree-pink": { fixedRows: 14 },
  "tree-tall": { fixedRows: 17 },
  "tree-young": { fixedRows: 13 },
  pine: { fixedRows: 6 },
  shrub: { fixedRows: 2 },
  "shrub-flower": { fixedRows: 2 },
};
const swayLeans = [
  { dx: 1, from: 0.6 },
  { dx: 1, from: 0.3 },
  { dx: -1, from: 0.6 },
];

const flutterFrames = 3;

/**
 * Hanging banners swing the lower part of their cloth, from `bannerSwingFrom` of its length
 * down; the crossbar on top and the pole below stay still.
 */
const banners = {
  "flag-pink": { clothRows: [5, 37] },
  "flag-purple": { clothRows: [5, 37] },
};
const bannerSwingFrom = 0.55;
/** A flag flying from the pole on its left waves up and down, more the further from the pole. */
const pennants = { "flag-checkered": { attachedColumn: 5, rows: [0, 15] } };
/** Bunting pennants swing their tips; the string and each pennant's top stay still. */
const buntings = ["bunting", "bunting-short"];

const generated = [];
for (const [name, { fixedRows }] of Object.entries(sways)) {
  const image = await readImage(name);
  const top = firstOpaqueRow(image);
  const pivot = image.height - fixedRows;
  for (const [index, { dx, from }] of swayLeans.entries()) {
    const frame = copyImage(image);
    for (let y = top; y < pivot; y++) {
      if ((pivot - y) / (pivot - top) >= from) shiftRow(image, frame, y, dx, name);
    }
    generated.push(await writeFrame(name, index + 1, frame));
  }
}
for (const [name, { clothRows }] of Object.entries(banners)) {
  const image = await readImage(name);
  const [first, last] = clothRows;
  // The cloth hangs from the crossbar, so only its lower part swings: right, then left.
  for (const [index, dx] of [1, -1].entries()) {
    const frame = copyImage(image);
    for (let y = first; y <= last; y++) {
      if ((y - first + 1) / (last - first + 1) < bannerSwingFrom) continue;
      // Rows as wide as the image ripple inside their outline; the narrower tail moves whole.
      const fullWidth = isOpaque(image, 0, y) || isOpaque(image, image.width - 1, y);
      if (fullWidth) rippleRow(image, frame, y, dx);
      else shiftRow(image, frame, y, dx, name);
    }
    generated.push(await writeFrame(name, index + 1, frame));
  }
}
for (const [name, { attachedColumn, rows }] of Object.entries(pennants)) {
  const image = await readImage(name);
  const length = image.width - 1 - attachedColumn;
  for (let index = 1; index < flutterFrames; index++) {
    const frame = copyImage(image);
    for (let x = attachedColumn + 1; x < image.width; x++) {
      const strength = Math.min(1, (2 * (x - attachedColumn)) / length);
      const dy = Math.round(flutterWave(x - attachedColumn, 2 * length, index) * strength);
      shiftColumn(image, frame, x, rows, dy, name);
    }
    generated.push(await writeFrame(name, index, frame));
  }
}
for (const name of buntings) {
  const image = await readImage(name);
  const string = stringColor(image);
  const pennantsOfBunting = pennantShapes(image, string);
  for (let index = 1; index < flutterFrames; index++) {
    const frame = copyImage(image);
    for (const [order, pennant] of pennantsOfBunting.entries()) {
      const dx = Math.round(flutterWave(order, 3, index));
      for (const row of pennant.rows) {
        if (row.width < pennant.widest) moveSpan(image, frame, row, dx, name);
      }
    }
    generated.push(await writeFrame(name, index, frame));
  }
}
console.log(`generated ${generated.length} ambient frames:\n${generated.join("\n")}`);

/** A wave travelling through cloth over the flutter's frames, between -1 and 1. */
function flutterWave(position, wavelength, frame) {
  return Math.sin(2 * Math.PI * (position / wavelength - frame / flutterFrames));
}

async function readImage(name) {
  const { data, info } = await sharp(path.join(objectsRoot, `${name}.png`))
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { width: info.width, height: info.height, data };
}

function copyImage(image) {
  return { ...image, data: Buffer.from(image.data) };
}

async function writeFrame(name, index, frame) {
  const file = `${name}-${index}.png`;
  const content = await sharp(frame.data, {
    raw: { width: frame.width, height: frame.height, channels: 4 },
  })
    .png({ compressionLevel: 9, adaptiveFiltering: false, palette: false })
    .toBuffer();
  await writeFile(path.join(objectsRoot, file), content);
  return file;
}

function pixel(image, x, y) {
  const start = (y * image.width + x) * 4;
  return image.data.subarray(start, start + 4);
}

function setPixel(image, x, y, value) {
  image.data.set(value, (y * image.width + x) * 4);
}

function isOpaque(image, x, y) {
  return pixel(image, x, y)[3] !== 0;
}

function firstOpaqueRow(image) {
  for (let y = 0; y < image.height; y++)
    for (let x = 0; x < image.width; x++) if (isOpaque(image, x, y)) return y;
  throw new Error("image is fully transparent");
}

/** Moves a whole row sideways; failing rather than cropping a pixel off the image's edge. */
function shiftRow(source, target, y, dx, name) {
  for (let x = 0; x < source.width; x++) {
    const from = x - dx;
    const inside = from >= 0 && from < source.width;
    setPixel(target, x, y, inside ? pixel(source, from, y) : transparent);
  }
  const lost = dx > 0 ? source.width - 1 : 0;
  if (isOpaque(source, lost, y))
    throw new Error(`${name}: shifting row ${y} would crop a pixel off the image`);
}

/**
 * Moves a row's pixels sideways inside its outline: the outermost opaque pixel on each side
 * stays, the pixels between them shift, and the one left behind repeats its neighbour. The
 * silhouette never changes; the cloth's shading and emblem slide like a fold passing through.
 */
function rippleRow(source, target, y, dx) {
  if (dx === 0) return;
  let left = 0;
  while (left < source.width && !isOpaque(source, left, y)) left++;
  let right = source.width - 1;
  while (right > left && !isOpaque(source, right, y)) right--;
  for (let x = left + 1; x < right; x++) {
    const from = Math.min(right - 1, Math.max(left + 1, x - dx));
    setPixel(target, x, y, pixel(source, from, y));
  }
}

/** Moves the pixels of one column within `rows` up or down; failing rather than cropping. */
function shiftColumn(source, target, x, [first, last], dy, name) {
  for (let y = first; y <= last; y++) {
    const from = y - dy;
    const inside = from >= first && from <= last;
    setPixel(target, x, y, inside ? pixel(source, x, from) : transparent);
  }
  const lost = dy > 0 ? last : first;
  if (dy !== 0 && isOpaque(source, x, lost))
    throw new Error(`${name}: shifting column ${x} would crop a pixel off the flag`);
}

/** The bunting's string is the colour of its first opaque pixel, on the string's left end. */
function stringColor(image) {
  for (let y = 0; y < image.height; y++)
    for (let x = 0; x < image.width; x++)
      if (isOpaque(image, x, y)) return Buffer.from(pixel(image, x, y));
  throw new Error("bunting is fully transparent");
}

/**
 * Each pennant is a run of non-string pixels hanging below the string: its rows from top to
 * tip, each a horizontal span, found by following the spans that overlap the one above.
 */
function pennantShapes(image, string) {
  const isCloth = (x, y) => isOpaque(image, x, y) && !pixel(image, x, y).equals(string);
  const spansOf = (y) => {
    const spans = [];
    for (let x = 0; x < image.width; x++) {
      if (!isCloth(x, y)) continue;
      const start = x;
      while (x + 1 < image.width && isCloth(x + 1, y)) x++;
      spans.push({ y, left: start, width: x - start + 1 });
    }
    return spans;
  };
  const pennants = [];
  let open = [];
  for (let y = 0; y < image.height; y++) {
    const next = [];
    for (const span of spansOf(y)) {
      const above = open.find(
        (pennant) =>
          pennant.last.left < span.left + span.width &&
          span.left < pennant.last.left + pennant.last.width,
      );
      const pennant = above ?? { rows: [], widest: 0 };
      if (!above) pennants.push(pennant);
      pennant.rows.push(span);
      pennant.last = span;
      pennant.widest = Math.max(pennant.widest, span.width);
      next.push(pennant);
    }
    open = next;
  }
  return pennants.sort((a, b) => a.rows[0].left - b.rows[0].left);
}

/** Moves one pennant row sideways by `dx`, failing if it would leave its pennant's top span. */
function moveSpan(source, target, span, dx, name) {
  if (dx === 0) return;
  const pixels = [];
  for (let x = span.left; x < span.left + span.width; x++) {
    pixels.push(Buffer.from(pixel(source, x, span.y)));
    setPixel(target, x, span.y, transparent);
  }
  for (const [offset, value] of pixels.entries()) {
    const x = span.left + offset + dx;
    if (x < 0 || x >= source.width)
      throw new Error(`${name}: moving row ${span.y} would crop a pixel off the image`);
    setPixel(target, x, span.y, value);
  }
}
