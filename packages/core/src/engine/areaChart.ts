// AreaChart engine: imperative mount/update/getContext/destroy. Stacked areas via
// d3.stack/d3.area; renders into LIGHT DOM. Hover uses a transparent overlay rect
// (shared renderOverlay) + a vertical hover line, with row/key hit-testing shared
// across SVG and canvas modes.
import DOMPurify from "dompurify";
import { attachDevtools } from "../devtools/hook";
import { ensureStyles } from "../styles";
import { svgEl, htmlEl, clear } from "../dom";
import { defaultXAxisFormatter, defaultNumberFormatter } from "../i18n/formatters";
import { renderTitle, renderXAxisLinear, renderYAxisLinear, renderOverlay } from "../render/svg";
import { processAreaChartData } from "../areaChart/data";
import { buildAreaColors } from "../areaChart/colors";
import { createAreaScales } from "../areaChart/scales";
import { areaProjectX } from "../areaChart/geometry";
import { parseXValue } from "../lineChart/lineUtils";
import { buildAreaRenderModel } from "../areaChart/renderModel";
import { renderAreaSvg } from "../areaChart/renderSvg";
import { placeTooltip } from "../render/placeTooltip";
import { drawAreaCanvas } from "../areaChart/renderCanvas";
import { drawAreaWebgpu } from "../areaChart/renderWebgpu";
import { resolveRenderer } from "../webgpu/capability";
import { buildAreaContext } from "../context/buildAreaContext";
import { renderA11yMirror } from "../context/a11yMirror";
import { checkAreaData } from "../validate/areaWarnings";
import {
  applyTransformData,
  applyEnrichContext,
  collectValidate,
  collectTools,
  setupPlugins,
} from "../plugins/runner";
import type { AgentTool, MichiVzPlugin, PluginContext } from "../plugins/types";
import type {
  AreaChartProps,
  AreaDataRow,
  ChartContext,
  ChartInstance,
  Margin,
  MountOptions,
  Renderer,
} from "../types";

const DEFAULT_MARGIN: Margin = { top: 50, right: 50, bottom: 50, left: 60 };

// canvas + webgpu both paint into a <canvas> layer (no DOM marks); svg does not.
// (Area's hover/hit-test uses a renderer-agnostic overlay rect, so unlike scatter
// there is no interaction-path branch to share here - isPainted only gates the
// painted-layer lifecycle below.)
const isPainted = (rr: Renderer): boolean => rr === "canvas" || rr === "webgpu";

interface Resolved {
  width: number;
  height: number;
  margin: Margin;
  ticks: number;
  renderer: Renderer;
  enableTransitions: boolean;
  forcePercentageScale: boolean;
}

function resolve(p: AreaChartProps): Resolved {
  return {
    width: p.width ?? 900,
    height: p.height ?? 480,
    margin: p.margin ?? DEFAULT_MARGIN,
    ticks: p.ticks ?? 10,
    // EFFECTIVE renderer: an opt-in "webgpu" request downgrades to "canvas" when
    // WebGPU is unavailable, so everything downstream (incl. getContext().renderer)
    // reflects what actually painted.
    renderer: resolveRenderer(p.renderer),
    enableTransitions: p.enableTransitions ?? true,
    forcePercentageScale: p.forcePercentageScale ?? false,
  };
}

interface HitRow {
  x: number;
  row: AreaDataRow;
  bands: Array<{ key: string; y0: number; y1: number }>;
}

export function mountAreaChart(
  host: HTMLElement,
  initial: AreaChartProps,
  opts?: MountOptions<AreaChartProps>
): ChartInstance<AreaChartProps> {
  ensureStyles();
  host.classList.add("michi-vz", "michi-vz-area-chart");

  const svg = svgEl("svg");
  const tooltip = htmlEl("div", { class: "tooltip" });
  tooltip.style.visibility = "hidden";
  const a11y = htmlEl("div", { class: "mv-a11y" });
  a11y.setAttribute("role", "img");
  // The 2D canvas (canvas mode, and the webgpu first-frame fallback) and the
  // dedicated WebGPU canvas. Both are layered absolutely behind the SVG.
  let canvas: HTMLCanvasElement | null = null;
  let webgpuCanvas: HTMLCanvasElement | null = null;

  host.appendChild(svg);
  host.appendChild(tooltip);
  host.appendChild(a11y);

  let baseProps: AreaChartProps = initial;
  let context: ChartContext | null = null;
  const pluginList: MichiVzPlugin<AreaChartProps>[] = [...(opts?.plugins ?? [])];
  const pc: PluginContext<AreaChartProps> = {
    chartType: "area-chart",
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
  // changes. Both Area consumers (ByEndUses/ByLevelOfProcessing) call setMetadata
  // inside it; an unconditional re-fire loops "Maximum update depth". Mirrors VSB.
  let lastContextSig = "";
  let hitRows: HitRow[] = [];
  let hoverLine: SVGLineElement | null = null;

  const showTooltip = (row: AreaDataRow, key: string, ev: MouseEvent): void => {
    const htmlStr = baseProps.tooltipFormatter
      ? // Legacy arg order: (datum, fullSeries, key) - consumers read d[key] + series.
        baseProps.tooltipFormatter(row, baseProps.series, key)
      : `<strong>${key}</strong><br/>${String(row.date)}: ${Number(row[key]) || 0}`;
    tooltip.innerHTML = DOMPurify.sanitize(htmlStr);
    tooltip.style.visibility = "visible";
    // Position AFTER content+visible so placeTooltip can measure offsetWidth/Height
    // and flip left near the host's right edge (avoid sliding under the sidebar).
    placeTooltip(host, tooltip, ev);
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
      baseProps.onHighlightItem?.([hit.key]);
      if (hoverLine) {
        const r = resolve(baseProps);
        hoverLine.setAttribute("x1", String(hit.rowX));
        hoverLine.setAttribute("x2", String(hit.rowX));
        hoverLine.setAttribute("y1", String(r.margin.top));
        hoverLine.setAttribute("y2", String(r.height - r.margin.bottom));
        hoverLine.style.visibility = "visible";
      }
    } else {
      hideTooltip();
      baseProps.onHighlightItem?.([]);
    }
  };

  tooltip.addEventListener("click", () => {
    sticky = false;
    tooltip.classList.remove("sticky");
    tooltip.style.visibility = "hidden";
  });

  function render(): void {
    // Plugin hook #1 - transformData: forecast/etc. append predicted points/series.
    // With no plugins this is an identity fold, so behaviour is unchanged.
    const props = applyTransformData(pluginList, baseProps, pc);
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
    // Legacy parity: NO vertical grid lines, and a clean SMALL set of date labels
    // that always includes the FIRST and LAST period (axis endpoints). Feed every
    // period as a candidate; maxTicks thins a dense monthly series (e.g. 48) down to
    // ~3-5 evenly-spaced labels keeping both ends; autoRotate tilts only if the kept
    // labels still collide. A short yearly series (≤ maxTicks) shows every year.
    const periodTicks =
      xAxisDataType === "date_annual" || xAxisDataType === "date_monthly"
        ? Array.from(new Set(props.series.map((s) => String(s.date)))).map((d) =>
            parseXValue(d, xAxisDataType)
          )
        : undefined;
    const plotW = r.width - r.margin.left - r.margin.right;
    // ~5 labels (first + last + 3 interior) on a normal-width chart; drop to 3 only
    // when the plot is genuinely narrow. autoRotate handles any residual overlap.
    const xMaxTicks = plotW < 480 ? 3 : 5;
    renderXAxisLinear(svg, scales.xScale, {
      width: r.width,
      height: r.height,
      margin: r.margin,
      xAxisDataType,
      format: (v) => xFormat(v),
      ticks: r.ticks,
      tickValues: props.tickValues ?? periodTicks,
      enableExplicitTickValues: true,
      showGrid: false,
      autoRotate: true,
      maxTicks: xMaxTicks,
    });
    renderYAxisLinear(svg, scales.yScale, {
      width: r.width,
      height: r.height,
      margin: r.margin,
      format: (v) => yFormat(v),
      ticks: r.ticks,
    });

    if (r.renderer === "svg") {
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

    if (isPainted(r.renderer)) {
      if (r.renderer === "webgpu") {
        if (!webgpuCanvas) webgpuCanvas = makeLayerCanvas("area-chart-webgpu-canvas");
        const ready = drawAreaWebgpu(webgpuCanvas, svg, model, scales, xAxisDataType, {
          width: r.width,
          height: r.height,
          // Re-render once the async GPU device resolves, upgrading canvas → GPU.
          onReady: render,
        });
        if (ready) {
          // GPU painted - drop any first-frame 2D fallback canvas.
          removeCanvas();
        } else {
          // Device not ready / unavailable (incl. jsdom): paint the canvas-2D stopgap
          // so the chart is never blank; the onReady re-render swaps in the GPU layer.
          if (!canvas) canvas = makeLayerCanvas("area-chart-canvas");
          drawAreaCanvas(canvas, svg, model, { width: r.width, height: r.height });
        }
      } else {
        // canvas mode
        removeWebgpuCanvas();
        if (!canvas) canvas = makeLayerCanvas("area-chart-canvas");
        drawAreaCanvas(canvas, svg, model, { width: r.width, height: r.height });
      }
    } else {
      removeCanvas();
      removeWebgpuCanvas();
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
      disabledItems: props.disabledItems,
    });
    // Plugin hook #3 - enrichContext: rewrite summary BEFORE the a11y mirror + the
    // dataprocessed event, so narration flows to both for free.
    context = applyEnrichContext(pluginList, context, pc);
    renderA11yMirror(a11y, context);
    const contextSig = JSON.stringify(context);
    if (contextSig !== lastContextSig) {
      lastContextSig = contextSig;
      props.onChartDataProcessed?.(context);
    }

    // Plugin hook #2 - validate: merge core checks with plugin warnings. Validate the
    // USER's data (baseProps), not the plugin-synthesised points.
    if (baseProps.onDataWarning) {
      const warnings = [
        ...checkAreaData(baseProps.series, baseProps.keys),
        ...collectValidate(pluginList, baseProps, pc),
      ];
      if (warnings.length > 0) baseProps.onDataWarning(warnings);
    }
  }

  render();
  const teardowns = setupPlugins(pluginList, pc);

  const instance = {
    update(next: AreaChartProps) {
      baseProps = next;
      render();
    },
    getContext() {
      return context;
    },
    use(plugin: MichiVzPlugin<AreaChartProps>) {
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
      canvas = null;
      webgpuCanvas = null;
      clear(host);
      host.classList.remove("michi-vz", "michi-vz-area-chart");
    },
  };

  return attachDevtools(instance, host, "area-chart", () => baseProps);
}
