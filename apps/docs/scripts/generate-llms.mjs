// Build-time generator for the AI-facing docs pair, public/llms.txt (compact
// index, llmstxt.org convention) + public/llms-full.txt (everything inline).
// Hand-written prose lives in scripts/llms/*.template.txt; the per-chart
// reference, shared-prop list, package roster, and versions are generated from
// .vitepress/data/props.json (run extract-props first) and the workspace
// package.json files, so new charts flow in with no manual llms step.
//
// Pure `generate()` is exported for the unit test; `main()` writes the files.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const DOCS = resolve(HERE, "..");
const REPO = resolve(HERE, "../../..");

export const SITE = "https://michi-vz.netlify.app";
export const REPO_URL = "https://github.com/beany-vu/michi-vz-mono";

// Docs page slug for a props.json chart key; most keys just drop "-chart".
const SLUG_EXCEPTIONS = {
  "comparable-horizontal-bar-chart": "comparable",
  "dual-horizontal-bar-chart": "dual",
};
export const slugOf = (key) => SLUG_EXCEPTIONS[key] ?? key.replace(/-chart$/, "");

// Roster for the generated Packages block. A renamed/removed package fails
// loudly here (missing package.json) instead of silently dropping a line.
const PACKAGES = [
  { dir: "core", role: "the plain TypeScript engine: mount functions, ChartContext builders, export helpers, and the `./styles.css` sub-path export.", peers: "none; d3 and DOMPurify install automatically as regular dependencies" },
  { dir: "wc", role: "Lit web components in light DOM, one element per chart; the barrel auto-registers everything, per-element sub-paths (`@michi-vz/wc/line-chart`) register one.", peers: "none" },
  { dir: "react", role: "React components plus `MichiVzProvider`/`useChartContext`; refs expose `getContext()` and `getElement()`.", peers: "react and react-dom >= 18" },
  { dir: "vue", role: "Vue 3 components taking the engine props as a single `:options` prop.", peers: "vue >= 3" },
  { dir: "svelte", role: "Svelte actions (`use:lineChart={props}`).", peers: "svelte >= 4" },
  { dir: "angular", role: "typed helpers over the web components (`applyLineChartProps`, `bindChart`).", peers: "@angular/core >= 16" },
  { dir: "insights", role: "the opt-in, local-first insights layer; tree-shakeable sub-paths (see the Insights section).", peers: "none" },
  { dir: "devtools", role: "in-page chart inspector, with an inert `/production` entry for production builds.", peers: "none" },
];

const pkgVersion = (dir) =>
  JSON.parse(readFileSync(resolve(REPO, `packages/${dir}/package.json`), "utf8")).version;

// title + description from a chart page's frontmatter - the single source for
// per-chart one-liners, so no blurb is hand-maintained here.
function frontmatter(slug) {
  const file = resolve(DOCS, `charts/${slug}.md`);
  const fm = readFileSync(file, "utf8").match(/^---\n([\s\S]*?)\n---/);
  if (!fm) throw new Error(`generate-llms: charts/${slug}.md has no frontmatter block`);
  const pick = (key) => {
    const m = fm[1].match(new RegExp(`^${key}:\\s*(.*)$`, "m"));
    if (!m || !m[1].trim()) throw new Error(`generate-llms: charts/${slug}.md frontmatter is missing "${key}"`);
    return m[1].trim().replace(/^"(.*)"$/, "$1");
  };
  return { title: pick("title"), description: pick("description") };
}

// Some JSDoc descriptions carry long porting/implementation notes that belong
// in the source, not a public reference - keep just the first sentence here.
function firstSentence(s) {
  // Lookbehind skips abbreviations (e.g./i.e./vs./etc.) so a sentence is never
  // cut mid-parenthesis; the lookahead also accepts a collapsed "- " bullet.
  const m = s.match(/^.*?(?<!\b(?:e\.g|i\.e|vs|etc|cf))[.!?](?=\s+[A-Z`"(\d-]|\s*$)/);
  const cut = (m ? m[0] : s).trim();
  return cut.length > 300 ? `${cut.slice(0, 297).trimEnd()}...` : cut;
}

function propLine(p) {
  let line = `- \`${p.name}\`: \`${p.type}\``;
  if (p.default) line += ` (default: \`${p.default}\`)`;
  if (p.description) line += ` - ${firstSentence(p.description)}`;
  return line;
}

// Shared props, listed once. A default is shown only when every chart agrees.
function sharedPropsBlock(data) {
  return data.shared
    .map((sp) => {
      const defaults = new Set(
        Object.values(data.charts).map((c) => c.props.find((p) => p.name === sp.name)?.default ?? "")
      );
      return propLine({ ...sp, default: defaults.size === 1 ? [...defaults][0] : "" });
    })
    .join("\n");
}

function chartEntries(data) {
  const out = [];
  for (const [key, c] of Object.entries(data.charts)) {
    const slug = slugOf(key);
    for (const rel of [`charts/${slug}.md`, `api/${slug}.md`]) {
      if (!existsSync(resolve(DOCS, rel)))
        throw new Error(`generate-llms: expected ${rel} for chart "${key}" - add the page or a SLUG_EXCEPTIONS entry`);
    }
    const { title, description } = frontmatter(slug);
    const specific = c.props.filter((p) => !p.common);
    const required = specific.filter((p) => !p.optional);
    const optional = specific.filter((p) => p.optional);
    out.push(
      `### ${title} (\`${key}\`)`,
      "",
      description,
      "",
      `- Element: \`<${c.element}>\` (import \`@michi-vz/wc/${key}\`)`,
      `- Engine: \`${c.mount}(host, props)\` from \`@michi-vz/core\`; props \`${c.propsType}\`, context \`${c.context}\``,
      `- Docs: ${SITE}/charts/${slug}`,
      `- API: ${SITE}/api/${slug}`,
      ""
    );
    if (required.length) out.push("Required props:", "", ...required.map(propLine), "");
    if (optional.length) out.push("Chart-specific props (the shared props above also apply):", "", ...optional.map(propLine), "");
  }
  return out.join("\n").trimEnd();
}

function chartLinks(data) {
  return Object.keys(data.charts)
    .map((key) => {
      const slug = slugOf(key);
      const { title, description } = frontmatter(slug);
      return `- [${title}](${SITE}/charts/${slug}): ${description}`;
    })
    .join("\n");
}

function packagesBlock(versions) {
  return PACKAGES.map(
    (p) => `- \`@michi-vz/${p.dir}\` ${versions[p.dir]} - ${p.role} Peer dependencies: ${p.peers}.`
  ).join("\n");
}

function renderTemplate(name, tokens, blocks) {
  let text = readFileSync(resolve(HERE, "llms", name), "utf8");
  text = text.replace(/^<!-- llms:([a-z-]+) -->$/gm, (_, key) => {
    if (!(key in blocks)) throw new Error(`generate-llms: ${name} references unknown block "${key}"`);
    return blocks[key];
  });
  text = text.replace(/\{\{([^}]+)\}\}/g, (_, raw) => {
    const key = raw.trim();
    if (!(key in tokens)) throw new Error(`generate-llms: ${name} references unknown token "${key}"`);
    return tokens[key];
  });
  if (text.includes("{{") || text.includes("<!-- llms:"))
    throw new Error(`generate-llms: unresolved marker left in ${name}`);
  const dash = text.match(/[–—]/);
  if (dash) {
    const i = text.indexOf(dash[0]);
    throw new Error(`generate-llms: en/em dash in ${name} output near "${text.slice(Math.max(0, i - 40), i + 40)}"`);
  }
  return text;
}

export function generate() {
  const data = JSON.parse(readFileSync(resolve(DOCS, ".vitepress/data/props.json"), "utf8"));
  const versions = Object.fromEntries(PACKAGES.map((p) => [p.dir, pkgVersion(p.dir)]));

  const tokens = {
    site: SITE,
    repo: REPO_URL,
    chartCount: String(Object.keys(data.charts).length),
  };
  for (const p of PACKAGES) tokens[`version:@michi-vz/${p.dir}`] = versions[p.dir];

  const llms = renderTemplate("llms.template.txt", tokens, { "chart-links": chartLinks(data) });
  const llmsFull = renderTemplate("llms-full.template.txt", tokens, {
    packages: packagesBlock(versions),
    "shared-props": sharedPropsBlock(data),
    charts: chartEntries(data),
  });
  return { llms, llmsFull };
}

function main() {
  const { llms, llmsFull } = generate();
  writeFileSync(resolve(DOCS, "public/llms.txt"), llms);
  writeFileSync(resolve(DOCS, "public/llms-full.txt"), llmsFull);
  const kb = (s) => `${(s.length / 1024).toFixed(1)}k`;
  console.log(`generate-llms: wrote llms.txt (${kb(llms)}) + llms-full.txt (${kb(llmsFull)})`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) main();
