import { defineConfig } from "tsup";
import pkg from "./package.json";

export default defineConfig({
  // Stamp the root `version` export from package.json so it can never drift
  // from the published version.
  define: { __MICHI_VZ_INSIGHTS_VERSION__: JSON.stringify(pkg.version) },
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
