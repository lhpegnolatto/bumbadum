// Bundles the server for production. Workspace packages export TypeScript
// source, so they are bundled in; third-party dependencies stay external and
// are resolved from node_modules at runtime.
import { readFile } from "node:fs/promises";
import { build } from "esbuild";

const { dependencies } = JSON.parse(
  await readFile(new URL("./package.json", import.meta.url), "utf8"),
);
const external = Object.keys(dependencies).filter((name) => !name.startsWith("@bumbadum/"));

await build({
  entryPoints: ["src/index.ts"],
  outfile: "dist/index.js",
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node24",
  sourcemap: true,
  external,
});
