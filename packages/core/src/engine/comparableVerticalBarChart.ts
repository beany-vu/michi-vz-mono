// ComparableVerticalBar engine: mount/update/getContext/destroy. Band x
// (categories) + linear y; two FULL-BANDWIDTH overlapping vertical sub-bars per
// category (valueBased, valueCompared - per-row z-order, shorter on top) in
// LIGHT DOM (SVG) or canvas. The vertical sibling of ComparableHorizontalBarChart -
// see comparableVerticalBar/renderModel.ts for the geometry note ported from
// legacy sdg-trade BarchartVertical/Chart.js.
import DOMPurify from "dompurify";
import { wireStickyDismiss } from "../render/stickyDismiss";
import { attachDevtools } from "../devtools/hook";
import { ensureStyles } from "../styles";
import { svgEl, htmlEl, clear } from "../dom";
import { defaultNumberFormatter } from "../i18n/formatters";
import { renderTitle, renderXAxisBand, renderYAxisLinear } from "../render/svg";
import { chooseAxisMode } from "../render/svg/chooseAxisMode";
import { measureLabelWidth } from "../render/svg/measureLabelWidth";
import { ensurePatternDefs } from "../render/svg/patternDefs";
import { applyChartChrome, createChromeRefs } from "../render/chrome";
import { processComparableVerticalBarData } from "../comparableVerticalBar/data";
import { buildComparableBarColors } from "../comparableBar/colors";
import { createComparableVerticalBarScales } from "../comparableVerticalBar/scales";
import { buildComparableVerticalRenderModel } from "../comparableVerticalBar/renderModel";
import type { ComparableVerticalBarModel } from "../comparableVerticalBar/renderModel";
import { renderComparableVerticalSvg } from "../comparableVerticalBar/renderSvg";
import { drawComparableVerticalCanvas } from "../comparableVerticalBar/renderCanvas";
import { drawComparableVerticalBarWebgpu } from "../comparableVerticalBar/renderWebgpu";
import { renderComparableVerticalDeltaSvg } from "../comparableVerticalBar/renderDeltaSvg";
import type { ComparableDeltaGeometryOptions } from "../comparableBar/delta";
import { resolveRenderer } from "../webgpu/capability";
import { buildComparableVerticalBarContext } from "../context/buildComparableVerticalBarContext";
import { renderA11yMirror } from "../context/a11yMirror";
import { contextSignature } from "../context/signature";
import { checkComparableVerticalBarData } from "../validate/comparableVerticalBarWarnings";
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
  ComparableBarDataPoint,
  ComparableVerticalBarChartProps,
  DataWarning,
  Filter,
  Margin,
  MountOptions,
  Renderer,
} from "../types";

const DEFAULT_MARGIN: Margin = { top: 50, right: 50, bottom: 100, left: 60 };

// canvas + webgpu both paint into a <canvas> layer (no DOM marks), so they share
// the host-level hit-test / click-to-pin interaction path. svg does not.
const isPainted = (rr: Renderer): boolean => rr === "canvas" || rr === "webgpu";

interface Resolved {
  width: number;
  height: number;
  margin: Margin;
  ticks: number;
  renderer: Renderer;
  valueBasedOpacity: number;
  valueComparedOpacity: number;
  enableTransitions: boolean;
  showZeroLineForYAxis: boolean;
  showGrid: boolean;
  hideTickLabels: boolean;
  minBarHeight: number;
  maxBarWidth?: number;
  xAxisLabelPadding?: number;
  xAxisMode?: "auto" | "horizontal";
  /** Resolved from props.deltaIndicator; undefined when the prop is omitted or
   * `show: false` (provable no-op - no geometry computed, no DOM painted). */
  deltaIndicator?: ComparableDeltaGeometryOptions;
  timeline: ResolvedTimeline | null;
}

function defaultDeltaFormatter(
  p: ComparableVerticalBarChartProps,
): (diff: number, d: ComparableBarDataPoint) => string {
  const fmt = p.yAxisFormat ?? defaultNumberFormatter(p.locale);
  return (diff) => {
    const sign = diff > 0 ? "+" : diff < 0 ? "-" : "";
    return `${sign}${fmt(Math.abs(diff))}`;
  };
}

function resolve(p: ComparableVerticalBarChartProps): Resolved {
  return {
    width: p.width ?? 900,
    height: p.height ?? 480,
    margin: p.margin ?? DEFAULT_MARGIN,
    ticks: p.ticks ?? 5,
    // EFFECTIVE renderer: an opt-in "webgpu" request downgrades to "canvas" when
    // WebGPU is unavailable, so everything downstream (incl. getContext().renderer)
    // reflects what actually painted.
    renderer: resolveRenderer(p.renderer),
    valueBasedOpacity: p.valueBasedOpacity ?? 0.45,
    valueComparedOpacity: p.valueComparedOpacity ?? 0.9,
    enableTransitions: p.enableTransitions ?? true,
    showZeroLineForYAxis: p.showZeroLineForYAxis ?? false,
    showGrid: p.showGrid ?? false,
    hideTickLabels: p.hideTickLabels ?? false,
    minBarHeight: p.minBarHeight ?? 5,
    maxBarWidth: p.maxBarWidth,
    xAxisLabelPadding: p.xAxisLabelPadding,
    xAxisMode: p.xAxisMode,
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

export function mountComparableVerticalBarChart(
  host: HTMLElement,
  initial: ComparableVerticalBarChartProps,
  opts?: MountOptions<ComparableVerticalBarChartProps>,
): ChartInstance<ComparableVerticalBarChartProps> {
  ensureStyles();
  host.classList.add("michi-vz", "michi-vz-comparable-vertical-bar-chart");

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

  let baseProps: ComparableVerticalBarChartProps = initial;
  let context: ChartContext | null = null;
  const pluginList: MichiVzPlugin<ComparableVerticalBarChartProps>[] = [...(opts?.plugins ?? [])];
  const pc: PluginContext<ComparableVerticalBarChartProps> = {
    chartType: "comparable-vertical-bar-chart",
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
  let lastColorMappingSent: Record<string, string> = {};
  // Signature of the last context emitted, so onChartDataProcessed only fires when
  // the context actually changes (breaks a consumer colour-authority dispatch loop).
  let lastContextSig = "";
  let model: ReturnType<typeof buildComparableVerticalRenderModel> | null = null;

  // Lazily create an absolutely-positioned <canvas> layered behind the SVG,
  // matching the host padding (shared by canvas mode + the webgpu fallback + the
  // webgpu layer).
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
    // Edge-aware position: flip left near the right edge, above near the bottom.
    const r = host.getBoundingClientRect();
    const x = ev.clientX - r.left;
    const y = ev.clientY - r.top;
    const tw = tooltip.offsetWidth;
    const th = tooltip.offsetHeight;
    tooltip.style.left = `${x + tw + 10 > r.width ? Math.max(0, x - tw - 10) : x + 10}px`;
    tooltip.style.top = `${y - th - 10 < 0 ? y + 10 : y - th - 10}px`;
  };
  const subBarTypeAt = (
    bar: ComparableVerticalBarModel,
    x: number,
    y: number,
  ): "based" | "compared" | undefined => {
    // compared is drawn in front; prefer it when the two overlap (full-bandwidth overlay).
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
    if (!isPainted(resolve(baseProps).renderer) || !model || sticky) return;
    const svgRect = svg.getBoundingClientRect();
    const x = ev.clientX - svgRect.left;
    const y = ev.clientY - svgRect.top;
    let hit: ComparableVerticalBarModel | null = null;
    for (const bar of model.bars) {
      if (x >= bar.x && x <= bar.x + bar.width) {
        const top = Math.min(bar.based.y, bar.compared.y);
        const bottom = Math.max(
          bar.based.y + bar.based.height,
          bar.compared.y + bar.compared.height,
        );
        if (y >= top && y <= bottom) {
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
    const dataState = applyChartChrome(host, props, props.dataSet, chrome);

    // Timeline (opt-in): swap in the active period's rows; the user's own filter
    // still applies within the period (its `date` is neutralized while playing).
    // This chart's own `filter` shape has no `date` field (unlike the shared
    // `Filter` type engineTl speaks) - cast across the boundary; the neutralize
    // check is simply a no-op here.
    const tlData = engineTl.beforeRender(
      r.timeline,
      props.dataSet,
      props.filter as unknown as Filter | undefined,
    );
    const { points, labels, yAxisDomain } = processComparableVerticalBarData(tlData.dataSet, {
      disabledItems: props.disabledItems,
      filter: tlData.filter as unknown as ComparableVerticalBarChartProps["filter"],
      yAxisDomain: props.yAxisDomain,
      symmetric: props.symmetricYDomain,
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

    const xFormat = props.xAxisFormat ?? ((d: string) => d);
    const yFormat = props.yAxisFormat ?? defaultNumberFormatter(props.locale);

    // Band x-axis layout (ported from legacy VerticalStackBar convention): fit
    // labels horizontally, else rotate -45° (all labels), else thin to a
    // readable subset. Reserve bottom margin for rotated labels so they don't
    // clip. bandWidth = xScale.step() is independent of margin.bottom, so
    // deciding the mode before the final scales is safe (no feedback loop).
    let margin = r.margin;
    let scales = createComparableVerticalBarScales(
      labels,
      yAxisDomain,
      r.width,
      r.height,
      margin,
      r.maxBarWidth,
    );
    const axis = r.hideTickLabels
      ? { mode: "horizontal" as const, tickValues: [] as string[] }
      : chooseAxisMode({
          domain: labels,
          formatter: (d) => xFormat(d),
          bandWidth: scales.xScale.step(),
          measure: measureLabelWidth,
          padding: r.xAxisLabelPadding,
          forceMode: r.xAxisMode,
        });
    if (axis.mode === "rotated") {
      const maxLabelWidth = axis.tickValues.reduce(
        (m, v) => Math.max(m, measureLabelWidth(xFormat(v))),
        0,
      );
      // 25 (axis offset) + 14 (label translate) + label·sin45 + 12 (descender pad)
      const required = Math.ceil(25 + 14 + maxLabelWidth * Math.SQRT1_2 + 12);
      if (required > margin.bottom) {
        margin = { ...margin, bottom: required };
        scales = createComparableVerticalBarScales(
          labels,
          yAxisDomain,
          r.width,
          r.height,
          margin,
          r.maxBarWidth,
        );
      }
    }

    model = buildComparableVerticalRenderModel(points, scales, colors, {
      highlightItems: props.highlightItems ?? [],
      minBarHeight: r.minBarHeight,
      colorsBasedMapping: props.colorsBasedMapping,
      deltaIndicator: r.deltaIndicator,
    });

    clear(svg);
    renderTitle(svg, { text: props.title, x: r.width / 2, y: margin.top / 2 });

    // No-data: render only the title; the overlay covers the rest.
    if (dataState !== "nodata") {
      renderXAxisBand(svg, scales.xScale, {
        width: r.width,
        height: r.height,
        margin,
        format: (label) => xFormat(label),
        mode: r.hideTickLabels ? "horizontal" : axis.mode,
        tickValues: r.hideTickLabels ? [] : axis.tickValues,
      });
      renderYAxisLinear(svg, scales.yScale, {
        width: r.width,
        height: r.height,
        margin,
        format: (v) => yFormat(v),
        ticks: r.ticks,
        showGrid: r.showGrid,
        highlightZeroLine: r.showZeroLineForYAxis,
      });

      // Real <defs><pattern> SVG hatch fill for patternsMapping (svg mode only -
      // canvas/webgpu tile the same data-URI via ctx.createPattern instead).
      const patternIds =
        r.renderer === "svg"
          ? ensurePatternDefs(svg, props.patternsMapping)
          : new Map<string, string>();

      if (r.renderer === "svg") {
        renderComparableVerticalSvg(
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
        if (!webgpuCanvas) webgpuCanvas = makeLayerCanvas("comparable-vertical-bar-webgpu-canvas");
        const ready = drawComparableVerticalBarWebgpu(webgpuCanvas, svg, model, {
          width: r.width,
          height: r.height,
          valueBasedOpacity: r.valueBasedOpacity,
          valueComparedOpacity: r.valueComparedOpacity,
          // Re-render once the async GPU device resolves, upgrading canvas -> GPU.
          onReady: render,
        });
        if (ready) {
          // GPU painted - drop any first-frame 2D fallback canvas.
          removeCanvas();
        } else {
          // Device not ready / unavailable (incl. jsdom): paint the canvas-2D
          // stopgap so the chart is never blank; the onReady re-render swaps in
          // the GPU layer.
          if (!canvas) canvas = makeLayerCanvas("comparable-vertical-bar-canvas");
          drawComparableVerticalCanvas(
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
        if (!canvas) canvas = makeLayerCanvas("comparable-vertical-bar-canvas");
        drawComparableVerticalCanvas(
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
        renderComparableVerticalDeltaSvg(svg, model.bars);
      }
    } else {
      removeCanvas();
      removeWebgpuCanvas();
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

    context = buildComparableVerticalBarContext({
      title: props.title,
      renderer: r.renderer,
      yAxisDomain,
      points,
      colorsMapping: colors.generatedColorsMapping,
      disabledItems: props.disabledItems,
      legendLabels,
      deltaIndicator: r.deltaIndicator,
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
      const warnings: DataWarning[] = [
        ...checkComparableVerticalBarData(baseProps.dataSet),
        ...collectValidate(pluginList, baseProps, pc),
      ];
      if (warnings.length > 0) baseProps.onDataWarning(warnings);
    }

    engineTl.afterRender(host, r.timeline);
  }

  render();
  const teardowns = setupPlugins(pluginList, pc);

  const instance: ChartInstance<ComparableVerticalBarChartProps> = {
    update(next: ComparableVerticalBarChartProps) {
      baseProps = next;
      render();
    },
    getContext() {
      return context;
    },
    use(plugin: MichiVzPlugin<ComparableVerticalBarChartProps>) {
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
      host.classList.remove("michi-vz", "michi-vz-comparable-vertical-bar-chart");
    },
  };
  // timeline() only exists when the chart opted into playback at mount, so
  // feature-off charts keep an unchanged instance surface.
  if (resolve(initial).timeline) {
    instance.timeline = () => engineTl.controller();
  }

  return attachDevtools(instance, host, "comparable-vertical-bar-chart", () => baseProps);
}
