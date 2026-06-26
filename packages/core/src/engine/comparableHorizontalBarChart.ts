// ComparableHorizontalBar engine: mount/update/getContext/destroy. Band y +
// linear x; two horizontal sub-bars per label in LIGHT DOM (SVG) or canvas.
import DOMPurify from "dompurify";
import { ensureStyles } from "../styles";
import { svgEl, htmlEl, clear } from "../dom";
import { defaultNumberFormatter } from "../i18n/formatters";
import { renderTitle, renderXAxisLinear, renderYAxisBand } from "../render/svg";
import { processComparableBarData } from "../comparableBar/data";
import { buildComparableBarColors } from "../comparableBar/colors";
import { createComparableBarScales } from "../comparableBar/scales";
import { buildComparableRenderModel } from "../comparableBar/renderModel";
import type { ComparableBarModel } from "../comparableBar/renderModel";
import { renderComparableSvg } from "../comparableBar/renderSvg";
import { drawComparableCanvas } from "../comparableBar/renderCanvas";
import { buildComparableBarContext } from "../context/buildComparableBarContext";
import { renderA11yMirror } from "../context/a11yMirror";
import type {
  ChartContext,
  ChartInstance,
  ComparableBarChartProps,
  ComparableBarDataPoint,
  DataWarning,
  Margin,
} from "../types";

const DEFAULT_MARGIN: Margin = { top: 50, right: 50, bottom: 50, left: 120 };

interface Resolved {
  width: number;
  height: number;
  margin: Margin;
  ticks: number;
  tickHtmlWidth: number;
  renderer: "svg" | "canvas";
  valueBasedOpacity: number;
  valueComparedOpacity: number;
  enableTransitions: boolean;
}

function resolve(p: ComparableBarChartProps): Resolved {
  return {
    width: p.width ?? 900,
    height: p.height ?? 480,
    margin: p.margin ?? DEFAULT_MARGIN,
    ticks: p.ticks ?? 5,
    tickHtmlWidth: p.tickHtmlWidth ?? 100,
    renderer: p.renderer ?? "svg",
    valueBasedOpacity: p.valueBasedOpacity ?? 0.45,
    valueComparedOpacity: p.valueComparedOpacity ?? 0.9,
    enableTransitions: p.enableTransitions ?? true,
  };
}

function checkData(dataSet: ComparableBarDataPoint[]): DataWarning[] {
  const warnings: DataWarning[] = [];
  if (!dataSet || dataSet.length === 0) {
    warnings.push({ type: "empty-dataset", message: "ComparableHorizontalBar received an empty dataSet." });
    return warnings;
  }
  const seen = new Set<string>();
  for (const d of dataSet) {
    if (!Number.isFinite(d.valueBased) || !Number.isFinite(d.valueCompared)) {
      warnings.push({ type: "non-finite-value", message: `"${d.label}" has a non-finite value.`, label: d.label });
    }
    if (seen.has(d.label)) warnings.push({ type: "duplicate-label", message: `Duplicate label "${d.label}".`, label: d.label });
    seen.add(d.label);
  }
  return warnings;
}

export function mountComparableHorizontalBarChart(
  host: HTMLElement,
  initial: ComparableBarChartProps
): ChartInstance<ComparableBarChartProps> {
  ensureStyles();
  host.classList.add("michi-vz", "michi-vz-comparable-bar-chart");

  const svg = svgEl("svg");
  const tooltip = htmlEl("div", { class: "tooltip" });
  tooltip.style.visibility = "hidden";
  const a11y = htmlEl("div", { class: "mv-a11y" });
  a11y.setAttribute("role", "img");
  let canvas: HTMLCanvasElement | null = null;

  host.appendChild(svg);
  host.appendChild(tooltip);
  host.appendChild(a11y);

  let props: ComparableBarChartProps = initial;
  let context: ChartContext | null = null;
  let sticky = false;
  let lastColorMappingSent: Record<string, string> = {};
  let model: ReturnType<typeof buildComparableRenderModel> | null = null;

  const showTooltip = (d: ComparableBarDataPoint, ev: MouseEvent): void => {
    const r = host.getBoundingClientRect();
    tooltip.style.left = `${ev.clientX - r.left + 10}px`;
    tooltip.style.top = `${ev.clientY - r.top - 10}px`;
    const htmlStr = props.tooltipFormatter
      ? props.tooltipFormatter(d)
      : `<strong>${d.label}</strong><br/>Based: ${d.valueBased}<br/>Compared: ${d.valueCompared}`;
    tooltip.innerHTML = DOMPurify.sanitize(htmlStr);
    tooltip.style.visibility = "visible";
  };
  const hideTooltip = (): void => {
    if (sticky) return;
    tooltip.style.visibility = "hidden";
  };

  const onHostMove = (ev: MouseEvent): void => {
    if (resolve(props).renderer !== "canvas" || !model || sticky) return;
    const svgRect = svg.getBoundingClientRect();
    const x = ev.clientX - svgRect.left;
    const y = ev.clientY - svgRect.top;
    let hit: ComparableBarModel | null = null;
    for (const bar of model.bars) {
      if (y >= bar.y && y <= bar.y + bar.height) {
        const left = Math.min(bar.based.x, bar.compared.x);
        const right = Math.max(bar.based.x + bar.based.width, bar.compared.x + bar.compared.width);
        if (x >= left && x <= right) {
          hit = bar;
          break;
        }
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
    svg.setAttribute("width", String(r.width));
    svg.setAttribute("height", String(r.height));
    svg.style.position = "relative";

    const { points, labels, xAxisDomain } = processComparableBarData(props.dataSet, {
      disabledItems: props.disabledItems,
      filter: props.filter,
      xAxisDomain: props.xAxisDomain,
    });

    const colors = buildComparableBarColors(
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

    const scales = createComparableBarScales(xAxisDomain, labels, r.width, r.height, r.margin);
    model = buildComparableRenderModel(points, scales, colors, {
      highlightItems: props.highlightItems ?? [],
    });

    const xFormat = props.xAxisFormat ?? defaultNumberFormatter(props.locale);
    const yFormat = props.yAxisFormat ?? ((d: number | string) => String(d));

    clear(svg);
    renderTitle(svg, { text: props.title, x: r.width / 2, y: r.margin.top / 2 });
    renderXAxisLinear(svg, scales.xScale, {
      width: r.width,
      height: r.height,
      margin: r.margin,
      xAxisDataType: "number",
      format: (v) => xFormat(v),
      ticks: r.ticks,
      enableExplicitTickValues: false,
    });
    renderYAxisBand(svg, scales.yScale, {
      width: r.width,
      margin: r.margin,
      format: (label) => yFormat(label),
      tickHtmlWidth: r.tickHtmlWidth,
      showGrid: false,
    });

    if (r.renderer !== "canvas") {
      renderComparableSvg(
        svg,
        model,
        {
          valueBasedOpacity: r.valueBasedOpacity,
          valueComparedOpacity: r.valueComparedOpacity,
          enableTransitions: r.enableTransitions,
        },
        {
          onEnter: (bar, ev) => {
            if (sticky) return;
            showTooltip(bar.raw, ev);
            props.onHighlightItem?.([bar.label]);
          },
          onLeave: () => {
            hideTooltip();
            if (!sticky) props.onHighlightItem?.([]);
          },
          onClick: (bar, ev) => {
            sticky = true;
            tooltip.classList.add("sticky");
            showTooltip(bar.raw, ev);
          },
        }
      );
    }

    if (r.renderer === "canvas") {
      if (!canvas) {
        canvas = htmlEl("canvas", { class: "comparable-bar-canvas" });
        canvas.style.position = "absolute";
        canvas.style.top = "0";
        canvas.style.left = "0";
        canvas.style.pointerEvents = "none";
        host.insertBefore(canvas, tooltip);
      }
      drawComparableCanvas(canvas, svg, model, {
        width: r.width,
        height: r.height,
        valueBasedOpacity: r.valueBasedOpacity,
        valueComparedOpacity: r.valueComparedOpacity,
      });
    } else if (canvas) {
      canvas.remove();
      canvas = null;
    }

    context = buildComparableBarContext({
      title: props.title,
      renderer: r.renderer,
      xAxisDomain,
      points,
      colorsMapping: colors.generatedColorsMapping,
    });
    renderA11yMirror(a11y, context);
    props.onChartDataProcessed?.(context);

    if (props.onDataWarning) {
      const warnings = checkData(props.dataSet);
      if (warnings.length > 0) props.onDataWarning(warnings);
    }
  }

  render();

  return {
    update(next: ComparableBarChartProps) {
      props = next;
      render();
    },
    getContext() {
      return context;
    },
    destroy() {
      host.removeEventListener("mousemove", onHostMove);
      clear(host);
      host.classList.remove("michi-vz", "michi-vz-comparable-bar-chart");
    },
  };
}
