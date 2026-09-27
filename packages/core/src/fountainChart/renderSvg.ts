// Imperative SVG renderer for FountainChart: draws the shared render model and the
// text model (SPEC section 4). No event listeners: the engine hit-tests at the host
// for every renderer (hitTest.ts).
//
// renderFountainSvg (svg renderer only) draws two groups:
// - g.mv-fountain-backdrop: the lake band at y = 0 and the dashed reference lines
//   (chart furniture: never clipped by a reveal);
// - g.fountain-chart-content (the reveal clips it): the trend line, then one
//   g.mv-fountain-jet-group per jet with, in the mock's order, the stem
//   (rect.mv-fountain-stem, or a dashed line.mv-fountain-stem for a forecast), the
//   bell (path.mv-fountain-jet: the canvas colour probe reads its fill), the small
//   dots (circle.mv-fountain-dot) and the big dot (circle.mv-fountain-value; hollow
//   for a forecast).
// The group and every mark carry data-label / data-label-safe, so consumer CSS
// reaches them.
//
// renderFountainSvgText (every renderer: text always stays SVG) draws the value
// labels (g.mv-fountain-value-label > text.mv-fountain-value-line[data-kind]), the
// reference line labels, the x labels' second lines (text.mv-fountain-axis-note: the
// forecast word when it does not fit beside the label), the rotated y-axis title and
// the reading guide.
//
// A forecast's hollow big dot is a ring with nothing painted inside: the marks under
// it (its stem, its bell, the trend line) are cut away by an even-odd clip
// (clipPath.mv-fountain-knockout), so it shows the real background, light or dark.
//
// Theme tokens: --michi-vz-surface (the chart's background colour: the thin ring round
// each small dot and the ring round a big dot), --michi-vz-attention (reference lines
// and counts), --michi-vz-lake, --michi-vz-ink, --michi-vz-muted, --michi-vz-grid.
import { svgEl } from "../dom";
import type { FountainRenderModel } from "./renderModel";
import type { FountainTextModel } from "./layout";

export interface FountainSvgOptions {
  enableTransitions: boolean;
}

const INK = "var(--michi-vz-ink, currentColor)";
const MUTED = "var(--michi-vz-muted, #666)";
const SURFACE = "var(--michi-vz-surface, #fff)";
const ATTENTION = "var(--michi-vz-attention, #c0392b)";
const LAKE = "var(--michi-vz-lake, #9cc3dd)";
const GRID = "var(--michi-vz-grid, lightgray)";

/** Lake band height below the baseline (px). */
export const FOUNTAIN_LAKE_HEIGHT = 6;
/** Opacity of a jet another label's highlight dims. */
export const FOUNTAIN_DIM_OPACITY = 0.3;

const r2 = (n: number): number => Math.round(n * 100) / 100;
const fontOf = (px: number): string => `calc(var(--michi-vz-font-size, 12px) * ${r2(px / 12)})`;

// Knockout ids must not collide between charts on one page.
let knockoutSeq = 0;

/** A circle as a closed path: two arcs from its leftmost point. */
function circlePath(x: number, y: number, r: number): string {
  return `M${r2(x - r)},${r2(y)} a${r2(r)},${r2(r)} 0 1,0 ${r2(2 * r)},0 a${r2(r)},${r2(r)} 0 1,0 ${r2(-2 * r)},0 Z`;
}

/** "M x,y L x,y ... Z" for a closed polygon. */
export function polygonPath(points: ReadonlyArray<readonly [number, number]>): string {
  if (points.length === 0) return "";
  return points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${r2(x)},${r2(y)}`).join(" ") + " Z";
}

export function renderFountainSvg(
  parent: SVGElement,
  model: FountainRenderModel,
  o: FountainSvgOptions,
): void {
  const backdrop = svgEl("g", { class: "mv-fountain-backdrop" });
  backdrop.appendChild(
    svgEl("rect", {
      class: "mv-fountain-lake",
      x: model.lake.x0,
      y: model.lake.y,
      width: Math.max(0, model.lake.x1 - model.lake.x0),
      height: FOUNTAIN_LAKE_HEIGHT,
      fill: LAKE,
      "fill-opacity": 0.3,
    }),
  );
  for (const line of model.referenceLines) {
    backdrop.appendChild(
      svgEl("line", {
        class: "mv-fountain-reference",
        "data-value": line.value,
        x1: line.x0,
        x2: line.x1,
        y1: line.y,
        y2: line.y,
        stroke: ATTENTION,
        "stroke-width": 1.2,
        "stroke-dasharray": "5 4",
      }),
    );
  }
  parent.appendChild(backdrop);

  const root = svgEl("g", { class: "fountain-chart-content" });

  // Hollow big dots: cut the marks under their inside away (the 2 px ring is centred on
  // r, so its inner edge is r - 1), everything else stays.
  const hollow = model.jets.filter((j) => j.bigDot.hollow).map((j) => j.bigDot);
  let knockout: string | null = null;
  if (hollow.length > 0) {
    const id = `mv-fountain-knockout-${++knockoutSeq}`;
    const clip = svgEl("clipPath", { id, class: "mv-fountain-knockout" });
    const holes = hollow.map((b) => circlePath(b.x, b.y, Math.max(0, b.r - 1))).join(" ");
    clip.appendChild(
      svgEl("path", {
        d: `M-100000,-100000 H100000 V100000 H-100000 Z ${holes}`,
        "clip-rule": "evenodd",
      }),
    );
    const defs = svgEl("defs");
    defs.appendChild(clip);
    root.appendChild(defs);
    knockout = `url(#${id})`;
  }

  if (model.trendLine) {
    const trend = svgEl("path", {
      class: "mv-fountain-trend",
      d: model.trendLine.map((p, i) => `${i === 0 ? "M" : "L"}${r2(p.x)},${r2(p.y)}`).join(" "),
      fill: "none",
      stroke: INK,
      "stroke-opacity": 0.45,
      "stroke-width": 1.2,
      "stroke-dasharray": "3 3",
    });
    if (knockout) trend.setAttribute("clip-path", knockout);
    root.appendChild(trend);
  }

  const transition = o.enableTransitions ? "opacity 0.2s ease-in-out" : "none";
  for (const jet of model.jets) {
    const hook = { "data-label": jet.label, "data-label-safe": jet.safe };
    const g = svgEl("g", { class: "mv-fountain-jet-group", ...hook, "data-index": jet.index });
    g.setAttribute("opacity", String(jet.dimmed ? FOUNTAIN_DIM_OPACITY : 1));
    if (knockout) g.setAttribute("clip-path", knockout);
    g.style.transition = transition;

    const s = jet.stem;
    if (s.dashed) {
      g.appendChild(
        svgEl("line", {
          class: "mv-fountain-stem",
          ...hook,
          x1: s.x,
          x2: s.x,
          y1: s.y0,
          y2: s.y1,
          stroke: jet.color,
          "stroke-width": r2(Math.max(1, s.width - 1.2)),
          "stroke-dasharray": "5 4",
          "stroke-opacity": 0.75,
        }),
      );
    } else {
      g.appendChild(
        svgEl("rect", {
          class: "mv-fountain-stem",
          ...hook,
          x: s.x - s.width / 2,
          y: Math.min(s.y0, s.y1),
          width: s.width,
          height: Math.abs(s.y0 - s.y1),
          rx: s.width / 2,
          fill: jet.color,
          "fill-opacity": 0.75,
        }),
      );
    }

    if (jet.bell) {
      const bell = svgEl("path", {
        class: "mv-fountain-jet",
        ...hook,
        d: polygonPath(jet.bell.points),
        fill: jet.color,
        "fill-opacity": jet.bell.dashed ? 0.06 : 0.13,
        stroke: jet.color,
        "stroke-opacity": jet.bell.dashed ? 0.6 : 0.7,
        "stroke-width": 1.2,
        "stroke-linejoin": "round",
      });
      if (jet.bell.dashed) bell.setAttribute("stroke-dasharray", "4 3");
      g.appendChild(bell);
    }

    for (const d of jet.dots) {
      g.appendChild(
        svgEl("circle", {
          class: "mv-fountain-dot",
          ...hook,
          "data-value": d.value,
          cx: d.x,
          cy: d.y,
          r: d.r,
          fill: jet.color,
          "fill-opacity": 0.9,
          stroke: SURFACE,
          "stroke-width": 0.7,
        }),
      );
    }

    const b = jet.bigDot;
    g.appendChild(
      svgEl("circle", {
        class: "mv-fountain-value",
        ...hook,
        cx: b.x,
        cy: b.y,
        r: b.r,
        // Hollow: a ring only; the knockout clears what is under it.
        fill: b.hollow ? "none" : jet.color,
        stroke: b.hollow ? jet.color : SURFACE,
        "stroke-width": 2,
      }),
    );
    root.appendChild(g);
  }
  parent.appendChild(root);
}

const VALUE_FILL: Record<string, string> = {
  usual: INK,
  low: MUTED,
  high: MUTED,
  only: MUTED,
  count: ATTENTION,
  countLabel: ATTENTION,
};

export function renderFountainSvgText(parent: SVGElement, text: FountainTextModel): void {
  const vl = text.valueLabels;
  if (vl) {
    const all = svgEl("g", { class: "mv-fountain-value-labels" });
    for (const block of vl.jets) {
      const g = svgEl("g", {
        class: "mv-fountain-value-label",
        "data-label": block.label,
        "data-label-safe": block.safe,
        "data-x": r2(block.x),
        visibility: "visible",
      });
      if (block.dimmed) g.setAttribute("opacity", "0.45");
      block.lines.forEach((l, k) => {
        const t = svgEl("text", {
          class: "mv-fountain-value-line",
          "data-kind": l.kind,
          x: block.x,
          y: vl.top + k * vl.lineHeight,
          "text-anchor": "middle",
          fill: VALUE_FILL[l.kind] ?? MUTED,
        });
        if (l.bold) t.setAttribute("font-weight", "bold");
        t.style.fontSize = fontOf(vl.fontSize);
        t.textContent = l.text;
        g.appendChild(t);
      });
      all.appendChild(g);
    }
    parent.appendChild(all);
  }

  for (const r of text.referenceLabels) {
    const t = svgEl("text", {
      class: "mv-fountain-reference-label",
      "data-value": r.value,
      fill: ATTENTION,
    });
    t.style.fontSize = fontOf(11);
    r.lines.forEach((l, k) => {
      const span = svgEl("tspan", { x: r.x, y: r.y + k * text.lineHeight });
      if (l.bold) span.setAttribute("font-weight", "bold");
      span.textContent = l.text;
      t.appendChild(span);
    });
    parent.appendChild(t);
  }

  for (const note of text.axisNotes) {
    const t = svgEl("text", {
      class: "mv-axis-label mv-fountain-axis-note",
      x: note.x,
      y: note.y,
      "text-anchor": "middle",
    });
    t.textContent = note.text;
    parent.appendChild(t);
  }

  if (text.yTitle) {
    const { x, y } = text.yTitle;
    const t = svgEl("text", {
      class: "mv-fountain-y-title",
      x,
      y,
      transform: `rotate(-90 ${r2(x)} ${r2(y)})`,
      "text-anchor": "middle",
      fill: MUTED,
    });
    t.style.fontSize = fontOf(11);
    t.textContent = text.yTitle.text;
    parent.appendChild(t);
  }

  const guide = text.readingGuide;
  if (guide) {
    parent.appendChild(
      svgEl("line", {
        class: "mv-fountain-reading-guide-rule",
        x1: guide.ruleX0,
        x2: guide.ruleX1,
        y1: guide.ruleY,
        y2: guide.ruleY,
        stroke: GRID,
      }),
    );
    const t = svgEl("text", { class: "mv-fountain-reading-guide", fill: MUTED });
    t.style.fontSize = fontOf(11);
    guide.lines.forEach((line, k) => {
      const span = svgEl("tspan", { x: guide.x, y: guide.top + k * text.lineHeight });
      span.textContent = line;
      t.appendChild(span);
    });
    parent.appendChild(t);
  }
}

/**
 * Show only the value labels of jets the reveal has reached (their centre x <=
 * revealX); null shows them all. Called on every reveal frame (timeline or
 * progressive draw), whatever paints the marks.
 */
export function gateFountainText(svg: Element, revealX: number | null): void {
  for (const g of Array.from(svg.querySelectorAll("g.mv-fountain-value-label"))) {
    const x = Number(g.getAttribute("data-x"));
    const shown = revealX === null || x <= revealX + 0.5;
    g.setAttribute("visibility", shown ? "visible" : "hidden");
  }
}
