// ComparableHorizontalBar engine: mount/update/getContext/destroy. Band y +
// linear x; two horizontal sub-bars per label in LIGHT DOM (SVG) or canvas.
import DOMPurify from "dompurify";
import { wireStickyDismiss } from "../render/stickyDismiss";
import { attachDevtools } from "../devtools/hook";
import { ensureStyles } from "../styles";
import { svgEl, htmlEl, clear } from "../dom";
import { defaultNumberFormatter } from "../i18n/formatters";
import { renderTitle, renderXAxisLinear, renderYAxisBand } from "../render/svg";
import { measureLabelWidth } from "../render/svg/measureLabelWidth";
import { ensurePatternDefs } from "../render/svg/patternDefs";
import { applyChartChrome, createChromeRefs } from "../render/chrome";
import { processComparableBarData } from "../comparableBar/data";
import { buildComparableBarColors } from "../comparableBar/colors";
import { createComparableBarScales } from "../comparableBar/scales";
import { buildComparableRenderModel } from "../comparableBar/renderModel";
import type { ComparableBarModel } from "../comparableBar/renderModel";
import { renderComparableSvg } from "../comparableBar/renderSvg";
import { drawComparableCanvas } from "../comparableBar/renderCanvas";
import { drawComparableBarWebgpu } from "../comparableBar/renderWebgpu";
import { renderComparableDeltaSvg } from "../comparableBar/renderDeltaSvg";
import type { ComparableDeltaGeometryOptions } from "../comparableBar/delta";
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
import {
  resolveTimeline,
  createEngineTimeline,
  type ResolvedTimeline,
} from "../animation/chartTimeline";
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
  layout: "overlay" | "grouped";
  /** Resolved from props.deltaIndicator; undefined when the prop is omitted or
   * `show: false` (provable no-op - no geometry computed, no DOM painted). */
  deltaIndicator?: ComparableDeltaGeometryOptions;
  timeline: ResolvedTimeline | null;
}

function defaultDeltaFormatter(
  p: ComparableBarChartProps,
): (diff: number, d: ComparableBarDataPoint) => string {
  const fmt = p.xAxisFormat ?? defaultNumberFormatter(p.locale);
  return (diff) => {
    const sign = diff > 0 ? "+" : diff < 0 ? "-" : "";
    return `${sign}${fmt(Math.abs(diff))}`;
  };
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
    layout: p.layout ?? "overlay",
    deltaIndicator: p.deltaIndicator?.show
      ? {
          positiveIsGood: p.deltaIndicator.positiveIsGood ?? true,
          positiveIsUp: p.deltaIndicator.positiveIsUp ?? true,
          formatter: p.deltaIndicator.formatter ?? defaultDeltaFormatter(p),
        }
      : undefined,
    timeline: resolveTimeline(p.timeline),
  };
}

function checkData(dataSet: ComparableBarDataPoint[]): DataWarning[] {
  const warnings: DataWarning[] = [];
  if (!dataSet || dataSet.length === 0) {
    warnings.push({
      type: "empty-dataset",
      message: "ComparableHorizontalBar received an empty dataSet.",
    });
    return warnings;
  }
  const seen = new Set<string>();
  for (const d of dataSet) {
    if (!Number.isFinite(d.valueBased) || !Number.isFinite(d.valueCompared)) {
      warnings.push({
        type: "non-finite-value",
        message: `"${d.label}" has a non-finite value.`,
        label: d.label,
      });
    }
    if (seen.has(d.label))
      warnings.push({
        type: "duplicate-label",
        message: `Duplicate label "${d.label}".`,
        label: d.label,
      });
    seen.add(d.label);
  }
  return warnings;
}

export function mountComparableHorizontalBarChart(
  host: HTMLElement,
  initial: ComparableBarChartProps,
  opts?: MountOptions<ComparableBarChartProps>,
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
    type?: "based" | "compared",
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
  const subBarTypeAt = (
    bar: ComparableBarModel,
    x: number,
    y: number,
  ): "based" | "compared" | undefined => {
    // compared is drawn in front; prefer it when the two overlap (overlay layout).
    // In grouped layout, based/compared occupy distinct y halves, so this also
    // naturally attributes a hover to the half the pointer is actually over.
    const inSeg = (s: { x: number; width: number; y: number; height: number }): boolean =>
      x >= s.x && x <= s.x + s.width && y >= s.y && y <= s.y + s.height;
    if (inSeg(bar.compared)) return "compared";
    if (inSeg(bar.based)) return "based";
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
      showTooltip(hit.raw, ev, subBarTypeAt(hit, x, y));
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
    // Uses the FULL (un-timelined) dataSet, so a period with rows drops into the
    // no-data overlay only when the whole dataSet is actually empty.
    applyChartChrome(host, props, props.dataSet, chrome);

    // Timeline (opt-in): swap in the active period's rows. ComparableBar's own
    // `filter` has no `date` field to neutralize, so it is left untouched.
    const tlData = engineTl.beforeRender(r.timeline, props.dataSet, undefined);

    // xAxisPredefinedDomain is the legacy alias the consumers pass; it wins over
    // xAxisDomain when it's a [min,max] pair.
    const predefined =
      props.xAxisPredefinedDomain && props.xAxisPredefinedDomain.length === 2
        ? ([props.xAxisPredefinedDomain[0], props.xAxisPredefinedDomain[1]] as [number, number])
        : undefined;
    const { points, labels, xAxisDomain } = processComparableBarData(tlData.dataSet, {
      disabledItems: props.disabledItems,
      filter: props.filter,
      xAxisDomain: predefined ?? props.xAxisDomain,
      symmetric: props.symmetricXDomain,
    });

    const colors = buildComparableBarColors(
      tlData.dataSet,
      props.colors,
      props.colorsMapping,
      props.skipColorMappingDispatch ?? false,
    );

    if (!props.skipColorMappingDispatch && props.onColorMappingGenerated) {
      const next = colors.generatedColorsMapping;
      if (JSON.stringify(next) !== JSON.stringify(lastColorMappingSent)) {
        lastColorMappingSent = { ...next };
        props.onColorMappingGenerated(next);
      }
    }

    const xFormat = props.xAxisFormat ?? defaultNumberFormatter(props.locale);
    const yFormat = props.yAxisFormat ?? ((d: number | string) => String(d));

    // Auto-fit the left gutter to the widest ROW label so long category names
    // (e.g. "Landlocked developing countries (LLDCs)") get a label box wide enough
    // to render on one line instead of being clipped to the fixed 120/100px default
    // and forced into the 2-line ellipsis. Only when the consumer left margin +
    // tickHtmlWidth at their defaults (an explicit margin/tickHtmlWidth is always
    // honoured verbatim). Capped at a fraction of the chart width so one very long
    // label can't eat the whole plot - the .mv-ylabel 2-line ellipsis stays the
    // safety net at the cap. Grows the gutter only, never shrinks below the default.
    const LEFT_LABEL_PAD = 16;
    const MAX_LEFT_FRACTION = 0.4;
    const widestLabel = labels.reduce((m, l) => Math.max(m, measureLabelWidth(yFormat(l))), 0);
    const autoLeft = Math.min(
      Math.round(r.width * MAX_LEFT_FRACTION),
      Math.max(r.margin.left, Math.ceil(widestLabel + LEFT_LABEL_PAD)),
    );
    const effMargin: Margin =
      props.margin?.left != null || autoLeft === r.margin.left
        ? r.margin
        : { ...r.margin, left: autoLeft };
    // Fill the (possibly widened) gutter with the label box so left-aligned labels
    // use the full width; respect an explicit tickHtmlWidth if the consumer set one.
    const effTickHtmlWidth = props.tickHtmlWidth != null ? r.tickHtmlWidth : effMargin.left;

    const scales = createComparableBarScales(
      xAxisDomain,
      labels,
      r.width,
      r.height,
      effMargin,
      r.padding,
      r.maxBarHeight,
    );
    model = buildComparableRenderModel(points, scales, colors, {
      highlightItems: props.highlightItems ?? [],
      minBarWidth: r.minBarWidth,
      colorsBasedMapping: props.colorsBasedMapping,
      layout: r.layout,
      deltaIndicator: r.deltaIndicator,
    });

    clear(svg);
    renderTitle(svg, { text: props.title, x: r.width / 2, y: effMargin.top / 2 });
    // maxTicks thins a dense/narrow value axis to a legible count, keeping the
    // first + last tick; autoRotate tilts -45deg only if the kept labels still
    // collide. Mirrors LineChart/AreaChart's identical width-based heuristic - a
    // no-op (byte-identical output) whenever the ticks already fit cleanly.
    const comparablePlotW = r.width - effMargin.left - effMargin.right;
    const comparableMaxTicks = comparablePlotW < 480 ? 3 : 5;
    renderXAxisLinear(svg, scales.xScale, {
      width: r.width,
      height: r.height,
      margin: effMargin,
      xAxisDataType: "number",
      format: (v) => xFormat(v),
      ticks: r.ticks,
      enableExplicitTickValues: false,
      showGrid: r.showGrid,
      showZeroLine: r.showZeroLineForXAxis,
      autoRotate: true,
      maxTicks: comparableMaxTicks,
    });
    // interactiveRowLabels: label hover/focus = leader line + row tooltip +
    // highlight; click pins (same sticky contract as the bars). Composed from the
    // row model, so it works in svg, canvas, and webgpu modes alike.
    const rowByLabel = new Map(model.bars.map((b) => [b.label, b]));
    const rowStartX = (label: string): number => {
      const b = rowByLabel.get(label);
      return b ? Math.min(b.based.x, b.compared.x) : effMargin.left;
    };
    const labelTooltipEvent = (x: number, rowCenterY: number): MouseEvent => {
      const hostRect = host.getBoundingClientRect();
      return { clientX: hostRect.left + x, clientY: hostRect.top + rowCenterY } as MouseEvent;
    };
    renderYAxisBand(svg, scales.yScale, {
      width: r.width,
      margin: effMargin,
      format: (label) => yFormat(label),
      tickHtmlWidth: effTickHtmlWidth,
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
              showTooltip(
                b.raw,
                (pointer as MouseEvent) ?? labelTooltipEvent(rowStartX(label), rowCenterY),
                "compared",
              );
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
              showTooltip(
                b.raw,
                (pointer as MouseEvent) ?? labelTooltipEvent(rowStartX(label), rowCenterY),
                "compared",
              );
            },
          }
        : undefined,
    });

    // Real <defs><pattern> SVG hatch fill for patternsMapping (svg mode only -
    // canvas/webgpu tile the same data-URI via ctx.createPattern instead).
    // Backported from ComparableVerticalBarChart's native implementation - this
    // SVG path previously ignored patternsMapping despite the prop's doc-comment
    // promising it (canvas mode already honoured it via drawComparableCanvas).
    const patternIds =
      r.renderer === "svg"
        ? ensurePatternDefs(svg, props.patternsMapping)
        : new Map<string, string>();

    if (r.renderer === "svg") {
      renderComparableSvg(
        svg,
        model,
        {
          valueBasedOpacity: r.valueBasedOpacity,
          valueComparedOpacity: r.valueComparedOpacity,
          enableTransitions: r.enableTransitions,
          patternIdFor: (label, safe) => patternIds.get(label) ?? patternIds.get(safe),
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
        },
      );
    }

    if (r.renderer === "webgpu") {
      if (!webgpuCanvas)
        webgpuCanvas = makeLayerCanvas("comparableHorizontalBarChart-webgpu-canvas");
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
          () => render(),
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
        () => render(),
      );
    } else {
      removeCanvas();
      removeWebgpuCanvas();
    }

    // Delta indicator: painted on the SVG scaffold layer unconditionally (same
    // treatment as title/axis text above), so it appears identically whichever
    // `renderer` painted the bars themselves. No-op when the prop is absent /
    // `show: false` (r.deltaIndicator is undefined -> model.bars[].delta is
    // undefined -> the loop below draws nothing).
    if (r.deltaIndicator) {
      renderComparableDeltaSvg(svg, model.bars);
    }

    // Legend keeps disabled labels (flagged) so a clicked pill dims in place
    // instead of vanishing and getting re-appended by the consumer (the VSB
    // 1.5.6 contract). Walk the pre-disable dataSet so a disabled label holds
    // its original slot; identical to the points order when nothing is disabled.
    const disabledSet = new Set(props.disabledItems ?? []);
    const visibleLabels = new Set(labels);
    const legendLabels =
      disabledSet.size > 0
        ? tlData.dataSet
            .map((d) => d.label)
            .filter((l) => visibleLabels.has(l) || disabledSet.has(l))
        : undefined;

    context = buildComparableBarContext({
      title: props.title,
      renderer: r.renderer,
      xAxisDomain,
      points,
      colorsMapping: colors.generatedColorsMapping,
      disabledItems: props.disabledItems,
      legendLabels,
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

    engineTl.afterRender(host, r.timeline);
  }

  render();
  const teardowns = setupPlugins(pluginList, pc);

  const instance: ChartInstance<ComparableBarChartProps> = {
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
      engineTl.destroy();
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
  // timeline() only exists when the chart opted into playback at mount, so
  // feature-off charts keep an unchanged instance surface.
  if (resolve(initial).timeline) {
    instance.timeline = () => engineTl.controller();
  }

  return attachDevtools(instance, host, "comparable-horizontal-bar-chart", () => baseProps);
}
