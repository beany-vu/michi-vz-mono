// GapChart engine: imperative mount/update/getContext/destroy over the ported
// pure layer. Framework wrappers (wc/react/vue/angular/svelte) are thin shells
// around this. Renders into LIGHT DOM (no shadow root) so the consumer colour
// contract + canvas probe work.
import DOMPurify from "dompurify";
import { ensureStyles } from "../styles";
import { svgEl, htmlEl, clear } from "../dom";
import { defaultXAxisFormatter } from "../i18n/formatters";
import { processGapChartData } from "../gapChart/data";
import { buildGapColors } from "../gapChart/colors";
import { createGapScales } from "../gapChart/scales";
import { buildGapRenderModel } from "../gapChart/renderModel";
import { renderTitle, renderXAxisLinear, renderYAxisBand } from "../render/svg";
import { renderGapSvg } from "../gapChart/renderSvg";
import { drawGapCanvas } from "../gapChart/renderCanvas";
import { buildGapContext } from "../context/buildContext";
import { renderA11yMirror } from "../context/a11yMirror";
import { checkGapData } from "../validate/dataWarnings";
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
  GapChartProps,
  GapDataItem,
  Margin,
  MountOptions,
  Shape,
} from "../types";

const DEFAULT_MARGIN: Margin = { top: 50, right: 150, bottom: 100, left: 150 };

interface Resolved {
  width: number;
  height: number;
  margin: Margin;
  shapeValue1: Shape;
  shapeValue2: Shape;
  ticks: number;
  tickHtmlWidth: number;
  squareRadius: number;
  colorMode: "label" | "shape";
  renderer: "svg" | "canvas";
  enableTransitions: boolean;
}

function resolve(p: GapChartProps): Resolved {
  return {
    width: p.width ?? 1000,
    height: p.height ?? 500,
    margin: p.margin ?? DEFAULT_MARGIN,
    shapeValue1: p.shapeValue1 ?? "circle",
    shapeValue2: p.shapeValue2 ?? "circle",
    ticks: p.ticks ?? 5,
    tickHtmlWidth: p.tickHtmlWidth ?? 100,
    squareRadius: p.squareRadius ?? 2,
    colorMode: p.colorMode ?? "label",
    renderer: p.renderer ?? "svg",
    enableTransitions: p.enableTransitions ?? true,
  };
}

export function mountGapChart(
  host: HTMLElement,
  initial: GapChartProps,
  opts?: MountOptions<GapChartProps>
): ChartInstance<GapChartProps> {
  ensureStyles();
  host.classList.add("michi-vz", "michi-vz-gap-chart");

  const svg = svgEl("svg");
  const tooltip = htmlEl("div", { class: "tooltip" });
  tooltip.style.visibility = "hidden";
  const a11y = htmlEl("div", { class: "mv-a11y" });
  a11y.setAttribute("role", "img");
  let canvas: HTMLCanvasElement | null = null;

  host.appendChild(svg);
  host.appendChild(tooltip);
  host.appendChild(a11y);

  let baseProps: GapChartProps = initial;
  let context: ChartContext | null = null;
  const pluginList: MichiVzPlugin<GapChartProps>[] = [...(opts?.plugins ?? [])];
  const pc: PluginContext<GapChartProps> = {
    chartType: "gap-chart",
    getProps: () => baseProps,
    getContext: () => context,
    setProps: (patch) => {
      baseProps = { ...baseProps, ...patch };
      render();
    },
  };
  let sticky = false;
  let lastColorMappingSent: Record<string, string> = {};

  const showTooltip = (d: GapDataItem, ev: MouseEvent): void => {
    const rect = host.getBoundingClientRect();
    tooltip.style.left = `${ev.clientX - rect.left + 10}px`;
    tooltip.style.top = `${ev.clientY - rect.top - 10}px`;
    const htmlStr = baseProps.tooltipFormatter
      ? baseProps.tooltipFormatter(d)
      : `<strong>${d.label}</strong><br/>Value 1: ${d.value1}<br/>Value 2: ${d.value2}<br/>Difference: ${
          d.difference ?? d.value1 - d.value2
        }`;
    tooltip.innerHTML = DOMPurify.sanitize(htmlStr);
    tooltip.style.visibility = "visible";
  };
  const hideTooltip = (): void => {
    if (sticky) return;
    tooltip.style.visibility = "hidden";
  };

  // Canvas-mode hit-test (no retained SVG nodes to attach handlers to).
  let canvasModel: ReturnType<typeof buildGapRenderModel> | null = null;
  const onHostMove = (ev: MouseEvent): void => {
    if (resolve(baseProps).renderer !== "canvas" || !canvasModel || sticky) return;
    const rect = svg.getBoundingClientRect();
    const x = ev.clientX - rect.left;
    const y = ev.clientY - rect.top;
    let hit: GapDataItem | null = null;
    for (const el of canvasModel.elements) {
      const center = el.y + el.barHeight / 2;
      const within =
        Math.abs(y - center) <= el.barHeight / 2 &&
        x >= Math.min(el.value1X, el.value2X) - 8 &&
        x <= Math.max(el.value1X, el.value2X) + 8;
      if (within) {
        hit = el.d;
        break;
      }
    }
    if (hit) {
      showTooltip(hit, ev);
      baseProps.onHighlightItem?.(hit);
    } else {
      hideTooltip();
      baseProps.onHighlightItem?.(null);
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
    const highlightItems = props.highlightItems ?? [];
    const disabledItems = props.disabledItems ?? [];

    svg.setAttribute("width", String(r.width));
    svg.setAttribute("height", String(r.height));
    svg.style.position = "relative";

    const xAxisDataType = props.xAxisDataType ?? "number";
    const { processedDataSet, yAxisDomain, xAxisDomain } = processGapChartData(
      props.dataSet,
      props.filter,
      disabledItems,
      props.tickValues
    );

    // allLabels (incl. disabled) for stable colour generation
    const allLabels = processGapChartData(props.dataSet, props.filter, [], props.tickValues)
      .processedDataSet.map((d) => d.label);

    const colors = buildGapColors(
      allLabels,
      props.colors,
      props.colorsMapping,
      r.colorMode,
      props.shapeColorsMapping,
      props.skipColorMappingDispatch ?? false
    );

    if (!props.skipColorMappingDispatch && props.onColorMappingGenerated) {
      const next = colors.generatedColorsMapping;
      if (JSON.stringify(next) !== JSON.stringify(lastColorMappingSent)) {
        lastColorMappingSent = { ...next };
        props.onColorMappingGenerated(next);
      }
    }

    const scales = createGapScales(
      xAxisDomain,
      yAxisDomain,
      r.width,
      r.height,
      r.margin,
      xAxisDataType
    );

    const model = buildGapRenderModel(
      processedDataSet,
      scales,
      colors,
      r.colorMode,
      highlightItems,
      r.shapeValue1,
      r.shapeValue2
    );
    canvasModel = model;

    const xFormat = props.xAxisFormat ?? defaultXAxisFormatter(xAxisDataType, props.locale);
    const yFormat = props.yAxisFormat ?? ((d: number | string) => String(d));

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
    renderYAxisBand(svg, scales.yScale, {
      width: r.width,
      margin: r.margin,
      format: (label) => yFormat(label),
      tickHtmlWidth: r.tickHtmlWidth,
      showGrid: true,
    });

    if (r.renderer !== "canvas") {
      renderGapSvg(
        svg,
        model,
        {
          shapeValue1: r.shapeValue1,
          shapeValue2: r.shapeValue2,
          squareRadius: r.squareRadius,
          enableTransitions: r.enableTransitions,
        },
        {
          onEnter: (d, ev) => {
            if (sticky) return;
            showTooltip(d, ev);
            props.onHighlightItem?.(d);
          },
          onLeave: () => {
            hideTooltip();
            if (!sticky) props.onHighlightItem?.(null);
          },
          onClick: (d, ev) => {
            sticky = true;
            tooltip.classList.add("sticky");
            showTooltip(d, ev);
          },
        }
      );
    }

    // ----- Canvas layer -----
    if (r.renderer === "canvas") {
      if (!canvas) {
        canvas = htmlEl("canvas", { class: "gap-chart-canvas" });
        canvas.style.position = "absolute";
        canvas.style.top = getComputedStyle(host).paddingTop;
        canvas.style.left = getComputedStyle(host).paddingLeft;
        canvas.style.pointerEvents = "none";
        host.insertBefore(canvas, tooltip);
      }
      drawGapCanvas(canvas, svg, model, {
        width: r.width,
        height: r.height,
        shapeValue1: r.shapeValue1,
        shapeValue2: r.shapeValue2,
        squareRadius: r.squareRadius,
      });
    } else if (canvas) {
      canvas.remove();
      canvas = null;
    }

    // ----- Context (renderer-agnostic) + a11y + warnings -----
    context = buildGapContext({
      title: props.title,
      renderer: r.renderer,
      xAxisDataType,
      xAxisDomain,
      processedDataSet,
      colorsMapping: colors.generatedColorsMapping,
    });
    // Plugin hook #3 — enrichContext: rewrite summary BEFORE the a11y mirror + the
    // dataprocessed event, so narration flows to both for free.
    context = applyEnrichContext(pluginList, context, pc);
    renderA11yMirror(a11y, context);
    props.onChartDataProcessed?.(context);

    // Plugin hook #2 — validate: merge core checks with plugin warnings. Validate the
    // USER's data (baseProps), not the plugin-synthesised points.
    if (baseProps.onDataWarning) {
      const warnings = [
        ...checkGapData(baseProps.dataSet),
        ...collectValidate(pluginList, baseProps, pc),
      ];
      if (warnings.length > 0) baseProps.onDataWarning(warnings);
    }
  }

  render();
  const teardowns = setupPlugins(pluginList, pc);

  return {
    update(next: GapChartProps) {
      baseProps = next;
      render();
    },
    getContext() {
      return context;
    },
    use(plugin: MichiVzPlugin<GapChartProps>) {
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
      host.classList.remove("michi-vz", "michi-vz-gap-chart");
    },
  };
}
