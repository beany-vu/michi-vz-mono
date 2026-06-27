// FanChart engine: the canonical forecast visualization. A COMPOSITION of the
// existing Line + Range primitives (no bespoke geometry): nested confidence bands
// (RangeChart area generator, graduated opacity) drawn underneath a Line whose
// history is solid and whose forecast median is dashed (certainty:false). Shares one
// set of scales over the union domain. Renders in BOTH svg and canvas modes from one
// model; canvas hover is hit-tested in the engine. LIGHT DOM. Same prop surface as Line.
import DOMPurify from "dompurify";
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
  renderer: "svg" | "canvas";
  fillOpacity: number;
  showDataPoints: boolean;
  enableTransitions: boolean;
}

function resolve(p: FanChartProps): Resolved {
  return {
    width: p.width ?? 1000,
    height: p.height ?? 500,
    margin: p.margin ?? DEFAULT_MARGIN,
    ticks: p.ticks ?? 5,
    renderer: p.renderer ?? "svg",
    fillOpacity: p.fillOpacity ?? 0.18,
    showDataPoints: p.showDataPoints ?? false,
    enableTransitions: p.enableTransitions ?? true,
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

  host.appendChild(svg);
  host.appendChild(tooltip);
  host.appendChild(a11y);

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
    tooltip.innerHTML = DOMPurify.sanitize(
      `<strong>${label}</strong>` + (last ? `<br/>${String(last.date)}: ${last.value}` : "")
    );
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
    // Plugin hook #1 — transformData.
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
        bandPaths.push({ label: it.label, safe, color, areaPath: d, opacity: dimmed ? base * 0.3 : base });
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

    if (r.renderer !== "canvas") {
      // Bands underneath, then the line on top — both on the SVG layer.
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
      svg.appendChild(bandsLayer);
      renderLineSvg(
        svg,
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
      if (canvas) {
        canvas.remove();
        canvas = null;
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

  return {
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
      for (const t of teardowns) t();
      host.removeEventListener("mousemove", onHostMove);
      clear(host);
      host.classList.remove("michi-vz", "michi-vz-fan-chart");
    },
  };
}
