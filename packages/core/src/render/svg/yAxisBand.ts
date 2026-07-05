// Imperative port of shared/YaxisBand.tsx - band-scale y-axis with HTML labels
// (via <foreignObject>, so long labels ellipsize and stay hoverable) plus a
// full-width dashed grid line per band. Optional hover wiring + dim, matching the
// legacy component's `onHover`/`hoveredItem` behaviour (no-hover guard is
// `hoveredItem === null`, so omitting it leaves all labels at full opacity).
//
// Generalized from the GapChart-local axis so every band-based chart shares one.
import { svgEl, htmlEl } from "../../dom";
import type { ScaleBand } from "d3-scale";
import type { Margin } from "../../types";
import { sampleBandTicks } from "./chooseAxisMode";

// A band shorter than one label's line height cannot show its label without
// smearing into its neighbours; below this the axis thins to a sampled subset.
const MIN_LABEL_HEIGHT = 16;
const DEFAULT_MAX_TICKS = 15;

export interface YAxisBandOptions {
  width: number;
  margin: Margin;
  /** Formats a band label (default identity). */
  format?: (label: string) => string;
  tickHtmlWidth?: number;
  /** Cap on labelled bands once thinning kicks in (default 15). */
  maxTicks?: number;
  showGrid?: boolean;
  hideTickLabels?: boolean;
  /** Offset (px) added to each label's foreignObject x/y (consumer alignment). */
  tickLabelOffset?: { x: number; y: number };
  /** Hover callbacks (e.g. cross-highlight). Omit to disable. */
  onHover?: (label: string | null) => void;
  /** Currently hovered band; null = no hover (all labels full opacity). */
  hoveredItem?: string | null;
  /** Opt-in row-label interactions (the chart-level `interactiveRowLabels` prop):
   * hovering/focusing a label draws a leader line from the label to its row's
   * marks and notifies the engine (tooltip + highlight); clicking pins. Labels
   * become keyboard-focusable buttons. */
  interactions?: {
    /** X the leader line ends at for a row (the row's nearest mark edge). */
    leaderToX: (label: string) => number;
    /** pointer = the live cursor position when scrubbing (absent on keyboard focus),
     * so the engine can pop the tooltip right where the user is looking. */
    onEnter: (label: string, rowCenterY: number, pointer?: { clientX: number; clientY: number }) => void;
    onLeave: () => void;
    onClick?: (label: string, rowCenterY: number, pointer?: { clientX: number; clientY: number }) => void;
  };
}

export function renderYAxisBand(
  parent: SVGElement,
  scale: ScaleBand<string>,
  o: YAxisBandOptions
): SVGGElement {
  const g = svgEl("g", { class: "mv-y-axis" });
  const format = o.format ?? ((l: string) => l);
  // Default the label gutter to the chart's left margin (min 100), so a chart that
  // reserves a wide left margin (e.g. BarBell's 180 for "MM-YYYY | label" rows) gets
  // a label box wide enough to fit its labels instead of clipping at a fixed 100.
  const tickHtmlWidth = o.tickHtmlWidth ?? Math.max(100, o.margin.left);
  const bandwidth = scale.bandwidth();
  const gridRight = o.width - o.margin.right;
  const hovered = o.hoveredItem ?? null;
  const domain = scale.domain();

  // Dense-axis thinning: with more rows than the plot can label (bands shorter
  // than a line of text, or beyond an explicit maxTicks) label only an even
  // subset - endpoints kept, numeric domains snapped to round values - and thin
  // the per-band grid with it. Marks/tooltips still render for every row.
  let visible: ReadonlySet<string> | null = null;
  if (bandwidth < MIN_LABEL_HEIGHT || (o.maxTicks != null && domain.length > o.maxTicks)) {
    visible = new Set(
      sampleBandTicks(domain, bandwidth, MIN_LABEL_HEIGHT, o.maxTicks ?? DEFAULT_MAX_TICKS)
    );
  }

  // One leader line + one popped-up label at a time. The leader runs from the
  // label box's right edge to the row's marks (engine-supplied x); the popup shows
  // the row's label when thinning hid it. Both live on the axis group, so every
  // renderer (svg, canvas, webgpu - axes are always SVG) gets them for free.
  const ia = o.interactions;
  const labelBoxX = o.margin.left - tickHtmlWidth + (o.tickLabelOffset?.x ?? 0);
  let leader: SVGElement | null = null;
  const clearScrubMarks = (): void => {
    leader?.remove();
    leader = null;
  };
  const showScrubMarks = (label: string, rowCenterY: number): void => {
    if (!ia) return;
    clearScrubMarks();
    leader = svgEl("line", {
      class: "mv-row-leader",
      x1: o.margin.left - 2 + (o.tickLabelOffset?.x ?? 0),
      y1: rowCenterY,
      x2: ia.leaderToX(label),
      y2: rowCenterY,
    });
    // Inline, not only CSS: the leader materialises UNDER the live pointer, and
    // if it caught the pointer the strip would fire pointerleave and clear it.
    (leader as SVGElement & { style: CSSStyleDeclaration }).style.pointerEvents = "none";
    g.appendChild(leader);
  };
  // The row under a pointer y: the whole gutter scrubs like a slider, reaching
  // every row - including the ones dense-axis thinning left unlabelled.
  const rangeTop = Math.min(...scale.range());
  const step = scale.step() || 1;
  const rowAt = (clientY: number): { label: string; center: number } | null => {
    const rect = parent.getBoundingClientRect();
    const y = clientY - rect.top;
    const i = Math.max(0, Math.min(domain.length - 1, Math.floor((y - rangeTop) / step)));
    const label = domain[i];
    if (label === undefined) return null;
    return { label, center: (scale(label) || 0) + bandwidth / 2 };
  };

  for (const label of domain) {
    if (visible && !visible.has(label)) continue;
    const center = (scale(label) || 0) + bandwidth / 2;

    // Only emit the line when grid is on. The old `stroke="transparent"` fallback did
    // NOT hide it: the `.mv-grid` CSS rule (stroke: lightgray) overrides a presentation
    // attribute, so showGrid:false still drew a dashed line under each band. Match the
    // x-axis (which appends the line only inside `if (showGrid)`) - showGrid is now authoritative.
    if (o.showGrid) {
      g.appendChild(
        svgEl("line", {
          class: "mv-grid",
          x1: o.margin.left,
          x2: gridRight,
          y1: center,
          y2: center,
        })
      );
    }

    if (o.hideTickLabels) continue;

    // Span the full band height so a wrapped multi-line label fits the row; the
    // flex-centered div keeps the text at the band centre (same as before), so any
    // tickLabelOffset still nudges from centre. overflow:visible (paired with the
    // .mv-ylabel div + the overflow:visible svg) lets a label taller than the band
    // spill into the empty inter-band gaps rather than clip - the foreignObject would
    // otherwise clip to its viewport, cutting off long labels (worst at the top band).
    // When thinning is active the band itself is shorter than a text line, so
    // centre a line-height box on the band instead of using the sliver-thin band box.
    const foY = visible
      ? center - MIN_LABEL_HEIGHT / 2
      : (scale(label) ?? center - bandwidth / 2);
    const fo = svgEl("foreignObject", {
      class: "mv-ylabel-fo",
      x: o.margin.left - tickHtmlWidth + (o.tickLabelOffset?.x ?? 0),
      y: foY + (o.tickLabelOffset?.y ?? 0),
      width: tickHtmlWidth,
      height: visible ? MIN_LABEL_HEIGHT : bandwidth,
      style: "overflow: visible",
    });
    const div = htmlEl("div", { class: "mv-ylabel", title: label });
    // Text in a <span> so a consumer's legacy `.tick-html span` rules (nowrap +
    // ellipsis) can reattach; charts without that CSS render the span transparently.
    const span = htmlEl("span");
    span.textContent = format(label);
    div.appendChild(span);
    // Dim non-hovered labels (legacy: 0.3 when another band is hovered).
    div.style.opacity = hovered === null || hovered === label ? "1" : "0.3";
    if (o.onHover) {
      div.addEventListener("mouseenter", () => o.onHover?.(label));
      div.addEventListener("mouseleave", () => o.onHover?.(null));
    }
    if (ia) {
      // Keyboard path: labels are focusable buttons (pointer interaction goes
      // through the scrub strip below, which covers the whole gutter).
      div.setAttribute("role", "button");
      div.setAttribute("tabindex", "0");
      div.addEventListener("focus", () => {
        showScrubMarks(label, center);
        ia.onEnter(label, center);
      });
      div.addEventListener("blur", () => {
        clearScrubMarks();
        ia.onLeave();
      });
      if (ia.onClick) {
        div.addEventListener("keydown", (e: KeyboardEvent) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            ia.onClick?.(label, center);
          }
        });
      }
    }
    fo.appendChild(div);
    g.appendChild(fo);
  }

  // Scrub strip: the whole label gutter behaves like a slider. Gliding or
  // dragging along it selects the row under the pointer - popping up its label
  // when thinning hid it - and fires the same enter/leave/click contract as the
  // keyboard path. Appended last so it sits above the labels for pointer input.
  if (ia && !o.hideTickLabels && domain.length > 0) {
    const strip = svgEl("rect", {
      class: "mv-row-scrub",
      x: labelBoxX,
      y: rangeTop,
      width: tickHtmlWidth,
      height: step * domain.length,
      fill: "transparent",
    });
    strip.style.cursor = "grab";
    let current: string | null = null;
    const scrubTo = (e: { clientX: number; clientY: number }): void => {
      const row = rowAt(e.clientY);
      if (!row) return;
      if (row.label !== current) {
        current = row.label;
        showScrubMarks(row.label, row.center);
      }
      // Refire on EVERY move (not just row changes) so the tooltip tracks the cursor.
      ia.onEnter(row.label, row.center, { clientX: e.clientX, clientY: e.clientY });
    };
    strip.addEventListener("pointermove", (e: PointerEvent) => scrubTo(e));
    strip.addEventListener("pointerdown", (e: PointerEvent) => scrubTo(e));
    strip.addEventListener("pointerleave", () => {
      current = null;
      clearScrubMarks();
      ia.onLeave();
    });
    if (ia.onClick) {
      strip.addEventListener("click", (e: MouseEvent) => {
        const row = rowAt(e.clientY);
        if (row) ia.onClick?.(row.label, row.center, { clientX: e.clientX, clientY: e.clientY });
      });
    }
    g.appendChild(strip);
  }

  parent.appendChild(g);
  return g;
}
