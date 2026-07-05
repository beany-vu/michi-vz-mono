// Shared builder for the flat `legendData` payload carried on every ChartContext.
// Ported from the legacy michi-vz per-chart legend logic (e.g.
// useLineChartMetadataExpose): appearance-order palette fallback with an
// opacity-repeat once the palette is exhausted, plus the data-label-safe CSS hook.
//
// A consumer colour authority (e.g. thd MonitorV2's setMetadata/remapLegendColors)
// overwrites `color` and re-orders, but relies on `label`, `dataLabelSafe`, and
// `disabled` being present and on `dataLabelSafe === sanitizeForClassName(label)`
// so its injected per-label CSS matches the SVG marks and the canvas colour probe.
import { sanitizeForClassName } from "../math/sanitize";
import { DEFAULT_COLORS } from "../theme/colors";
import type { LegendItem } from "../types";

export interface LegendInput {
  /** Ordered labels to appear in the legend (as rendered: filtered/visible set). */
  labels: string[];
  /** Explicit label -> colour; "transparent" (skip-mode placeholder) is ignored. */
  colorsMapping?: Record<string, string>;
  /** Labels currently disabled/hidden by the consumer (greyed in the legend). */
  disabledItems?: string[];
  /** Palette fallback for labels without an explicit colour. */
  palette?: string[];
}

/** Opaque white-mix of a hex colour (the "solid + white veil" tint the split
 * renderers paint) so a legend swatch can show the pale companion EXACTLY as it
 * renders. ratio = veil strength (0..1); non-hex colours return undefined. */
export function mixWithWhite(color: string, ratio: number): string | undefined {
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(color);
  if (!m) return undefined;
  const hex = m[1].length === 3 ? m[1].split("").map((c) => c + c).join("") : m[1];
  const r = Math.max(0, Math.min(1, ratio));
  const mix = (i: number) => {
    const c = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    return Math.round(c + (255 - c) * r).toString(16).padStart(2, "0");
  };
  return `#${mix(0)}${mix(1)}${mix(2)}`;
}

/** Hex (#rgb / #rrggbb) + alpha → 8-digit hex; non-hex returned unchanged. */
function hexWithAlpha(color: string, alpha: number): string {
  if (!/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(color)) return color;
  const a = Math.round(Math.max(0, Math.min(1, alpha)) * 255)
    .toString(16)
    .padStart(2, "0");
  return `${color}${a}`;
}

export function buildLegendData(input: LegendInput): LegendItem[] {
  const palette = input.palette && input.palette.length ? input.palette : DEFAULT_COLORS;
  const mapping = input.colorsMapping ?? {};
  const disabled = new Set(input.disabledItems ?? []);
  const seen = new Set<string>();
  const out: LegendItem[] = [];

  for (const label of input.labels) {
    if (!label || seen.has(label)) continue;
    seen.add(label);
    const order = out.length;

    let color = mapping[label];
    if (!color || color === "transparent") {
      const base = palette[order % palette.length];
      const cycle = Math.floor(order / palette.length);
      color = cycle > 0 ? hexWithAlpha(base, Math.max(0.1, 1 - cycle * 0.1)) : base;
    }

    out.push({
      label,
      color,
      order,
      disabled: disabled.has(label),
      dataLabelSafe: sanitizeForClassName(label),
    });
  }

  return out;
}
