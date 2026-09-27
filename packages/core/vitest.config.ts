import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // Tests that read the examples package run it against this source, not a build.
    alias: { "@michi-vz/core": fileURLToPath(new URL("./src/index.ts", import.meta.url)) },
  },
  test: {
    environment: "jsdom",
    include: ["test/**/*.test.ts"],
  },
});
