import { defineConfig } from "tsup";

// Self-contained browser bundle for the no-build / CDN path and the playground:
// inlines lit + @michi-vz/core + d3 + dompurify into one ESM file. Importing it
// auto-registers all elements and (via the engine) auto-injects core.css.
export default defineConfig({
  entry: { "michi-vz-wc.bundle": "src/index.ts" },
  format: ["esm"],
  noExternal: [/.*/],
  dts: false,
  minify: true,
  treeshake: true,
  sourcemap: false,
  clean: false,
});
