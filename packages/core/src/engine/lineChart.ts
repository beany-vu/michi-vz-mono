// LineChart engine: imperative mount/update/getContext/destroy over the ported
// pure layer. Renders into LIGHT DOM. Mirrors mountGapChart's shape so wrappers
// stay uniform. Proves the remaining render styles: per-run solid/dashed lines
// (gap detection), single-point guide line, LTTB-decimated canvas, hover line.
import DOMPurify from "dompurify";
import { wireStickyDismiss } from "../render/stickyDismiss";
import { attachDevtools, reportDevtoolsHit } from "../devtools/hook";
import { ensureStyles } from "../styles";
import { svgEl, htmlEl, clear } from "../dom";
import { defaultXAxisFormatter, defaultNumberFormatter } from "../i18n/formatters";
import {
  renderTitle,
  renderXAxisLinear,
  renderYAxisLinear,
  renderAnnotationsSvg,
  wireNoDataTickTooltips,
} from "../render/svg";
import { applyChartChrome, createChromeRefs } from "../render/chrome";
import { shouldSkipScaffold } from "../state/dataState";
import { processLineChartData } from "../lineChart/data";
import { buildLineColors } from "../lineChart/colors";
import { createLineScales, type LineXScale } from "../lineChart/scales";
import { buildLineRenderModel } from "../lineChart/renderModel";
import { lttb } from "../lineChart/lttb";
import { projectX } from "../lineChart/geometry";
import { parseXValue, enumeratePeriods, periodValue } from "../lineChart/lineUtils";
import { renderLineSvg } from "../lineChart/renderSvg";
import {
  resolveProgressiveDraw,
  createProgressiveDrawDriver,
  installProgressiveClip,
  setProgressiveReveal,
  installTipLabels,
  setTipLabels,
  computeTipLabels,
  type ResolvedProgressiveDraw,
  type ProgressiveDrawDriver,
} from "../lineChart/progressiveDraw";
import { defaultTicker } from "../animation/ticker";
import { defaultMotionPreference } from "../animation/reducedMotion";
import { resolveTimeline, type ResolvedTimeline } from "../animation/chartTimeline";
import { createCumulativeTimeline, type CumulativePeriod } from "../animation/cumulativeTimeline";
import { placeTooltip } from "../render/placeTooltip";
import { drawLineCanvas } from "../lineChart/renderCanvas";
import { drawLineWebgpu } from "../lineChart/renderWebgpu";
import { resolveRenderer } from "../webgpu/capability";
import { buildLineContext } from "../context/buildLineContext";
import { buildLegendData } from "../context/legend";
import { renderA11yMirror } from "../context/a11yMirror";
import { contextSignature } from "../context/signature";
import { checkLineData } from "../validate/lineWarnings";
import {
  applyTransformData,
  applyEnrichContext,
  collectValidate,
  collectAnnotations,
  collectTools,
  setupPlugins,
} from "../plugins/runner";
import type { AgentTool, MichiVzPlugin, PluginContext } from "../plugins/types";
import type {
  ChartContext,
  ChartInstance,
  DataPoint,
  LineChartProps,
  LineDataItem,
  LineZoomConfig,
  Margin,
  MountOptions,
  MouseLineConfig,
  Renderer,
  SinglePointLineConfig,
} from "../types";

const DEFAULT_MARGIN: Margin = { top: 50, right: 50, bottom: 50, left: 60 };

// canvas + webgpu both paint into a <canvas> layer (no DOM marks), so they share
// the host-level hit-test / click-to-pin interaction path. svg does not.
const isPainted = (rr: Renderer): boolean => rr === "canvas" || rr === "webgpu";

interface Resolved {
  width: number;
  height: number;
  margin: Margin;
  ticks: number;
  renderer: Renderer;
  showDataPoints: boolean;
  mouseLine: MouseLineConfig | null;
  enableTransitions: boolean;
  singlePointLine: SinglePointLineConfig | null;
  yAxisScale: "linear" | "log";
  progressiveDraw: ResolvedProgressiveDraw | null;
  timeline: ResolvedTimeline | null;
  zoom: LineZoomConfig | null;
}

function resolveSinglePointLine(
  v: LineChartProps["singlePointLine"],
): SinglePointLineConfig | null {
  if (!v) return null;
  return v === true ? {} : v;
}

function resolveZoom(v: LineChartProps["zoom"]): LineZoomConfig | null {
  if (!v) return null;
  return v === true ? {} : v;
}

function resolveMouseLine(v: LineChartProps["enableMouseLine"]): MouseLineConfig | null {
  if (!v) return null;
  return v === true ? {} : v;
}

function resolve(p: LineChartProps): Resolved {
  return {
    width: p.width ?? 1000,
    height: p.height ?? 500,
    margin: p.margin ?? DEFAULT_MARGIN,
    ticks: p.ticks ?? 5,
    // EFFECTIVE renderer: an opt-in "webgpu" request downgrades to "canvas" when
    // WebGPU is unavailable, so everything downstream (incl. getContext().renderer)
    // reflects what actually painted.
    renderer: resolveRenderer(p.renderer),
    showDataPoints: p.showDataPoints ?? false,
    mouseLine: resolveMouseLine(p.enableMouseLine ?? true),
    enableTransitions: p.enableTransitions ?? true,
    singlePointLine: resolveSinglePointLine(p.singlePointLine),
    yAxisScale: p.yAxisScale ?? "linear",
    progressiveDraw: resolveProgressiveDraw(p.progressiveDraw),
    timeline: resolveTimeline(p.timeline),
    zoom: resolveZoom(p.zoom),
  };
}

let zoomClipSeq = 0;

export function mountLineChart(
  host: HTMLElement,
  initial: LineChartProps,
  opts?: MountOptions<LineChartProps>,
): ChartInstance<LineChartProps> {
  ensureStyles();
  host.classList.add("michi-vz", "michi-vz-line-chart");

  const svg = svgEl("svg");
  const tooltip = htmlEl("div", { class: "tooltip" });
  tooltip.style.visibility = "hidden";
  const a11y = htmlEl("div", { class: "mv-a11y" });
  a11y.setAttribute("role", "img");
  let canvas: HTMLCanvasElement | null = null;
  let webgpuCanvas: HTMLCanvasElement | null = null;
  let mouseLine: SVGLineElement | null = null;
  const chrome = createChromeRefs();

  host.appendChild(svg);
  host.appendChild(tooltip);
  host.appendChild(a11y);

  let baseProps: LineChartProps = initial;
  let context: ChartContext | null = null;
  const pluginList: MichiVzPlugin<LineChartProps>[] = [...(opts?.plugins ?? [])];
  const pc: PluginContext<LineChartProps> = {
    chartType: "line-chart",
    getProps: () => baseProps,
    getContext: () => context,
    setProps: (patch) => {
      baseProps = { ...baseProps, ...patch };
      render();
    },
  };
  // Progressive draw (opt-in reveal animation): the driver owns the rAF loop,
  // the ticker/motion pair is injectable for deterministic tests.
  const ticker = opts?.ticker ?? defaultTicker();
  const motion = opts?.motion ?? defaultMotionPreference();
  let pdDriver: ProgressiveDrawDriver | null = null;
  let pdHasPlayed = false;
  // Cumulative timeline (opt-in play-through-years): the line draws up to the
  // active year; wins over progressiveDraw when both are configured.
  const cumTl = createCumulativeTimeline({ ticker: opts?.ticker, motion: opts?.motion });

  let sticky = false;
  // True while the cursor is over a faded no-data tick label; makes onHostMove's canvas
  // hit-test stand down so it doesn't hide the no-data tooltip (see wireNoDataTickTooltips).
  let overNoDataTick = false;
  let lastColorMappingSent: Record<string, string> = {};
  // Idempotency guard: only fire onChartDataProcessed when the serialized context
  // changes - an unconditional re-fire loops "Maximum update depth" in any consumer
  // that dispatches on each call (two-colour-writer indicators). Mirrors VSB.
  let lastContextSig = "";
  // Kept for canvas-mode hit-testing (full, undecimated points per label).
  let hitData: Array<{ label: string; points: Array<{ x: number; y: number; d: DataPoint }> }> = [];
  // Resolved label -> colour for the shared tooltip's per-series swatches (updated each render).
  let currentColors: Record<string, string> = {};

  // ---- Drag-to-zoom (opt-in `zoom` prop) ----
  // The zoomed x-domain in axis units (epoch ms on date axes). Survives update()
  // so a data refresh keeps the user's zoom; render() re-clamps it to the data
  // domain and drops it when the intersection is degenerate.
  let zoomDomain: [number, number] | null = null;
  // px x where the current selection drag started, in svg coords; null = not dragging.
  let zoomDragStart: number | null = null;
  let zoomRectEl: SVGRectElement | null = null;
  // A completed selection drag ends with a click event on the host; without this
  // flag that click would toggle the canvas-mode tooltip pin (or pin via an SVG
  // path's own click) right after zooming.
  let suppressNextClick = false;
  // The x-scale of the LAST render, for inverting the selection px -> axis units.
  let currentXScale: LineXScale | null = null;
  const ZOOM_DRAG_MIN_PX = 5;

  const consumeSuppressedClick = (): boolean => {
    if (!suppressNextClick) return false;
    suppressNextClick = false;
    return true;
  };

  const applyZoom = (domain: [number, number] | null): void => {
    zoomDomain = domain;
    render(); // clamps to the data domain; a degenerate intersection nulls it
    baseProps.onZoomChange?.(zoomDomain);
  };

  const removeZoomRect = (): void => {
    zoomRectEl?.remove();
    zoomRectEl = null;
  };

  const onZoomDown = (ev: MouseEvent): void => {
    const r = resolve(baseProps);
    if (!r.zoom || ev.button !== 0) return;
    const rect = svg.getBoundingClientRect();
    const x = ev.clientX - rect.left;
    const y = ev.clientY - rect.top;
    if (x < r.margin.left || x > r.width - r.margin.right) return;
    if (y < r.margin.top || y > r.height - r.margin.bottom) return;
    zoomDragStart = x;
    ev.preventDefault(); // no text selection while dragging
  };

  const updateZoomRect = (ev: MouseEvent): void => {
    if (zoomDragStart === null) return;
    const r = resolve(baseProps);
    const rect = svg.getBoundingClientRect();
    const x = Math.max(r.margin.left, Math.min(ev.clientX - rect.left, r.width - r.margin.right));
    // Below the drag threshold this is still a potential click - draw nothing.
    if (!zoomRectEl && Math.abs(x - zoomDragStart) < ZOOM_DRAG_MIN_PX) return;
    if (!zoomRectEl) {
      zoomRectEl = svgEl("rect", { class: "mv-zoom-rect" }) as SVGRectElement;
      svg.appendChild(zoomRectEl);
    }
    zoomRectEl.setAttribute("x", String(Math.min(zoomDragStart, x)));
    zoomRectEl.setAttribute("y", String(r.margin.top));
    zoomRectEl.setAttribute("width", String(Math.abs(x - zoomDragStart)));
    zoomRectEl.setAttribute(
      "height",
      String(Math.max(0, r.height - r.margin.top - r.margin.bottom)),
    );
    // The selection replaces the hover chrome while it is visible.
    if (mouseLine) mouseLine.style.visibility = "hidden";
    if (!sticky) tooltip.style.visibility = "hidden";
  };

  // window-level so a drag released outside the host still completes.
  const onZoomUp = (ev: MouseEvent): void => {
    if (zoomDragStart === null) return;
    const start = zoomDragStart;
    zoomDragStart = null;
    const hadRect = zoomRectEl !== null;
    removeZoomRect();
    const r = resolve(baseProps);
    if (!r.zoom || !currentXScale) return;
    const rect = svg.getBoundingClientRect();
    const end = Math.max(r.margin.left, Math.min(ev.clientX - rect.left, r.width - r.margin.right));
    if (!hadRect || Math.abs(end - start) < ZOOM_DRAG_MIN_PX) return; // a click, not a drag
    suppressNextClick = true;
    const toValue = (px: number): number => {
      const v = (currentXScale as { invert(px: number): number | Date }).invert(px);
      return v instanceof Date ? v.valueOf() : v;
    };
    const lo = toValue(Math.min(start, end));
    const hi = toValue(Math.max(start, end));
    if (hi - lo < (r.zoom.minRange ?? 0)) return;
    applyZoom([lo, hi]);
  };

  // Built-in "Reset zoom" chip; render() toggles visibility + label.
  const zoomResetBtn = htmlEl("button", {
    class: "mv-zoom-reset",
    type: "button",
  }) as HTMLButtonElement;
  zoomResetBtn.style.display = "none";
  const onZoomReset = (ev: MouseEvent): void => {
    ev.stopPropagation(); // never toggle the canvas tooltip pin
    applyZoom(null);
  };
  zoomResetBtn.addEventListener("click", onZoomReset);
  host.appendChild(zoomResetBtn);

  const findPoint = (label: string, x: number): { d: DataPoint; series: DataPoint[] } | null => {
    const entry = hitData.find((h) => h.label === label);
    if (!entry || entry.points.length === 0) return null;
    let best = entry.points[0];
    for (const p of entry.points) if (Math.abs(p.x - x) < Math.abs(best.x - x)) best = p;
    return { d: best.d, series: entry.points.map((p) => p.d) };
  };

  const showTooltip = (label: string, ev: MouseEvent): void => {
    const svgRect = svg.getBoundingClientRect();
    const hit = findPoint(label, ev.clientX - svgRect.left);
    if (!hit) return;
    // Enrich the hovered point with its series label — the pre-mono library passed
    // `{ ...point, label: item.label }` and consumer formatters (e.g. thd's
    // TooltipTrend) render `item.label` as the series-name row.
    const htmlStr = baseProps.tooltipFormatter
      ? baseProps.tooltipFormatter({ ...hit.d, label }, hit.series, baseProps.dataSet)
      : `<strong>${label}</strong><br/>${String(hit.d.date)}: ${hit.d.value}`;
    tooltip.innerHTML = DOMPurify.sanitize(htmlStr);
    tooltip.style.visibility = "visible";
    // Position AFTER content+visible so placeTooltip can measure offsetWidth/Height
    // and flip left near the host's right edge (avoid sliding under the sidebar).
    placeTooltip(host, tooltip, ev);
  };
  const hideTooltip = (): void => {
    if (sticky) return;
    tooltip.style.visibility = "hidden";
  };

  // ---- Shared ("all series at the hovered year") tooltip ----
  const SHARED_X_TOL = 1; // px: a series' point must sit AT the hovered column to be listed
  const defaultSharedTooltip = (
    xLabel: string,
    entries: Array<{ label: string; value: number; color: string }>,
  ): string => {
    const rows = entries
      .map(
        (e) =>
          `<div style="margin-top:2px"><span style="display:inline-block;width:8px;height:8px;` +
          `margin-right:6px;border-radius:2px;background:${e.color}"></span>${e.label}: ${e.value}</div>`,
      )
      .join("");
    return `<strong>${xLabel}</strong>${rows}`;
  };
  const showSharedTooltip = (ev: MouseEvent, revealCap = Infinity): void => {
    const svgRect = svg.getBoundingClientRect();
    const x = ev.clientX - svgRect.left;
    // Nearest data-point x across all series = the crosshair-snapped year column.
    // While a progressive draw is running, columns beyond the reveal edge are
    // not drawn yet, so they never become the snapped column.
    let nearestX: number | null = null;
    for (const entry of hitData)
      for (const pt of entry.points) {
        if (pt.x > revealCap) continue;
        if (nearestX === null || Math.abs(pt.x - x) < Math.abs(nearestX - x)) nearestX = pt.x;
      }
    if (nearestX === null) {
      hideTooltip();
      return;
    }
    // One row per series that actually has a point AT that column (dataSet order).
    const rows: Array<{ label: string; value: number; color: string; d: DataPoint }> = [];
    let headerDate: DataPoint["date"] | null = null;
    for (const entry of hitData) {
      let best: { x: number; y: number; d: DataPoint } | null = null;
      for (const pt of entry.points)
        if (best === null || Math.abs(pt.x - nearestX) < Math.abs(best.x - nearestX)) best = pt;
      if (best && Math.abs(best.x - nearestX) <= SHARED_X_TOL) {
        rows.push({
          label: entry.label,
          value: best.d.value,
          color: currentColors[entry.label] ?? "",
          d: best.d,
        });
        if (headerDate === null) headerDate = best.d.date;
      }
    }
    if (rows.length === 0) {
      hideTooltip();
      return;
    }
    const xLabel = headerDate === null ? "" : String(headerDate);
    const htmlStr = baseProps.sharedTooltipFormatter
      ? baseProps.sharedTooltipFormatter({ x: nearestX, xLabel, entries: rows })
      : defaultSharedTooltip(xLabel, rows);
    tooltip.innerHTML = DOMPurify.sanitize(htmlStr);
    tooltip.style.visibility = "visible";
    placeTooltip(host, tooltip, ev);
  };

  const onHostMove = (ev: MouseEvent): void => {
    // An in-progress zoom selection owns the pointer: grow the rectangle and
    // keep the hover chrome (crosshair/tooltips) out of the way.
    if (zoomDragStart !== null) {
      updateZoomRect(ev);
      if (zoomRectEl) return;
    }
    const r = resolve(baseProps);
    // Everything right of the reveal edge is not drawn: the crosshair, snapping,
    // and tooltips all stop there. The timeline caps even while PAUSED (undrawn
    // years are not inspectable); a progressive draw caps only while running.
    const revealCap =
      cumTl.getRevealX() ?? (pdDriver?.isRunning() ? pdDriver.getRevealX() : Infinity);
    if (r.mouseLine && mouseLine) {
      const svgRect = svg.getBoundingClientRect();
      const x = ev.clientX - svgRect.left;
      // Legacy parity: snap to the nearest data point x (the old LineChartMouseLine
      // bisector feel) unless the config opts out with snap:false. hitData covers svg
      // AND canvas modes; empty hitData (e.g. every series disabled) = nothing to
      // snap to, keep the line hidden rather than show it at a stale x.
      let lineX: number | null = null;
      if (x >= r.margin.left && x <= Math.min(r.width - r.margin.right, revealCap)) {
        if (r.mouseLine.snap === false) {
          lineX = x;
        } else {
          for (const entry of hitData)
            for (const pt of entry.points) {
              if (pt.x > revealCap) continue;
              if (lineX === null || Math.abs(pt.x - x) < Math.abs(lineX - x)) lineX = pt.x;
            }
        }
      }
      if (lineX !== null) {
        mouseLine.setAttribute("x1", String(lineX));
        mouseLine.setAttribute("x2", String(lineX));
        mouseLine.setAttribute("y1", String(r.margin.top));
        mouseLine.setAttribute("y2", String(r.height - r.margin.bottom));
        mouseLine.style.visibility = "visible";
      } else {
        mouseLine.style.visibility = "hidden";
      }
    }
    if (!isPainted(r.renderer) || sticky || hitData.length === 0 || overNoDataTick) return;
    // Shared tooltip: whenever the cursor is within the plot x-range, list every
    // series' value at the nearest year (no need to be near a specific line).
    if (baseProps.sharedTooltip) {
      const rect = svg.getBoundingClientRect();
      const sx = ev.clientX - rect.left;
      if (sx >= r.margin.left && sx <= Math.min(r.width - r.margin.right, revealCap)) {
        showSharedTooltip(ev, revealCap);
        baseProps.onHighlightItem?.(hitData.map((h) => h.label));
      } else {
        hideTooltip();
        baseProps.onHighlightItem?.([]);
      }
      return;
    }
    const svgRect = svg.getBoundingClientRect();
    const x = ev.clientX - svgRect.left;
    const y = ev.clientY - svgRect.top;
    if (x > revealCap) {
      hideTooltip();
      baseProps.onHighlightItem?.([]);
      return;
    }
    let hitLabel: string | null = null;
    let bestDy = 24;
    for (const entry of hitData) {
      let nearest: (typeof entry.points)[number] | null = null;
      for (const p of entry.points) {
        if (p.x > revealCap) continue;
        if (nearest === null || Math.abs(p.x - x) < Math.abs(nearest.x - x)) nearest = p;
      }
      if (nearest) {
        const dy = Math.abs(nearest.y - y);
        if (dy < bestDy) {
          bestDy = dy;
          hitLabel = entry.label;
        }
      }
    }
    reportDevtoolsHit(host, x, y, hitLabel);
    if (hitLabel) {
      showTooltip(hitLabel, ev);
      baseProps.onHighlightItem?.([hitLabel]);
    } else {
      hideTooltip();
      baseProps.onHighlightItem?.([]);
    }
  };
  // Canvas-mode click-to-pin: SVG marks pin via their own onClick, but canvas
  // marks have no DOM, so a click on the host toggles the hovered tooltip's pin.
  const onHostClick = (): void => {
    if (consumeSuppressedClick()) return; // the click that ends a zoom drag
    if (!isPainted(resolve(baseProps).renderer)) return;
    if (sticky) {
      sticky = false;
      tooltip.classList.remove("sticky");
      tooltip.style.visibility = "hidden";
    } else if (tooltip.style.visibility === "visible") {
      sticky = true;
      tooltip.classList.add("sticky");
    }
  };
  // Legacy parity: the crosshair hides when the cursor leaves the chart. Tooltip
  // semantics stay untouched - it keeps its own sticky/grace logic.
  const onHostLeave = (): void => {
    if (mouseLine) mouseLine.style.visibility = "hidden";
  };
  host.addEventListener("mousemove", onHostMove);
  host.addEventListener("mouseleave", onHostLeave);
  host.addEventListener("click", onHostClick);
  host.addEventListener("mousedown", onZoomDown);
  window.addEventListener("mouseup", onZoomUp);
  const disposeStickyDismiss = wireStickyDismiss(host, tooltip, {
    isSticky: () => sticky,
    unpin: () => {
      sticky = false;
    },
  });

  function render(): void {
    // A re-render rebuilds every node the reveal animation mutates, so any
    // in-flight progressive draw is cancelled first (never re-attached stale).
    // Its current position is captured so the reveal RESUMES after the rebuild:
    // wrappers (Lit updated(), React effects) call update() right after mount,
    // and without the resume that double-render would kill every mount autoplay.
    const pdResume = pdDriver?.isRunning() ? pdDriver.getRevealX() : null;
    pdDriver?.stop();
    pdDriver = null;
    // Plugin hook #1 - transformData: forecast/etc. append predicted points/series.
    // With no plugins this is an identity fold, so behaviour is unchanged.
    const props = applyTransformData(pluginList, baseProps, pc);
    let r = resolve(props);
    const xAxisDataType = props.xAxisDataType ?? "number";
    const highlightItems = props.highlightItems ?? [];

    // Computed up front (pure - no host/DOM dependency) so a log y-axis with no
    // positive values anywhere can force the no-data state below instead of asking
    // d3 for a degenerate/zero-inclusive log scale.
    const { processedDataSet, xAxisDomain, yAxisDomain, rankedDataSet } = processLineChartData(
      props.dataSet,
      {
        disabledItems: props.disabledItems,
        filter: props.filter,
        detectGaps: props.detectGaps,
        expectedStep: props.expectedStep,
        xAxisDataType,
        yAxisDomain: props.yAxisDomain,
        yAxisScale: r.yAxisScale,
      },
    );
    const logHasNoPositiveValues =
      r.yAxisScale === "log" && processedDataSet.every((item) => item.series.length === 0);

    // Zoomed x-domain: clamp the stored selection to the (possibly refreshed)
    // data domain; a degenerate intersection clears the zoom entirely. The
    // y-domain stays FULL by design (stable reading while panning through x).
    let effectiveXDomain: [number, number] = xAxisDomain;
    if (r.zoom && zoomDomain) {
      const lo = Math.max(Math.min(zoomDomain[0], zoomDomain[1]), xAxisDomain[0]);
      const hi = Math.min(Math.max(zoomDomain[0], zoomDomain[1]), xAxisDomain[1]);
      if (hi > lo) {
        zoomDomain = [lo, hi];
        effectiveXDomain = zoomDomain;
      } else {
        zoomDomain = null;
      }
    }
    const zoomed = r.zoom !== null && zoomDomain !== null;
    // The webgpu path has no clip support, so a zoomed chart would paint marks
    // over the axes; canvas is visually identical and clips correctly.
    if (zoomed && r.renderer === "webgpu") r = { ...r, renderer: "canvas" };
    zoomResetBtn.textContent = r.zoom?.resetLabel ?? "Reset zoom";
    zoomResetBtn.style.display = zoomed && r.zoom?.resetButton !== false ? "" : "none";
    // A value in axis units (epoch ms on date axes) inside the zoomed domain?
    const inZoomDomain = (raw: number | Date): boolean => {
      const v = raw instanceof Date ? raw.valueOf() : raw;
      return v >= effectiveXDomain[0] && v <= effectiveXDomain[1];
    };
    // Canvas plot clip while zoomed (the SVG path installs a <clipPath> wrapper).
    const zoomClipX: [number, number] | undefined = zoomed
      ? [r.margin.left, r.width - r.margin.right]
      : undefined;

    // data-mv-state + font var + default loading/no-data overlays (shared chrome).
    const dataState = applyChartChrome(
      host,
      logHasNoPositiveValues ? { ...props, isNodata: true } : props,
      props.dataSet,
      chrome,
    );
    // Skip axes/marks for "nodata" AND for a first-load "loading" with nothing to
    // draw — but never during a refetch with stale data still on screen.
    const skipScaffold = shouldSkipScaffold(dataState, props.dataSet);

    svg.setAttribute("width", String(r.width));
    svg.setAttribute("height", String(r.height));
    svg.style.position = "relative";

    const colors = buildLineColors(
      props.dataSet,
      props.colors,
      props.colorsMapping,
      props.skipColorMappingDispatch ?? false,
    );

    if (!props.skipColorMappingDispatch && props.onColorMappingGenerated) {
      const next = colors.generatedColorsMapping;
      if (JSON.stringify(next) !== JSON.stringify(lastColorMappingSent)) {
        lastColorMappingSent = { ...next };
        props.onColorMappingGenerated(next);
      }
    }

    const scales = createLineScales(
      effectiveXDomain,
      yAxisDomain,
      r.width,
      r.height,
      r.margin,
      xAxisDataType,
      r.yAxisScale,
      // A zoomed domain is the user's exact selection: nicing would round it
      // away, and clamping would pile out-of-range points flat on the plot
      // edges instead of letting them project out and clip.
      zoomed ? { xNice: false, xClamp: false } : undefined,
    );
    currentXScale = scales.xScale;

    // Build hit-test data from the FULL (undecimated) processed points. While
    // zoomed, out-of-domain points are excluded so the crosshair and tooltips
    // never snap to a clipped (invisible) point.
    hitData = processedDataSet.map((item) => ({
      label: item.label,
      points: item.series
        .filter((d) => !zoomed || inZoomDomain(parseXValue(d.date, xAxisDataType)))
        .map((d) => ({
          x: projectX(d, scales.xScale, xAxisDataType),
          y: scales.yScale(d.value),
          d,
        })),
    }));
    currentColors = colors.generatedColorsMapping;

    // Canvas/webgpu mode: LTTB-decimate each series to ~2 points/px before drawing.
    const drawDataSet: LineDataItem[] = isPainted(r.renderer)
      ? processedDataSet.map((item) => {
          const pxX = (d: DataPoint) => projectX(d, scales.xScale, xAxisDataType);
          const span = item.series.length
            ? Math.abs(pxX(item.series[item.series.length - 1]) - pxX(item.series[0]))
            : 0;
          const threshold = Math.max(3, Math.min(item.series.length, Math.round(span * 2)));
          return { ...item, series: lttb(item.series, threshold, pxX, (d) => d.value) };
        })
      : processedDataSet;

    const model = buildLineRenderModel(drawDataSet, scales, colors, {
      xAxisDataType,
      curve: props.curve,
      highlightItems,
    });

    const xFormat = props.xAxisFormat ?? defaultXAxisFormatter(xAxisDataType, props.locale);
    const yFormat = props.yAxisFormat ?? defaultNumberFormatter(props.locale);

    // ----- SVG layer (axes + title always; marks only in svg mode) -----
    clear(svg);
    renderTitle(svg, { text: props.title, x: r.width / 2, y: r.margin.top / 2 });
    // No-data / empty first-load: render only the title (axes + marks hidden,
    // matching legacy `!displayIsNodata && filteredDataSet.length > 0` gating);
    // the overlay covers it. A refetch with stale data keeps its scaffolding.
    if (!skipScaffold) {
      // Legacy parity (mirrors AreaChart): feed every DATA period as a candidate tick
      // so the axis ALWAYS keeps the first + last period (raw `scaleTime().ticks()`
      // snaps to "nice" calendar boundaries and silently drops non-round endpoints).
      // maxTicks thins a dense series (e.g. 48 months) to ~3-5 keeping both ends;
      // autoRotate tilts -45deg only when the kept labels still collide.
      // Periods come from processedDataSet — the SAME ranked/sliced/disabled-filtered
      // set the x-domain is computed from — never from the raw props.dataSet: with a
      // top/bottom `filter`, a ranked-out pool series holding a later period than any
      // drawn series would otherwise contribute a tick past the domain edge, which the
      // unclamped date scale happily projects beyond the plotted lines.
      const periodTicks =
        xAxisDataType === "date_annual" || xAxisDataType === "date_monthly"
          ? Array.from(
              new Set(processedDataSet.flatMap((row) => row.series.map((p) => String(p.date)))),
            )
              .map((d) => parseXValue(d, xAxisDataType))
              .sort(
                (a, b) =>
                  (a instanceof Date ? a.valueOf() : a) - (b instanceof Date ? b.valueOf() : b),
              )
          : undefined;
      const plotW = r.width - r.margin.left - r.margin.right;
      const xMaxTicks = plotW < 480 ? 3 : 5;
      // Opt-in continuous timeline: draw a tick for EVERY period in range (not just
      // periods present in data); periods with no non-null value are marked faded and
      // get a "no data" hover tooltip. Explicit `tickValues` still wins over the fill.
      let candidateTicks = props.tickValues ?? periodTicks;
      // While zoomed, period/explicit ticks outside the zoomed domain would
      // render beyond the plot; drop them, and if fewer than 2 survive let d3
      // generate ticks inside the zoomed domain instead.
      if (zoomed && candidateTicks) {
        const kept = candidateTicks.filter((t) => inZoomDomain(t));
        candidateTicks = kept.length >= 2 ? kept : undefined;
      }
      let noDataValues: Set<number> | undefined;
      const isDateAxis = xAxisDataType === "date_annual" || xAxisDataType === "date_monthly";
      if (props.fillPeriodTicks && !props.tickValues && isDateAxis) {
        const [dMin, dMax] = scales.xScale.domain() as [Date, Date];
        const allPeriods = enumeratePeriods(dMin, dMax, xAxisDataType);
        candidateTicks = allPeriods;
        // Same sourcing rule as periodTicks above: a ranked-out/hidden pool series
        // must not mark a period as "present" (its faded no-data tick would lie).
        const present = new Set<number>();
        for (const row of processedDataSet) {
          for (const p of row.series) {
            if (p.value === null || p.value === undefined || Number.isNaN(p.value)) continue;
            const parsed = parseXValue(p.date, xAxisDataType);
            present.add(parsed instanceof Date ? periodValue(parsed, xAxisDataType) : parsed);
          }
        }
        noDataValues = new Set(allPeriods.filter((v) => !present.has(v)));
        if (props.noDataTickColor != null) {
          host.style.setProperty("--michi-vz-tick-nodata", props.noDataTickColor);
        }
      }
      const xAxisG = renderXAxisLinear(svg, scales.xScale, {
        width: r.width,
        height: r.height,
        margin: r.margin,
        xAxisDataType,
        format: (v) => xFormat(v),
        ticks: r.ticks,
        tickValues: candidateTicks,
        enableExplicitTickValues: true,
        showGrid: props.showVerticalGridLines === true,
        autoRotate: true,
        maxTicks: xMaxTicks,
        noDataValues,
      });
      if (noDataValues && noDataValues.size > 0) {
        wireNoDataTickTooltips(xAxisG, tooltip, host, props.noDataTickTooltip, undefined, (h) => {
          overNoDataTick = h;
        });
      }
      renderYAxisLinear(svg, scales.yScale, {
        width: r.width,
        height: r.height,
        margin: r.margin,
        format: (v) => yFormat(v),
        ticks: props.yTicks ?? 10,
        showGrid: props.showGridLines !== false,
        highlightZeroLine: props.highlightZeroLine !== false,
      });
    }

    // Consumer-supplied SVG children (axis-title text, reference lines) - rendered
    // after the axes, mirroring the legacy <LineChart>'s `{children}` slot. The source
    // is the React wrapper's renderToStaticMarkup(children). DOMPurify strips a bare
    // <text> (mXSS guard) unless it sits under an <svg> root, so sanitise the markup
    // wrapped in one, then lift the children into the chart's <svg>. (Same as scatter.)
    if (props.svgChildren) {
      const childG = svgEl("g", { class: "mv-svg-children" });
      const clean = DOMPurify.sanitize(
        `<svg xmlns="http://www.w3.org/2000/svg">${props.svgChildren}</svg>`,
        { USE_PROFILES: { svg: true } },
      );
      const tmp = svgEl("g");
      tmp.innerHTML = clean;
      const inner = tmp.querySelector("svg");
      if (inner) {
        while (inner.firstChild) childG.appendChild(inner.firstChild);
      }
      svg.appendChild(childG);
    }

    if (r.renderer === "svg" && !skipScaffold) {
      renderLineSvg(
        svg,
        model,
        {
          margin: r.margin,
          width: r.width,
          showDataPoints: r.showDataPoints,
          singlePointLine: r.singlePointLine,
          enableTransitions: r.enableTransitions,
        },
        {
          onEnter: (label, ev) => {
            if (sticky) return;
            showTooltip(label, ev);
            props.onHighlightItem?.([label]);
          },
          onLeave: () => {
            hideTooltip();
            if (!sticky) props.onHighlightItem?.([]);
          },
          onClick: (label, ev) => {
            if (consumeSuppressedClick()) return; // the click that ends a zoom drag
            sticky = true;
            tooltip.classList.add("sticky");
            showTooltip(label, ev);
          },
        },
      );
    }

    // While zoomed, clip the SVG marks to the plot box: with clamp off, points
    // outside the zoomed domain project beyond the plot and must not paint over
    // the axes. The clip lives on a WRAPPER group so progressiveDraw's own
    // clip-path on g.line-chart-content composes with it instead of replacing it.
    if (zoomed && r.renderer === "svg" && !skipScaffold) {
      const contentRoot = svg.querySelector<SVGGElement>("g.line-chart-content");
      if (contentRoot && contentRoot.parentNode) {
        const id = `mv-zoom-clip-${++zoomClipSeq}`;
        const clip = svgEl("clipPath", { id });
        clip.appendChild(
          svgEl("rect", {
            x: r.margin.left,
            y: 0,
            width: Math.max(0, r.width - r.margin.left - r.margin.right),
            height: r.height,
          }),
        );
        svg.appendChild(clip);
        const wrap = svgEl("g", { class: "mv-zoom-clip" });
        wrap.setAttribute("clip-path", `url(#${id})`);
        contentRoot.parentNode.insertBefore(wrap, contentRoot);
        wrap.appendChild(contentRoot);
      }
    }

    // Mouse crosshair line (drawn above marks, below tooltip). Styling lives in
    // CORE_CSS (.mv-mouse-line: solid legacy grey); a config object overrides
    // per-instance by setting the --michi-vz-crosshair* vars the rule consumes.
    // Inline stroke ATTRIBUTES would lose to the class rule (y-band gridline
    // gotcha), so no presentation attrs here.
    if (r.mouseLine && !skipScaffold) {
      mouseLine = svgEl("line", { class: "mv-mouse-line" }) as SVGLineElement;
      const cfg = r.mouseLine;
      if (cfg.stroke !== undefined) mouseLine.style.setProperty("--michi-vz-crosshair", cfg.stroke);
      if (cfg.strokeWidth !== undefined)
        mouseLine.style.setProperty("--michi-vz-crosshair-width", String(cfg.strokeWidth));
      if (cfg.strokeDasharray !== undefined)
        mouseLine.style.setProperty("--michi-vz-crosshair-dash", cfg.strokeDasharray);
      mouseLine.style.visibility = "hidden";
      mouseLine.style.pointerEvents = "none";
      svg.appendChild(mouseLine);
    } else {
      mouseLine = null;
    }

    // ----- Canvas / WebGPU layer -----
    const makeLayerCanvas = (className: string): HTMLCanvasElement => {
      const c = htmlEl("canvas", { class: className });
      c.style.position = "absolute";
      c.style.top = getComputedStyle(host).paddingTop;
      c.style.left = getComputedStyle(host).paddingLeft;
      c.style.pointerEvents = "none";
      host.insertBefore(c, tooltip);
      return c;
    };
    const removeCanvas = (): void => {
      if (canvas) {
        canvas.remove();
        canvas = null;
      }
    };
    const removeWebgpuCanvas = (): void => {
      if (webgpuCanvas) {
        webgpuCanvas.remove();
        webgpuCanvas = null;
      }
    };

    if (r.renderer === "webgpu" && !skipScaffold) {
      if (!webgpuCanvas) webgpuCanvas = makeLayerCanvas("lineChart-webgpu-canvas");
      const ready = drawLineWebgpu(webgpuCanvas, svg, model, {
        width: r.width,
        height: r.height,
        margin: r.margin,
        singlePointLine: r.singlePointLine,
        // Re-render once the async GPU device resolves, upgrading canvas → GPU.
        onReady: render,
      });
      if (ready) {
        // GPU painted - drop any first-frame 2D fallback canvas.
        removeCanvas();
      } else {
        // Device not ready / unavailable (incl. jsdom): paint the canvas-2D
        // stopgap so the chart is never blank; onReady re-render swaps in GPU.
        if (!canvas) canvas = makeLayerCanvas("line-chart-canvas");
        drawLineCanvas(canvas, svg, model, {
          width: r.width,
          height: r.height,
          margin: r.margin,
          showDataPoints: r.showDataPoints,
          singlePointLine: r.singlePointLine,
          clipX: zoomClipX,
        });
      }
    } else if (r.renderer === "canvas" && !skipScaffold) {
      removeWebgpuCanvas();
      if (!canvas) canvas = makeLayerCanvas("line-chart-canvas");
      drawLineCanvas(canvas, svg, model, {
        width: r.width,
        height: r.height,
        margin: r.margin,
        showDataPoints: r.showDataPoints,
        singlePointLine: r.singlePointLine,
        clipX: zoomClipX,
      });
    } else {
      removeCanvas();
      removeWebgpuCanvas();
    }

    // ----- Progressive draw (opt-in reveal animation) -----
    // SVG mode: install one <clipPath> and mutate only its rect width per frame.
    // Canvas mode: redraw the same model per frame under an equivalent ctx.clip.
    // WebGPU degrades to instant-draw (no dash/text support there either).
    const pd = r.progressiveDraw;
    if (pd && !r.timeline && !skipScaffold && r.renderer !== "webgpu") {
      const startPx = r.margin.left;
      const endPx = r.width;
      // Tip labels are computed from the undecimated hitData (same nearest-point
      // source the tooltips use), so SVG and canvas report identical values.
      const tipCfg = pd.tipLabel;
      const colorOf = (label: string): string => currentColors[label] ?? "";
      let applyReveal: ((x: number) => void) | null = null;
      if (r.renderer === "svg") {
        const contentRoot = svg.querySelector<SVGGElement>("g.line-chart-content");
        if (contentRoot) {
          const rect = installProgressiveClip(svg, contentRoot, r.height);
          const tipGroup = tipCfg ? installTipLabels(svg) : null;
          applyReveal = (x) => {
            setProgressiveReveal(rect, x);
            if (tipGroup && tipCfg) {
              setTipLabels(tipGroup, computeTipLabels(hitData, colorOf, x, tipCfg));
            }
          };
        }
      } else if (canvas) {
        const layer = canvas;
        const fontFamily = props.fontFamily ?? "sans-serif";
        applyReveal = (x) =>
          drawLineCanvas(layer, svg, model, {
            width: r.width,
            height: r.height,
            margin: r.margin,
            showDataPoints: r.showDataPoints,
            singlePointLine: r.singlePointLine,
            revealX: x,
            clipX: zoomClipX,
            tipLabels: tipCfg ? computeTipLabels(hitData, colorOf, x, tipCfg) : undefined,
            fontFamily,
          });
      }
      if (applyReveal) {
        // Resuming a reveal interrupted by this re-render: start from where it
        // was, with the remaining share of the duration. (Benign corner: a
        // replay() issued right after a resumed render restarts from the
        // resume point rather than the plot edge.)
        const resuming = pdResume !== null;
        const span = Math.max(1, endPx - startPx);
        const remaining = resuming
          ? Math.max(1, pd.durationMs * (1 - (pdResume - startPx) / span))
          : pd.durationMs;
        pdDriver = createProgressiveDrawDriver({
          ticker,
          motion,
          durationMs: remaining,
          easing: pd.easing,
          startPx: resuming ? pdResume : startPx,
          endPx,
          onFrame: applyReveal,
        });
        if (resuming) {
          pdDriver.start();
        } else if (pd.autoplay && (!pdHasPlayed || pd.replayOnUpdate)) {
          pdHasPlayed = true;
          pdDriver.start();
        } else {
          // Already played (or autoplay off): render fully revealed; replay()
          // re-runs the animation on demand.
          applyReveal(endPx);
        }
      }
    }

    // ----- Cumulative timeline (opt-in play-through-years) -----
    // The line draws UP TO the active year; play/scrub sweeps the same reveal
    // clip progressiveDraw uses. Data + getContext() stay full (visual only).
    if (r.timeline && !skipScaffold && r.renderer !== "webgpu") {
      // Distinct periods across every series, ordered by pixel position.
      const periodMap = new Map<string, CumulativePeriod>();
      for (const entry of hitData) {
        for (const pt of entry.points) {
          const key = String(pt.d.date);
          const existing = periodMap.get(key);
          if (!existing || pt.x > existing.px) periodMap.set(key, { period: pt.d.date, px: pt.x });
        }
      }
      const periods = Array.from(periodMap.values()).sort((a, b) => a.px - b.px);
      const tlTip = r.timeline.tipLabel;
      const colorOfTl = (label: string): string => currentColors[label] ?? "";
      let onReveal: ((x: number) => void) | undefined;
      let tlCanvasRedraw: ((x: number) => void) | undefined;
      if (r.renderer === "svg") {
        const tipGroup = tlTip ? installTipLabels(svg) : null;
        if (tipGroup && tlTip) {
          onReveal = (x) => setTipLabels(tipGroup, computeTipLabels(hitData, colorOfTl, x, tlTip));
        }
      } else if (canvas) {
        const layer = canvas;
        const fontFamily = props.fontFamily ?? "sans-serif";
        tlCanvasRedraw = (x) =>
          drawLineCanvas(layer, svg, model, {
            width: r.width,
            height: r.height,
            margin: r.margin,
            showDataPoints: r.showDataPoints,
            singlePointLine: r.singlePointLine,
            revealX: x,
            clipX: zoomClipX,
            tipLabels: tlTip ? computeTipLabels(hitData, colorOfTl, x, tlTip) : undefined,
            fontFamily,
          });
      }
      cumTl.afterRender(r.timeline, {
        host,
        renderer: r.renderer,
        svg,
        marksRoot: svg.querySelector("g.line-chart-content"),
        height: r.height,
        periods,
        startPx: r.margin.left,
        endPx: r.width,
        canvasRedraw: tlCanvasRedraw,
        onReveal,
        startPeriod: props.filter && props.filter.date !== "" ? props.filter.date : undefined,
      });
    } else {
      cumTl.afterRender(null, {
        host,
        renderer: r.renderer,
        svg,
        marksRoot: null,
        height: r.height,
        periods: [],
        startPx: 0,
        endPx: 0,
      });
    }

    // ----- Legend rows (flat colour-contract payload) -----
    // With a filter, the legend is the RANKED slice pre-disabledItems (a hidden
    // ranked series keeps its greyed pill — the only way back, same 1.5.6/1.12.2
    // contract as VSB/ComparableBar); without one, every series with data
    // (disabled included, flagged) so a consumer legend can re-enable them.
    const skipDispatch = props.skipColorMappingDispatch ?? false;
    const legendLabels = props.filter
      ? (rankedDataSet ?? processedDataSet).map((d) => d.label)
      : props.dataSet.filter((d) => (d.series?.length ?? 0) > 0).map((d) => d.label);
    const legendData = buildLegendData({
      labels: legendLabels,
      colorsMapping: skipDispatch ? (props.colorsMapping ?? {}) : colors.generatedColorsMapping,
      disabledItems: props.disabledItems,
      palette: props.colors,
    });

    // ----- Context (renderer-agnostic) + a11y + warnings -----
    context = buildLineContext({
      title: props.title,
      renderer: r.renderer,
      xAxisDataType,
      xAxisDomain,
      yAxisDomain,
      processedDataSet,
      rankedDataSet,
      colorsMapping: colors.generatedColorsMapping,
      legendData,
      disabledItems: props.disabledItems,
      xFormat: props.xAxisFormat ?? defaultXAxisFormatter(xAxisDataType, props.locale),
    });
    // Plugin hook #3 - enrichContext: rewrite summary BEFORE the a11y mirror + the
    // dataprocessed event, so narration flows to both for free.
    context = applyEnrichContext(pluginList, context, pc);

    // Plugin hook #4 - annotate: draw threshold/goal lines + "fall point" markers on
    // the SVG layer (present in both render modes), above the marks.
    const annotations = collectAnnotations(pluginList, context, pc);
    if (annotations.length > 0) {
      renderAnnotationsSvg(svg, annotations, {
        yPx: (v) => scales.yScale(v),
        xPx: (at) =>
          (scales.xScale as (x: number | Date) => number)(parseXValue(at, xAxisDataType)),
        plot: {
          left: r.margin.left,
          right: r.width - r.margin.right,
          top: r.margin.top,
          bottom: r.height - r.margin.bottom,
        },
      });
    }

    renderA11yMirror(a11y, context);
    const contextSig = contextSignature(context);
    if (contextSig !== lastContextSig) {
      lastContextSig = contextSig;
      props.onChartDataProcessed?.(context);
    }

    // Plugin hook #2 - validate: merge core checks with plugin warnings. Validate the
    // USER's data (baseProps), not the plugin-synthesised points.
    if (baseProps.onDataWarning) {
      const warnings = [
        ...checkLineData(baseProps.dataSet, xAxisDataType, r.yAxisScale),
        ...collectValidate(pluginList, baseProps, pc),
      ];
      if (warnings.length > 0) baseProps.onDataWarning(warnings);
    }
  }

  render();
  const teardowns = setupPlugins(pluginList, pc);

  const instance: ChartInstance<LineChartProps> = {
    update(next: LineChartProps) {
      baseProps = next;
      render();
    },
    getContext() {
      return context;
    },
    use(plugin: MichiVzPlugin<LineChartProps>) {
      pluginList.push(plugin);
      const t = plugin.setup?.(pc);
      if (typeof t === "function") teardowns.push(t);
      render();
    },
    getTools(): AgentTool[] {
      return collectTools(pluginList, pc);
    },
    destroy() {
      pdDriver?.stop();
      pdDriver = null;
      cumTl.destroy();
      disposeStickyDismiss();
      for (const t of teardowns) t();
      host.removeEventListener("mousemove", onHostMove);
      host.removeEventListener("mouseleave", onHostLeave);
      host.removeEventListener("click", onHostClick);
      host.removeEventListener("mousedown", onZoomDown);
      window.removeEventListener("mouseup", onZoomUp);
      zoomResetBtn.removeEventListener("click", onZoomReset);
      removeZoomRect();
      canvas = null;
      webgpuCanvas = null;
      clear(host);
      host.classList.remove("michi-vz", "michi-vz-line-chart");
    },
  };
  // replay()/timeline() only exist when the chart opted into the respective
  // animation, so feature-off charts keep an unchanged instance surface.
  if (resolve(initial).progressiveDraw) {
    instance.replay = () => {
      pdDriver?.replay();
    };
  }
  if (resolve(initial).timeline) {
    instance.timeline = () => cumTl.controller();
  }
  if (resolve(initial).zoom) {
    instance.resetZoom = () => applyZoom(null);
    instance.setZoomDomain = (domain) => applyZoom(domain);
  }

  return attachDevtools(instance, host, "line-chart", () => baseProps);
}
