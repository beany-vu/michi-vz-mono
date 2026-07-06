// ScatterPlot engine: mount/update/getContext/destroy. Point cloud in LIGHT DOM;
// SVG marks (per-mark hover) or canvas (host-level hit-test). Title + shared
// linear x/y axes.
import DOMPurify from "dompurify";
import { wireStickyDismiss } from "../render/stickyDismiss";
import { attachDevtools, reportDevtoolsHit } from "../devtools/hook";
import { ensureStyles } from "../styles";
import { svgEl, htmlEl, clear } from "../dom";
import { defaultXAxisFormatter, defaultNumberFormatter } from "../i18n/formatters";
import { renderTitle, renderXAxisLinear, renderXAxisBand, renderYAxisLinear } from "../render/svg";
import { renderDScaleLegend } from "../render/svg/dScaleLegend";
import { drawCrosshair, clearCrosshair } from "../render/svg/scatterCrosshair";
import { makeSvgGroupDraggable } from "../render/svg/draggable";
import { placeTooltip } from "../render/placeTooltip";
import type { ScaleBand, ScaleLinear, ScaleTime } from "d3-scale";
import { processScatterData } from "../scatterChart/data";
import { buildScatterColors } from "../scatterChart/colors";
import { createScatterScales } from "../scatterChart/scales";
import { buildScatterRenderModel } from "../scatterChart/renderModel";
import type { ScatterPointModel } from "../scatterChart/renderModel";
import { buildScatterPointLabels } from "../scatterChart/pointLabels";
import { renderScatterPointLabelsSvg } from "../scatterChart/renderPointLabelsSvg";
import { renderScatterSvg } from "../scatterChart/renderSvg";
import { drawScatterCanvas } from "../scatterChart/renderCanvas";
import { drawScatterWebgpu } from "../scatterChart/renderWebgpu";
import { resolveRenderer } from "../webgpu/capability";
import { buildScatterContext } from "../context/buildScatterContext";
import { renderA11yMirror } from "../context/a11yMirror";
import { contextSignature } from "../context/signature";
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
  Renderer,
  ScatterChartProps,
  ScatterDataPoint,
  ScatterPointLabelsConfig,
} from "../types";

const DEFAULT_MARGIN: Margin = { top: 50, right: 50, bottom: 50, left: 60 };

// canvas + webgpu both paint into a <canvas> layer (no DOM marks), so they share the
// host-level hit-test / crosshair / click-to-pin path. svg does not. ⚠️ Keep this and
// the webgpu render branch - they are the opt-in renderer="webgpu" support.
const isPainted = (rr: Renderer): boolean => rr === "canvas" || rr === "webgpu";

interface Resolved {
  width: number;
  height: number;
  margin: Margin;
  ticks: number;
  yTicks: number | undefined;
  showGridX: boolean;
  showGridY: boolean;
  renderer: Renderer;
  enableTransitions: boolean;
  sizeRange: [number, number];
  showCrosshair: boolean;
  crosshairLabels: boolean;
  crosshairDashed: boolean;
  crosshairSpan: "full" | "half";
  crosshairPlacement: "auto" | "fixed";
  pointLabels: ScatterPointLabelsConfig | null;
  drawOrder: "sizeDescending" | "sizeAscending";
}

function resolveGrid(g: ScatterChartProps["showGrid"], axis: "x" | "y"): boolean {
  if (g === undefined) return true;
  if (typeof g === "boolean") return g;
  return g[axis] ?? true;
}

// Same boolean|config resolution shape as LineChart's resolveMouseLine /
// resolveSinglePointLine (engine/lineChart.ts): `true` -> default config `{}`,
// omitted/false -> null (feature off, no-op).
function resolvePointLabels(v: ScatterChartProps["pointLabels"]): ScatterPointLabelsConfig | null {
  if (!v) return null;
  return v === true ? {} : v;
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
    // EFFECTIVE renderer: opt-in "webgpu" downgrades to "canvas" when unavailable.
    renderer: resolveRenderer(p.renderer),
    enableTransitions: p.enableTransitions ?? true,
    sizeRange: p.sizeRange ?? [4, 20],
    showCrosshair: p.showCrosshair ?? false,
    crosshairLabels: p.crosshairLabels ?? false,
    // Hover crosshair is dashed unless explicitly forced solid (legacy default).
    crosshairDashed: p.crosshairLineStyle !== "solid",
    crosshairSpan: p.crosshairSpan ?? "full",
    crosshairPlacement: p.crosshairLabelPlacement ?? "auto",
    pointLabels: resolvePointLabels(p.pointLabels),
    drawOrder: p.drawOrder ?? "sizeDescending",
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
  // The 2D canvas (canvas mode + the webgpu first-frame fallback) and the dedicated
  // WebGPU canvas. Both are layered absolutely behind the SVG.
  let canvas: HTMLCanvasElement | null = null;
  let webgpuCanvas: HTMLCanvasElement | null = null;

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
  // changes - an unconditional re-fire loops "Maximum update depth" in any consumer
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
  // Draggable dScaleLegend: the offset persists across re-renders; the flag suppresses
  // the canvas hover hit-test while the legend is being dragged.
  let legendOffset = { x: 0, y: 0 };
  let legendDragging = false;

  // Lazily create an absolutely-positioned <canvas> behind the SVG, matching host
  // padding (shared by canvas mode + the webgpu fallback + the webgpu layer).
  const makeLayerCanvas = (className: string): HTMLCanvasElement => {
    const c = htmlEl("canvas", { class: className });
    const hostStyle = getComputedStyle(host); // one probe, two reads
    c.style.position = "absolute";
    c.style.top = hostStyle.paddingTop;
    c.style.left = hostStyle.paddingLeft;
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

  const showTooltip = (p: ScatterDataPoint, ev: MouseEvent): void => {
    const htmlStr = baseProps.tooltipFormatter
      ? baseProps.tooltipFormatter(p)
      : `<strong>${p.label}</strong><br/>x: ${p.x}, y: ${p.y}${p.d !== undefined ? `<br/>size: ${p.d}` : ""}`;
    tooltip.innerHTML = DOMPurify.sanitize(htmlStr);
    tooltip.style.visibility = "visible";
    placeTooltip(host, tooltip, ev);
  };
  const hideTooltip = (): void => {
    if (sticky) return;
    tooltip.style.visibility = "hidden";
  };

  // Canvas-mode hit-test (topmost = smallest, model is largest-first → scan reverse).
  // The scan is O(points) per event and real mice fire mousemove several times a
  // frame - at 50k points that made whole pages feel laggy. onHostMove processes
  // the FIRST event of a burst synchronously (single moves stay snappy), then
  // collapses the rest of the frame into ONE trailing rAF pass over the latest
  // event. `hitTestPainted` caches resolve(baseProps) per render instead of
  // recomputing it on every pointer event.
  const runHitTest = (ev: MouseEvent): void => {
    if (!hitTestPainted || !model || sticky || legendDragging) return;
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
    reportDevtoolsHit(host, x, y, hit ? hit.label : null);
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
  let hitTestPainted = false; // refreshed in render()
  let pendingHoverEv: MouseEvent | null = null;
  let hoverRaf = 0;
  let lastHoverTs = 0;
  const onHostMove = (ev: MouseEvent): void => {
    const now = performance.now();
    if (!hoverRaf && now - lastHoverTs >= 16) {
      lastHoverTs = now;
      runHitTest(ev); // leading edge: immediate
      return;
    }
    pendingHoverEv = ev; // burst: keep only the latest
    if (!hoverRaf) {
      hoverRaf = requestAnimationFrame(() => {
        hoverRaf = 0;
        lastHoverTs = performance.now();
        const p = pendingHoverEv;
        pendingHoverEv = null;
        if (p) runHitTest(p);
      });
    }
  };
  // Canvas-mode click-to-pin: SVG marks pin via their own onClick, but canvas
  // marks have no DOM, so a click on the host toggles the hovered tooltip's pin.
  const onHostClick = (): void => {
    if (!hitTestPainted) return;
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
  const disposeStickyDismiss = wireStickyDismiss(host, tooltip, {
    isSticky: () => sticky,
    unpin: () => {
      sticky = false;
    },
  });

  function render(): void {
    // Plugin hook #1 - transformData: append/transform points/series before layout.
    // With no plugins this is an identity fold, so behaviour is unchanged.
    const props = applyTransformData(pluginList, baseProps, pc);
    const r = resolve(props);
    // Cache for the pointer handlers: same expression they used to evaluate
    // per event (baseProps, not the plugin-transformed props).
    hitTestPainted = isPainted(resolve(baseProps).renderer);
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
      drawOrder: r.drawOrder,
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

    // Consumer-supplied SVG children (axis text labels, reference lines) - rendered
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
    // Draggable so it can be moved off the bubbles; the offset persists across renders.
    if (props.dScaleLegend && points.length > 0 && !props.isLoading) {
      const legendG = renderDScaleLegend(svg, scales.sizeScale, r.sizeRange, props.dScaleLegend, {
        width: r.width,
        height: r.height,
      });
      makeSvgGroupDraggable(legendG, {
        offset: legendOffset,
        onMove: (o) => {
          legendOffset = o;
        },
        onDragStateChange: (d) => {
          legendDragging = d;
        },
      });
    }

    if (r.renderer === "svg") {
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

    // ⚠️ PAINTED (canvas + webgpu) render branch - opt-in renderer="webgpu" support.
    // Keep the webgpu arm (agents/humans): it tries the GPU then falls back to the 2D
    // canvas when unavailable (always, in jsdom/CI). SVG/canvas behaviour is untouched.
    if (isPainted(r.renderer)) {
      if (r.renderer === "webgpu") {
        if (!webgpuCanvas) webgpuCanvas = makeLayerCanvas("scatter-chart-webgpu-canvas");
        // Re-render once the async GPU device resolves, upgrading canvas → GPU.
        const ok = drawScatterWebgpu(webgpuCanvas, svg, model, {
          width: r.width,
          height: r.height,
          onReady: render,
        });
        if (ok) {
          removeCanvas();
        } else {
          // Device not ready / unavailable: paint the canvas-2D stopgap so the chart
          // is never blank; the onReady re-render swaps in the GPU layer.
          if (!canvas) canvas = makeLayerCanvas("scatter-chart-canvas");
          lastFillColors = drawScatterCanvas(canvas, svg, model, { width: r.width, height: r.height });
        }
      } else {
        removeWebgpuCanvas();
        if (!canvas) canvas = makeLayerCanvas("scatter-chart-canvas");
        lastFillColors = drawScatterCanvas(canvas, svg, model, { width: r.width, height: r.height });
      }
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
    } else {
      removeCanvas();
      removeWebgpuCanvas();
    }

    // Point labels: painted on the SVG scaffold layer unconditionally (same
    // treatment as title/axis text and ComparableBar's delta indicator - see
    // scatterChart/renderPointLabelsSvg.ts), so labels appear identically
    // whichever `renderer` painted the points themselves. No-op when the prop
    // is absent/false (r.pointLabels is null).
    if (r.pointLabels) {
      const formatter = r.pointLabels.formatter ?? ((d: ScatterDataPoint) => d.label);
      renderScatterPointLabelsSvg(svg, buildScatterPointLabels(model.points, formatter));
    }

    // Crosshair config the canvas hover handler (onHostMove) reads; null when off.
    crosshairCfg =
      isPainted(r.renderer) && r.showCrosshair
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
      disposeStickyDismiss();
      for (const t of teardowns) t();
      host.removeEventListener("mousemove", onHostMove);
      host.removeEventListener("click", onHostClick);
      if (hoverRaf) cancelAnimationFrame(hoverRaf);
      hoverRaf = 0;
      pendingHoverEv = null;
      crosshairSvg = null;
      crosshairGroup = null;
      crosshairCfg = null;
      canvas = null;
      webgpuCanvas = null;
      clear(host);
      host.classList.remove("michi-vz", "michi-vz-scatter-chart");
    },
  };

  return attachDevtools(instance, host, "scatter-plot-chart", () => baseProps);
}
