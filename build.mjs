import * as esbuild from "esbuild";
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";

const watch = process.argv.includes("--watch");

await rm("dist", { recursive: true, force: true });
await mkdir("dist", { recursive: true });
// package.json is the single source of truth for the version.
const { version } = JSON.parse(await readFile("package.json", "utf8"));
const manifest = JSON.parse(await readFile("manifest.json", "utf8"));
await writeFile("dist/manifest.json", JSON.stringify({ ...manifest, version }));
await cp("icons", "dist/icons", { recursive: true });

const options = {
  entryPoints: {
    "background/service-worker": "src/background/service-worker.ts",
    "content/main-world-hook": "src/content/main-world-hook.ts",
    "content/fullscreen-controller": "src/content/fullscreen-controller.ts",
  },
  outdir: "dist",
  bundle: true,
  format: "iife",
  target: "chrome120",
  minify: !watch,
  legalComments: "none",
  drop: watch ? [] : ["debugger"],
  sourcemap: watch ? "inline" : false,
  logLevel: "info",
};

if (watch) {
  const ctx = await esbuild.context(options);
  await ctx.watch();
} else {
  await esbuild.build(options);
}
