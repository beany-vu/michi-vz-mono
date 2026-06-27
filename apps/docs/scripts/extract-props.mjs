// Build-time API extractor: reads the @michi-vz/core engine TYPES (source) and
// emits per-chart prop metadata for the docs <PropsTable> component. Single
// source of truth = packages/core/src/types.ts (descriptions come from JSDoc
// there); defaults are read from each engine's resolve() `?? …` + DEFAULT_MARGIN
// (which match the wc element field initializers).
//
// Pure `extract()` is exported for the unit test; `main()` writes props.json.
import { Project } from "ts-morph";
import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, "../../..");
const CORE_SRC = resolve(REPO, "packages/core/src");
const WC_SRC = resolve(REPO, "packages/wc/src");
const OUT = resolve(HERE, "../.vitepress/data/props.json");

// chart key (= @michi-vz/examples key / element suffix) -> source locations.
export const CHARTS = [
  { key: "line-chart", propsType: "LineChartProps", element: "michi-vz-line-chart", engine: "lineChart.ts", wc: "line-chart.ts", context: "LineChartContext", mount: "mountLineChart" },
  { key: "fan-chart", propsType: "FanChartProps", element: "michi-vz-fan-chart", engine: "fanChart.ts", wc: "fan-chart.ts", context: "FanChartContext", mount: "mountFanChart" },
  { key: "area-chart", propsType: "AreaChartProps", element: "michi-vz-area-chart", engine: "areaChart.ts", wc: "area-chart.ts", context: "AreaChartContext", mount: "mountAreaChart" },
  { key: "scatter-chart", propsType: "ScatterChartProps", element: "michi-vz-scatter-chart", engine: "scatterChart.ts", wc: "scatter-chart.ts", context: "ScatterChartContext", mount: "mountScatterChart" },
  { key: "range-chart", propsType: "RangeChartProps", element: "michi-vz-range-chart", engine: "rangeChart.ts", wc: "range-chart.ts", context: "RangeChartContext", mount: "mountRangeChart" },
  { key: "ribbon-chart", propsType: "RibbonChartProps", element: "michi-vz-ribbon-chart", engine: "ribbonChart.ts", wc: "ribbon-chart.ts", context: "RibbonChartContext", mount: "mountRibbonChart" },
  { key: "radar-chart", propsType: "RadarChartProps", element: "michi-vz-radar-chart", engine: "radarChart.ts", wc: "radar-chart.ts", context: "RadarChartContext", mount: "mountRadarChart" },
  { key: "vertical-stack-bar-chart", propsType: "VerticalStackBarChartProps", element: "michi-vz-vertical-stack-bar-chart", engine: "verticalStackBarChart.ts", wc: "vertical-stack-bar-chart.ts", context: "VerticalStackBarChartContext", mount: "mountVerticalStackBarChart" },
  { key: "comparable-horizontal-bar-chart", propsType: "ComparableBarChartProps", element: "michi-vz-comparable-horizontal-bar-chart", engine: "comparableHorizontalBarChart.ts", wc: "comparable-horizontal-bar-chart.ts", context: "ComparableBarChartContext", mount: "mountComparableHorizontalBarChart" },
  { key: "dual-horizontal-bar-chart", propsType: "DualBarChartProps", element: "michi-vz-dual-horizontal-bar-chart", engine: "dualHorizontalBarChart.ts", wc: "dual-horizontal-bar-chart.ts", context: "DualBarChartContext", mount: "mountDualHorizontalBarChart" },
  { key: "bar-bell-chart", propsType: "BarBellChartProps", element: "michi-vz-bar-bell-chart", engine: "barBellChart.ts", wc: "bar-bell-chart.ts", context: "BarBellChartContext", mount: "mountBarBellChart" },
  { key: "gap-chart", propsType: "GapChartProps", element: "michi-vz-gap-chart", engine: "gapChart.ts", wc: "gap-chart.ts", context: "GapChartContext", mount: "mountGapChart" },
];

// Props shared (identical type) across (almost) every chart - flagged `common`
// so the table can group them. tooltipFormatter / onHighlightItem are NOT here
// (their signatures vary per chart).
export const SHARED = [
  "width", "height", "margin", "colors", "colorsMapping", "renderer",
  "highlightItems", "disabledItems", "locale", "skipColorMappingDispatch",
  "enableTransitions", "onColorMappingGenerated", "onChartDataProcessed", "onDataWarning",
];

// Expand a few named unions for friendlier display in the Type column.
const ALIASES = {
  XaxisDataType: '"date_annual" | "date_monthly" | "number"',
  CurveType: '"curveBumpX" | "curveLinear" | "curveMonotoneX"',
  Shape: '"circle" | "square" | "triangle"',
};

const oneLine = (s) => s.replace(/\s+/g, " ").trim();

function typeText(prop) {
  const node = prop.getTypeNode();
  const t = node ? node.getText() : prop.getType().getText(prop);
  return oneLine(t);
}

function descOf(prop) {
  const docs = prop.getJsDocs();
  if (!docs.length) return "";
  return oneLine(docs.map((d) => d.getDescription()).join(" "));
}

// Defaults from engine resolve(): `name: p.name ?? <default>` (+ DEFAULT_MARGIN).
function engineDefaults(engineFile) {
  const text = readFileSync(resolve(CORE_SRC, "engine", engineFile), "utf8");
  const out = {};
  for (const m of text.matchAll(/(\w+):\s*p\.\w+\s*\?\?\s*([^\n]+)/g)) {
    const val = oneLine(m[2].replace(/\/\/.*$/, "")).replace(/,\s*$/, "").trim();
    if (val) out[m[1]] = val;
  }
  const margin = text.match(/DEFAULT_MARGIN[^=]*=\s*({[^}]*})/);
  if (margin) out.margin = oneLine(margin[1]);
  return out;
}

// Fallback defaults from the wc element class field initializers.
function wcDefaults(wcFile) {
  const text = readFileSync(resolve(WC_SRC, wcFile), "utf8");
  const out = {};
  for (const m of text.matchAll(/^\s*([a-zA-Z0-9_]+)\s*(?::[^=\n]+)?=\s*([^;\n]+);/gm)) {
    const val = oneLine(m[2]);
    if (!val || val === "[]" || val === "{}" || val === '""') continue;
    if (!(m[1] in out)) out[m[1]] = val;
  }
  return out;
}

export function extract() {
  const project = new Project({ skipAddingFilesFromTsConfig: true, useInMemoryFileSystem: false });
  const typesFile = project.addSourceFileAtPath(resolve(CORE_SRC, "types.ts"));

  const propsOf = (interfaceName) =>
    typesFile.getInterfaceOrThrow(interfaceName).getProperties().map((p) => ({
      name: p.getName(),
      type: ALIASES[typeText(p)] ?? typeText(p),
      optional: p.hasQuestionToken(),
      description: descOf(p),
    }));

  // Shared prop metadata (type/description), taken from the first chart that declares each.
  const sharedMap = {};
  for (const c of CHARTS) for (const p of propsOf(c.propsType)) {
    if (SHARED.includes(p.name) && !sharedMap[p.name]) sharedMap[p.name] = p;
  }
  const shared = SHARED.map((n) => sharedMap[n]).filter(Boolean);

  const charts = {};
  for (const c of CHARTS) {
    const ed = engineDefaults(c.engine);
    const wd = wcDefaults(c.wc);
    const props = propsOf(c.propsType).map((p) => ({
      ...p,
      // Common props take their description from the single shared definition, so
      // a shared prop only needs to be JSDoc'd once (in any one interface).
      description: SHARED.includes(p.name) ? sharedMap[p.name]?.description || p.description : p.description,
      default: ed[p.name] ?? wd[p.name] ?? "",
      common: SHARED.includes(p.name),
    }));
    charts[c.key] = { element: c.element, propsType: c.propsType, context: c.context, mount: c.mount, props };
  }

  return { generatedFrom: "packages/core/src/types.ts", shared, charts };
}

function main() {
  const data = extract();
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify(data, null, 2) + "\n");
  const n = Object.keys(data.charts).length;
  const total = Object.values(data.charts).reduce((s, c) => s + c.props.length, 0);
  console.log(`extract-props: wrote ${n} charts, ${total} props -> ${OUT}`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) main();
