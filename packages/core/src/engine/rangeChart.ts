// RangeChart engine: mount/update/getContext/destroy. Per-series valueMin..valueMax
// bands (+ median lines) over a linear/time x. Reuses Line's scales. LIGHT DOM.
import DOMPurify from "dompurify";
import { ensureStyles } from "../styles";
import { svgEl, htmlEl, clear } from "../dom";
import { defaultXAxisFormatter, defaultNumberFormatter } from "../i18n/formatters";
import { renderTitle, renderXAxisLinear, renderYAxisLinear } from "../render/svg";
import { createLineScales } from "../lineChart/scales";
import { processRangeData } from "../rangeChart/data";
import { buildRangeColors } from "../rangeChart/colors";
import { buildRangeRenderModel } from "../rangeChart/renderModel";
import { renderRangeSvg } from "../rangeChart/renderSvg";
import { drawRangeCanvas } from "../rangeChart/renderCanvas";
import { buildRangeContext } from "../context/buildRangeContext";
import { renderA11yMirror } from "../context/a11yMirror";
import type {
  ChartContext,
  ChartInstance,
  DataWarning,
  Margin,
  RangeChartProps,
  RangeDataItem,
} from "../types";

const DEFAULT_MARGIN: Margin = { top: 50, right: 50, bottom: 50, left: 60 };

interface Resolved {
  width: number;
  height: number;
  margin: Margin;
  ticks: number;
  renderer: "svg" | "canvas";
  fillOpacity: number;
  enableTransitions: boolean;
}

function resolve(p: RangeChartProps): Resolved {
  return {
    width: p.width ?? 1000,
    height: p.height ?? 500,
    margin: p.margin ?? DEFAULT_MARGIN,
    ticks: p.ticks ?? 5,
    renderer: p.renderer ?? "svg",
    fillOpacity: p.fillOpacity ?? 0.8,
    enableTransitions: p.enableTransitions ?? true,
  };
}

function checkData(dataSet: RangeDataItem[]): DataWarning[] {
  const warnings: DataWarning[] = [];
  if (!dataSet || dataSet.length === 0) {
    warnings.push({ type: "empty-dataset", message: "RangeChart received an empty dataSet." });
    return warnings;
  }
  for (const it of dataSet) {
    for (const p of it.series) {
      if (!Number.isFinite(p.valueMin) || !Number.isFinite(p.valueMax)) {
        warnings.push({
          type: "non-finite-value",
          message: `Band "${it.label}" has a non-finite min/max at ${String(p.date)}.`,
          label: it.label,
        });
      }
    }
  }
  return warnings;
}

export function mountRangeChart(host: HTMLElement, initial: RangeChartProps): ChartInstance<RangeChartProps> {
  ensureStyles();
  host.classList.add("michi-vz", "michi-vz-range-chart");

  const svg = svgEl("svg");
  const tooltip = htmlEl("div", { class: "tooltip" });
  tooltip.style.visibility = "hidden";
  const a11y = htmlEl("div", { class: "mv-a11y" });
  a11y.setAttribute("role", "img");
  let canvas: HTMLCanvasElement | null = null;

  host.appendChild(svg);
  host.appendChild(tooltip);
  host.appendChild(a11y);

  let props: RangeChartProps = initial;
  let context: ChartContext | null = null;
  let sticky = false;
  let lastColorMappingSent: Record<string, string> = {};

  const showTooltip = (label: string, ev: MouseEvent): void => {
    const r = host.getBoundingClientRect();
    tooltip.style.left = `${ev.clientX - r.left + 10}px`;
    tooltip.style.top = `${ev.clientY - r.top - 10}px`;
    const item = props.dataSet.find((it) => it.label === label);
    const mid = item?.series[Math.floor(item.series.length / 2)];
    const htmlStr =
      props.tooltipFormatter && item && mid
        ? props.tooltipFormatter(mid, item)
        : `<strong>${label}</strong>` + (mid ? `<br/>${String(mid.date)}: ${mid.valueMin}–${mid.valueMax}` : "");
    tooltip.innerHTML = DOMPurify.sanitize(htmlStr);
    tooltip.style.visibility = "visible";
  };
  const hideTooltip = (): void => {
    if (sticky) return;
    tooltip.style.visibility = "hidden";
  };
  tooltip.addEventListener("click", () => {
    sticky = false;
    tooltip.classList.remove("sticky");
    tooltip.style.visibility = "hidden";
  });

  function render(): void {
    const r = resolve(props);
    const xAxisDataType = props.xAxisDataType ?? "number";
    svg.setAttribute("width", String(r.width));
    svg.setAttribute("height", String(r.height));
    svg.style.position = "relative";

    const { items, xAxisDomain, yAxisDomain } = processRangeData(props.dataSet, {
      disabledItems: props.disabledItems,
      xAxisDataType,
      yAxisDomain: props.yAxisDomain,
    });

    const colors = buildRangeColors(
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

    const scales = createLineScales(xAxisDomain, yAxisDomain, r.width, r.height, r.margin, xAxisDataType);
    const model = buildRangeRenderModel(items, scales, colors, {
      xAxisDataType,
      curve: props.curve,
      highlightItems: props.highlightItems ?? [],
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
      renderRangeSvg(
        svg,
        model,
        { fillOpacity: r.fillOpacity, enableTransitions: r.enableTransitions },
        {
          onEnter: (s, ev) => {
            if (sticky) return;
            showTooltip(s.label, ev);
            props.onHighlightItem?.([s.label]);
          },
          onLeave: () => {
            hideTooltip();
            if (!sticky) props.onHighlightItem?.([]);
          },
          onClick: (s, ev) => {
            sticky = true;
            tooltip.classList.add("sticky");
            showTooltip(s.label, ev);
          },
        }
      );
    }

    if (r.renderer === "canvas") {
      if (!canvas) {
        canvas = htmlEl("canvas", { class: "range-chart-canvas" });
        canvas.style.position = "absolute";
        canvas.style.top = "0";
        canvas.style.left = "0";
        canvas.style.pointerEvents = "none";
        host.insertBefore(canvas, tooltip);
      }
      drawRangeCanvas(canvas, svg, model, { width: r.width, height: r.height, fillOpacity: r.fillOpacity });
    } else if (canvas) {
      canvas.remove();
      canvas = null;
    }

    context = buildRangeContext({
      title: props.title,
      renderer: r.renderer,
      xAxisDataType,
      xAxisDomain,
      yAxisDomain,
      items,
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
    update(next: RangeChartProps) {
      props = next;
      render();
    },
    getContext() {
      return context;
    },
    destroy() {
      clear(host);
      host.classList.remove("michi-vz", "michi-vz-range-chart");
    },
  };
}
