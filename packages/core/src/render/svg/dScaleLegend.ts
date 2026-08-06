// Bubble-size reference legend for ScatterPlot: three nested left-half arcs +
// domain-value labels, at (width-100, height/3). Faithful to the legacy
// ScatterPlotChart dScaleLegend block (radii 8/20/40, labels at the arc tops).
import { svgEl } from "../../dom";
import type { ScaleLinear } from "d3-scale";

/** Left-half arc path (legacy drawHalfLeftCircle): from (x,y) up to (x, y-2r). */
function halfLeftCirclePath(x: number, y: number, r: number): string {
  return `M ${x},${y} A ${r},${r} 0 0 1 ${x} ${y - 2 * r}`;
}

export interface DScaleLegendConfig {
  /** Legend heading. Pass an array to render explicit lines (stacked upward from
   *  the single-line baseline, so multi-line titles never crowd the arc labels);
   *  SVG <text> cannot wrap, and the consumer's i18n knows the break points. */
  title?: string | string[];
  valueFormatter?: (d: number) => string;
}

export interface DScaleLegendOptions {
  width: number;
  height: number;
}

/**
 * Append a bubble-size reference legend to `parent`.
 *
 * `sizeScale` maps a data `d` → pixel RADIUS (range = sizeRange). The three
 * sentinel radii shown are [rMin, rMax/2, rMax] - for sizeRange=[8,40] that is
 * [8,20,40], exactly the legacy diameters 16/40/80. Each label is the data value
 * that produces that radius, via `sizeScale.invert(radius)`.
 */
export function renderDScaleLegend(
  parent: SVGElement,
  sizeScale: ScaleLinear<number, number>,
  sizeRange: [number, number],
  cfg: DScaleLegendConfig,
  o: DScaleLegendOptions,
): SVGGElement {
  const px = o.width - 100;
  const py = o.height / 3;
  const [rMin, rMax] = sizeRange;
  const sentinels: number[] = [rMin, rMax / 2, rMax];

  const g = svgEl("g", { class: "michi-vz-legend" });

  if (cfg.title) {
    const lines = (Array.isArray(cfg.title) ? cfg.title : [cfg.title]).filter(Boolean);
    const lineHeight = 18;
    const baseY = py - 2 * rMax - 40;
    // Last line keeps the legacy single-line baseline; extra lines stack upward.
    lines.forEach((line, i) => {
      const title = svgEl("text", {
        x: px,
        y: baseY - (lines.length - 1 - i) * lineHeight,
        "text-anchor": "middle",
      });
      title.textContent = line;
      g.appendChild(title);
    });
  }

  // Arcs largest-first so the smaller ones nest visibly inside.
  for (const rad of [...sentinels].sort((a, b) => b - a)) {
    g.appendChild(
      svgEl("path", { d: halfLeftCirclePath(px, py, rad), fill: "none", stroke: "#ccc" }),
    );
  }

  // Labels at the top of each arc (legacy: smallest at py, then py-rMax, py-2*rMax).
  const labelY = [py, py - rMax, py - 2 * rMax];
  sentinels.forEach((rad, i) => {
    const domainVal = sizeScale.invert(rad);
    const label = cfg.valueFormatter ? cfg.valueFormatter(domainVal) : String(domainVal);
    const t = svgEl("text", { x: px, y: labelY[i], "text-anchor": "middle" });
    t.textContent = label;
    g.appendChild(t);
  });

  parent.appendChild(g);
  return g;
}
