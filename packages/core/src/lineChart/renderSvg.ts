// Imperative SVG renderer for LineChart (port of useLineChartPathsShapesRendering
// JSX). Per series: a group with one <path class="line"> per certainty run
// (solid/dashed), an optional single-point guide line, optional data-point marks,
// and a wide transparent <path class="line-overlay"> for hover hit-testing. Every
// mark carries data-label + data-label-safe so the consumer colour contract + the
// canvas probe match.
import { svgEl } from "../dom";
import { getShapePath, getSquareDimensions } from "../gapChart/shapes";
import type { LineRenderModel, LineSeriesModel } from "./renderModel";
import type { Margin, Shape, SinglePointLineConfig } from "../types";

export interface LineSvgOptions {
  margin: Margin;
  width: number;
  showDataPoints: boolean;
  singlePointLine: SinglePointLineConfig | null;
  enableTransitions: boolean;
}

export interface LineInteractions {
  onEnter: (label: string, ev: MouseEvent) => void;
  onLeave: (ev: MouseEvent) => void;
  onClick: (label: string, ev: MouseEvent) => void;
}

function pointMark(shape: Shape, x: number, y: number, color: string, safe: string, label: string): SVGElement {
  if (shape === "square") {
    const dims = getSquareDimensions();
    return svgEl("rect", {
      class: "data-point",
      "data-label": label,
      "data-label-safe": safe,
      x: x + dims.x,
      y: y + dims.y,
      width: dims.width,
      height: dims.height,
      fill: color,
      stroke: "#fdfdfd",
      "stroke-width": 2,
    });
  }
  if (shape === "triangle") {
    return svgEl("path", {
      class: "data-point",
      "data-label": label,
      "data-label-safe": safe,
      d: getShapePath("triangle") || "",
      transform: `translate(${x}, ${y})`,
      fill: color,
      stroke: "#fdfdfd",
      "stroke-width": 2,
    });
  }
  return svgEl("circle", {
    class: "data-point",
    "data-label": label,
    "data-label-safe": safe,
    cx: x,
    cy: y,
    r: 5,
    fill: color,
    stroke: "#fdfdfd",
    "stroke-width": 2,
  });
}

function renderSeries(g: SVGGElement, s: LineSeriesModel, o: LineSvgOptions, ia: LineInteractions): void {
  const transition = o.enableTransitions ? "opacity 0.2s ease-in-out" : "none";
  g.style.opacity = s.dimmed ? "0.05" : "1";
  g.style.transition = transition;

  // Line runs (solid for certain, 4,4 dash for uncertain/gap).
  for (const run of s.runs) {
    if (!run.path) continue;
    const path = svgEl("path", {
      class: "line",
      "data-label": s.label,
      "data-label-safe": s.safe,
      d: run.path,
      fill: "none",
      stroke: s.color,
      "stroke-width": 2.5,
      "stroke-linejoin": "round",
      "stroke-linecap": "round",
      "stroke-dasharray": run.certain ? "none" : "4,4",
    });
    g.appendChild(path);
  }

  // Single-point guide line (a lone point has no visible line otherwise).
  if (s.singlePointY !== null && o.singlePointLine) {
    const cfg = o.singlePointLine;
    g.appendChild(
      svgEl("line", {
        class: "single-point-line",
        "data-label": s.label,
        "data-label-safe": s.safe,
        x1: o.margin.left,
        x2: o.width - o.margin.right,
        y1: s.singlePointY,
        y2: s.singlePointY,
        stroke: cfg.stroke ?? s.color,
        "stroke-width": cfg.strokeWidth ?? 2.5,
        "stroke-dasharray": cfg.strokeDasharray ?? "4,4",
      })
    );
  }

  // Optional data-point markers.
  if (o.showDataPoints) {
    for (const p of s.points) {
      g.appendChild(pointMark(s.shape, p.x, p.y, s.color, s.safe, s.label));
    }
  }

  // Transparent hover overlay over the union of runs (hit surface).
  for (const run of s.runs) {
    if (!run.path) continue;
    const overlay = svgEl("path", {
      class: "line-overlay",
      "data-label": s.label,
      "data-label-safe": s.safe,
      d: run.path,
      fill: "none",
      stroke: "transparent",
      "stroke-width": 12,
    });
    overlay.style.cursor = "pointer";
    overlay.addEventListener("mouseenter", (e) => ia.onEnter(s.label, e));
    overlay.addEventListener("mouseleave", (e) => ia.onLeave(e));
    overlay.addEventListener("click", (e) => ia.onClick(s.label, e));
    g.appendChild(overlay);
  }
}

export function renderLineSvg(
  parent: SVGElement,
  model: LineRenderModel,
  o: LineSvgOptions,
  ia: LineInteractions
): void {
  const root = svgEl("g", { class: "line-chart-content" });
  for (const s of model.series) {
    const g = svgEl("g", { class: "data-group", "data-label": s.label, "data-label-safe": s.safe });
    renderSeries(g, s, o, ia);
    root.appendChild(g);
  }
  parent.appendChild(root);
}
