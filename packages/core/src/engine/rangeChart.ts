// RangeChart engine: mount/update/getContext/destroy. Per-series valueMin..valueMax
// bands (+ median lines) over a linear/time x. Reuses Line's scales. LIGHT DOM.
import DOMPurify from "dompurify";
import { wireStickyDismiss } from "../render/stickyDismiss";
import { attachDevtools } from "../devtools/hook";
import { ensureStyles } from "../styles";
import { svgEl, htmlEl, clear } from "../dom";
import { defaultXAxisFormatter, defaultNumberFormatter } from "../i18n/formatters";
import { renderTitle, renderXAxisLinear, renderYAxisLinear } from "../render/svg";
import { createLineScales } from "../lineChart/scales";
import { parseXValue } from "../lineChart/lineUtils";
import { processRangeData } from "../rangeChart/data";
import { buildRangeColors } from "../rangeChart/colors";
import { buildRangeRenderModel } from "../rangeChart/renderModel";
import { renderRangeSvg } from "../rangeChart/renderSvg";
import { drawRangeCanvas } from "../rangeChart/renderCanvas";
import { drawRangeWebgpu } from "../rangeChart/renderWebgpu";
import { resolveRenderer } from "../webgpu/capability";
import { resolveReveal, createEngineReveal, type ResolvedReveal } from "../animation/reveal";
import { resolveTimeline, type ResolvedTimeline } from "../animation/chartTimeline";
import { createCumulativeTimeline, type CumulativePeriod } from "../animation/cumulativeTimeline";
import { buildRangeContext } from "../context/buildRangeContext";
import { renderA11yMirror } from "../context/a11yMirror";
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
  DataWarning,
  Margin,
  MountOptions,
  RangeChartProps,
  RangeDataItem,
} from "../types";

const DEFAULT_MARGIN: Margin = { top: 50, right: 50, bottom: 50, left: 60 };

interface Resolved {
  width: number;
  height: number;
  margin: Margin;
  ticks: number;
  renderer: "svg" | "canvas" | "webgpu";
  fillOpacity: number;
  enableTransitions: boolean;
  progressiveDraw: ResolvedReveal | null;
  timeline: ResolvedTimeline | null;
}

function resolve(p: RangeChartProps): Resolved {
  return {
    width: p.width ?? 1000,
    height: p.height ?? 500,
    margin: p.margin ?? DEFAULT_MARGIN,
    ticks: p.ticks ?? 5,
    // EFFECTIVE renderer: an opt-in "webgpu" request downgrades to "canvas" when
    // WebGPU is unavailable, so everything downstream (incl. getContext().renderer)
    // reflects what actually painted.
    renderer: resolveRenderer(p.renderer),
    fillOpacity: p.fillOpacity ?? 0.8,
    enableTransitions: p.enableTransitions ?? true,
    progressiveDraw: resolveReveal(p.progressiveDraw),
    timeline: resolveTimeline(p.timeline),
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

export function mountRangeChart(
  host: HTMLElement,
  initial: RangeChartProps,
  opts?: MountOptions<RangeChartProps>
): ChartInstance<RangeChartProps> {
  ensureStyles();
  host.classList.add("michi-vz", "michi-vz-range-chart");

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

  // Opt-in progressive-draw reveal (generic engine helper: SVG clip / canvas redraw).
  const engineRv = createEngineReveal({ ticker: opts?.ticker, motion: opts?.motion });
  // Cumulative timeline (opt-in play-through-years): wins over progressiveDraw
  // when both are configured.
  const cumTl = createCumulativeTimeline({ ticker: opts?.ticker, motion: opts?.motion });

  let baseProps: RangeChartProps = initial;
  let context: ChartContext | null = null;
  const pluginList: MichiVzPlugin<RangeChartProps>[] = [...(opts?.plugins ?? [])];
  const pc: PluginContext<RangeChartProps> = {
    chartType: "range-chart",
    getProps: () => baseProps,
    getContext: () => context,
    setProps: (patch) => {
      baseProps = { ...baseProps, ...patch };
      render();
    },
  };
  let sticky = false;
  let lastColorMappingSent: Record<string, string> = {};

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

  const showTooltip = (label: string, ev: MouseEvent): void => {
    const r = host.getBoundingClientRect();
    tooltip.style.left = `${ev.clientX - r.left + 10}px`;
    tooltip.style.top = `${ev.clientY - r.top - 10}px`;
    const item = baseProps.dataSet.find((it) => it.label === label);
    const mid = item?.series[Math.floor(item.series.length / 2)];
    const htmlStr =
      baseProps.tooltipFormatter && item && mid
        ? baseProps.tooltipFormatter(mid, item)
        : `<strong>${label}</strong>` + (mid ? `<br/>${String(mid.date)}: ${mid.valueMin}-${mid.valueMax}` : "");
    tooltip.innerHTML = DOMPurify.sanitize(htmlStr);
    tooltip.style.visibility = "visible";
  };
  const hideTooltip = (): void => {
    if (sticky) return;
    tooltip.style.visibility = "hidden";
  };
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

    if (r.renderer === "svg") {
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

    if (r.renderer === "webgpu") {
      if (!webgpuCanvas) webgpuCanvas = makeLayerCanvas("range-chart-webgpu-canvas");
      const ready = drawRangeWebgpu(webgpuCanvas, svg, model, {
        width: r.width,
        height: r.height,
        fillOpacity: r.fillOpacity,
        // Re-render once the async GPU device resolves, upgrading canvas → GPU.
        onReady: render,
      });
      if (ready) {
        // GPU painted - drop any first-frame 2D fallback canvas.
        removeCanvas();
      } else {
        // Device not ready / unavailable (incl. jsdom): paint the canvas-2D stopgap
        // so the chart is never blank; the onReady re-render swaps in the GPU layer.
        if (!canvas) canvas = makeLayerCanvas("range-chart-canvas");
        drawRangeCanvas(canvas, svg, model, { width: r.width, height: r.height, fillOpacity: r.fillOpacity });
      }
    } else if (r.renderer === "canvas") {
      removeWebgpuCanvas();
      if (!canvas) canvas = makeLayerCanvas("range-chart-canvas");
      drawRangeCanvas(canvas, svg, model, { width: r.width, height: r.height, fillOpacity: r.fillOpacity });
    } else {
      removeCanvas();
      removeWebgpuCanvas();
    }

    // ----- Progressive draw (opt-in reveal animation) -----
    // SVG mode: clip g.range-chart-content; canvas mode: redraw under an equivalent
    // ctx.clip. WebGPU always paints the full frame instantly (no reveal there).
    // Timeline wins over progressiveDraw when both are configured.
    const canvasLayer = r.renderer === "canvas" ? canvas : null;
    engineRv.afterRender(r.timeline ? null : r.progressiveDraw, {
      renderer: r.renderer,
      svg,
      marksRoot: svg.querySelector("g.range-chart-content"),
      height: r.height,
      startPx: r.margin.left,
      endPx: r.width,
      canvasRedraw: canvasLayer
        ? (x) =>
            drawRangeCanvas(canvasLayer, svg, model, {
              width: r.width,
              height: r.height,
              fillOpacity: r.fillOpacity,
              revealX: x,
            })
        : undefined,
    });

    // ----- Cumulative timeline (opt-in play-through-years) -----
    // The bands draw UP TO the active year; play/scrub sweeps the same reveal
    // clip progressiveDraw uses. Data + getContext() stay full (visual only).
    if (r.timeline && r.renderer !== "webgpu") {
      const periodMap = new Map<string, CumulativePeriod>();
      for (const it of items) {
        for (const p of it.series) {
          const key = String(p.date);
          const px = (scales.xScale as (x: number | Date) => number)(
            parseXValue(p.date, xAxisDataType)
          );
          const existing = periodMap.get(key);
          if (!existing || px > existing.px) periodMap.set(key, { period: p.date, px });
        }
      }
      const periods = Array.from(periodMap.values()).sort((a, b) => a.px - b.px);
      cumTl.afterRender(r.timeline, {
        host,
        renderer: r.renderer,
        svg,
        marksRoot: svg.querySelector("g.range-chart-content"),
        height: r.height,
        periods,
        startPx: r.margin.left,
        endPx: r.width,
        canvasRedraw: canvasLayer
          ? (x) =>
              drawRangeCanvas(canvasLayer, svg, model, {
                width: r.width,
                height: r.height,
                fillOpacity: r.fillOpacity,
                revealX: x,
              })
          : undefined,
      });
    } else {
      cumTl.afterRender(null, {
        host,
        renderer: r.renderer,
        svg,
        marksRoot: null,
        height: r.height,
        periods: [],
        startPx: 0,
        endPx: 0,
      });
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
    // Plugin hook #3 - enrichContext: rewrite summary BEFORE the a11y mirror + the
    // dataprocessed event, so narration flows to both for free.
    context = applyEnrichContext(pluginList, context, pc);
    renderA11yMirror(a11y, context);
    props.onChartDataProcessed?.(context);

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

  const instance: ChartInstance<RangeChartProps> = {
    update(next: RangeChartProps) {
      baseProps = next;
      render();
    },
    getContext() {
      return context;
    },
    use(plugin: MichiVzPlugin<RangeChartProps>) {
      pluginList.push(plugin);
      const t = plugin.setup?.(pc);
      if (typeof t === "function") teardowns.push(t);
      render();
    },
    getTools(): AgentTool[] {
      return collectTools(pluginList, pc);
    },
    destroy() {
      engineRv.stop();
      cumTl.destroy();
      disposeStickyDismiss();
      for (const t of teardowns) t();
      canvas = null;
      webgpuCanvas = null;
      clear(host);
      host.classList.remove("michi-vz", "michi-vz-range-chart");
    },
  };
  // replay()/timeline() only exist when the chart opted into the respective
  // animation, so feature-off charts keep an unchanged instance surface.
  if (resolve(initial).progressiveDraw) {
    instance.replay = () => engineRv.replay();
  }
  if (resolve(initial).timeline) {
    instance.timeline = () => cumTl.controller();
  }

  return attachDevtools(instance, host, "range-chart", () => baseProps);
}
