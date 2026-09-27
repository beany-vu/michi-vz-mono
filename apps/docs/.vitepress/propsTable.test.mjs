// Renders the real PropsTable.vue template on the server with a small props.json-shaped
// fixture, so the API pages cannot list a deprecated prop as a live one again: a prop
// with a `deprecated` note (scripts/extract-props.mjs) shows a "Deprecated" badge and
// its note in the description cell, and a live prop keeps its plain description.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createSSRApp } from "vue";
import { renderToString } from "vue/server-renderer";
import { parse } from "vue/compiler-sfc";

const HERE = dirname(fileURLToPath(import.meta.url));
const sfc = parse(readFileSync(resolve(HERE, "theme/PropsTable.vue"), "utf8")).descriptor;

const PROPS = [
  {
    name: "showRange",
    type: "boolean",
    optional: true,
    description: "Draw the fountain.",
    default: "true",
    common: false,
  },
  {
    name: "frothLayers",
    type: "number",
    optional: true,
    description: "",
    deprecated: "ignored since core 1.29; emits an ignored-option warning",
    default: "",
    common: false,
  },
  {
    name: "width",
    type: "number",
    optional: true,
    description: "Chart width in px.",
    default: "",
    common: true,
  },
  {
    name: "legacySize",
    type: "number",
    optional: true,
    description: "The old size.",
    deprecated: "use `width`",
    default: "",
    common: true,
  },
];

/** The rendered table, one entry per row: the prop name and its description cell. */
async function rows() {
  const app = createSSRApp({
    template: sfc.template.content,
    setup: () => ({
      chart: "fountain-chart",
      entry: { props: PROPS },
      specific: PROPS.filter((p) => !p.common),
      common: PROPS.filter((p) => p.common),
    }),
  });
  const html = await renderToString(app);
  return [...html.matchAll(/<tr>([\s\S]*?)<\/tr>/g)]
    .map((m) => [...m[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((c) => c[1]))
    .filter((cells) => cells.length === 4)
    .map((cells) => ({
      name: cells[0].match(/<code>([^<]+)<\/code>/)?.[1],
      description: cells[3],
      text: cells[3]
        .replace(/<[^>]+>/g, " ")
        .replace(/<!--[\s\S]*?-->/g, "")
        .replace(/\s+/g, " ")
        .trim(),
    }));
}

test("a deprecated prop shows a Deprecated badge and its note, not an empty cell", async () => {
  const row = (await rows()).find((r) => r.name === "frothLayers");
  assert.ok(row, "no frothLayers row");
  assert.match(row.description, /class="mv-deprecated"[^>]*>Deprecated</);
  assert.equal(row.text, "Deprecated ignored since core 1.29; emits an ignored-option warning");
});

test("in the common props too, and a description after the note stays", async () => {
  const row = (await rows()).find((r) => r.name === "legacySize");
  assert.ok(row, "no legacySize row");
  assert.match(row.description, /class="mv-deprecated"[^>]*>Deprecated</);
  assert.equal(row.text, "Deprecated use `width` The old size.");
});

test("a live prop keeps its description and gets no badge", async () => {
  const all = await rows();
  for (const name of ["showRange", "width"]) {
    const row = all.find((r) => r.name === name);
    assert.ok(row, `no ${name} row`);
    assert.doesNotMatch(row.description, /mv-deprecated/);
    assert.equal(row.text, PROPS.find((p) => p.name === name).description);
  }
});
