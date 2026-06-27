import { defineConfig } from "tsup";

export default defineConfig({
  entry: [
    "src/index.ts",
    "src/forecast/index.ts",
    "src/anomaly/index.ts",
    "src/validate/index.ts",
    "src/narrate/index.ts",
    "src/embeddings/index.ts",
    "src/sql/index.ts",
    "src/sonify/index.ts",
    "src/agent/index.ts",
    "src/mcp/index.ts",
  ],
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  splitting: true,
});
