// Guards the generated AI-facing docs (public/llms.txt + llms-full.txt):
// every chart present, copy rules hold (no en/em dashes, no first-person
// plural, no competitor names), links absolute, versions stamped live.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { generate, SITE, REPO_URL, slugOf } from "./generate-llms.mjs";
import { CHARTS } from "./extract-props.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, "../../..");
const { llms, llmsFull } = generate();

test("generates both outputs; full is the larger", () => {
  assert.ok(llms.length > 1000, "llms.txt should be non-trivial");
  assert.ok(llmsFull.length > llms.length, "llms-full.txt must be larger than the index");
});

test("every chart appears in llms-full.txt and llms.txt (count derived, never hardcoded)", () => {
  for (const c of CHARTS) {
    const chartUrl = `${SITE}/charts/${slugOf(c.key)}`;
    assert.ok(llmsFull.includes(`<${c.element}>`), `full: element <${c.element}>`);
    assert.ok(llmsFull.includes(c.mount), `full: mount ${c.mount}`);
    assert.ok(llmsFull.includes(chartUrl), `full: docs url ${chartUrl}`);
    assert.ok(llmsFull.includes(`${SITE}/api/${slugOf(c.key)}`), `full: api url for ${c.key}`);
    assert.ok(llms.includes(`](${chartUrl})`), `index: chart link ${chartUrl}`);
  }
  assert.ok(llmsFull.includes(`${CHARTS.length} chart`), "full: chart count stamped from CHARTS");
});

test("copy rules: no en/em dashes, no first-person plural, no competitor names", () => {
  for (const [name, text] of [
    ["llms.txt", llms],
    ["llms-full.txt", llmsFull],
  ]) {
    assert.ok(!/[–—]/.test(text), `${name}: contains an en/em dash`);
    const we = text.match(/\b(we|our)\b/i);
    assert.equal(
      we,
      null,
      `${name}: first-person plural "${we?.[0]}" near: ${text.slice(Math.max(0, (we?.index ?? 0) - 40), (we?.index ?? 0) + 40)}`,
    );
    const competitors =
      /\b(highcharts|echarts|recharts|chart\.js|chartjs|plotly|amcharts|nivo|victory|visx)\b/i;
    const hit = text.match(competitors);
    assert.equal(hit, null, `${name}: names another chart library ("${hit?.[0]}")`);
  }
});

test("no leftover template markers", () => {
  for (const [name, text] of [
    ["llms.txt", llms],
    ["llms-full.txt", llmsFull],
  ]) {
    assert.ok(!text.includes("{{"), `${name}: unresolved {{token}}`);
    assert.ok(!text.includes("<!-- llms:"), `${name}: unresolved block marker`);
  }
});

test("every markdown link is absolute to the site (or on the allowlist)", () => {
  const allow = [REPO_URL, `${REPO_URL}/`, "https://www.npmjs.com/org/michi-vz"];
  for (const [name, text] of [
    ["llms.txt", llms],
    ["llms-full.txt", llmsFull],
  ]) {
    for (const m of text.matchAll(/\]\(([^)]+)\)/g)) {
      const url = m[1];
      const ok = url.startsWith(`${SITE}/`) || allow.includes(url);
      assert.ok(ok, `${name}: non-absolute or off-site link ${url}`);
    }
  }
});

test("package versions are stamped from the workspace, not hardcoded", () => {
  for (const pkg of ["core", "react", "insights"]) {
    const { version } = JSON.parse(
      readFileSync(resolve(REPO, `packages/${pkg}/package.json`), "utf8"),
    );
    assert.ok(llmsFull.includes(version), `full: @michi-vz/${pkg} version ${version}`);
    assert.ok(llms.includes(version), `index: @michi-vz/${pkg} version ${version}`);
  }
});

test("structure: llmstxt.org index shape and single shared-prop reference", () => {
  assert.ok(llms.startsWith("# michi-vz\n"), "index: H1 first");
  assert.ok(/^> /m.test(llms), "index: blockquote summary");
  assert.ok(llms.includes("## Optional"), "index: Optional section");
  assert.ok(llms.includes(`${SITE}/llms-full.txt`), "index: links the full file");
  for (const heading of [
    "## Shared props",
    "## Chart reference",
    "## ChartContext",
    "## Insights",
    "## Theming",
  ]) {
    assert.ok(llmsFull.includes(heading), `full: missing "${heading}"`);
  }
  // Shared props are documented once, not repeated under each of the 21 charts.
  const rendererBullets = llmsFull.match(/^- `renderer`/gm) ?? [];
  assert.equal(rendererBullets.length, 1, "full: `renderer` must appear only in the shared block");
});
