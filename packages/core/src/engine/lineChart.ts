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
import { processLineChartData } from "../lineChart/data";
import { buildLineColors } from "../lineChart/colors";
import { createLineScales } from "../lineChart/scales";
import { buildLineRenderModel } from "../lineChart/renderModel";
import { lttb } from "../lineChart/lttb";
import { projectX } from "../lineChart/geometry";
import { parseXValue, enumeratePeriods, periodValue } from "../lineChart/lineUtils";
import { renderLineSvg } from "../lineChart/renderSvg";
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
}

function resolveSinglePointLine(v: LineChartProps["singlePointLine"]): SinglePointLineConfig | null {
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
  };
}

export function mountLineChart(
  host: HTMLElement,
  initial: LineChartProps,
  opts?: MountOptions<LineChartProps>
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
    const item = baseProps.dataSet.find((s) => s.label === label);
    const htmlStr = baseProps.tooltipFormatter
      ? baseProps.tooltipFormatter(hit.d, hit.series, baseProps.dataSet)
      : `<strong>${label}</strong><br/>${String(hit.d.date)}: ${hit.d.value}`;
    void item;
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

  const onHostMove = (ev: MouseEvent): void => {
    const r = resolve(baseProps);
    if (r.mouseLine && mouseLine) {
      const svgRect = svg.getBoundingClientRect();
      const x = ev.clientX - svgRect.left;
      // Legacy parity: snap to the nearest data point x (the old LineChartMouseLine
      // bisector feel) unless the config opts out with snap:false. hitData covers svg
      // AND canvas modes; empty hitData (e.g. every series disabled) = nothing to
      // snap to, keep the line hidden rather than show it at a stale x.
      let lineX: number | null = null;
      if (x >= r.margin.left && x <= r.width - r.margin.right) {
        if (r.mouseLine.snap === false) {
          lineX = x;
        } else {
          for (const entry of hitData)
            for (const pt of entry.points)
              if (lineX === null || Math.abs(pt.x - x) < Math.abs(lineX - x)) lineX = pt.x;
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
  const disposeStickyDismiss = wireStickyDismiss(host, tooltip, {
    isSticky: () => sticky,
    unpin: () => {
      sticky = false;
    },
  });

  function render(): void {
    // Plugin hook #1 - transformData: forecast/etc. append predicted points/series.
    // With no plugins this is an identity fold, so behaviour is unchanged.
    const props = applyTransformData(pluginList, baseProps, pc);
    const r = resolve(props);
    const xAxisDataType = props.xAxisDataType ?? "number";
    const highlightItems = props.highlightItems ?? [];
    // data-mv-state + font var + default loading/no-data overlays (shared chrome).
    const dataState = applyChartChrome(host, props, props.dataSet, chrome);

    svg.setAttribute("width", String(r.width));
    svg.setAttribute("height", String(r.height));
    svg.style.position = "relative";

    const { processedDataSet, xAxisDomain, yAxisDomain } = processLineChartData(props.dataSet, {
      disabledItems: props.disabledItems,
      filter: props.filter,
      detectGaps: props.detectGaps,
      expectedStep: props.expectedStep,
      xAxisDataType,
      yAxisDomain: props.yAxisDomain,
    });

    const colors = buildLineColors(
      props.dataSet,
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

    const scales = createLineScales(
      xAxisDomain,
      yAxisDomain,
      r.width,
      r.height,
      r.margin,
      xAxisDataType
    );

    // Build hit-test data from the FULL (undecimated) processed points.
    hitData = processedDataSet.map((item) => ({
      label: item.label,
      points: item.series.map((d) => ({
        x: projectX(d, scales.xScale, xAxisDataType),
        y: scales.yScale(d.value),
        d,
      })),
    }));

    // Canvas/webgpu mode: LTTB-decimate each series to ~2 points/px before drawing.
    const drawDataSet: LineDataItem[] =
      isPainted(r.renderer)
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
    // No-data: render only the title (axes + marks hidden, matching legacy
    // `!displayIsNodata && filteredDataSet.length > 0` gating); the overlay covers it.
    if (dataState !== "nodata") {
      // Legacy parity (mirrors AreaChart): feed every DATA period as a candidate tick
      // so the axis ALWAYS keeps the first + last period (raw `scaleTime().ticks()`
      // snaps to "nice" calendar boundaries and silently drops non-round endpoints).
      // maxTicks thins a dense series (e.g. 48 months) to ~3-5 keeping both ends;
      // autoRotate tilts -45deg only when the kept labels still collide.
      const periodTicks =
        xAxisDataType === "date_annual" || xAxisDataType === "date_monthly"
          ? Array.from(
              new Set(props.dataSet.flatMap((row) => row.series.map((p) => String(p.date))))
            )
              .map((d) => parseXValue(d, xAxisDataType))
              .sort(
                (a, b) =>
                  (a instanceof Date ? a.valueOf() : a) - (b instanceof Date ? b.valueOf() : b)
              )
          : undefined;
      const plotW = r.width - r.margin.left - r.margin.right;
      const xMaxTicks = plotW < 480 ? 3 : 5;
      // Opt-in continuous timeline: draw a tick for EVERY period in range (not just
      // periods present in data); periods with no non-null value are marked faded and
      // get a "no data" hover tooltip. Explicit `tickValues` still wins over the fill.
      let candidateTicks = props.tickValues ?? periodTicks;
      let noDataValues: Set<number> | undefined;
      const isDateAxis = xAxisDataType === "date_annual" || xAxisDataType === "date_monthly";
      if (props.fillPeriodTicks && !props.tickValues && isDateAxis) {
        const [dMin, dMax] = scales.xScale.domain() as [Date, Date];
        const allPeriods = enumeratePeriods(dMin, dMax, xAxisDataType);
        candidateTicks = allPeriods;
        const present = new Set<number>();
        for (const row of props.dataSet) {
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
        { USE_PROFILES: { svg: true } }
      );
      const tmp = svgEl("g");
      tmp.innerHTML = clean;
      const inner = tmp.querySelector("svg");
      if (inner) {
        while (inner.firstChild) childG.appendChild(inner.firstChild);
      }
      svg.appendChild(childG);
    }

    if (r.renderer === "svg" && dataState !== "nodata") {
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
            sticky = true;
            tooltip.classList.add("sticky");
            showTooltip(label, ev);
          },
        }
      );
    }

    // Mouse crosshair line (drawn above marks, below tooltip). Styling lives in
    // CORE_CSS (.mv-mouse-line: solid legacy grey); a config object overrides
    // per-instance by setting the --michi-vz-crosshair* vars the rule consumes.
    // Inline stroke ATTRIBUTES would lose to the class rule (y-band gridline
    // gotcha), so no presentation attrs here.
    if (r.mouseLine && dataState !== "nodata") {
      mouseLine = svgEl("line", { class: "mv-mouse-line" }) as SVGLineElement;
      const cfg = r.mouseLine;
      if (cfg.stroke !== undefined)
        mouseLine.style.setProperty("--michi-vz-crosshair", cfg.stroke);
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

    if (r.renderer === "webgpu" && dataState !== "nodata") {
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
        });
      }
    } else if (r.renderer === "canvas" && dataState !== "nodata") {
      removeWebgpuCanvas();
      if (!canvas) canvas = makeLayerCanvas("line-chart-canvas");
      drawLineCanvas(canvas, svg, model, {
        width: r.width,
        height: r.height,
        margin: r.margin,
        showDataPoints: r.showDataPoints,
        singlePointLine: r.singlePointLine,
      });
    } else {
      removeCanvas();
      removeWebgpuCanvas();
    }

    // ----- Legend rows (flat colour-contract payload) -----
    // Mirrors legacy useLineChartMetadataExpose: with a filter, the legend is the
    // visible/filtered set (= processedDataSet); without one, every series with
    // data (disabled included, flagged) so a consumer legend can re-enable them.
    const skipDispatch = props.skipColorMappingDispatch ?? false;
    const legendLabels = props.filter
      ? processedDataSet.map((d) => d.label)
      : props.dataSet.filter((d) => (d.series?.length ?? 0) > 0).map((d) => d.label);
    const legendData = buildLegendData({
      labels: legendLabels,
      colorsMapping: skipDispatch ? props.colorsMapping ?? {} : colors.generatedColorsMapping,
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
      colorsMapping: colors.generatedColorsMapping,
      legendData,
      disabledItems: props.disabledItems,
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
    const contextSig = contextSignature(context);
    if (contextSig !== lastContextSig) {
      lastContextSig = contextSig;
      props.onChartDataProcessed?.(context);
    }

    // Plugin hook #2 - validate: merge core checks with plugin warnings. Validate the
    // USER's data (baseProps), not the plugin-synthesised points.
    if (baseProps.onDataWarning) {
      const warnings = [
        ...checkLineData(baseProps.dataSet, xAxisDataType),
        ...collectValidate(pluginList, baseProps, pc),
      ];
      if (warnings.length > 0) baseProps.onDataWarning(warnings);
    }
  }

  render();
  const teardowns = setupPlugins(pluginList, pc);

  const instance = {
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
      disposeStickyDismiss();
      for (const t of teardowns) t();
      host.removeEventListener("mousemove", onHostMove);
      host.removeEventListener("mouseleave", onHostLeave);
      host.removeEventListener("click", onHostClick);
      canvas = null;
      webgpuCanvas = null;
      clear(host);
      host.classList.remove("michi-vz", "michi-vz-line-chart");
    },
  };

  return attachDevtools(instance, host, "line-chart", () => baseProps);
}
