// Guards per-chart SUBPATH parity: every chart in the CHARTS registry must have a
// package.json export entry AND a tsup entry in all four wrapper packages, so a new
// chart cannot ship reachable only through the barrel. `wc` is included because it
// is the template the others mirror.
// Run: `pnpm --filter docs test` (node --test).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { CHARTS } from "./extract-props.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, "../../..");
const PACKAGES = ["wc", "angular", "react", "vue", "svelte"];

for (const pkgName of PACKAGES) {
  const pkg = JSON.parse(readFileSync(resolve(REPO, `packages/${pkgName}/package.json`), "utf8"));
  const tsup = readFileSync(resolve(REPO, `packages/${pkgName}/tsup.config.ts`), "utf8");

  test(`${pkgName}: every chart has an export-map subpath`, () => {
    const missing = CHARTS.map((c) => c.key).filter((k) => !pkg.exports?.[`./${k}`]);
    assert.deepEqual(
      missing,
      [],
      `packages/${pkgName}/package.json is missing exports for: ${missing.join(", ")}`,
    );
  });

  test(`${pkgName}: every chart has a tsup entry`, () => {
    const missing = CHARTS.map((c) => c.key).filter((k) => !tsup.includes(`src/${k}.`));
    assert.deepEqual(
      missing,
      [],
      `packages/${pkgName}/tsup.config.ts is missing entries for: ${missing.join(", ")}`,
    );
  });

  test(`${pkgName}: export-map subpaths point at matching dist files`, () => {
    for (const { key } of CHARTS) {
      const e = pkg.exports[`./${key}`];
      assert.equal(e.types, `./dist/${key}.d.ts`, `${pkgName} ./${key} types path`);
      assert.equal(e.import, `./dist/${key}.js`, `${pkgName} ./${key} import path`);
      assert.equal(e.require, `./dist/${key}.cjs`, `${pkgName} ./${key} require path`);
    }
  });
}

test("angular does NOT declare sideEffects:false (registration is the side effect)", () => {
  const pkg = JSON.parse(readFileSync(resolve(REPO, "packages/angular/package.json"), "utf8"));
  assert.equal(pkg.sideEffects, undefined);
});

test("react/vue/svelte keep sideEffects:false", () => {
  for (const p of ["react", "vue", "svelte"]) {
    const pkg = JSON.parse(readFileSync(resolve(REPO, `packages/${p}/package.json`), "utf8"));
    assert.equal(pkg.sideEffects, false, `packages/${p} lost sideEffects:false`);
  }
});
