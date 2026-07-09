// GapChart engine: imperative mount/update/getContext/destroy over the ported
// pure layer. Framework wrappers (wc/react/vue/angular/svelte) are thin shells
// around this. Renders into LIGHT DOM (no shadow root) so the consumer colour
// contract + canvas probe work.
import DOMPurify from "dompurify";
import { wireStickyDismiss } from "../render/stickyDismiss";
import { attachDevtools } from "../devtools/hook";
import { ensureStyles } from "../styles";
import { svgEl, htmlEl, clear } from "../dom";
import { defaultXAxisFormatter } from "../i18n/formatters";
import { processGapChartData } from "../gapChart/data";
import { buildGapColors } from "../gapChart/colors";
import { createGapScales } from "../gapChart/scales";
import { buildGapRenderModel } from "../gapChart/renderModel";
import { renderTitle, renderXAxisLinear, renderYAxisBand } from "../render/svg";
import {
  renderGapSvg,
  buildGapLegendItems,
  renderGapLegend,
} from "../gapChart/renderSvg";
import { placeTooltip } from "../render/placeTooltip";
import { drawGapCanvas } from "../gapChart/renderCanvas";
import { drawGapWebgpu } from "../gapChart/renderWebgpu";
import { resolveRenderer } from "../webgpu/capability";
import { buildGapContext } from "../context/buildContext";
import { renderA11yMirror } from "../context/a11yMirror";
import { contextSignature } from "../context/signature";
import { checkGapData } from "../validate/dataWarnings";
import {
  applyTransformData,
  applyEnrichContext,
  collectValidate,
  collectTools,
  setupPlugins,
} from "../plugins/runner";
import type { AgentTool, MichiVzPlugin, PluginContext } from "../plugins/types";
import {
  resolveTimeline,
  createEngineTimeline,
  type ResolvedTimeline,
} from "../animation/chartTimeline";
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


// canvas + webgpu both paint into a <canvas> layer (no DOM marks), so they share
// the host-level hit-test path. svg does not.
type GapRenderer = "svg" | "canvas" | "webgpu";
const isPainted = (rr: GapRenderer): boolean =>
  rr === "canvas" || rr === "webgpu";

interface Resolved {
  width: number;
  height: number;
  margin: Margin;
  shapeValue1: Shape;
  shapeValue2: Shape;
  ticks: number;
  tickHtmlWidth: number;
  interactiveRowLabels: boolean;
  squareRadius: number;
  colorMode: "label" | "shape";
  renderer: GapRenderer;
  enableTransitions: boolean;
  showZeroLineForXAxis: boolean;
  maxBarHeight?: number;
  timeline: ResolvedTimeline | null;
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
    interactiveRowLabels: p.interactiveRowLabels ?? false,
    squareRadius: p.squareRadius ?? 2,
    colorMode: p.colorMode ?? "label",
    // EFFECTIVE renderer: an opt-in "webgpu" request downgrades to "canvas" when
    // WebGPU is unavailable, so everything downstream (incl. getContext().renderer)
    // reflects what actually painted.
    renderer: resolveRenderer(p.renderer),
    enableTransitions: p.enableTransitions ?? true,
    showZeroLineForXAxis: p.showZeroLineForXAxis ?? false,
    maxBarHeight: p.maxBarHeight,
    timeline: resolveTimeline(p.timeline),
  };
}

export function mountGapChart(
  host: HTMLElement,
  initial: GapChartProps,
  opts?: MountOptions<GapChartProps>,
): ChartInstance<GapChartProps> {
  ensureStyles();
  host.classList.add("michi-vz", "michi-vz-gap-chart");

  const svg = svgEl("svg");
  const tooltip = htmlEl("div", { class: "tooltip" });
  tooltip.style.visibility = "hidden";
  const a11y = htmlEl("div", { class: "mv-a11y" });
  a11y.setAttribute("role", "img");
  let canvas: HTMLCanvasElement | null = null;
  let webgpuCanvas: HTMLCanvasElement | null = null;

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
  // Opt-in "play through years": the controller + built-in control lifecycle is
  // shared engine glue; render() consumes the period-filtered dataSet it returns.
  const engineTl = createEngineTimeline({
    ticker: opts?.ticker,
    motion: opts?.motion,
    requestRender: () => render(),
  });

  let sticky = false;
  // While the pointer is on the row-label scrub gutter, the host-level canvas
  // hit-test must stand down (it would miss and hide the scrub tooltip).
  let scrubbing = false;
  let lastColorMappingSent: Record<string, string> = {};
  // Idempotency guard: only fire onChartDataProcessed when the serialized context
  // changes - an unconditional re-fire loops "Maximum update depth" in any consumer
  // that dispatches on each call (two-colour-writer indicators). Mirrors VSB.
  let lastContextSig = "";

  // Lazily create an absolutely-positioned <canvas> layered behind the SVG, matching
  // the host padding (shared by canvas mode + the webgpu fallback + the webgpu layer).
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

  const showTooltip = (d: GapDataItem, ev: MouseEvent): void => {
    const htmlStr = baseProps.tooltipFormatter
      ? baseProps.tooltipFormatter(d)
      : `<strong>${d.label}</strong><br/>Value 1: ${d.value1}<br/>Value 2: ${
          d.value2
        }<br/>Difference: ${d.difference ?? d.value1 - d.value2}`;
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

  // Canvas-mode hit-test (no retained SVG nodes to attach handlers to).
  let canvasModel: ReturnType<typeof buildGapRenderModel> | null = null;
  const onHostMove = (ev: MouseEvent): void => {
    if (scrubbing) return;
    if (!isPainted(resolve(baseProps).renderer) || !canvasModel || sticky)
      return;
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
  host.addEventListener("mousemove", onHostMove);
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
    const highlightItems = props.highlightItems ?? [];
    const disabledItems = props.disabledItems ?? [];

    svg.setAttribute("width", String(r.width));
    svg.setAttribute("height", String(r.height));
    svg.style.position = "relative";

    const xAxisDataType = props.xAxisDataType ?? "number";
    const explicitTickValues =
      props.enableExplicitTickValues === false ? undefined : props.tickValues;
    // Timeline (opt-in): swap in the active period's rows; the user's own filter
    // still applies within the period (its `date` is neutralized while playing).
    const tlData = engineTl.beforeRender(r.timeline, props.dataSet, props.filter);
    const { processedDataSet, yAxisDomain, xAxisDomain: derivedXDomain } = processGapChartData(
      tlData.dataSet,
      tlData.filter,
      disabledItems,
      explicitTickValues,
    );
    // Explicit [min, max] wins over the derived zero-baseline domain (e.g. to zoom
    // a life-expectancy story into its 35-90 band instead of anchoring at 0).
    const xAxisDomain = props.xAxisDomain ?? derivedXDomain;

    // allLabels (incl. disabled) for stable colour generation
    const allLabels = processGapChartData(
      tlData.dataSet,
      tlData.filter,
      [],
      explicitTickValues,
    ).processedDataSet.map((d) => d.label);

    const colors = buildGapColors(
      allLabels,
      props.colors,
      props.colorsMapping,
      r.colorMode,
      props.shapeColorsMapping,
      props.skipColorMappingDispatch ?? false,
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
      xAxisDataType,
      props.xAxisDomain === undefined, // explicit domain -> no nice() re-rounding
      r.maxBarHeight,
    );

    const model = buildGapRenderModel(
      processedDataSet,
      scales,
      colors,
      r.colorMode,
      highlightItems,
      r.shapeValue1,
      r.shapeValue2,
    );
    canvasModel = model;

    const xFormat =
      props.xAxisFormat ?? defaultXAxisFormatter(xAxisDataType, props.locale);
    const yFormat = props.yAxisFormat ?? ((d: number | string) => String(d));

    // ----- SVG layer (axes + title always; marks only in svg mode) -----
    clear(svg);
    renderTitle(svg, {
      text: props.title,
      x: r.width / 2,
      y: r.margin.top / 2,
    });
    // maxTicks thins a dense/narrow numeric axis to a legible count, keeping the
    // first + last tick; autoRotate tilts -45deg only if the kept labels still
    // collide. Mirrors LineChart/AreaChart's identical width-based heuristic - a
    // no-op (byte-identical output) whenever the ticks already fit cleanly.
    const gapPlotW = r.width - r.margin.left - r.margin.right;
    const gapMaxTicks = gapPlotW < 480 ? 3 : 5;
    renderXAxisLinear(svg, scales.xScale, {
      width: r.width,
      height: r.height,
      margin: r.margin,
      xAxisDataType,
      format: (v) => xFormat(v),
      ticks: r.ticks,
      tickValues: props.tickValues,
      enableExplicitTickValues: props.enableExplicitTickValues ?? true,
      showZeroLine: r.showZeroLineForXAxis,
      autoRotate: true,
      maxTicks: gapMaxTicks,
    });
    // interactiveRowLabels: label hover/focus = leader line + row tooltip +
    // highlight; click pins (same sticky contract as the marks). Composed from the
    // row model, so it works in svg, canvas, and webgpu modes alike.
    const rowByLabel = new Map(model.elements.map((el) => [el.d.label, el]));
    const labelTooltipEvent = (x: number, rowCenterY: number): MouseEvent => {
      const hostRect = host.getBoundingClientRect();
      return { clientX: hostRect.left + x, clientY: hostRect.top + rowCenterY } as MouseEvent;
    };
    renderYAxisBand(svg, scales.yScale, {
      width: r.width,
      margin: r.margin,
      format: (label) => yFormat(label),
      tickHtmlWidth: r.tickHtmlWidth,
      showGrid: true,
      interactions: r.interactiveRowLabels
        ? {
            leaderToX: (label) => {
              const el = rowByLabel.get(label);
              // The row's nearest mark edge (either endpoint marker).
              return el ? Math.min(el.value1X, el.value2X) : r.margin.left;
            },
            onEnter: (label, rowCenterY, pointer) => {
              scrubbing = true;
              if (sticky) return;
              const el = rowByLabel.get(label);
              if (!el) return;
              showTooltip(
                el.d,
                (pointer as MouseEvent) ?? labelTooltipEvent(Math.min(el.value1X, el.value2X), rowCenterY)
              );
              props.onHighlightItem?.(el.d);
            },
            onLeave: () => {
              scrubbing = false;
              hideTooltip();
              if (!sticky) props.onHighlightItem?.(null);
            },
            onClick: (label, rowCenterY, pointer) => {
              const el = rowByLabel.get(label);
              if (!el) return;
              sticky = true;
              tooltip.classList.add("sticky");
              showTooltip(
                el.d,
                (pointer as MouseEvent) ?? labelTooltipEvent(Math.min(el.value1X, el.value2X), rowCenterY)
              );
            },
          }
        : undefined,
    });

    if (r.renderer === "svg") {
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
        },
      );
    }

    // ----- Canvas / WebGPU layer -----
    if (r.renderer === "webgpu") {
      if (!webgpuCanvas)
        webgpuCanvas = makeLayerCanvas("gapChart-webgpu-canvas");
      const painted = drawGapWebgpu(webgpuCanvas, svg, model, {
        width: r.width,
        height: r.height,
        shapeValue1: r.shapeValue1,
        shapeValue2: r.shapeValue2,
        // Re-render once the async GPU device resolves, upgrading canvas → GPU.
        onReady: render,
      });
      if (painted) {
        // GPU painted - drop any first-frame 2D fallback canvas.
        removeCanvas();
      } else {
        // Device not ready / unavailable (incl. jsdom): paint the canvas-2D stopgap
        // so the chart is never blank; the onReady re-render swaps in the GPU layer.
        if (!canvas) canvas = makeLayerCanvas("gap-chart-canvas");
        drawGapCanvas(canvas, svg, model, {
          width: r.width,
          height: r.height,
          shapeValue1: r.shapeValue1,
          shapeValue2: r.shapeValue2,
          squareRadius: r.squareRadius,
        });
      }
    } else if (r.renderer === "canvas") {
      removeWebgpuCanvas();
      if (!canvas) canvas = makeLayerCanvas("gap-chart-canvas");
      drawGapCanvas(canvas, svg, model, {
        width: r.width,
        height: r.height,
        shapeValue1: r.shapeValue1,
        shapeValue2: r.shapeValue2,
        squareRadius: r.squareRadius,
      });
    } else {
      removeCanvas();
      removeWebgpuCanvas();
    }

    // ----- Built-in legend (SVG layer, both renderers) -----
    // Legacy parity: render only when opted in AND shape labels are supplied. thd's
    // TradeSimulationSnapshot keeps it off on screen (its own legend sits above the
    // chart) and re-shows it during PDF capture via showLegend={isDownloadingChart}.
    if (props.showLegend && props.shapesLabelsMapping) {
      const legendItems = buildGapLegendItems(
        props.shapesLabelsMapping,
        r.shapeValue1,
        r.shapeValue2,
        r.colorMode,
        props.shapeColorsMapping,
      );
      renderGapLegend(svg, legendItems, {
        width: r.width,
        height: r.height,
        margin: r.margin,
        legendAlign: props.legendAlign ?? "left",
      });
    }

    // ----- Context (renderer-agnostic) + a11y + warnings -----
    context = buildGapContext({
      title: props.title,
      renderer: r.renderer,
      xAxisDataType,
      xAxisDomain,
      processedDataSet,
      colorsMapping: colors.generatedColorsMapping,
      disabledItems: props.disabledItems,
    });
    // Plugin hook #3 - enrichContext: rewrite summary BEFORE the a11y mirror + the
    // dataprocessed event, so narration flows to both for free.
    context = applyEnrichContext(pluginList, context, pc);
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
        ...checkGapData(baseProps.dataSet),
        ...collectValidate(pluginList, baseProps, pc),
      ];
      if (warnings.length > 0) baseProps.onDataWarning(warnings);
    }

    engineTl.afterRender(host, r.timeline);
  }

  render();
  const teardowns = setupPlugins(pluginList, pc);

  const instance: ChartInstance<GapChartProps> = {
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
      engineTl.destroy();
      disposeStickyDismiss();
      for (const t of teardowns) t();
      host.removeEventListener("mousemove", onHostMove);
      host.removeEventListener("click", onHostClick);
      canvas = null;
      webgpuCanvas = null;
      clear(host);
      host.classList.remove("michi-vz", "michi-vz-gap-chart");
    },
  };
  // timeline() only exists when the chart opted into playback at mount, so
  // feature-off charts keep an unchanged instance surface.
  if (resolve(initial).timeline) {
    instance.timeline = () => engineTl.controller();
  }

  return attachDevtools(instance, host, "gap-chart", () => baseProps);
}
