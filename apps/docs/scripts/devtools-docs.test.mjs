// Guards the devtools guide's Hit-test section against drift from the engines: the charts it
// names as reporting their canvas hit-tests are exactly the engines that declare
// `hitReporting: "canvas"` to devtools, in all four locales.
// Run: `pnpm --filter docs test` (node --test).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const DOCS = resolve(HERE, "..");
const ENGINES = resolve(HERE, "../../../packages/core/src/engine");

// "radialTreeChart.ts" -> "radial tree": the name the guide uses for the chart.
const reporting = readdirSync(ENGINES)
  .filter((f) => f.endsWith("Chart.ts"))
  .filter((f) =>
    /attachDevtools\([^;]*hitReporting:\s*"canvas"/s.test(
      readFileSync(resolve(ENGINES, f), "utf8"),
    ),
  )
  .map((f) => f.replace(/Chart\.ts$/, "").replace(/[A-Z]/g, (c) => ` ${c.toLowerCase()}`))
  .sort();

test("the engines that report canvas hits are found", () => {
  assert.ok(reporting.length >= 7, `only ${reporting.join(", ")}`);
  assert.ok(reporting.includes("fountain"), "the fountain declares canvas hits");
});

for (const l of ["", "fr/", "nl/", "vi/"]) {
  test(`${l || "en/"}guide/devtools.md: the Hit-test section names every chart that reports canvas hits`, () => {
    const md = readFileSync(resolve(DOCS, `${l}guide/devtools.md`), "utf8");
    const start = md.indexOf("### Hit-test");
    assert.ok(start >= 0, "no Hit-test section");
    // The first paragraph's list: "(bubble, line, ... and treemap)", wrapped over lines.
    const list = md
      .slice(start, md.indexOf("\n\n", md.indexOf("\n\n", start) + 2))
      .match(/\(([\p{L} ,\n]+)\)/u)?.[1];
    assert.ok(list, "no list of charts in the Hit-test section");
    const named = list
      .split(/,\s*|\s+(?:and|et|en|và)\s+/)
      .map((s) => s.replace(/\s+/g, " ").trim())
      .sort();
    assert.deepEqual(named, reporting);
  });
}
