export function withGrid(n) {
  return n * 16;
}

export function asGridCoors(x, y) {
  return `${withGrid(x)},${withGrid(y)}`;
}

export function nextPosition(initialX, initialY, direction) {
  let x = initialX;
  let y = initialY;
  const size = 16;
  if (direction === "left") {
    x -= size;
  } else if (direction === "right") {
    x += size;
  } else if (direction === "up") {
    y -= size;
  } else if (direction === "down") {
    y += size;
  }
  return { x, y };
}

export function emitEvent(name, detail) {
  const event = new CustomEvent(name, {
    detail,
  });
  document.dispatchEvent(event);
}
