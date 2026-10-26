/** A rectangle in world or texture pixels. */
export interface WindowRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** The part of a facade covered by the generated window mask. */
export interface WindowFacade {
  /** Top-left position and size of the facade/window-mask sprite in world pixels. */
  bounds: WindowRect;
  /** The facade's depth anchor, in the same world-pixel space as an actor's feet. */
  base: number;
}

/** A moving thing that may cover a facade window. */
export interface WindowOccluder {
  kind: "player" | "car";
  /** Bounds of the visible actor in world pixels. */
  bounds: WindowRect;
  /** Bottom edge used by the room's shared depth order. */
  feetY: number;
}

/** A drawable piece of a window mask, with its matching source rectangle. */
export interface VisibleWindowRegion {
  world: WindowRect;
  texture: WindowRect;
}

/**
 * Returns the visible pieces of a facade's window mask after Players and Cars in front of it are
 * removed. The returned rectangles are non-overlapping and can be used as Pixi source/destination
 * frames without changing the generated mask texture.
 *
 * Actors behind the facade are ignored. An actor whose feet are exactly on the facade base is in
 * front, matching `playerDepth`/`objectDepth` in `depth.ts`.
 */
export function visibleWindowRegions(
  facade: WindowFacade,
  occluders: readonly WindowOccluder[],
): VisibleWindowRegion[] {
  const frontOccluders = occluders.filter((occluder) => occluder.feetY >= facade.base);
  const xEdges = edges(facade.bounds.x, facade.bounds.x + facade.bounds.width, frontOccluders, "x");
  const yEdges = edges(
    facade.bounds.y,
    facade.bounds.y + facade.bounds.height,
    frontOccluders,
    "y",
  );
  const visible: WindowRect[] = [];

  for (let y = 0; y < yEdges.length - 1; y += 1) {
    for (let x = 0; x < xEdges.length - 1; x += 1) {
      const region = {
        x: xEdges[x] as number,
        y: yEdges[y] as number,
        width: (xEdges[x + 1] as number) - (xEdges[x] as number),
        height: (yEdges[y + 1] as number) - (yEdges[y] as number),
      };
      const centre = { x: region.x + region.width / 2, y: region.y + region.height / 2 };
      if (!frontOccluders.some(({ bounds }) => contains(bounds, centre))) visible.push(region);
    }
  }

  return mergeAdjacent(visible)
    .filter((region) => region.width > 0 && region.height > 0)
    .sort((a, b) => a.y - b.y || a.x - b.x)
    .map((world) => ({
      world,
      texture: {
        x: world.x - facade.bounds.x,
        y: world.y - facade.bounds.y,
        width: world.width,
        height: world.height,
      },
    }));
}

function edges(
  start: number,
  end: number,
  occluders: readonly WindowOccluder[],
  axis: "x" | "y",
): number[] {
  return [
    start,
    end,
    ...occluders.flatMap(({ bounds }) => {
      const boundsStart = axis === "x" ? bounds.x : bounds.y;
      const boundsEnd = boundsStart + (axis === "x" ? bounds.width : bounds.height);
      return boundsEnd > start && boundsStart < end
        ? [Math.max(start, boundsStart), Math.min(end, boundsEnd)]
        : [];
    }),
  ]
    .sort((a, b) => a - b)
    .filter((edge, index, all) => edge !== all[index - 1]);
}

function contains(rect: WindowRect, point: { x: number; y: number }): boolean {
  return (
    point.x >= rect.x &&
    point.x < rect.x + rect.width &&
    point.y >= rect.y &&
    point.y < rect.y + rect.height
  );
}

function mergeAdjacent(regions: WindowRect[]): WindowRect[] {
  const merged: WindowRect[] = [];
  for (const region of regions.sort((a, b) => a.y - b.y || a.x - b.x)) {
    const previous = merged.at(-1);
    if (
      previous &&
      previous.y === region.y &&
      previous.height === region.height &&
      previous.x + previous.width === region.x
    ) {
      previous.width += region.width;
    } else {
      merged.push({ ...region });
    }
  }
  return merged;
}
