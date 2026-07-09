// FanChart engine: the canonical forecast visualization. A COMPOSITION of the
// existing Line + Range primitives (no bespoke geometry): nested confidence bands
// (RangeChart area generator, graduated opacity) drawn underneath a Line whose
// history is solid and whose forecast median is dashed (certainty:false). Shares one
// set of scales over the union domain. Renders in BOTH svg and canvas modes from one
// model; canvas hover is hit-tested in the engine. LIGHT DOM. Same prop surface as Line.
import DOMPurify from "dompurify";
import { wireStickyDismiss } from "../render/stickyDismiss";
import { attachDevtools } from "../devtools/hook";
import { ensureStyles } from "../styles";
import { svgEl, htmlEl, clear } from "../dom";
import { sanitizeForClassName } from "../math/sanitize";
import { defaultXAxisFormatter, defaultNumberFormatter } from "../i18n/formatters";
import { renderTitle, renderXAxisLinear, renderYAxisLinear, renderAnnotationsSvg } from "../render/svg";
import { createLineScales } from "../lineChart/scales";
import { processLineChartData } from "../lineChart/data";
import { buildLineColors } from "../lineChart/colors";
import { buildLineRenderModel } from "../lineChart/renderModel";
import { renderLineSvg } from "../lineChart/renderSvg";
import { projectX } from "../lineChart/geometry";
import { parseXValue } from "../lineChart/lineUtils";
import { makeRangeAreaGenerator } from "../rangeChart/geometry";
import { drawFanCanvas, type FanBandPath } from "../fanChart/renderCanvas";
import { drawFanWebgpu } from "../fanChart/renderWebgpu";
import { resolveRenderer } from "../webgpu/capability";
import { resolveReveal, createEngineReveal, type ResolvedReveal } from "../animation/reveal";
import { resolveTimeline, type ResolvedTimeline } from "../animation/chartTimeline";
import { createCumulativeTimeline, type CumulativePeriod } from "../animation/cumulativeTimeline";
import { buildFanContext } from "../context/buildFanContext";
import { renderA11yMirror } from "../context/a11yMirror";
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
  DataWarning,
  FanChartProps,
  FanDataItem,
  LineDataItem,
  Margin,
  MountOptions,
} from "../types";

const DEFAULT_MARGIN: Margin = { top: 50, right: 50, bottom: 50, left: 60 };

interface Resolved {
  width: number;
  height: number;
  margin: Margin;
  ticks: number;
  renderer: "svg" | "canvas" | "webgpu";
  fillOpacity: number;
  showDataPoints: boolean;
  enableTransitions: boolean;
  progressiveDraw: ResolvedReveal | null;
  timeline: ResolvedTimeline | null;
}

// canvas + webgpu both paint into a <canvas> layer (no per-mark DOM), so they share
// the host-level hit-test / click-to-pin interaction path. svg does not.
const isPainted = (rr: Resolved["renderer"]): boolean => rr === "canvas" || rr === "webgpu";

function resolve(p: FanChartProps): Resolved {
  return {
    width: p.width ?? 1000,
    height: p.height ?? 500,
    margin: p.margin ?? DEFAULT_MARGIN,
    ticks: p.ticks ?? 5,
    // EFFECTIVE renderer: an opt-in "webgpu" request downgrades to "canvas" when
    // WebGPU is unavailable, so everything downstream (incl. getContext().renderer)
    // reflects what actually painted.
    renderer: resolveRenderer(p.renderer),
    fillOpacity: p.fillOpacity ?? 0.18,
    showDataPoints: p.showDataPoints ?? false,
    enableTransitions: p.enableTransitions ?? true,
    progressiveDraw: resolveReveal(p.progressiveDraw),
    timeline: resolveTimeline(p.timeline),
  };
}

function checkData(dataSet: FanDataItem[]): DataWarning[] {
  const warnings: DataWarning[] = [];
  if (!dataSet || dataSet.length === 0) {
    warnings.push({ type: "empty-dataset", message: "FanChart received an empty dataSet." });
    return warnings;
  }
  for (const it of dataSet) {
    for (const d of it.series) {
      if (!Number.isFinite(d.value)) {
        warnings.push({
          type: "non-finite-value",
          message: `Fan series "${it.label}" has a non-finite value at ${String(d.date)}.`,
          label: it.label,
        });
      }
    }
  }
  return warnings;
}

export function mountFanChart(
  host: HTMLElement,
  initial: FanChartProps,
  opts?: MountOptions<FanChartProps>
): ChartInstance<FanChartProps> {
  ensureStyles();
  host.classList.add("michi-vz", "michi-vz-fan-chart");

  const svg = svgEl("svg");
  const tooltip = htmlEl("div", { class: "tooltip" });
  tooltip.style.visibility = "hidden";
  const a11y = htmlEl("div", { class: "mv-a11y" });
  a11y.setAttribute("role", "img");
  let canvas: HTMLCanvasElement | null = null;
  let webgpuCanvas: HTMLCanvasElement | null = null;

  host.appendChild(svg);
  host.appendChild(tooltip);
  host.appendChild(a11y);

  // Opt-in progressive-draw reveal (generic engine helper: SVG clip / canvas redraw).
  const engineRv = createEngineReveal({ ticker: opts?.ticker, motion: opts?.motion });
  // Cumulative timeline (opt-in play-through-years): wins over progressiveDraw
  // when both are configured.
  const cumTl = createCumulativeTimeline({ ticker: opts?.ticker, motion: opts?.motion });

  let baseProps: FanChartProps = initial;
  let context: ChartContext | null = null;
  const pluginList: MichiVzPlugin<FanChartProps>[] = [...(opts?.plugins ?? [])];
  const pc: PluginContext<FanChartProps> = {
    chartType: "fan-chart",
    getProps: () => baseProps,
    getContext: () => context,
    setProps: (patch) => {
      baseProps = { ...baseProps, ...patch };
      render();
    },
  };
  let sticky = false;
  let lastColorMappingSent: Record<string, string> = {};
  // Per-label pixel points for canvas-mode hit-testing (no per-mark DOM there).
  let hitData: Array<{ label: string; points: Array<{ x: number; y: number; d: DataPoint }> }> = [];

  const showTooltip = (label: string, ev: MouseEvent): void => {
    const rect = host.getBoundingClientRect();
    tooltip.style.left = `${ev.clientX - rect.left + 10}px`;
    tooltip.style.top = `${ev.clientY - rect.top - 10}px`;
    const item = baseProps.dataSet.find((it) => it.label === label);
    const last = item && item.series.length ? item.series[item.series.length - 1] : null;
    const htmlStr =
      baseProps.tooltipFormatter && item
        ? baseProps.tooltipFormatter(item, last)
        : `<strong>${label}</strong>` + (last ? `<br/>${String(last.date)}: ${last.value}` : "");
    tooltip.innerHTML = DOMPurify.sanitize(htmlStr);
    tooltip.style.visibility = "visible";
  };
  const hideTooltip = (): void => {
    if (sticky) return;
    tooltip.style.visibility = "hidden";
  };

  // Canvas-mode hover: find the nearest series and highlight + tooltip it. Mirrors
  // lineChart's handler so canvas keeps the SAME interaction as SVG.
  const onHostMove = (ev: MouseEvent): void => {
    const r = resolve(baseProps);
    if (!isPainted(r.renderer) || sticky || hitData.length === 0) return;
    const svgRect = svg.getBoundingClientRect();
    const x = ev.clientX - svgRect.left;
    const y = ev.clientY - svgRect.top;
    let hitLabel: string | null = null;
    let bestDy = 24;
    for (const entry of hitData) {
      let nearest = entry.points[0];
      for (const p of entry.points) if (Math.abs(p.x - x) < Math.abs(nearest.x - x)) nearest = p;
      if (nearest) {
        const dy = Math.abs(nearest.y - y);
        if (dy < bestDy) {
          bestDy = dy;
          hitLabel = entry.label;
        }
      }
    }
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
  host.addEventListener("mousemove", onHostMove);
  host.addEventListener("click", onHostClick);
  const disposeStickyDismiss = wireStickyDismiss(host, tooltip, {
    isSticky: () => sticky,
    unpin: () => {
      sticky = false;
    },
  });

  function render(): void {
    // Plugin hook #1 - transformData.
    const props = applyTransformData(pluginList, baseProps, pc);
    const r = resolve(props);
    const xAxisDataType = props.xAxisDataType ?? "number";
    const disabled = new Set(props.disabledItems ?? []);
    const highlightItems = props.highlightItems ?? [];
    const highlightSet = new Set(highlightItems);
    const anyHighlight = highlightSet.size > 0;

    svg.setAttribute("width", String(r.width));
    svg.setAttribute("height", String(r.height));
    svg.style.position = "relative";

    // The line layer (history + dashed median) via the Line pure layer.
    const lineItems: LineDataItem[] = props.dataSet.map((d) => ({
      label: d.label,
      color: d.color,
      series: d.series,
    }));
    const { processedDataSet, xAxisDomain, yAxisDomain: lineY } = processLineChartData(lineItems, {
      disabledItems: props.disabledItems,
      xAxisDataType,
    });

    // Widen the y-domain to include the bands (unless the consumer fixed it).
    let yMin = lineY[0];
    let yMax = lineY[1];
    for (const it of props.dataSet) {
      if (disabled.has(it.label)) continue;
      for (const band of it.bands) {
        for (const p of band.series) {
          if (Number.isFinite(p.valueMin)) yMin = Math.min(yMin, p.valueMin);
          if (Number.isFinite(p.valueMax)) yMax = Math.max(yMax, p.valueMax);
        }
      }
    }
    const yAxisDomain: [number, number] = props.yAxisDomain ?? [yMin, yMax];

    const colors = buildLineColors(
      lineItems,
      props.colors,
      props.colorsMapping,
      props.skipColorMappingDispatch ?? false
    );
    if (!props.skipColorMappingDispatch && props.onColorMappingGenerated) {
      const next = colors.generatedColorsMapping;
      if (JSON.stringify(next) !== JSON.stringify(lastColorMappingSent)) {
        lastColorMappingSent = { ...next };
        props.onColorMappingGenerated(next);
      }
    }

    const scales = createLineScales(xAxisDomain, yAxisDomain, r.width, r.height, r.margin, xAxisDataType);
    const xFormat = props.xAxisFormat ?? defaultXAxisFormatter(xAxisDataType, props.locale);
    const yFormat = props.yAxisFormat ?? defaultNumberFormatter(props.locale);

    // ----- ONE render model: band area paths (graduated opacity) + the line model -----
    const areaGen = makeRangeAreaGenerator(scales.xScale, scales.yScale, xAxisDataType, props.curve);
    const bandPaths: FanBandPath[] = [];
    for (const it of props.dataSet) {
      if (disabled.has(it.label)) continue;
      const safe = sanitizeForClassName(it.label);
      const color = colors.getColor(it.label);
      const dimmed = anyHighlight && !highlightSet.has(it.label);
      const sorted = [...it.bands].sort((a, b) => b.level - a.level); // widest first
      const n = sorted.length;
      sorted.forEach((band, j) => {
        const d = areaGen(band.series);
        if (!d) return;
        // narrower bands (later j) get more opaque so the fan reads as nested.
        const base = r.fillOpacity * ((j + 1) / n);
        // Pixel-space top/bottom polylines for webgpu's pushBandStrip (areaPath
        // alone is an SVG/canvas path string, not usable as GPU geometry).
        const bandX = (p: (typeof band.series)[number]) =>
          (scales.xScale as (x: number | Date) => number)(parseXValue(p.date, xAxisDataType));
        const top: Array<[number, number]> = band.series.map((p) => [bandX(p), scales.yScale(p.valueMax)]);
        const bottom: Array<[number, number]> = band.series.map((p) => [bandX(p), scales.yScale(p.valueMin)]);
        bandPaths.push({
          label: it.label,
          safe,
          color,
          areaPath: d,
          opacity: dimmed ? base * 0.3 : base,
          top,
          bottom,
        });
      });
    }
    const lineModel = buildLineRenderModel(processedDataSet, scales, colors, {
      xAxisDataType,
      curve: props.curve,
      highlightItems,
    });

    // hit-test data (canvas hover) from the full processed line points.
    hitData = processedDataSet.map((item) => ({
      label: item.label,
      points: item.series.map((d) => ({
        x: projectX(d, scales.xScale, xAxisDataType),
        y: scales.yScale(d.value),
        d,
      })),
    }));

    // ----- SVG layer (axes + title always) -----
    clear(svg);
    renderTitle(svg, { text: props.title, x: r.width / 2, y: r.margin.top / 2 });
    renderXAxisLinear(svg, scales.xScale, {
      width: r.width,
      height: r.height,
      margin: r.margin,
      xAxisDataType,
      format: (v) => xFormat(v),
      ticks: r.ticks,
      tickValues: props.tickValues,
      enableExplicitTickValues: true,
    });
    renderYAxisLinear(svg, scales.yScale, {
      width: r.width,
      height: r.height,
      margin: r.margin,
      format: (v) => yFormat(v),
      ticks: r.ticks,
    });

    if (r.renderer === "svg") {
      // Single wrapping group for progressiveDraw's clip (bands + line together,
      // never the axes/title). Bands underneath, then the line on top.
      const marksRoot = svgEl("g", { class: "fan-chart-content" });
      const bandsLayer = svgEl("g", { class: "mv-fan-bands" });
      for (const b of bandPaths) {
        bandsLayer.appendChild(
          svgEl("path", {
            class: "mv-fan-band area",
            "data-label": b.label,
            "data-label-safe": b.safe,
            d: b.areaPath,
            fill: b.color,
            stroke: "none",
            opacity: b.opacity,
          })
        );
      }
      marksRoot.appendChild(bandsLayer);
      renderLineSvg(
        marksRoot,
        lineModel,
        {
          margin: r.margin,
          width: r.width,
          showDataPoints: r.showDataPoints,
          singlePointLine: null,
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
            sticky = true;
            tooltip.classList.add("sticky");
            showTooltip(label, ev);
          },
        }
      );
      svg.appendChild(marksRoot);
      if (canvas) {
        canvas.remove();
        canvas = null;
      }
      if (webgpuCanvas) {
        webgpuCanvas.remove();
        webgpuCanvas = null;
      }
    } else if (r.renderer === "webgpu") {
      // ----- WebGPU layer: try GPU, fall back to the canvas-2D stopgap -----
      if (!webgpuCanvas) {
        webgpuCanvas = htmlEl("canvas", { class: "fanChart-webgpu-canvas" });
        webgpuCanvas.style.position = "absolute";
        webgpuCanvas.style.top = getComputedStyle(host).paddingTop;
        webgpuCanvas.style.left = getComputedStyle(host).paddingLeft;
        webgpuCanvas.style.pointerEvents = "none";
        host.insertBefore(webgpuCanvas, tooltip);
      }
      const painted = drawFanWebgpu(
        webgpuCanvas,
        svg,
        { bands: bandPaths, lineModel },
        {
          width: r.width,
          height: r.height,
          // Re-render once the async GPU device resolves, upgrading canvas → GPU.
          onReady: render,
        }
      );
      if (painted) {
        // GPU painted - drop any first-frame 2D fallback canvas.
        if (canvas) {
          canvas.remove();
          canvas = null;
        }
      } else {
        // Device not ready / unavailable (incl. jsdom): paint the canvas-2D stopgap
        // so the chart is never blank; the onReady re-render swaps in the GPU layer.
        if (!canvas) {
          canvas = htmlEl("canvas", { class: "fan-chart-canvas" });
          canvas.style.position = "absolute";
          canvas.style.top = getComputedStyle(host).paddingTop;
          canvas.style.left = getComputedStyle(host).paddingLeft;
          canvas.style.pointerEvents = "none";
          host.insertBefore(canvas, tooltip);
        }
        drawFanCanvas(canvas, svg, { bands: bandPaths, lineModel }, { width: r.width, height: r.height });
      }
    } else {
      // ----- Canvas layer (bands + line drawn from the same model) -----
      if (!canvas) {
        canvas = htmlEl("canvas", { class: "fan-chart-canvas" });
        canvas.style.position = "absolute";
        canvas.style.top = getComputedStyle(host).paddingTop;
        canvas.style.left = getComputedStyle(host).paddingLeft;
        canvas.style.pointerEvents = "none";
        host.insertBefore(canvas, tooltip);
      }
      drawFanCanvas(canvas, svg, { bands: bandPaths, lineModel }, { width: r.width, height: r.height });
      if (webgpuCanvas) {
        webgpuCanvas.remove();
        webgpuCanvas = null;
      }
    }

    // ----- Progressive draw (opt-in reveal animation) -----
    // SVG mode: clip g.fan-chart-content (bands + line together); canvas mode:
    // redraw under an equivalent ctx.clip. WebGPU paints the full frame instantly.
    // Timeline wins over progressiveDraw when both are configured.
    const canvasLayer = r.renderer === "canvas" ? canvas : null;
    engineRv.afterRender(r.timeline ? null : r.progressiveDraw, {
      renderer: r.renderer,
      svg,
      marksRoot: svg.querySelector("g.fan-chart-content"),
      height: r.height,
      startPx: r.margin.left,
      endPx: r.width,
      canvasRedraw: canvasLayer
        ? (x) =>
            drawFanCanvas(
              canvasLayer,
              svg,
              { bands: bandPaths, lineModel },
              { width: r.width, height: r.height, revealX: x }
            )
        : undefined,
    });

    // ----- Cumulative timeline (opt-in play-through-years) -----
    // The bands + line draw UP TO the active year; play/scrub sweeps the same
    // reveal clip progressiveDraw uses. Data + getContext() stay full (visual only).
    if (r.timeline && r.renderer !== "webgpu") {
      const periodMap = new Map<string, CumulativePeriod>();
      for (const entry of hitData) {
        for (const pt of entry.points) {
          const key = String(pt.d.date);
          const existing = periodMap.get(key);
          if (!existing || pt.x > existing.px) periodMap.set(key, { period: pt.d.date, px: pt.x });
        }
      }
      const periods = Array.from(periodMap.values()).sort((a, b) => a.px - b.px);
      cumTl.afterRender(r.timeline, {
        host,
        renderer: r.renderer,
        svg,
        marksRoot: svg.querySelector("g.fan-chart-content"),
        height: r.height,
        periods,
        startPx: r.margin.left,
        endPx: r.width,
        canvasRedraw: canvasLayer
          ? (x) =>
              drawFanCanvas(
                canvasLayer,
                svg,
                { bands: bandPaths, lineModel },
                { width: r.width, height: r.height, revealX: x }
              )
          : undefined,
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

    // ----- Context + plugin hooks + a11y + warnings -----
    context = buildFanContext({
      title: props.title,
      renderer: r.renderer,
      xAxisDataType,
      xAxisDomain,
      yAxisDomain,
      dataSet: props.dataSet,
      colorsMapping: colors.generatedColorsMapping,
    });
    context = applyEnrichContext(pluginList, context, pc);

    const annotations = collectAnnotations(pluginList, context, pc);

    // Forecast-region highlight: shade the part of the x-range that is NOT actual
    // data (from the last solid `certainty:true` point to the end). This is distinct
    // from highlightItems (which highlights a series). Opt out with forecastZone:false.
    if (props.forecastZone !== false) {
      let boundary = -Infinity;
      let end = -Infinity;
      for (const it of props.dataSet) {
        if (disabled.has(it.label)) continue;
        for (const d of it.series) {
          const xn = typeof d.date === "number" ? d.date : Number(d.date);
          if (!Number.isFinite(xn)) continue;
          if (d.certainty !== false) boundary = Math.max(boundary, xn);
          end = Math.max(end, xn);
        }
      }
      if (Number.isFinite(boundary) && end > boundary) {
        annotations.push({ type: "xband", at: boundary, at2: end, label: "forecast", color: "#64748b", opacity: 0.1 });
      }
    }

    if (annotations.length > 0) {
      renderAnnotationsSvg(svg, annotations, {
        yPx: (v) => scales.yScale(v),
        xPx: (at) => (scales.xScale as (x: number | Date) => number)(parseXValue(at, xAxisDataType)),
        plot: {
          left: r.margin.left,
          right: r.width - r.margin.right,
          top: r.margin.top,
          bottom: r.height - r.margin.bottom,
        },
      });
    }

    renderA11yMirror(a11y, context);
    props.onChartDataProcessed?.(context);

    if (baseProps.onDataWarning) {
      const warnings = [...checkData(baseProps.dataSet), ...collectValidate(pluginList, baseProps, pc)];
      if (warnings.length > 0) baseProps.onDataWarning(warnings);
    }
  }

  render();
  const teardowns = setupPlugins(pluginList, pc);

  const instance: ChartInstance<FanChartProps> = {
    update(next: FanChartProps) {
      baseProps = next;
      render();
    },
    getContext() {
      return context;
    },
    use(plugin: MichiVzPlugin<FanChartProps>) {
      pluginList.push(plugin);
      const t = plugin.setup?.(pc);
      if (typeof t === "function") teardowns.push(t);
      render();
    },
    getTools(): AgentTool[] {
      return collectTools(pluginList, pc);
    },
    destroy() {
      engineRv.stop();
      cumTl.destroy();
      disposeStickyDismiss();
      for (const t of teardowns) t();
      host.removeEventListener("mousemove", onHostMove);
      host.removeEventListener("click", onHostClick);
      canvas = null;
      webgpuCanvas = null;
      clear(host);
      host.classList.remove("michi-vz", "michi-vz-fan-chart");
    },
  };
  // replay()/timeline() only exist when the chart opted into the respective
  // animation, so feature-off charts keep an unchanged instance surface.
  if (resolve(initial).progressiveDraw) {
    instance.replay = () => engineRv.replay();
  }
  if (resolve(initial).timeline) {
    instance.timeline = () => cumTl.controller();
  }

  return attachDevtools(instance, host, "fan-chart", () => baseProps);
}
