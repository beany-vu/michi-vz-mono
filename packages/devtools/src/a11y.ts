// Chart accessibility heuristics for the A11y tab, inspired by Chartability
// (chartability.fizz.studio). Pure and dependency-free: everything works off the
// renderer-agnostic ChartContext fields every michi-vz chart already carries
// (summary, a11yTable, colorsMapping, series).

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
  summary?: string;
  a11yTable?: { headers: string[]; rows: Array<Array<string | number>> };
  colorsMapping?: Record<string, string>;
  series?: unknown[];
}

/** WCAG 1.4.11 non-text contrast: graphical objects need 3:1 against adjacent color. */
const GRAPHIC_CONTRAST = 3;

export function auditContext(ctx: AuditableContext): A11yFinding[] {
  const out: A11yFinding[] = [];

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

  for (const group of findDuplicateColors(ctx.colorsMapping ?? {})) {
    out.push({
      kind: "warn",
      text: `${group.join(", ")} share the same color - they cannot be told apart by color alone.`,
    });
  }

  for (const [label, color] of Object.entries(ctx.colorsMapping ?? {})) {
    const vsLight = contrastRatio(color, "#ffffff");
    const vsDark = contrastRatio(color, "#1a1a1a");
    if (!Number.isNaN(vsLight) && vsLight < GRAPHIC_CONTRAST) {
      out.push({
        kind: "warn",
        text: `"${label}" (${color}) has low contrast on a light background (${vsLight.toFixed(2)}:1; graphics need ${GRAPHIC_CONTRAST}:1).`,
      });
    }
    if (!Number.isNaN(vsDark) && vsDark < GRAPHIC_CONTRAST) {
      out.push({
        kind: "warn",
        text: `"${label}" (${color}) has low contrast on a dark background (${vsDark.toFixed(2)}:1; graphics need ${GRAPHIC_CONTRAST}:1).`,
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
