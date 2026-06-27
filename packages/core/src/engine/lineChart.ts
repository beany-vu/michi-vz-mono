// LineChart engine: imperative mount/update/getContext/destroy over the ported
// pure layer. Renders into LIGHT DOM. Mirrors mountGapChart's shape so wrappers
// stay uniform. Proves the remaining render styles: per-run solid/dashed lines
// (gap detection), single-point guide line, LTTB-decimated canvas, hover line.
import DOMPurify from "dompurify";
import { ensureStyles } from "../styles";
import { svgEl, htmlEl, clear } from "../dom";
import { defaultXAxisFormatter, defaultNumberFormatter } from "../i18n/formatters";
import { renderTitle, renderXAxisLinear, renderYAxisLinear, renderAnnotationsSvg } from "../render/svg";
import { processLineChartData } from "../lineChart/data";
import { buildLineColors } from "../lineChart/colors";
import { createLineScales } from "../lineChart/scales";
import { buildLineRenderModel } from "../lineChart/renderModel";
import { lttb } from "../lineChart/lttb";
import { projectX } from "../lineChart/geometry";
import { parseXValue } from "../lineChart/lineUtils";
import { renderLineSvg } from "../lineChart/renderSvg";
import { drawLineCanvas } from "../lineChart/renderCanvas";
import { buildLineContext } from "../context/buildLineContext";
import { renderA11yMirror } from "../context/a11yMirror";
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
  SinglePointLineConfig,
} from "../types";

const DEFAULT_MARGIN: Margin = { top: 50, right: 50, bottom: 50, left: 60 };

interface Resolved {
  width: number;
  height: number;
  margin: Margin;
  ticks: number;
  renderer: "svg" | "canvas";
  showDataPoints: boolean;
  enableMouseLine: boolean;
  enableTransitions: boolean;
  singlePointLine: SinglePointLineConfig | null;
}

function resolveSinglePointLine(v: LineChartProps["singlePointLine"]): SinglePointLineConfig | null {
  if (!v) return null;
  return v === true ? {} : v;
}

function resolve(p: LineChartProps): Resolved {
  return {
    width: p.width ?? 1000,
    height: p.height ?? 500,
    margin: p.margin ?? DEFAULT_MARGIN,
    ticks: p.ticks ?? 5,
    renderer: p.renderer ?? "svg",
    showDataPoints: p.showDataPoints ?? false,
    enableMouseLine: p.enableMouseLine ?? false,
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
  let mouseLine: SVGLineElement | null = null;

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
  let lastColorMappingSent: Record<string, string> = {};
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
    const rect = host.getBoundingClientRect();
    const svgRect = svg.getBoundingClientRect();
    const hit = findPoint(label, ev.clientX - svgRect.left);
    if (!hit) return;
    tooltip.style.left = `${ev.clientX - rect.left + 10}px`;
    tooltip.style.top = `${ev.clientY - rect.top - 10}px`;
    const item = baseProps.dataSet.find((s) => s.label === label);
    const htmlStr = baseProps.tooltipFormatter
      ? baseProps.tooltipFormatter(hit.d, hit.series, baseProps.dataSet)
      : `<strong>${label}</strong><br/>${String(hit.d.date)}: ${hit.d.value}`;
    void item;
    tooltip.innerHTML = DOMPurify.sanitize(htmlStr);
    tooltip.style.visibility = "visible";
  };
  const hideTooltip = (): void => {
    if (sticky) return;
    tooltip.style.visibility = "hidden";
  };

  const onHostMove = (ev: MouseEvent): void => {
    const r = resolve(baseProps);
    if (r.enableMouseLine && mouseLine) {
      const svgRect = svg.getBoundingClientRect();
      const x = ev.clientX - svgRect.left;
      if (x >= r.margin.left && x <= r.width - r.margin.right) {
        mouseLine.setAttribute("x1", String(x));
        mouseLine.setAttribute("x2", String(x));
        mouseLine.setAttribute("y1", String(r.margin.top));
        mouseLine.setAttribute("y2", String(r.height - r.margin.bottom));
        mouseLine.style.visibility = "visible";
      } else {
        mouseLine.style.visibility = "hidden";
      }
    }
    if (r.renderer !== "canvas" || sticky || hitData.length === 0) return;
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
  host.addEventListener("mousemove", onHostMove);
  tooltip.addEventListener("click", () => {
    sticky = false;
    tooltip.classList.remove("sticky");
    tooltip.style.visibility = "hidden";
  });

  function render(): void {
    // Plugin hook #1 — transformData: forecast/etc. append predicted points/series.
    // With no plugins this is an identity fold, so behaviour is unchanged.
    const props = applyTransformData(pluginList, baseProps, pc);
    const r = resolve(props);
    const xAxisDataType = props.xAxisDataType ?? "number";
    const highlightItems = props.highlightItems ?? [];

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

    // Canvas mode: LTTB-decimate each series to ~2 points/px before drawing.
    const drawDataSet: LineDataItem[] =
      r.renderer === "canvas"
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

    if (r.renderer !== "canvas") {
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

    // Mouse crosshair line (drawn above marks, below tooltip).
    if (r.enableMouseLine) {
      mouseLine = svgEl("line", { class: "mv-mouse-line" }) as SVGLineElement;
      mouseLine.setAttribute("stroke", "#999");
      mouseLine.setAttribute("stroke-width", "1");
      mouseLine.setAttribute("stroke-dasharray", "3,3");
      mouseLine.style.visibility = "hidden";
      mouseLine.style.pointerEvents = "none";
      svg.appendChild(mouseLine);
    } else {
      mouseLine = null;
    }

    // ----- Canvas layer -----
    if (r.renderer === "canvas") {
      if (!canvas) {
        canvas = htmlEl("canvas", { class: "line-chart-canvas" });
        canvas.style.position = "absolute";
        canvas.style.top = getComputedStyle(host).paddingTop;
        canvas.style.left = getComputedStyle(host).paddingLeft;
        canvas.style.pointerEvents = "none";
        host.insertBefore(canvas, tooltip);
      }
      drawLineCanvas(canvas, svg, model, {
        width: r.width,
        height: r.height,
        margin: r.margin,
        showDataPoints: r.showDataPoints,
        singlePointLine: r.singlePointLine,
      });
    } else if (canvas) {
      canvas.remove();
      canvas = null;
    }

    // ----- Context (renderer-agnostic) + a11y + warnings -----
    context = buildLineContext({
      title: props.title,
      renderer: r.renderer,
      xAxisDataType,
      xAxisDomain,
      yAxisDomain,
      processedDataSet,
      colorsMapping: colors.generatedColorsMapping,
    });
    // Plugin hook #3 — enrichContext: rewrite summary BEFORE the a11y mirror + the
    // dataprocessed event, so narration flows to both for free.
    context = applyEnrichContext(pluginList, context, pc);

    // Plugin hook #4 — annotate: draw threshold/goal lines + "fall point" markers on
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
    props.onChartDataProcessed?.(context);

    // Plugin hook #2 — validate: merge core checks with plugin warnings. Validate the
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

  return {
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
      for (const t of teardowns) t();
      host.removeEventListener("mousemove", onHostMove);
      clear(host);
      host.classList.remove("michi-vz", "michi-vz-line-chart");
    },
  };
}
