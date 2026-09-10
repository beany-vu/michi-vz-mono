// Imperative SVG renderer for Gauge. Each ring is a <g class="gauge-ring-cell">
// holding a full-circle track <path class="gauge-track"> and a value arc
// <path class="gauge-arc"> whose stroke-dasharray encodes the sweep (the arc
// path starts at 12 o'clock and runs clockwise; `startAngle` rotates the cell).
// data-label + data-label-safe on the ARC carry the colour contract.
import { svgEl } from "../dom";
import type { GaugeRingMark, GaugeRenderModel } from "./renderModel";

export interface GaugeSvgOptions {
  enableTransitions: boolean;
}

export interface GaugeInteractions {
  onEnter: (ring: GaugeRingMark, ev: MouseEvent) => void;
  onLeave: (ev: MouseEvent) => void;
  onClick: (ring: GaugeRingMark, ev: MouseEvent) => void;
}

/** Full circle from 12 o'clock, clockwise, centred at (cx,cy): two half arcs. */
export function fullCirclePath(cx: number, cy: number, r: number): string {
  return `M ${cx} ${cy - r} a ${r} ${r} 0 0 1 0 ${2 * r} a ${r} ${r} 0 0 1 0 ${-2 * r}`;
}

export function renderGaugeSvg(
  parent: SVGElement,
  model: GaugeRenderModel,
  o: GaugeSvgOptions,
  ia: GaugeInteractions,
): void {
  const root = svgEl("g", { class: "gauge-chart-content" });
  const transition = o.enableTransitions
    ? "opacity 0.15s ease-out, stroke-dasharray 0.2s ease-out"
    : "none";

  let defs: SVGDefsElement | null = null;

  for (const d of model.rings) {
    const circumference = 2 * Math.PI * d.radius;
    const degrees = (d.startAngle * 180) / Math.PI;
    const g = svgEl("g", {
      class: "gauge-ring-cell",
      transform: degrees ? `rotate(${degrees} ${model.cx} ${model.cy})` : undefined,
    });
    if (!degrees) g.removeAttribute("transform");

    const dPath = fullCirclePath(model.cx, model.cy, d.radius);
    // The track spans the same sweep as the arc (a partial gauge's track is a
    // partial arc too, not a full circle) - the dash pattern's two numbers sum
    // to the path length, so a full sweep (sweepLen === circumference) draws
    // solid with a zero gap, matching pre-sweepAngle rendering exactly.
    const sweepLen = (model.sweepAngle / (2 * Math.PI)) * circumference;
    const trackGap = Math.max(0, circumference - sweepLen);
    const track = svgEl("path", {
      class: "gauge-track",
      d: dPath,
      fill: "none",
      stroke: d.trackColor,
      "stroke-width": d.thickness,
      "stroke-dasharray": `${sweepLen} ${trackGap}`,
      opacity: d.trackOpacity,
    });
    (track as SVGElement).style.transition = transition;
    g.appendChild(track);

    // Arc extent is scaled against the sweep, not the circumference: d.sweep
    // already carries that scaling (renderModel: fraction * sweepAngle), so
    // this stays the exact same formula as the full-circle case.
    const arcLen = (d.sweep / (2 * Math.PI)) * circumference;

    // Gradient is anchored to the FULL sweep (fixed x1/x2 across the ring's
    // diameter), never to the drawn portion - the stroke-dasharray above is
    // what shortens the visible arc, so a colour always sits at the same value.
    let stroke = d.stroke;
    const colours = d.gradient;
    if (colours && colours.length === 1) {
      stroke = colours[0];
    } else if (colours && colours.length > 1) {
      if (!defs) {
        defs = svgEl("defs");
        root.insertBefore(defs, root.firstChild);
      }
      const gradientId = `${model.gradientIdBase}-grad-${d.index}`;
      const gradient = svgEl("linearGradient", {
        id: gradientId,
        gradientUnits: "userSpaceOnUse",
        x1: model.cx - d.radius,
        x2: model.cx + d.radius,
        y1: model.cy,
        y2: model.cy,
      });
      colours.forEach((c, i) => {
        gradient.appendChild(
          svgEl("stop", {
            offset: i / (colours.length - 1),
            "stop-color": c,
          }),
        );
      });
      defs.appendChild(gradient);
      stroke = `url(#${gradientId})`;
    }

    const arc = svgEl("path", {
      class: "gauge-arc",
      "data-label": d.colorKey,
      "data-label-safe": d.dataLabelSafe,
      d: dPath,
      fill: "none",
      stroke,
      "stroke-width": d.thickness,
      "stroke-linecap": model.roundedCaps ? "round" : "butt",
      "stroke-dasharray": `${arcLen} ${circumference}`,
      opacity: d.opacity,
    });
    (arc as SVGElement).style.transition = transition;
    g.appendChild(arc);

    g.style.cursor = "pointer";
    g.addEventListener("mouseenter", (e) => ia.onEnter(d, e));
    g.addEventListener("mouseleave", (e) => ia.onLeave(e));
    g.addEventListener("click", (e) => ia.onClick(d, e));
    root.appendChild(g);
  }

  parent.appendChild(root);
}
