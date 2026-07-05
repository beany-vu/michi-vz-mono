// ComparableHorizontalBar engine: mount/update/getContext/destroy. Band y +
// linear x; two horizontal sub-bars per label in LIGHT DOM (SVG) or canvas.
import DOMPurify from "dompurify";
import { wireStickyDismiss } from "../render/stickyDismiss";
import { attachDevtools } from "../devtools/hook";
import { ensureStyles } from "../styles";
import { svgEl, htmlEl, clear } from "../dom";
import { defaultNumberFormatter } from "../i18n/formatters";
import { renderTitle, renderXAxisLinear, renderYAxisBand } from "../render/svg";
import { applyChartChrome, createChromeRefs } from "../render/chrome";
import { processComparableBarData } from "../comparableBar/data";
import { buildComparableBarColors } from "../comparableBar/colors";
import { createComparableBarScales } from "../comparableBar/scales";
import { buildComparableRenderModel } from "../comparableBar/renderModel";
import type { ComparableBarModel } from "../comparableBar/renderModel";
import { renderComparableSvg } from "../comparableBar/renderSvg";
import { drawComparableCanvas } from "../comparableBar/renderCanvas";
import { drawComparableBarWebgpu } from "../comparableBar/renderWebgpu";
import { resolveRenderer } from "../webgpu/capability";
import { buildComparableBarContext } from "../context/buildComparableBarContext";
import { renderA11yMirror } from "../context/a11yMirror";
import { contextSignature } from "../context/signature";
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
  ComparableBarChartProps,
  ComparableBarDataPoint,
  DataWarning,
  Margin,
  MountOptions,
} from "../types";

const DEFAULT_MARGIN: Margin = { top: 50, right: 50, bottom: 50, left: 120 };

const ZERO_PADDING = { top: 0, right: 0, bottom: 0, left: 0 };

interface Resolved {
  width: number;
  height: number;
  margin: Margin;
  ticks: number;
  tickHtmlWidth: number;
  interactiveRowLabels: boolean;
  renderer: "svg" | "canvas" | "webgpu";
  valueBasedOpacity: number;
  valueComparedOpacity: number;
  enableTransitions: boolean;
  padding: { top: number; right: number; bottom: number; left: number };
  showZeroLineForXAxis: boolean;
  showGrid: boolean;
  minBarWidth: number;
  hideTickLabels: boolean;
  horizontalTickPosition?: { x: number; y: number };
  maxBarHeight?: number;
}

// canvas + webgpu both paint into a <canvas> layer (no DOM marks), so they share
// the host-level hit-test / click-to-pin interaction path. svg does not.
const isPainted = (rr: Resolved["renderer"]): boolean => rr === "canvas" || rr === "webgpu";

function resolve(p: ComparableBarChartProps): Resolved {
  return {
    width: p.width ?? 900,
    height: p.height ?? 480,
    margin: p.margin ?? DEFAULT_MARGIN,
    ticks: p.ticks ?? 5,
    tickHtmlWidth: p.tickHtmlWidth ?? 100,
    interactiveRowLabels: p.interactiveRowLabels ?? false,
    // EFFECTIVE renderer: an opt-in "webgpu" request downgrades to "canvas" when
    // WebGPU is unavailable, so everything downstream (incl. getContext().renderer)
    // reflects what actually painted.
    renderer: resolveRenderer(p.renderer),
    valueBasedOpacity: p.valueBasedOpacity ?? 0.45,
    valueComparedOpacity: p.valueComparedOpacity ?? 0.9,
    enableTransitions: p.enableTransitions ?? true,
    padding: p.padding ?? ZERO_PADDING,
    showZeroLineForXAxis: p.showZeroLineForXAxis ?? false,
    showGrid: p.showGrid ?? false,
    minBarWidth: p.minBarWidth ?? 5,
    hideTickLabels: p.hideTickLabels ?? false,
    horizontalTickPosition: p.horizontalTickPosition,
    maxBarHeight: p.maxBarHeight,
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
  initial: ComparableBarChartProps,
  opts?: MountOptions<ComparableBarChartProps>
): ChartInstance<ComparableBarChartProps> {
  ensureStyles();
  host.classList.add("michi-vz", "michi-vz-comparable-bar-chart");

  const svg = svgEl("svg");
  const tooltip = htmlEl("div", { class: "tooltip" });
  tooltip.style.visibility = "hidden";
  const a11y = htmlEl("div", { class: "mv-a11y" });
  a11y.setAttribute("role", "img");
  // The 2D canvas (canvas mode, and the webgpu first-frame fallback) and the
  // dedicated WebGPU canvas. Both are layered absolutely behind the SVG.
  let canvas: HTMLCanvasElement | null = null;
  let webgpuCanvas: HTMLCanvasElement | null = null;
  const chrome = createChromeRefs();

  host.appendChild(svg);
  host.appendChild(tooltip);
  host.appendChild(a11y);

  let baseProps: ComparableBarChartProps = initial;
  let context: ChartContext | null = null;
  const pluginList: MichiVzPlugin<ComparableBarChartProps>[] = [...(opts?.plugins ?? [])];
  const pc: PluginContext<ComparableBarChartProps> = {
    chartType: "comparable-horizontal-bar-chart",
    getProps: () => baseProps,
    getContext: () => context,
    setProps: (patch) => {
      baseProps = { ...baseProps, ...patch };
      render();
    },
  };
  let sticky = false;
  // While the pointer is on the row-label scrub gutter, the host-level canvas
  // hit-test must stand down (it would miss and hide the scrub tooltip).
  let scrubbing = false;
  let lastColorMappingSent: Record<string, string> = {};
  // Signature of the last context emitted, so onChartDataProcessed only fires when
  // the context actually changes. A consumer colour authority (thd setMetadata)
  // dispatches into redux on every call; re-firing an unchanged context every
  // render creates an infinite render→dispatch→render loop ("Maximum update depth"),
  // especially where a second colour writer (Tariff Structure useColorV2) is active.
  let lastContextSig = "";
  let model: ReturnType<typeof buildComparableRenderModel> | null = null;

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

  const showTooltip = (
    d: ComparableBarDataPoint,
    ev: MouseEvent,
    type?: "based" | "compared"
  ): void => {
    // Legacy 3-arg contract: (datum, dataSet, hovered sub-bar type).
    const htmlStr = baseProps.tooltipFormatter
      ? baseProps.tooltipFormatter(d, baseProps.dataSet, type)
      : `<strong>${d.label}</strong><br/>Based: ${d.valueBased}<br/>Compared: ${d.valueCompared}`;
    tooltip.innerHTML = DOMPurify.sanitize(htmlStr);
    tooltip.style.visibility = "visible";
    // Edge-aware position (mirror VSB): flip left near the right edge, below near top.
    const r = host.getBoundingClientRect();
    const x = ev.clientX - r.left;
    const y = ev.clientY - r.top;
    const tw = tooltip.offsetWidth;
    const th = tooltip.offsetHeight;
    tooltip.style.left = `${x + tw + 10 > r.width ? Math.max(0, x - tw - 10) : x + 10}px`;
    tooltip.style.top = `${y - th - 10 < 0 ? y + 10 : y - th - 10}px`;
  };
  const subBarTypeAt = (bar: ComparableBarModel, x: number): "based" | "compared" | undefined => {
    // compared is drawn in front; prefer it when the two overlap.
    if (x >= bar.compared.x && x <= bar.compared.x + bar.compared.width) return "compared";
    if (x >= bar.based.x && x <= bar.based.x + bar.based.width) return "based";
    return undefined;
  };
  const hideTooltip = (): void => {
    if (sticky) return;
    tooltip.style.visibility = "hidden";
  };

  const onHostMove = (ev: MouseEvent): void => {
    if (scrubbing) return;
    if (!isPainted(resolve(baseProps).renderer) || !model || sticky) return;
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
      showTooltip(hit.raw, ev, subBarTypeAt(hit, x));
      baseProps.onHighlightItem?.([hit.label]);
    } else {
      hideTooltip();
      baseProps.onHighlightItem?.([]);
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
  // Cursor leaves the chart: hide the tooltip and clear the highlight, else the
  // last-hovered bar stays highlighted (others dimmed) after the cursor exits.
  const onHostLeave = (): void => {
    if (sticky) return;
    hideTooltip();
    baseProps.onHighlightItem?.([]);
  };
  host.addEventListener("mousemove", onHostMove);
  host.addEventListener("mouseleave", onHostLeave);
  host.addEventListener("click", onHostClick);
  const disposeStickyDismiss = wireStickyDismiss(host, tooltip, {
    isSticky: () => sticky,
    unpin: () => {
      sticky = false;
    },
  });

  function render(): void {
    // Plugin hook #1 - transformData: append/derive points before processing.
    // With no plugins this is an identity fold, so behaviour is unchanged.
    const props = applyTransformData(pluginList, baseProps, pc);
    const r = resolve(props);
    svg.setAttribute("width", String(r.width));
    svg.setAttribute("height", String(r.height));
    svg.style.position = "relative";

    // data-mv-state + font var + default loading/no-data overlays (shared chrome).
    applyChartChrome(host, props, props.dataSet, chrome);

    // xAxisPredefinedDomain is the legacy alias the consumers pass; it wins over
    // xAxisDomain when it's a [min,max] pair.
    const predefined =
      props.xAxisPredefinedDomain && props.xAxisPredefinedDomain.length === 2
        ? ([props.xAxisPredefinedDomain[0], props.xAxisPredefinedDomain[1]] as [number, number])
        : undefined;
    const { points, labels, xAxisDomain } = processComparableBarData(props.dataSet, {
      disabledItems: props.disabledItems,
      filter: props.filter,
      xAxisDomain: predefined ?? props.xAxisDomain,
      symmetric: props.symmetricXDomain,
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

    const scales = createComparableBarScales(
      xAxisDomain,
      labels,
      r.width,
      r.height,
      r.margin,
      r.padding,
      r.maxBarHeight
    );
    model = buildComparableRenderModel(points, scales, colors, {
      highlightItems: props.highlightItems ?? [],
      minBarWidth: r.minBarWidth,
      colorsBasedMapping: props.colorsBasedMapping,
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
      showGrid: r.showGrid,
      showZeroLine: r.showZeroLineForXAxis,
    });
    // interactiveRowLabels: label hover/focus = leader line + row tooltip +
    // highlight; click pins (same sticky contract as the bars). Composed from the
    // row model, so it works in svg, canvas, and webgpu modes alike.
    const rowByLabel = new Map(model.bars.map((b) => [b.label, b]));
    const rowStartX = (label: string): number => {
      const b = rowByLabel.get(label);
      return b ? Math.min(b.based.x, b.compared.x) : r.margin.left;
    };
    const labelTooltipEvent = (x: number, rowCenterY: number): MouseEvent => {
      const hostRect = host.getBoundingClientRect();
      return { clientX: hostRect.left + x, clientY: hostRect.top + rowCenterY } as MouseEvent;
    };
    renderYAxisBand(svg, scales.yScale, {
      width: r.width,
      margin: r.margin,
      format: (label) => yFormat(label),
      tickHtmlWidth: r.tickHtmlWidth,
      showGrid: false,
      hideTickLabels: r.hideTickLabels,
      tickLabelOffset: r.horizontalTickPosition,
      interactions: r.interactiveRowLabels
        ? {
            leaderToX: rowStartX,
            onEnter: (label, rowCenterY, pointer) => {
              scrubbing = true;
              if (sticky) return;
              const b = rowByLabel.get(label);
              if (!b) return;
              showTooltip(b.raw, (pointer as MouseEvent) ?? labelTooltipEvent(rowStartX(label), rowCenterY), "compared");
              props.onHighlightItem?.([label]);
            },
            onLeave: () => {
              scrubbing = false;
              hideTooltip();
              if (!sticky) props.onHighlightItem?.([]);
            },
            onClick: (label, rowCenterY, pointer) => {
              const b = rowByLabel.get(label);
              if (!b) return;
              sticky = true;
              tooltip.classList.add("sticky");
              showTooltip(b.raw, (pointer as MouseEvent) ?? labelTooltipEvent(rowStartX(label), rowCenterY), "compared");
            },
          }
        : undefined,
    });

    if (r.renderer === "svg") {
      renderComparableSvg(
        svg,
        model,
        {
          valueBasedOpacity: r.valueBasedOpacity,
          valueComparedOpacity: r.valueComparedOpacity,
          enableTransitions: r.enableTransitions,
        },
        {
          onEnter: (bar, ev, type) => {
            if (sticky) return;
            showTooltip(bar.raw, ev, type);
            props.onHighlightItem?.([bar.label]);
          },
          onLeave: () => {
            hideTooltip();
            if (!sticky) props.onHighlightItem?.([]);
          },
          onClick: (bar, ev, type) => {
            sticky = true;
            tooltip.classList.add("sticky");
            showTooltip(bar.raw, ev, type);
          },
        }
      );
    }

    if (r.renderer === "webgpu") {
      if (!webgpuCanvas) webgpuCanvas = makeLayerCanvas("comparableHorizontalBarChart-webgpu-canvas");
      const ready = drawComparableBarWebgpu(webgpuCanvas, svg, model, {
        width: r.width,
        height: r.height,
        valueBasedOpacity: r.valueBasedOpacity,
        valueComparedOpacity: r.valueComparedOpacity,
        // Re-render once the async GPU device resolves, upgrading canvas → GPU.
        onReady: render,
      });
      if (ready) {
        // GPU painted - drop any first-frame 2D fallback canvas.
        removeCanvas();
      } else {
        // Device not ready / unavailable (incl. jsdom): paint the canvas-2D stopgap
        // so the chart is never blank; the onReady re-render swaps in the GPU layer.
        if (!canvas) canvas = makeLayerCanvas("comparable-bar-canvas");
        drawComparableCanvas(
          canvas,
          svg,
          model,
          {
            width: r.width,
            height: r.height,
            valueBasedOpacity: r.valueBasedOpacity,
            valueComparedOpacity: r.valueComparedOpacity,
            patternsMapping: props.patternsMapping,
          },
          // Re-render once a hatch pattern image finishes loading so it paints.
          () => render()
        );
      }
    } else if (r.renderer === "canvas") {
      removeWebgpuCanvas();
      if (!canvas) canvas = makeLayerCanvas("comparable-bar-canvas");
      drawComparableCanvas(
        canvas,
        svg,
        model,
        {
          width: r.width,
          height: r.height,
          valueBasedOpacity: r.valueBasedOpacity,
          valueComparedOpacity: r.valueComparedOpacity,
          patternsMapping: props.patternsMapping,
        },
        // Re-render once a hatch pattern image finishes loading so it paints.
        () => render()
      );
    } else {
      removeCanvas();
      removeWebgpuCanvas();
    }

    context = buildComparableBarContext({
      title: props.title,
      renderer: r.renderer,
      xAxisDomain,
      points,
      colorsMapping: colors.generatedColorsMapping,
      disabledItems: props.disabledItems,
    });
    // Plugin hook #3 - enrichContext: rewrite summary BEFORE the a11y mirror + the
    // dataprocessed event, so narration flows to both for free.
    context = applyEnrichContext(pluginList, context, pc);
    renderA11yMirror(a11y, context);
    // Idempotent: only emit when the context changed (breaks the dispatch loop).
    const sig = contextSignature(context);
    if (sig !== lastContextSig) {
      lastContextSig = sig;
      props.onChartDataProcessed?.(context);
    }

    // Plugin hook #2 - validate: merge core checks with plugin warnings. Validate the
    // USER's data (baseProps), not the plugin-synthesised points.
    if (baseProps.onDataWarning) {
      const warnings = [
        ...checkData(baseProps.dataSet),
        ...collectValidate(pluginList, baseProps, pc),
      ];
      if (warnings.length > 0) baseProps.onDataWarning(warnings);
    }
  }

  render();
  const teardowns = setupPlugins(pluginList, pc);

  const instance = {
    update(next: ComparableBarChartProps) {
      baseProps = next;
      render();
    },
    getContext() {
      return context;
    },
    use(plugin: MichiVzPlugin<ComparableBarChartProps>) {
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
      host.removeEventListener("mouseleave", onHostLeave);
      host.removeEventListener("click", onHostClick);
      canvas = null;
      webgpuCanvas = null;
      clear(host);
      host.classList.remove("michi-vz", "michi-vz-comparable-bar-chart");
    },
  };

  return attachDevtools(instance, host, "comparable-horizontal-bar-chart", () => baseProps);
}
