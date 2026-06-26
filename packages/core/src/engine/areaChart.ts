// AreaChart engine: imperative mount/update/getContext/destroy. Stacked areas via
// d3.stack/d3.area; renders into LIGHT DOM. Hover uses a transparent overlay rect
// (shared renderOverlay) + a vertical hover line, with row/key hit-testing shared
// across SVG and canvas modes.
import DOMPurify from "dompurify";
import { ensureStyles } from "../styles";
import { svgEl, htmlEl, clear } from "../dom";
import { defaultXAxisFormatter, defaultNumberFormatter } from "../i18n/formatters";
import { renderTitle, renderXAxisLinear, renderYAxisLinear, renderOverlay } from "../render/svg";
import { processAreaChartData } from "../areaChart/data";
import { buildAreaColors } from "../areaChart/colors";
import { createAreaScales } from "../areaChart/scales";
import { areaProjectX } from "../areaChart/geometry";
import { buildAreaRenderModel } from "../areaChart/renderModel";
import { renderAreaSvg } from "../areaChart/renderSvg";
import { drawAreaCanvas } from "../areaChart/renderCanvas";
import { buildAreaContext } from "../context/buildAreaContext";
import { renderA11yMirror } from "../context/a11yMirror";
import { checkAreaData } from "../validate/areaWarnings";
import type { AreaChartProps, AreaDataRow, ChartContext, ChartInstance, Margin } from "../types";

const DEFAULT_MARGIN: Margin = { top: 50, right: 50, bottom: 50, left: 60 };

interface Resolved {
  width: number;
  height: number;
  margin: Margin;
  ticks: number;
  renderer: "svg" | "canvas";
  enableTransitions: boolean;
  forcePercentageScale: boolean;
}

function resolve(p: AreaChartProps): Resolved {
  return {
    width: p.width ?? 900,
    height: p.height ?? 480,
    margin: p.margin ?? DEFAULT_MARGIN,
    ticks: p.ticks ?? 5,
    renderer: p.renderer ?? "svg",
    enableTransitions: p.enableTransitions ?? true,
    forcePercentageScale: p.forcePercentageScale ?? false,
  };
}

interface HitRow {
  x: number;
  row: AreaDataRow;
  bands: Array<{ key: string; y0: number; y1: number }>;
}

export function mountAreaChart(host: HTMLElement, initial: AreaChartProps): ChartInstance<AreaChartProps> {
  ensureStyles();
  host.classList.add("michi-vz", "michi-vz-area-chart");

  const svg = svgEl("svg");
  const tooltip = htmlEl("div", { class: "tooltip" });
  tooltip.style.visibility = "hidden";
  const a11y = htmlEl("div", { class: "mv-a11y" });
  a11y.setAttribute("role", "img");
  let canvas: HTMLCanvasElement | null = null;

  host.appendChild(svg);
  host.appendChild(tooltip);
  host.appendChild(a11y);

  let props: AreaChartProps = initial;
  let context: ChartContext | null = null;
  let sticky = false;
  let lastColorMappingSent: Record<string, string> = {};
  let hitRows: HitRow[] = [];
  let hoverLine: SVGLineElement | null = null;

  const showTooltip = (row: AreaDataRow, key: string, ev: MouseEvent): void => {
    const rect = host.getBoundingClientRect();
    tooltip.style.left = `${ev.clientX - rect.left + 10}px`;
    tooltip.style.top = `${ev.clientY - rect.top - 10}px`;
    const htmlStr = props.tooltipFormatter
      ? props.tooltipFormatter(row, key, props.series)
      : `<strong>${key}</strong><br/>${String(row.date)}: ${Number(row[key]) || 0}`;
    tooltip.innerHTML = DOMPurify.sanitize(htmlStr);
    tooltip.style.visibility = "visible";
  };
  const hideTooltip = (): void => {
    if (sticky) return;
    tooltip.style.visibility = "hidden";
    if (hoverLine) hoverLine.style.visibility = "hidden";
  };

  // Hit-test: nearest row by x, then the key whose [y1,y0] band contains y.
  const hitTest = (x: number, y: number): { row: AreaDataRow; key: string; rowX: number } | null => {
    if (hitRows.length === 0) return null;
    let nearest = hitRows[0];
    for (const h of hitRows) if (Math.abs(h.x - x) < Math.abs(nearest.x - x)) nearest = h;
    for (const band of nearest.bands) {
      if (y >= band.y1 && y <= band.y0) return { row: nearest.row, key: band.key, rowX: nearest.x };
    }
    return null;
  };

  const onOverlayMove = (ev: MouseEvent): void => {
    if (sticky) return;
    const svgRect = svg.getBoundingClientRect();
    const x = ev.clientX - svgRect.left;
    const y = ev.clientY - svgRect.top;
    const hit = hitTest(x, y);
    if (hit) {
      showTooltip(hit.row, hit.key, ev);
      props.onHighlightItem?.([hit.key]);
      if (hoverLine) {
        const r = resolve(props);
        hoverLine.setAttribute("x1", String(hit.rowX));
        hoverLine.setAttribute("x2", String(hit.rowX));
        hoverLine.setAttribute("y1", String(r.margin.top));
        hoverLine.setAttribute("y2", String(r.height - r.margin.bottom));
        hoverLine.style.visibility = "visible";
      }
    } else {
      hideTooltip();
      props.onHighlightItem?.([]);
    }
  };

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

    const { activeKeys, stacked, xAxisDomain, yAxisDomain } = processAreaChartData(props.series, {
      keys: props.keys,
      disabledItems: props.disabledItems,
      xAxisDataType,
      yAxisDomain: props.yAxisDomain,
      forcePercentageScale: r.forcePercentageScale,
    });

    const colors = buildAreaColors(
      props.keys,
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

    const scales = createAreaScales(
      xAxisDomain,
      yAxisDomain,
      r.width,
      r.height,
      r.margin,
      xAxisDataType,
      r.forcePercentageScale
    );

    const model = buildAreaRenderModel(stacked, scales, colors, {
      xAxisDataType,
      curve: props.curve,
      highlightItems,
    });

    // Build hit-test bands per row from the stacked model.
    const rowMap = new Map<AreaDataRow, HitRow>();
    for (const layer of stacked) {
      for (const p of layer.values) {
        let hr = rowMap.get(p.data);
        if (!hr) {
          hr = { x: areaProjectX(p.data, scales.xScale, xAxisDataType), row: p.data, bands: [] };
          rowMap.set(p.data, hr);
        }
        hr.bands.push({ key: layer.key, y0: scales.yScale(p[0] || 0), y1: scales.yScale(p[1] || 0) });
      }
    }
    hitRows = [...rowMap.values()];

    const xFormat = props.xAxisFormat ?? defaultXAxisFormatter(xAxisDataType, props.locale);
    const yFormat = props.yAxisFormat ?? defaultNumberFormatter(props.locale);

    // ----- SVG layer -----
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
      renderAreaSvg(svg, model, { enableTransitions: r.enableTransitions });
    }

    // Hover line (above areas) + transparent capture overlay (topmost).
    hoverLine = svgEl("line", { class: "mv-hover-line" }) as SVGLineElement;
    hoverLine.setAttribute("stroke", "#666");
    hoverLine.setAttribute("stroke-width", "2");
    hoverLine.style.visibility = "hidden";
    hoverLine.style.pointerEvents = "none";
    svg.appendChild(hoverLine);

    const overlay = renderOverlay(svg, { width: r.width, height: r.height });
    overlay.style.cursor = "crosshair";
    overlay.addEventListener("mousemove", onOverlayMove);
    overlay.addEventListener("mouseleave", () => {
      hideTooltip();
      if (!sticky) props.onHighlightItem?.([]);
    });
    overlay.addEventListener("click", (ev) => {
      const svgRect = svg.getBoundingClientRect();
      const hit = hitTest(ev.clientX - svgRect.left, ev.clientY - svgRect.top);
      if (hit) {
        sticky = true;
        tooltip.classList.add("sticky");
        showTooltip(hit.row, hit.key, ev);
      }
    });

    // ----- Canvas layer -----
    if (r.renderer === "canvas") {
      if (!canvas) {
        canvas = htmlEl("canvas", { class: "area-chart-canvas" });
        canvas.style.position = "absolute";
        canvas.style.top = "0";
        canvas.style.left = "0";
        canvas.style.pointerEvents = "none";
        host.insertBefore(canvas, tooltip);
      }
      drawAreaCanvas(canvas, svg, model, { width: r.width, height: r.height });
    } else if (canvas) {
      canvas.remove();
      canvas = null;
    }

    // ----- Context + a11y + warnings -----
    context = buildAreaContext({
      title: props.title,
      renderer: r.renderer,
      xAxisDataType,
      xAxisDomain,
      yAxisDomain,
      series: props.series,
      activeKeys,
      colorsMapping: colors.generatedColorsMapping,
    });
    renderA11yMirror(a11y, context);
    props.onChartDataProcessed?.(context);

    if (props.onDataWarning) {
      const warnings = checkAreaData(props.series, props.keys);
      if (warnings.length > 0) props.onDataWarning(warnings);
    }
  }

  render();

  return {
    update(next: AreaChartProps) {
      props = next;
      render();
    },
    getContext() {
      return context;
    },
    destroy() {
      clear(host);
      host.classList.remove("michi-vz", "michi-vz-area-chart");
    },
  };
}
