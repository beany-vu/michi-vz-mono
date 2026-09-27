// Guards the Fountain (Jet d'Eau) docs against drift after the core 1.29 redesign:
// - every <ChartDemo chart="fountain-chart" :index="n"> points at a real example,
//   the four locales show the same demos in the same order, and every fountain
//   example is shown somewhere on the page;
// - the examples use the new data shape (no removed props, no per-item density /
//   lean) and stable "fountain-" ids;
// - neither the examples nor the pages (above the migration notes, which must name
//   the removed props), the API pages (outside code), the chart index blurbs nor the
//   atlas card bring back the old look's words;
// - the chart pages keep the whole approved reading key in the rules box, speak in
//   plain words (no statistics jargon above the migration notes), and link other
//   charts by their page title;
// - the "other N charts are stable" counts match the chart pages.
// Run: `pnpm --filter docs test` (node --test).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const DOCS = resolve(HERE, "..");
const REPO = resolve(HERE, "../../..");
const LOCALES = ["", "fr/", "nl/", "vi/"];
const read = (p) => readFileSync(p, "utf8");

// The fountain section of the examples source: from its heading comment (so the shared
// props above the array are checked too) to the array's closing "];".
const examplesSrc = read(resolve(REPO, "packages/examples/src/index.ts"));
const start = examplesSrc.indexOf("// ---- Fountain (Jet d'Eau) ----");
const end = examplesSrc.indexOf(
  "\n];\n",
  examplesSrc.indexOf("const fountain: Example<FountainChartProps>[] = [", start),
);
const fountainSrc = start >= 0 && end > start ? examplesSrc.slice(start, end) : "";
const ids = [...fountainSrc.matchAll(/^ {4}id: "([^"]+)"/gm)].map((m) => m[1]);

// The old look's words, per locale (the pages are checked above the migration notes).
// Whole words only, with Unicode letter boundaries: JS `\b` is ASCII, so it would
// never match before "écume" and would match inside Vietnamese syllables.
const wholeWords = (alts) =>
  new RegExp(`(?<![\\p{L}\\p{N}])(${alts.join("|")})(?![\\p{L}\\p{N}])`, "iu");
const OLD_WORDS = {
  "": wholeWords([
    "froth\\p{L}*",
    "plumes?",
    "mist",
    "droplets?",
    "spray",
    "crowns?",
    "bloom\\p{L}*",
    "lean\\p{L}*",
    "wind",
    "silhouettes?",
  ]),
  "fr/": wholeWords([
    "écume\\p{L}*",
    "panaches?",
    "brume",
    "embruns?",
    "gouttelettes?",
    "couronnes?",
    "vent",
    "silhouettes?",
  ]),
  "nl/": wholeWords([
    "schuim\\p{L}*",
    "pluim\\p{L}*",
    "nevel",
    "druppel\\p{L}*",
    "kroon",
    "kronen",
    "wind",
    "silhouet(ten)?",
  ]),
  // "nổi bọt" is how the vi API pages say a DOM event bubbles: not the old look's froth.
  "vi/": wholeWords(["(?<!nổi )bọt", "chùm tia", "sương", "giọt", "vương miện", "gió"]),
};

// Statistics jargon a first-time reader should not meet on the chart page (SPEC
// principle 5). The API pages may name the median; the chart pages say it in words.
const JARGON = {
  "": wholeWords([
    "medians?",
    "uncertaint(y|ies)",
    "distributions?",
    "variance",
    "percentiles?",
    "quartiles?",
    "standard deviations?",
    "confidence intervals?",
  ]),
  "fr/": wholeWords([
    "médianes?",
    "incertitudes?",
    "variance",
    "percentiles?",
    "quartiles?",
    "écarts?-types?",
    "intervalles? de confiance",
  ]),
  "nl/": wholeWords([
    "medianen?",
    "mediaan",
    "onzekerheid",
    "variantie",
    "percentielen?",
    "kwartielen?",
    "standaardafwijking(en)?",
    "betrouwbaarheidsinterval(len)?",
  ]),
  "vi/": wholeWords([
    "trung vị",
    "bất định",
    "phân phối",
    "phương sai",
    "bách phân vị",
    "tứ phân vị",
    "độ lệch chuẩn",
    "khoảng tin cậy",
  ]),
};

/** Markdown without fenced code blocks and inline code spans (API names stay legal). */
const stripCode = (s) => s.replace(/```[\s\S]*?```/g, "").replace(/`[^`\n]*`/g, "");

/** The bullets of the rules box under "How to read it" (the reading key's rules). */
function rules(md) {
  const open = md.indexOf("::: tip", md.indexOf("{#how-to-read-it}"));
  const close = md.indexOf("\n:::", open + 1);
  if (open < 0 || close < 0) return [];
  return md
    .slice(open, close)
    .split("\n")
    .filter((s) => s.startsWith("- "));
}

/** A page's frontmatter title. */
const titleOf = (md) =>
  md
    .match(/^title:\s*(.+)$/m)?.[1]
    .trim()
    .replace(/^"(.*)"$/, "$1");

/** Number of chart pages (every chart, the index excluded). */
const chartCount = readdirSync(resolve(DOCS, "charts")).filter(
  (f) => f.endsWith(".md") && f !== "index.md",
).length;
const REMOVED_PROPS =
  /\b(style|frothLayers|bloomExponent|stemFraction|showDroplets|showMist|density|lean)\s*:/;

/** The :index of every fountain ChartDemo on a page, in order (no :index = 0). */
function demoIndices(md) {
  return [...md.matchAll(/<ChartDemo\b([^>]*)\/?>/g)]
    .filter((m) => /chart="fountain-chart"/.test(m[1]))
    .map((m) => {
      const i = m[1].match(/:index="(\d+)"/);
      return i ? Number(i[1]) : 0;
    });
}

const pages = Object.fromEntries(
  LOCALES.map((l) => [l, read(resolve(DOCS, `${l}charts/fountain.md`))]),
);

test("examples: the fountain block is found and every id is unique and prefixed", () => {
  assert.ok(ids.length > 0, "no fountain examples found in packages/examples/src/index.ts");
  assert.deepEqual(
    ids.filter((id) => !id.startsWith("fountain-")),
    [],
  );
  assert.equal(new Set(ids).size, ids.length, `duplicate ids: ${ids.join(", ")}`);
});

test("examples: the 16 approved examples, then the reading key (anatomy + six patterns)", () => {
  assert.ok(ids.length >= 23, `expected at least 23 fountain examples, got ${ids.length}`);
  assert.equal(ids[0], "fountain-commute-by-mode");
  assert.equal(ids[15], "fountain-class-test-pass-mark");
  assert.deepEqual(ids.slice(16, 23), [
    "fountain-key-anatomy",
    "fountain-key-steady",
    "fountain-key-changes-a-lot",
    "fountain-key-rare-bad-days",
    "fountain-key-often-bad",
    "fountain-key-just-a-guess",
    "fountain-key-enough-days",
  ]);
});

test("examples: no removed props and no old-look words", () => {
  const bad = fountainSrc.match(REMOVED_PROPS);
  assert.equal(bad, null, `a fountain example still sets \`${bad?.[1]}\``);
  const word = fountainSrc.match(OLD_WORDS[""]);
  assert.equal(word, null, `a fountain example still says "${word?.[0]}"`);
});

test("examples: a chart without its fountain prints no guide about fountains and dots", () => {
  const blocks = fountainSrc.split(/\n {2}\{\n {4}id: "/).slice(1);
  const hidden = blocks.filter((b) => /\bshowRange: false\b/.test(b));
  assert.ok(hidden.length > 0, "no example turns showRange off");
  for (const b of hidden) {
    const id = b.slice(0, b.indexOf('"'));
    assert.match(b, /\breadingGuide: false\b/, `${id} hides the fountain but keeps the guide`);
  }
});

for (const l of LOCALES) {
  const md = pages[l];
  const name = `${l || "en/"}charts/fountain.md`;

  test(`${name}: every demo points at a real example`, () => {
    const out = demoIndices(md).filter((i) => i >= ids.length);
    assert.deepEqual(out, [], `indices past the ${ids.length} fountain examples: ${out}`);
  });

  test(`${name}: every fountain example is shown`, () => {
    const shown = new Set(demoIndices(md));
    const missing = ids.filter((_, i) => !shown.has(i));
    assert.deepEqual(missing, [], `not shown: ${missing.join(", ")}`);
  });

  test(`${name}: keeps the Experimental badge and the migration notes`, () => {
    assert.match(md, /<span class="vp-badge warning">[^<]+<\/span>/);
    assert.match(md, /\{#migrating\}/);
    for (const prop of ["frothLayers", "showMist", "spreadRatio"]) {
      assert.ok(md.includes(prop), `the migration notes should name \`${prop}\``);
    }
  });

  test(`${name}: no old-look words above the migration notes`, () => {
    const body = md.slice(0, md.indexOf("{#migrating}"));
    const word = body.match(OLD_WORDS[l]);
    assert.equal(word, null, `still says "${word?.[0]}"`);
  });

  test(`${name}: each gallery demo shows the example its heading names`, () => {
    const gallery = md.slice(md.indexOf("{#examples}"), md.indexOf("{#data-shape}"));
    const items = [
      ...gallery.matchAll(/^### .+ \{#([a-z0-9-]+)\}\n\n<ChartDemo\b[^>]*:index="(\d+)"/gm),
    ];
    assert.equal(items.length, 16, `expected 16 gallery items, got ${items.length}`);
    for (const [, slug, i] of items) {
      assert.equal(ids[Number(i)], `fountain-${slug}`, `#${slug} shows example ${i}`);
    }
  });

  test(`${name}: the rules box carries the whole reading key`, () => {
    // The approved key has 8 rules; the page adds "a few small dots = just a guess".
    const got = rules(md);
    assert.ok(got.length >= 9, `the rules box has ${got.length} rules, expected at least 9`);
    assert.equal(got.length, rules(pages[""]).length, "a different number of rules than en");
  });

  test(`${name}: plain words, no statistics jargon above the migration notes`, () => {
    const body = stripCode(md.slice(0, md.indexOf("{#migrating}")));
    const word = body.match(JARGON[l]);
    assert.equal(word, null, `still says "${word?.[0]}"`);
  });

  test(`${name}: links to other charts use their page titles`, () => {
    for (const m of md.matchAll(/\[([^\]]+)\]\(\/(?:fr\/|nl\/|vi\/)?charts\/([a-z-]+)\)/g)) {
      const title = titleOf(read(resolve(DOCS, `${l}charts/${m[2]}.md`)));
      assert.equal(m[1], title, `the link to ${m[2]} should read "${title}"`);
    }
  });

  test(`${name}: the stable-chart count matches the chart pages`, () => {
    const warning = md.slice(
      md.indexOf("::: warning"),
      md.indexOf("\n:::", md.indexOf("::: warning")),
    );
    assert.ok(warning.includes(String(chartCount - 1)), `expected ${chartCount - 1} other charts`);
  });

  test(`${l || "en/"}api/fountain.md: no old-look words outside code`, () => {
    const body = stripCode(read(resolve(DOCS, `${l}api/fountain.md`)));
    const word = body.match(OLD_WORDS[l]);
    assert.equal(word, null, `still says "${word?.[0]}"`);
  });

  test(`${l || "en/"}guide/insights.md: stable-chart count and the fountain link`, () => {
    const line = read(resolve(DOCS, `${l}guide/insights.md`))
      .split("\n")
      .find((s) => s.includes("charts/fountain)"));
    assert.ok(line, "no fountain link in the insights guide");
    assert.ok(line.includes(String(chartCount - 1)), `expected ${chartCount - 1} stable charts`);
    assert.doesNotMatch(line, /(?<!\d)16(?!\d)/, "still counts 16 stable charts");
    const link = line.match(/\[([^\]]+)\]\([^)]*charts\/fountain\)/)?.[1];
    assert.equal(link, titleOf(md), "the fountain link should read the page title");
  });

  test(`${l || "en/"}charts/index.md: the fountain blurb has no old-look words`, () => {
    const line = read(resolve(DOCS, `${l}charts/index.md`))
      .split("\n")
      .find((s) => s.includes("charts/fountain)"));
    assert.ok(line, "no fountain line in the chart index");
    const word = line.match(OLD_WORDS[l]);
    assert.equal(word, null, `still says "${word?.[0]}"`);
  });
}

test("the four locales show the same fountain demos in the same order", () => {
  const en = demoIndices(pages[""]);
  for (const l of LOCALES.slice(1)) {
    assert.deepEqual(demoIndices(pages[l]), en, `${l}charts/fountain.md differs from en`);
  }
});

test("en/charts/fountain.md: the rules box names every rule of the approved key", () => {
  const box = rules(pages[""]).join("\n").toLowerCase();
  for (const rule of [
    "big dot",
    "small dot is one",
    "close together",
    "how often",
    "tall fountain",
    "more small dots in total",
    "few small dots",
    "left and right",
    "red dashed line",
  ]) {
    assert.ok(box.includes(rule), `the rules box has no "${rule}" rule`);
  }
});

test("the atlas card's fountain blurb has no old-look words", () => {
  const src = read(resolve(DOCS, ".vitepress/theme/ChartAtlas.vue"));
  const i = src.indexOf('slug: "fountain"');
  const card = src.slice(i, src.indexOf("tag:", i));
  assert.ok(i >= 0 && card.length > 0, "no fountain card in the atlas");
  const word = card.match(OLD_WORDS[""]);
  assert.equal(word, null, `still says "${word?.[0]}"`);
});

test("the home-page fountain preview uses the new data shape", () => {
  const src = read(resolve(DOCS, ".vitepress/theme/previews.ts"));
  const i = src.indexOf('"fountain-chart": {');
  const block = src.slice(i, src.indexOf("satisfies FountainChartProps", i));
  assert.ok(i >= 0 && block.length > 0, "no fountain preview found");
  assert.equal(block.match(REMOVED_PROPS), null);
  assert.match(block, /\blow:/);
});

// The trend line's default: on in trend mode with one series, off with several series (one
// line would zig-zag between them) and in snapshot mode. Every sentence that gives the
// default names both cases.
const ONE_SERIES = {
  "": /one series/,
  "fr/": /une seule série/,
  "nl/": /één reeks/,
  "vi/": /một chuỗi/,
};
const SEVERAL_SERIES = {
  "": /several series/,
  "fr/": /plusieurs séries/,
  "nl/": /meerdere reeksen/,
  "vi/": /nhiều chuỗi/,
};

test("the trend line is off by default across several series (renderModel)", () => {
  const src = read(resolve(REPO, "packages/core/src/fountainChart/renderModel.ts"));
  assert.match(
    src,
    /o\.showTrendLine \?\?\s*\(resolved\.mode === "trend" && new Set\(resolved\.jets\.map\(\(j\) => j\.label\)\)\.size <= 1\)/,
  );
});

for (const l of LOCALES) {
  test(`${l || "en/"}: the showTrendLine default names one series and several series`, () => {
    const api = read(resolve(DOCS, `${l}api/fountain.md`));
    const chart = pages[l];
    const lines = [
      ...api.split("\n").filter((s) => /`showTrendLine`/.test(s) && !s.startsWith("|")),
      ...chart
        .slice(chart.indexOf("{#trend-and-forecast}"), chart.indexOf("{#timeline}"))
        .split("\n")
        .filter((s) => /`showTrendLine`/.test(s)),
    ];
    assert.equal(lines.length, 2, `expected one sentence on each page, got ${lines.length}`);
    for (const s of lines) {
      assert.match(s, ONE_SERIES[l], s.slice(0, 80));
      assert.match(s, SEVERAL_SERIES[l], s.slice(0, 80));
    }
    // The trend-mode tip says the dashed line joins the big dots with one series.
    const tip = api.slice(api.indexOf("::: tip"), api.indexOf("\n:::", api.indexOf("::: tip")));
    assert.match(tip, ONE_SERIES[l], "the trend-mode tip");
  });
}

// Since core 1.29 the fountain has the loading and no-data states of the other charts: an
// empty dataSet shows the no-data overlay, not empty axes (fountainChart.test.ts).
for (const l of LOCALES) {
  test(`${l || "en/"}: an empty dataSet shows the no-data overlay, and the migration notes say so`, () => {
    const row = read(resolve(DOCS, `${l}api/fountain.md`))
      .split("\n")
      .find((s) => s.startsWith("| `empty-dataset`"));
    assert.ok(row, "no empty-dataset row in the warnings table");
    for (const code of ["noDataLabel", "isNodata: false"]) {
      assert.ok(row.includes(`\`${code}\``), `the empty-dataset row should name \`${code}\``);
    }
    const md = pages[l];
    const notes = md.slice(
      md.indexOf("{#migrating}"),
      md.indexOf("\n## ", md.indexOf("{#migrating}")),
    );
    for (const prop of ["isLoading", "isNodata", "noDataLabel"]) {
      assert.ok(notes.includes(`\`${prop}\``), `the migration notes should name \`${prop}\``);
    }
  });
}
