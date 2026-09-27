// Chart accessibility heuristics for the A11y tab, inspired by Chartability
// (chartability.fizz.studio). Pure and dependency-free: everything works off the
// renderer-agnostic ChartContext fields every michi-vz chart already carries
// (summary, a11yTable, colorsMapping, series), plus the colorScale / noDataColor
// props for binned colour ramps.

export interface A11yFinding {
  kind: "ok" | "warn" | "err";
  text: string;
}

/** Minimal color parser: #rgb, #rrggbb, rgb(r, g, b). Everything else is null. */
function parseColor(input: string): [number, number, number] | null {
  const c = String(input).trim();
  const m3 = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(c);
  if (m3)
    return [parseInt(m3[1] + m3[1], 16), parseInt(m3[2] + m3[2], 16), parseInt(m3[3] + m3[3], 16)];
  const m6 = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(c);
  if (m6) return [parseInt(m6[1], 16), parseInt(m6[2], 16), parseInt(m6[3], 16)];
  const mRgb = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i.exec(c);
  if (mRgb) return [Number(mRgb[1]), Number(mRgb[2]), Number(mRgb[3])];
  return null;
}

function channel(v: number): number {
  const s = v / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

function luminance(rgb: [number, number, number]): number {
  return 0.2126 * channel(rgb[0]) + 0.7152 * channel(rgb[1]) + 0.0722 * channel(rgb[2]);
}

/** WCAG contrast ratio (1..21). NaN when either color cannot be parsed. */
export function contrastRatio(c1: string, c2: string): number {
  const a = parseColor(c1);
  const b = parseColor(c2);
  if (!a || !b) return NaN;
  const l1 = luminance(a);
  const l2 = luminance(b);
  const [hi, lo] = l1 >= l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

/** Groups of labels that share the exact same color (case-insensitive). */
export function findDuplicateColors(colorsMapping: Record<string, string>): string[][] {
  const byColor = new Map<string, string[]>();
  for (const [label, color] of Object.entries(colorsMapping)) {
    const key = String(color).toLowerCase();
    const group = byColor.get(key);
    if (group) group.push(label);
    else byColor.set(key, [label]);
  }
  return [...byColor.values()].filter((g) => g.length > 1);
}

export interface AuditableContext {
  /** e.g. "choropleth-map-chart"; choropleth and symbol maps get the colour-ramp audit. */
  chartType?: string;
  summary?: string;
  a11yTable?: { headers: string[]; rows: Array<Array<string | number>> };
  colorsMapping?: Record<string, string>;
  series?: unknown[];
  /** The symbol map echoes its `colorScale` prop here. */
  colorScale?: { domain?: number[]; range?: string[] };
}

/** Extra inputs the context does not carry. */
export interface AuditOptions {
  /**
   * The chart's current props (a devtools entry's `getProps()`). Read for
   * `colorScale` (the ramp to audit) and `noDataColor` (must stand apart from it).
   */
  props?: unknown;
}

/** WCAG 1.4.11 non-text contrast: graphical objects need 3:1 against adjacent color. */
const GRAPHIC_CONTRAST = 3;

/**
 * Two neighbouring steps of a sequential ramp below this contrast are hard to tell
 * apart. Loose on purpose: the pale end of a 9-class ColorBrewer ramp sits near
 * 1.13:1 and is still readable next to its neighbour.
 */
const RAMP_STEP_CONTRAST = 1.1;

/** Chart types whose colours are a binned value ramp, not one colour per series. */
const RAMP_CHARTS = new Set(["choropleth-map-chart", "symbol-map-chart"]);

type ColorScaleLike = { domain?: unknown; range?: unknown };

function asColorScale(v: unknown): { range: string[] } | null {
  const range = (v as ColorScaleLike | null | undefined)?.range;
  if (!Array.isArray(range) || range.length === 0) return null;
  return { range: range.map(String) };
}

/** Labels grouped by colour (case-insensitive), in first-seen order. */
function labelsByColor(colorsMapping: Record<string, string>): Array<[string, string[]]> {
  const groups = new Map<string, { color: string; labels: string[] }>();
  for (const [label, color] of Object.entries(colorsMapping)) {
    const key = String(color).toLowerCase();
    const g = groups.get(key);
    if (g) g.labels.push(label);
    else groups.set(key, { color: String(color), labels: [label] });
  }
  return [...groups.values()].map((g) => [g.color, g.labels]);
}

/** Distinct colours sorted light to dark (unparseable colours dropped). */
function rampFromColors(colors: string[]): string[] {
  const seen = new Map<string, string>();
  for (const c of colors) {
    const key = c.toLowerCase();
    if (!seen.has(key) && parseColor(c)) seen.set(key, c);
  }
  return [...seen.values()].sort((a, b) => luminance(parseColor(b)!) - luminance(parseColor(a)!));
}

function auditRamp(steps: string[], noDataColor: string | undefined): A11yFinding[] {
  const out: A11yFinding[] = [];
  let lowest = Infinity;
  for (let i = 0; i < steps.length - 1; i++) {
    const r = contrastRatio(steps[i], steps[i + 1]);
    if (Number.isNaN(r)) continue;
    lowest = Math.min(lowest, r);
    if (r < RAMP_STEP_CONTRAST) {
      out.push({
        kind: "warn",
        text: `Colour steps ${i + 1} and ${i + 2} (${steps[i]}, ${steps[i + 1]}) are hard to tell apart (${r.toFixed(2)}:1) - readers cannot say which bin a region is in.`,
      });
    }
  }
  if (noDataColor) {
    const same = steps.findIndex((c) => c.toLowerCase() === noDataColor.toLowerCase());
    if (same >= 0) {
      out.push({
        kind: "warn",
        text: `noDataColor ${noDataColor} is ramp step ${same + 1} - places without data look like data.`,
      });
    } else {
      let nearest = -1;
      let nearestRatio = Infinity;
      steps.forEach((c, i) => {
        const r = contrastRatio(c, noDataColor);
        if (!Number.isNaN(r) && r < nearestRatio) {
          nearestRatio = r;
          nearest = i;
        }
      });
      if (nearest >= 0 && nearestRatio < RAMP_STEP_CONTRAST) {
        out.push({
          kind: "warn",
          text: `noDataColor ${noDataColor} is nearly ramp step ${nearest + 1} (${steps[nearest]}, ${nearestRatio.toFixed(2)}:1) - places without data look like data.`,
        });
      }
    }
  }
  if (out.length === 0) {
    const detail =
      steps.length > 1 ? `, adjacent steps distinguishable (lowest ${lowest.toFixed(2)}:1)` : "";
    out.push({
      kind: "ok",
      text: `Colour ramp of ${steps.length} step${steps.length === 1 ? "" : "s"}${detail}${noDataColor ? ", noDataColor stands apart" : ""}. Same-bin places share a colour by design, so no per-label colour checks run.`,
    });
  }
  return out;
}

export function auditContext(ctx: AuditableContext, opts: AuditOptions = {}): A11yFinding[] {
  const out: A11yFinding[] = [];
  const props = (opts.props ?? {}) as { colorScale?: unknown; noDataColor?: unknown };

  if (!ctx.summary || !ctx.summary.trim()) {
    out.push({
      kind: "err",
      text: "No plain-language summary - screen readers and AI agents get no text alternative for this chart.",
    });
  }

  const rows = ctx.a11yTable?.rows;
  const seriesCount = Array.isArray(ctx.series) ? ctx.series.length : 0;
  if (!rows || rows.length === 0) {
    if (seriesCount > 0) {
      out.push({
        kind: "warn",
        text: "No a11y data table - the chart's data is unreachable without vision.",
      });
    }
  } else if (seriesCount > rows.length) {
    out.push({
      kind: "warn",
      text: `The a11y table has ${rows.length} row${rows.length === 1 ? "" : "s"} for ${seriesCount} series - some series are missing from the table.`,
    });
  }

  // A binned value ramp (choropleth, symbol map, any chart with a colorScale):
  // same-bin labels share a colour by design and the pale end is pale on purpose,
  // so audit the ramp itself instead of every label.
  const scale = asColorScale(props.colorScale) ?? asColorScale(ctx.colorScale);
  if (scale || RAMP_CHARTS.has(ctx.chartType ?? "")) {
    const steps = scale?.range ?? rampFromColors(Object.values(ctx.colorsMapping ?? {}));
    const noData = typeof props.noDataColor === "string" ? props.noDataColor : undefined;
    if (steps.length > 0) out.push(...auditRamp(steps, noData));
    return out.length ? out : [{ kind: "ok", text: "No issues found by these heuristics." }];
  }

  for (const group of findDuplicateColors(ctx.colorsMapping ?? {})) {
    out.push({
      kind: "warn",
      text: `${group.join(", ")} share the same color - they cannot be told apart by color alone.`,
    });
  }

  // Contrast once per distinct colour, naming every label that uses it.
  for (const [color, labels] of labelsByColor(ctx.colorsMapping ?? {})) {
    const who = labels.map((l) => `"${l}"`).join(", ");
    const vsLight = contrastRatio(color, "#ffffff");
    const vsDark = contrastRatio(color, "#1a1a1a");
    if (!Number.isNaN(vsLight) && vsLight < GRAPHIC_CONTRAST) {
      out.push({
        kind: "warn",
        text: `${who} (${color}) ${labels.length === 1 ? "has" : "have"} low contrast on a light background (${vsLight.toFixed(2)}:1; graphics need ${GRAPHIC_CONTRAST}:1).`,
      });
    }
    if (!Number.isNaN(vsDark) && vsDark < GRAPHIC_CONTRAST) {
      out.push({
        kind: "warn",
        text: `${who} (${color}) ${labels.length === 1 ? "has" : "have"} low contrast on a dark background (${vsDark.toFixed(2)}:1; graphics need ${GRAPHIC_CONTRAST}:1).`,
      });
    }
  }

  if (out.length === 0) {
    out.push({
      kind: "ok",
      text: "No issues found by these heuristics: summary present, data table complete, colors distinct and contrast-safe on light and dark.",
    });
  }
  return out;
}
