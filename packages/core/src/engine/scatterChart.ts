// ScatterPlot engine: mount/update/getContext/destroy. Point cloud in LIGHT DOM;
// SVG marks (per-mark hover) or canvas (host-level hit-test). Title + shared
// linear x/y axes.
import DOMPurify from "dompurify";
import { attachDevtools } from "../devtools/hook";
import { ensureStyles } from "../styles";
import { svgEl, htmlEl, clear } from "../dom";
import { defaultXAxisFormatter, defaultNumberFormatter } from "../i18n/formatters";
import { renderTitle, renderXAxisLinear, renderXAxisBand, renderYAxisLinear } from "../render/svg";
import { renderDScaleLegend } from "../render/svg/dScaleLegend";
import { drawCrosshair, clearCrosshair } from "../render/svg/scatterCrosshair";
import type { ScaleBand, ScaleLinear, ScaleTime } from "d3-scale";
import { processScatterData } from "../scatterChart/data";
import { buildScatterColors } from "../scatterChart/colors";
import { createScatterScales } from "../scatterChart/scales";
import { buildScatterRenderModel } from "../scatterChart/renderModel";
import type { ScatterPointModel } from "../scatterChart/renderModel";
import { renderScatterSvg } from "../scatterChart/renderSvg";
import { drawScatterCanvas } from "../scatterChart/renderCanvas";
import { buildScatterContext } from "../context/buildScatterContext";
import { renderA11yMirror } from "../context/a11yMirror";
import { checkScatterData } from "../validate/scatterWarnings";
import {
  applyTransformData,
  applyEnrichContext,
  collectValidate,
  collectTools,
  setupPlugins,
} from "../plugins/runner";
import type { AgentTool, MichiVzPlugin, PluginContext } from "../plugins/types";
import type {
  ChartContext,
  ChartInstance,
  Margin,
  MountOptions,
  ScatterChartProps,
  ScatterDataPoint,
} from "../types";

const DEFAULT_MARGIN: Margin = { top: 50, right: 50, bottom: 50, left: 60 };

interface Resolved {
  width: number;
  height: number;
  margin: Margin;
  ticks: number;
  yTicks: number | undefined;
  showGridX: boolean;
  showGridY: boolean;
  renderer: "svg" | "canvas";
  enableTransitions: boolean;
  sizeRange: [number, number];
  showCrosshair: boolean;
  crosshairLabels: boolean;
  crosshairDashed: boolean;
  crosshairSpan: "full" | "half";
  crosshairPlacement: "auto" | "fixed";
}

function resolveGrid(g: ScatterChartProps["showGrid"], axis: "x" | "y"): boolean {
  if (g === undefined) return true;
  if (typeof g === "boolean") return g;
  return g[axis] ?? true;
}

function resolve(p: ScatterChartProps): Resolved {
  return {
    width: p.width ?? 900,
    height: p.height ?? 480,
    margin: p.margin ?? DEFAULT_MARGIN,
    ticks: p.ticks ?? 5,
    yTicks: p.yTicksQty,
    showGridX: resolveGrid(p.showGrid, "x"),
    showGridY: resolveGrid(p.showGrid, "y"),
    renderer: p.renderer ?? "svg",
    enableTransitions: p.enableTransitions ?? true,
    sizeRange: p.sizeRange ?? [4, 20],
    showCrosshair: p.showCrosshair ?? false,
    crosshairLabels: p.crosshairLabels ?? false,
    // Hover crosshair is dashed unless explicitly forced solid (legacy default).
    crosshairDashed: p.crosshairLineStyle !== "solid",
    crosshairSpan: p.crosshairSpan ?? "full",
    crosshairPlacement: p.crosshairLabelPlacement ?? "auto",
  };
}

export function mountScatterChart(
  host: HTMLElement,
  initial: ScatterChartProps,
  opts?: MountOptions<ScatterChartProps>
): ChartInstance<ScatterChartProps> {
  ensureStyles();
  host.classList.add("michi-vz", "michi-vz-scatter-chart");

  const svg = svgEl("svg");
  const tooltip = htmlEl("div", { class: "tooltip" });
  tooltip.style.visibility = "hidden";
  const a11y = htmlEl("div", { class: "mv-a11y" });
  a11y.setAttribute("role", "img");
  let canvas: HTMLCanvasElement | null = null;

  host.appendChild(svg);
  host.appendChild(tooltip);
  host.appendChild(a11y);

  let baseProps: ScatterChartProps = initial;
  let context: ChartContext | null = null;
  const pluginList: MichiVzPlugin<ScatterChartProps>[] = [...(opts?.plugins ?? [])];
  const pc: PluginContext<ScatterChartProps> = {
    chartType: "scatter-plot-chart",
    getProps: () => baseProps,
    getContext: () => context,
    setProps: (patch) => {
      baseProps = { ...baseProps, ...patch };
      render();
    },
  };
  let sticky = false;
  let lastColorMappingSent: Record<string, string> = {};
  // Idempotency guard: only fire onChartDataProcessed when the serialized context
  // changes — an unconditional re-fire loops "Maximum update depth" in any consumer
  // that dispatches on each call (two-colour-writer indicators). Mirrors VSB.
  let lastContextSig = "";
  let model: ReturnType<typeof buildScatterRenderModel> | null = null;
  // Canvas-mode crosshair: a dedicated SVG overlay layered ABOVE the canvas so the
  // crosshair sits on top of the bubbles. Drawn on hover in onHostMove.
  let crosshairSvg: SVGSVGElement | null = null;
  let crosshairGroup: SVGGElement | null = null;
  let crosshairCfg: {
    margin: Margin;
    width: number;
    height: number;
    dashed: boolean;
    showLabels: boolean;
    span: "full" | "half";
    placement: "auto" | "fixed";
    xFormat: (v: number) => string;
    yFormat: (v: number) => string;
  } | null = null;
  // Probe-resolved canvas fill colours (label → colour), so the crosshair matches
  // the hovered bubble's actual displayed colour (set by the consumer's CSS).
  let lastFillColors: Map<string, string> = new Map();

  const showTooltip = (p: ScatterDataPoint, ev: MouseEvent): void => {
    const rect = host.getBoundingClientRect();
    tooltip.style.left = `${ev.clientX - rect.left + 10}px`;
    tooltip.style.top = `${ev.clientY - rect.top - 10}px`;
    const htmlStr = baseProps.tooltipFormatter
      ? baseProps.tooltipFormatter(p)
      : `<strong>${p.label}</strong><br/>x: ${p.x}, y: ${p.y}${p.d !== undefined ? `<br/>size: ${p.d}` : ""}`;
    tooltip.innerHTML = DOMPurify.sanitize(htmlStr);
    tooltip.style.visibility = "visible";
  };
  const hideTooltip = (): void => {
    if (sticky) return;
    tooltip.style.visibility = "hidden";
  };

  // Canvas-mode hit-test (topmost = smallest, model is largest-first → scan reverse).
  const onHostMove = (ev: MouseEvent): void => {
    if (resolve(baseProps).renderer !== "canvas" || !model || sticky) return;
    const svgRect = svg.getBoundingClientRect();
    const x = ev.clientX - svgRect.left;
    const y = ev.clientY - svgRect.top;
    let hit: ScatterPointModel | null = null;
    for (let i = model.points.length - 1; i >= 0; i--) {
      const p = model.points[i];
      if (Math.hypot(x - p.cx, y - p.cy) <= p.r) {
        hit = p;
        break;
      }
    }
    if (hit) {
      showTooltip(hit.raw, ev);
      baseProps.onHighlightItem?.([hit.label]);
      if (crosshairGroup && crosshairCfg) {
        const color = lastFillColors.get(hit.label) || hit.color;
        drawCrosshair(crosshairGroup, hit.cx, hit.cy, hit.r, color, {
          margin: crosshairCfg.margin,
          width: crosshairCfg.width,
          height: crosshairCfg.height,
          dashed: crosshairCfg.dashed,
          showLabels: crosshairCfg.showLabels,
          span: crosshairCfg.span,
          placement: crosshairCfg.placement,
          xLabel: crosshairCfg.xFormat(hit.raw.x as number),
          yLabel: crosshairCfg.yFormat(hit.raw.y),
          opacity: 0.6,
        });
      }
    } else {
      hideTooltip();
      baseProps.onHighlightItem?.([]);
      if (crosshairGroup) clearCrosshair(crosshairGroup);
    }
  };
  // Canvas-mode click-to-pin: SVG marks pin via their own onClick, but canvas
  // marks have no DOM, so a click on the host toggles the hovered tooltip's pin.
  const onHostClick = (): void => {
    if (resolve(baseProps).renderer !== "canvas") return;
    if (sticky) {
      sticky = false;
      tooltip.classList.remove("sticky");
      tooltip.style.visibility = "hidden";
      if (crosshairGroup) clearCrosshair(crosshairGroup);
    } else if (tooltip.style.visibility === "visible") {
      sticky = true;
      tooltip.classList.add("sticky");
    }
  };
  host.addEventListener("mousemove", onHostMove);
  host.addEventListener("click", onHostClick);
  tooltip.addEventListener("click", () => {
    sticky = false;
    tooltip.classList.remove("sticky");
    tooltip.style.visibility = "hidden";
  });

  function render(): void {
    // Plugin hook #1 — transformData: append/transform points/series before layout.
    // With no plugins this is an identity fold, so behaviour is unchanged.
    const props = applyTransformData(pluginList, baseProps, pc);
    const r = resolve(props);
    const xAxisDataType = props.xAxisDataType ?? "number";
    const highlightItems = props.highlightItems ?? [];

    svg.setAttribute("width", String(r.width));
    svg.setAttribute("height", String(r.height));
    svg.style.position = "relative";

    const { points, xAxisDomain, yAxisDomain, dDomain } = processScatterData(props.dataSet, {
      disabledItems: props.disabledItems,
      filter: props.filter,
      xAxisDataType,
      xAxisDomain: props.xAxisDomain,
      yAxisDomain: props.yAxisDomain,
    });

    const colors = buildScatterColors(
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

    const scales = createScatterScales(
      xAxisDomain,
      yAxisDomain,
      dDomain,
      r.width,
      r.height,
      r.margin,
      xAxisDataType,
      r.sizeRange
    );

    model = buildScatterRenderModel(points, scales, colors, {
      xAxisDataType,
      highlightItems,
      defaultRadius: Math.min(...r.sizeRange) + 1,
    });

    const xFormat = props.xAxisFormat ?? defaultXAxisFormatter(xAxisDataType, props.locale);
    const yFormat = props.yAxisFormat ?? defaultNumberFormatter(props.locale);

    clear(svg);
    renderTitle(svg, { text: props.title, x: r.width / 2, y: r.margin.top / 2 });
    if (xAxisDataType === "band" && "bandwidth" in scales.xScale) {
      // Categorical axis: one centred label per band (band categories are few, so no
      // thinning/rotation). xAxisFormat, if given, maps the raw category label.
      renderXAxisBand(svg, scales.xScale as ScaleBand<string>, {
        width: r.width,
        height: r.height,
        margin: r.margin,
        format: props.xAxisFormat as ((label: string) => string) | undefined,
      });
    } else {
      renderXAxisLinear(
        svg,
        scales.xScale as ScaleLinear<number, number> | ScaleTime<number, number>,
        {
          width: r.width,
          height: r.height,
          margin: r.margin,
          xAxisDataType,
          format: (v) => xFormat(v),
          ticks: r.ticks,
          tickValues: props.tickValues,
          enableExplicitTickValues: true,
          showGrid: r.showGridX,
        }
      );
    }
    renderYAxisLinear(svg, scales.yScale, {
      width: r.width,
      height: r.height,
      margin: r.margin,
      format: (v) => yFormat(v),
      ticks: r.yTicks ?? r.ticks,
      showGrid: r.showGridY,
    });

    // Consumer-supplied SVG children (axis text labels, reference lines) — rendered
    // before the marks, mirroring the legacy `{children}` slot. The source is the React
    // wrapper's renderToStaticMarkup(children). DOMPurify strips a bare <text> (mXSS
    // guard) unless it sits under an <svg> root, so sanitise the markup wrapped in one,
    // then lift the children out into the chart's <svg>.
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

    // Bubble-size reference legend (top-right). Renders in both SVG and canvas modes.
    if (props.dScaleLegend && points.length > 0 && !props.isLoading) {
      renderDScaleLegend(svg, scales.sizeScale, r.sizeRange, props.dScaleLegend, {
        width: r.width,
        height: r.height,
      });
    }

    if (r.renderer !== "canvas") {
      renderScatterSvg(
        svg,
        model,
        { enableTransitions: r.enableTransitions },
        {
          onEnter: (p, ev) => {
            if (sticky) return;
            showTooltip(p.raw, ev);
            props.onHighlightItem?.([p.label]);
          },
          onLeave: () => {
            hideTooltip();
            if (!sticky) props.onHighlightItem?.([]);
          },
          onClick: (p, ev) => {
            sticky = true;
            tooltip.classList.add("sticky");
            showTooltip(p.raw, ev);
          },
        }
      );
    }

    if (r.renderer === "canvas") {
      if (!canvas) {
        canvas = htmlEl("canvas", { class: "scatter-chart-canvas" });
        canvas.style.position = "absolute";
        canvas.style.top = getComputedStyle(host).paddingTop;
        canvas.style.left = getComputedStyle(host).paddingLeft;
        canvas.style.pointerEvents = "none";
        host.insertBefore(canvas, tooltip);
      }
      lastFillColors = drawScatterCanvas(canvas, svg, model, { width: r.width, height: r.height });
      // Crosshair overlay <svg>, layered ABOVE the canvas so it sits on the bubbles.
      if (r.showCrosshair) {
        if (!crosshairSvg) {
          crosshairSvg = svgEl("svg") as SVGSVGElement;
          crosshairSvg.style.position = "absolute";
          crosshairSvg.style.top = "0";
          crosshairSvg.style.left = "0";
          crosshairSvg.style.pointerEvents = "none";
          crosshairGroup = svgEl("g", { class: "mv-crosshair" }) as SVGGElement;
          crosshairSvg.appendChild(crosshairGroup);
          host.insertBefore(crosshairSvg, tooltip);
        }
        crosshairSvg.setAttribute("width", String(r.width));
        crosshairSvg.setAttribute("height", String(r.height));
      } else if (crosshairSvg) {
        crosshairSvg.remove();
        crosshairSvg = null;
        crosshairGroup = null;
      }
    } else if (canvas) {
      canvas.remove();
      canvas = null;
    }

    // Crosshair config the canvas hover handler (onHostMove) reads; null when off.
    crosshairCfg =
      r.renderer === "canvas" && r.showCrosshair
        ? {
            margin: r.margin,
            width: r.width,
            height: r.height,
            dashed: r.crosshairDashed,
            showLabels: r.crosshairLabels,
            span: r.crosshairSpan,
            placement: r.crosshairPlacement,
            xFormat: (v: number) => xFormat(v),
            yFormat: (v: number) => yFormat(v),
          }
        : null;

    context = buildScatterContext({
      title: props.title,
      renderer: r.renderer,
      xAxisDataType,
      xAxisDomain,
      yAxisDomain,
      points,
      colorsMapping: colors.generatedColorsMapping,
      disabledItems: props.disabledItems,
    });
    // Plugin hook #3 — enrichContext: rewrite summary BEFORE the a11y mirror + the
    // dataprocessed event, so narration flows to both for free.
    context = applyEnrichContext(pluginList, context, pc);
    renderA11yMirror(a11y, context);
    const contextSig = JSON.stringify(context);
    if (contextSig !== lastContextSig) {
      lastContextSig = contextSig;
      props.onChartDataProcessed?.(context);
    }

    // Plugin hook #2 — validate: merge core checks with plugin warnings. Validate the
    // USER's data (baseProps), not the plugin-synthesised points.
    if (baseProps.onDataWarning) {
      const warnings = [
        ...checkScatterData(baseProps.dataSet),
        ...collectValidate(pluginList, baseProps, pc),
      ];
      if (warnings.length > 0) baseProps.onDataWarning(warnings);
    }
  }

  render();
  const teardowns = setupPlugins(pluginList, pc);

  const instance = {
    update(next: ScatterChartProps) {
      baseProps = next;
      render();
    },
    getContext() {
      return context;
    },
    use(plugin: MichiVzPlugin<ScatterChartProps>) {
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
      host.removeEventListener("click", onHostClick);
      crosshairSvg = null;
      crosshairGroup = null;
      crosshairCfg = null;
      clear(host);
      host.classList.remove("michi-vz", "michi-vz-scatter-chart");
    },
  };

  return attachDevtools(instance, host, "scatter-plot-chart", () => baseProps);
}
