// Emits the raw stylesheet (@michi-vz/core/styles.css) from the canonical
// CORE_CSS string after the JS build, so consumers can <link>/import it or run
// under strict CSP without the auto-inject.
import { mkdirSync, writeFileSync } from "node:fs";
import { CORE_CSS } from "../dist/index.js";

const outDir = new URL("../dist/styles/", import.meta.url);
mkdirSync(outDir, { recursive: true });
writeFileSync(new URL("core.css", outDir), CORE_CSS.trimStart());
console.log("emitted dist/styles/core.css");
