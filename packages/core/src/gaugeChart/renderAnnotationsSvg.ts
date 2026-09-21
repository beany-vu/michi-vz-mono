// The ONE annotation renderer for the Gauge (Approach A): svg elements for the
// value markers, reference ticks and end labels. In svg mode the parent is the
// ring group; in canvas/webgpu mode it is an overlay <svg> the engine stacks
// above the painted layer, so every renderer shows identical annotations and
// consumer CSS reaches them through the classes below.
import { svgEl } from "../dom";
import type { GaugeAnnotations } from "./annotations";

/** Caption sits 6px above the tick's label anchor, the value 7px below (13px apart). */
const TICK_CAPTION_DY = -6;
/** Caption to value line distance for every label. */
const LINE_GAP = 13;

function text(x: number, y: number, content: string, className: string): SVGTextElement {
  const t = svgEl("text", { class: className, x, y, "text-anchor": "middle" });
  t.textContent = content;
  return t;
}

function appendLabel(
  g: SVGGElement,
  x: number,
  y: number,
  label: string | undefined,
  valueLabel: string | undefined,
  extraClass: string,
): void {
  const cls = extraClass ? ` ${extraClass}` : "";
  if (label) g.appendChild(text(x, y, label, `mv-gauge-tick-label${cls}`));
  if (valueLabel) g.appendChild(text(x, y + LINE_GAP, valueLabel, `mv-gauge-tick-value${cls}`));
}

export function renderGaugeAnnotationsSvg(parent: SVGElement, a: GaugeAnnotations): void {
  if (a.markers.length === 0 && a.ticks.length === 0 && a.endLabels.length === 0) return;
  // pointer-events:none: in svg mode this group is a later sibling of the
  // g.gauge-ring-cell groups whose mouseenter/mouseleave drive hover, so a marker
  // that accepted the pointer would fire mouseleave on the cell underneath - the
  // emphasis and the centre readout would drop the moment the cursor reached it.
  const g = svgEl("g", { class: "gauge-annotations", "pointer-events": "none" });

  for (const t of a.ticks) {
    g.appendChild(
      svgEl("line", {
        class: "mv-gauge-tick",
        x1: t.x1,
        y1: t.y1,
        x2: t.x2,
        y2: t.y2,
        stroke: t.color,
        "stroke-width": 1,
      }),
    );
    appendLabel(g, t.labelX, t.labelY + TICK_CAPTION_DY, t.label, t.valueLabel, "");
  }

  for (const e of a.endLabels) {
    appendLabel(g, e.x, e.y, e.label, e.valueLabel, "mv-gauge-end-label");
  }

  // Markers last so they stack above every line and label.
  for (const m of a.markers) {
    if (m.tick) {
      g.appendChild(
        svgEl("line", {
          class: "mv-gauge-marker-tick",
          x1: m.tick.x1,
          y1: m.tick.y1,
          x2: m.tick.x2,
          y2: m.tick.y2,
          stroke: m.tick.color,
          "stroke-width": m.tick.width,
          "stroke-linecap": "butt",
        }),
      );
    }
    g.appendChild(
      svgEl("circle", {
        class: "mv-gauge-marker",
        "data-label": m.dataLabel,
        "data-label-safe": m.dataLabelSafe,
        cx: m.x,
        cy: m.y,
        r: m.radius,
        fill: m.fill,
        stroke: m.stroke,
        "stroke-width": m.strokeWidth,
      }),
    );
  }

  parent.appendChild(g);
}
