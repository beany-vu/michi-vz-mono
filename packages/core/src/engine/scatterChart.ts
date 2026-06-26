// ScatterPlot engine: mount/update/getContext/destroy. Point cloud in LIGHT DOM;
// SVG marks (per-mark hover) or canvas (host-level hit-test). Title + shared
// linear x/y axes.
import DOMPurify from "dompurify";
import { ensureStyles } from "../styles";
import { svgEl, htmlEl, clear } from "../dom";
import { defaultXAxisFormatter, defaultNumberFormatter } from "../i18n/formatters";
import { renderTitle, renderXAxisLinear, renderYAxisLinear } from "../render/svg";
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
import type { ChartContext, ChartInstance, Margin, ScatterChartProps, ScatterDataPoint } from "../types";

const DEFAULT_MARGIN: Margin = { top: 50, right: 50, bottom: 50, left: 60 };

interface Resolved {
  width: number;
  height: number;
  margin: Margin;
  ticks: number;
  renderer: "svg" | "canvas";
  enableTransitions: boolean;
  sizeRange: [number, number];
}

function resolve(p: ScatterChartProps): Resolved {
  return {
    width: p.width ?? 900,
    height: p.height ?? 480,
    margin: p.margin ?? DEFAULT_MARGIN,
    ticks: p.ticks ?? 5,
    renderer: p.renderer ?? "svg",
    enableTransitions: p.enableTransitions ?? true,
    sizeRange: p.sizeRange ?? [4, 20],
  };
}

export function mountScatterChart(
  host: HTMLElement,
  initial: ScatterChartProps
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

  let props: ScatterChartProps = initial;
  let context: ChartContext | null = null;
  let sticky = false;
  let lastColorMappingSent: Record<string, string> = {};
  let model: ReturnType<typeof buildScatterRenderModel> | null = null;

  const showTooltip = (p: ScatterDataPoint, ev: MouseEvent): void => {
    const rect = host.getBoundingClientRect();
    tooltip.style.left = `${ev.clientX - rect.left + 10}px`;
    tooltip.style.top = `${ev.clientY - rect.top - 10}px`;
    const htmlStr = props.tooltipFormatter
      ? props.tooltipFormatter(p)
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
    if (resolve(props).renderer !== "canvas" || !model || sticky) return;
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
      props.onHighlightItem?.([hit.label]);
    } else {
      hideTooltip();
      props.onHighlightItem?.([]);
    }
  };
  host.addEventListener("mousemove", onHostMove);
  tooltip.addEventListener("click", () => {
    sticky = false;
    tooltip.classList.remove("sticky");
    tooltip.style.visibility = "hidden";
  });

  function render(): void {
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
        canvas.style.top = "0";
        canvas.style.left = "0";
        canvas.style.pointerEvents = "none";
        host.insertBefore(canvas, tooltip);
      }
      drawScatterCanvas(canvas, svg, model, { width: r.width, height: r.height });
    } else if (canvas) {
      canvas.remove();
      canvas = null;
    }

    context = buildScatterContext({
      title: props.title,
      renderer: r.renderer,
      xAxisDataType,
      xAxisDomain,
      yAxisDomain,
      points,
      colorsMapping: colors.generatedColorsMapping,
    });
    renderA11yMirror(a11y, context);
    props.onChartDataProcessed?.(context);

    if (props.onDataWarning) {
      const warnings = checkScatterData(props.dataSet);
      if (warnings.length > 0) props.onDataWarning(warnings);
    }
  }

  render();

  return {
    update(next: ScatterChartProps) {
      props = next;
      render();
    },
    getContext() {
      return context;
    },
    destroy() {
      host.removeEventListener("mousemove", onHostMove);
      clear(host);
      host.classList.remove("michi-vz", "michi-vz-scatter-chart");
    },
  };
}
