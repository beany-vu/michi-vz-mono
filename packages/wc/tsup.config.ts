import { defineConfig } from "tsup";

export default defineConfig({
  entry: [
    "src/index.ts",
    "src/gap-chart.ts",
    "src/line-chart.ts",
    "src/area-chart.ts",
    "src/scatter-chart.ts",
    "src/vertical-stack-bar-chart.ts",
    "src/comparable-horizontal-bar-chart.ts",
  ],
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  splitting: true,
});
