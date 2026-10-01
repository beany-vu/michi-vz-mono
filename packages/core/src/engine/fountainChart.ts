// FountainChart ("Jet d'Eau") engine: mount/update/getContext/destroy. One jet per
// data item; categorical x = snapshot, temporal/numeric x = trend. LIGHT DOM.
//
// One render model (fountainChart/renderModel.ts) is drawn by svg, canvas or webgpu;
// the words around it (value labels, reference labels, the y title, the reading
// guide) are planned first (frame.ts, layout.ts), so the margins they need are
// reserved before the scales are built, and are always SVG.
//
// Interaction is ONE host-level handler for every renderer (audit fountain #6):
// hitTestFountain by column, capped by the timeline / progressive-draw reveal; the
// tooltip (default words from labels.ts, or tooltipFormatter) follows the pointer via
// placeTooltip; click or tap pins it or moves the pin; clicking the pinned jet or empty
// space, Escape, or a click outside the chart unpins; leaving the host hides it.
// onHighlightItem fires only when the target changes; every resolved hover is
// reported to the devtools hit channel.
import DOMPurify from "dompurify";
import { wireStickyDismiss } from "../render/stickyDismiss";
import { placeTooltip } from "../render/placeTooltip";
import { attachDevtools, reportDevtoolsHit } from "../devtools/hook";
import { ensureStyles } from "../styles";
import { applyHostDefaults } from "../theme/defaults";
import { svgEl, htmlEl, clear } from "../dom";
import { defaultNumberFormatter } from "../i18n/formatters";
import { renderTitle, renderXAxisBand, renderXAxisLinear, renderYAxisLinear } from "../render/svg";
import { applyChartChrome, createChromeRefs } from "../render/chrome";
import { shouldSkipScaffold } from "../state/dataState";
import { resolveFountainData, type FountainResolvedJet } from "../fountainChart/data";
import { buildFountainColors } from "../fountainChart/colors";
import { fountainPeriodTicks, fountainYDomain, type FountainScales } from "../fountainChart/scales";
import { buildFountainRenderModel } from "../fountainChart/renderModel";
import type {
  FountainDotCache,
  FountainJetModel,
  FountainRenderModel,
} from "../fountainChart/renderModel";
import { hitTestFountain } from "../fountainChart/hitTest";
import {
  fountainPeriodLabel,
  fountainTooltipHtml,
  fountainTooltipLines,
  fountainValueFormatter,
  resolveFountainWords,
} from "../fountainChart/labels";
import { buildFountainTextModel, fountainTextMeasure } from "../fountainChart/layout";
import { planFountainFrame } from "../fountainChart/frame";
import { fountainHostMeasure } from "../fountainChart/measure";
import { checkFountainData } from "../validate/fountainWarnings";
import {
  gateFountainText,
  renderFountainSvg,
  renderFountainSvgText,
} from "../fountainChart/renderSvg";
import { drawFountainCanvas, type FountainPaintTheme } from "../fountainChart/renderCanvas";
import { drawFountainWebgpu } from "../fountainChart/renderWebgpu";
import { resolveRenderer } from "../webgpu/capability";
import { resolveReveal, createEngineReveal, type ResolvedReveal } from "../animation/reveal";
import { resolveTimeline, type ResolvedTimeline } from "../animation/chartTimeline";
import { createCumulativeTimeline, type CumulativePeriod } from "../animation/cumulativeTimeline";
import { buildFountainContext } from "../context/buildFountainContext";
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
  DataWarning,
  FountainChartProps,
  FountainTooltipJet,
  Margin,
  MountOptions,
} from "../types";

const DEFAULT_MARGIN: Margin = { top: 50, right: 40, bottom: 50, left: 60 };

interface Resolved {
  width: number;
  height: number;
  margin: Margin;
  ticks: number;
  showRange: boolean;
  showSamples: boolean;
  showValueLabels: boolean;
  drift: boolean;
  /** undefined = the model default (on in trend mode, off in snapshot mode) */
  showTrendLine: boolean | undefined;
  renderer: "svg" | "canvas" | "webgpu";
  enableTransitions: boolean;
  progressiveDraw: ResolvedReveal | null;
  timeline: ResolvedTimeline | null;
}

function resolve(p: FountainChartProps): Resolved {
  return {
    width: p.width ?? 900,
    height: p.height ?? 480,
    margin: p.margin ?? DEFAULT_MARGIN,
    ticks: p.ticks ?? 5,
    showRange: p.showRange ?? true,
    showSamples: p.showSamples ?? true,
    showValueLabels: p.showValueLabels ?? true,
    drift: p.drift ?? false,
    showTrendLine: p.showTrendLine,
    // An opt-in "webgpu" request downgrades to "canvas" when WebGPU is unavailable.
    renderer: resolveRenderer(p.renderer),
    enableTransitions: p.enableTransitions ?? true,
    progressiveDraw: resolveReveal(p.progressiveDraw),
    timeline: resolveTimeline(p.timeline),
  };
}

/** A theme colour from the host's CSS custom property, else the default. */
function themeColor(cs: CSSStyleDeclaration, name: string, fallback: string): string {
  return (cs.getPropertyValue(name) || "").trim() || fallback;
}

export function mountFountainChart(
  host: HTMLElement,
  initial: FountainChartProps,
  opts?: MountOptions<FountainChartProps>,
): ChartInstance<FountainChartProps> {
  ensureStyles();
  applyHostDefaults(host);
  host.classList.add("michi-vz", "michi-vz-fountain-chart");

  const svg = svgEl("svg");
  const tooltip = htmlEl("div", { class: "tooltip" });
  tooltip.style.visibility = "hidden";
  const a11y = htmlEl("div", { class: "mv-a11y" });
  a11y.setAttribute("role", "img");
  let canvas: HTMLCanvasElement | null = null;
  let webgpuCanvas: HTMLCanvasElement | null = null;
  const chrome = createChromeRefs();

  host.appendChild(svg);
  host.appendChild(tooltip);
  host.appendChild(a11y);

  let baseProps: FountainChartProps = initial;
  let context: ChartContext | null = null;
  let lastContextSig = "";
  const pluginList: MichiVzPlugin<FountainChartProps>[] = [...(opts?.plugins ?? [])];
  const pc: PluginContext<FountainChartProps> = {
    chartType: "fountain-chart",
    getProps: () => baseProps,
    getContext: () => context,
    setProps: (patch) => {
      baseProps = { ...baseProps, ...patch };
      render();
    },
  };
  let lastColorMappingSent: Record<string, string> = {};
  let model: FountainRenderModel | null = null;
  // Packed small dots per jet, reused while nothing that places them changes (an
  // update that only highlights, e.g. onHighlightItem echoed into highlightItems).
  const dotCache: FountainDotCache = new Map();
  // Per render: the resolved jet behind each model jet (the tooltip's period).
  let sourceOf = new Map<number, FountainResolvedJet>();
  let temporalType: ReturnType<typeof resolveFountainData>["temporalType"] = null;
  const engineRv = createEngineReveal({ ticker: opts?.ticker, motion: opts?.motion });
  // Cumulative timeline (opt-in play-through-years): TREND mode only; snapshot mode
  // passes no periods so the control tears down. Wins over progressiveDraw.
  const cumTl = createCumulativeTimeline({ ticker: opts?.ticker, motion: opts?.motion });

  // Lazily create an absolutely-positioned <canvas> over the SVG (pointer events off),
  // matching the host padding (shared by canvas mode and the webgpu fallback).
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
    canvas?.remove();
    canvas = null;
  };
  const removeWebgpuCanvas = (): void => {
    webgpuCanvas?.remove();
    webgpuCanvas = null;
  };

  // ----- interaction (one host-level path for every renderer) -----
  let pinnedIndex: number | null = null;
  let highlightKey = ""; // the last label list sent to onHighlightItem ("" = [])

  const emitHighlight = (labels: string[]): void => {
    const key = labels.join("\u0000");
    if (key === highlightKey) return;
    highlightKey = key;
    baseProps.onHighlightItem?.(labels);
  };

  const tooltipHtml = (jet: FountainJetModel): string => {
    const p = baseProps;
    const src = sourceOf.get(jet.index);
    const period = src ? fountainPeriodLabel(src, temporalType, p.xAxisFormat, p.locale) : null;
    const lines = fountainTooltipLines(jet, {
      format: fountainValueFormatter(p.yAxisFormat, p.locale),
      words: resolveFountainWords(p),
      referenceLines: p.referenceLines,
      showRange: p.showRange,
      period,
    });
    if (!p.tooltipFormatter) return fountainTooltipHtml(lines);
    const drawn: FountainTooltipJet = {
      label: jet.label,
      code: jet.code,
      color: jet.color,
      value: jet.value,
      low: jet.low,
      high: jet.high,
      samples: [...jet.samples],
      forecast: jet.forecast,
      period,
      referenceCounts: jet.referenceCounts,
      lines: lines.map((l) => l.text),
    };
    // The item with its resolved value: the median of the samples when it gives none.
    return p.tooltipFormatter({ ...jet.item, value: jet.value }, drawn);
  };
  const showTooltip = (jet: FountainJetModel, ev: MouseEvent): void => {
    tooltip.innerHTML = DOMPurify.sanitize(tooltipHtml(jet));
    tooltip.style.visibility = "visible";
    placeTooltip(host, tooltip, ev);
  };
  const hideTooltip = (): void => {
    tooltip.style.visibility = "hidden";
  };

  const onKeyDown = (ev: KeyboardEvent): void => {
    if (ev.key === "Escape") unpin();
  };
  // Clear the pin state; the Escape listener only lives while something is pinned.
  const releasePin = (): void => {
    pinnedIndex = null;
    if (typeof document !== "undefined") document.removeEventListener("keydown", onKeyDown);
  };
  function unpin(): void {
    if (pinnedIndex === null) return;
    releasePin();
    tooltip.classList.remove("sticky");
    hideTooltip();
    emitHighlight([]);
  }
  const pin = (jet: FountainJetModel, ev: MouseEvent): void => {
    if (pinnedIndex === null && typeof document !== "undefined") {
      document.addEventListener("keydown", onKeyDown);
    }
    pinnedIndex = jet.index;
    tooltip.classList.add("sticky");
    showTooltip(jet, ev);
    emitHighlight([jet.label]);
  };

  /** The jet under the pointer (reported to devtools), capped by any running reveal. */
  const hitAt = (ev: MouseEvent): FountainJetModel | null => {
    if (!model) return null;
    const rect = svg.getBoundingClientRect();
    const x = ev.clientX - rect.left;
    const y = ev.clientY - rect.top;
    const cap = cumTl.getRevealX() ?? engineRv.getRevealX();
    const hit = hitTestFountain(model, x, y, cap);
    reportDevtoolsHit(host, x, y, hit ? hit.label : null);
    return hit;
  };
  const inTooltip = (ev: Event): boolean => tooltip.contains(ev.target as Node);

  const onHostMove = (ev: MouseEvent): void => {
    if (!model || inTooltip(ev)) return;
    const hit = hitAt(ev);
    svg.style.cursor = hit ? "pointer" : "";
    if (pinnedIndex !== null) return;
    if (hit) {
      showTooltip(hit, ev);
      emitHighlight([hit.label]);
    } else {
      hideTooltip();
      emitHighlight([]);
    }
  };
  const onHostClick = (ev: MouseEvent): void => {
    // Clicks on the pinned tooltip itself belong to wireStickyDismiss.
    if (!model || inTooltip(ev)) return;
    const hit = hitAt(ev);
    if (hit && hit.index !== pinnedIndex) pin(hit, ev);
    else unpin();
  };
  const onHostLeave = (): void => {
    svg.style.cursor = "";
    if (pinnedIndex !== null) return;
    hideTooltip();
    emitHighlight([]);
  };
  host.addEventListener("mousemove", onHostMove);
  host.addEventListener("click", onHostClick);
  host.addEventListener("mouseleave", onHostLeave);
  const disposeStickyDismiss = wireStickyDismiss(host, tooltip, {
    isSticky: () => pinnedIndex !== null,
    unpin: () => {
      releasePin();
      emitHighlight([]);
    },
  });

  function render(): void {
    // Plugin hook #1 - transformData.
    const props = applyTransformData(pluginList, baseProps, pc);
    const r = resolve(props);
    svg.setAttribute("width", String(r.width));
    svg.setAttribute("height", String(r.height));
    svg.style.position = "relative";
    clear(svg);

    // data-mv-state + font + the default loading / no-data overlays.
    const dataState = applyChartChrome(host, props, props.dataSet, chrome);
    const skipScaffold = shouldSkipScaffold(dataState, props.dataSet);

    const resolved = resolveFountainData(props.dataSet, {
      xAxisDataType: props.xAxisDataType,
      disabledItems: props.disabledItems,
    });
    temporalType = resolved.temporalType;
    sourceOf = new Map(resolved.jets.map((j) => [j.index, j]));

    // Colours from the UNFILTERED dataSet, so disabling never recolours the others.
    const colors = buildFountainColors(
      props.dataSet,
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

    const words = resolveFountainWords(props);
    const format = fountainValueFormatter(props.yAxisFormat, props.locale);
    const yFormat = props.yAxisFormat ?? defaultNumberFormatter(props.locale);
    const yDomain = fountainYDomain(resolved.jets, {
      referenceLines: props.referenceLines,
      showRange: r.showRange,
      yAxisDomain: props.yAxisDomain,
    });
    const layoutWarnings: DataWarning[] = [];
    let scales: FountainScales | null = null;
    let painted: "svg" | "canvas" | "webgpu" = r.renderer;

    renderTitle(svg, { text: props.title, x: r.width / 2, y: r.margin.top / 2 });

    if (skipScaffold) {
      // Loading with nothing to show yet, or no data: the overlay only.
      model = null;
      removeCanvas();
      removeWebgpuCanvas();
      engineRv.afterRender(null, {
        renderer: r.renderer,
        svg,
        marksRoot: null,
        height: r.height,
        startPx: 0,
        endPx: r.width,
      });
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
    } else {
      // ----- the frame: margins for the words, then the final scales -----
      // Every word is measured in the page's font, so the margins reserved for it hold.
      const measure = fountainHostMeasure(host);
      const frame = planFountainFrame({
        resolved,
        yDomain,
        yAxisDomainGiven: !!props.yAxisDomain,
        width: r.width,
        height: r.height,
        margin: r.margin,
        ticks: r.ticks,
        words,
        format,
        yFormat: (v: number) => yFormat(v),
        xAxisFormat: props.xAxisFormat,
        locale: props.locale,
        referenceLines: props.referenceLines,
        showRange: r.showRange,
        showSamples: r.showSamples,
        showValueLabels: r.showValueLabels,
        yAxisTitle: props.yAxisTitle,
        readingGuide: props.readingGuide,
        measure: measure.regular,
        measureBold: measure.bold,
      });
      layoutWarnings.push(...frame.warnings);
      const { margin } = frame;
      const sc = frame.scales;
      scales = sc;

      const built = buildFountainRenderModel(resolved, sc, colors, {
        showRange: r.showRange,
        showSamples: r.showSamples,
        showValueLabels: r.showValueLabels,
        drift: r.drift,
        showTrendLine: r.showTrendLine,
        highlightItems: props.highlightItems ?? [],
        referenceLines: props.referenceLines,
        readingGuide: props.readingGuide,
        format,
        words,
        dotCache,
      });
      model = built;

      const text = buildFountainTextModel(built, {
        valueFit: frame.valueFit,
        bottom: frame.bottom,
        measure: fountainTextMeasure(measure.regular, measure.bold),
        referenceWidth: frame.referenceWidth,
        yTitle:
          props.yAxisTitle && frame.yTitleX !== null
            ? { text: props.yAxisTitle, x: frame.yTitleX }
            : null,
        guideLines: frame.guideLines,
        width: r.width,
        axisNotes: frame.axisNotes,
      });

      // ----- axes -----
      const xAxis = frame.xAxis;
      if (xAxis?.kind === "linear" && sc.xLinear && resolved.temporalType) {
        renderXAxisLinear(svg, sc.xLinear, {
          width: r.width,
          height: r.height,
          margin,
          xAxisDataType: resolved.temporalType,
          format: xAxis.label,
          ticks: r.ticks,
          // One tick per data period (first and last always kept), as Line does.
          tickValues:
            props.tickValues ?? fountainPeriodTicks(resolved.periods, resolved.temporalType),
          enableExplicitTickValues: true,
          // No vertical grid and no tick dots: the stems already mark the periods, and
          // a grey dot under each would read as one more measurement.
          showGrid: false,
          tickDots: false,
          autoRotate: true,
          // Tilts exactly when the frame planned it (the same measure).
          measure: measure.regular,
          maxTicks: sc.plot.right - sc.plot.left < 480 ? 3 : 5,
        });
      } else if (xAxis?.kind === "band" && sc.xBand) {
        renderXAxisBand(svg, sc.xBand, {
          width: r.width,
          height: r.height,
          margin,
          format: xAxis.label,
          mode: xAxis.mode,
          tickValues: xAxis.tickValues,
        });
      }
      renderYAxisLinear(svg, sc.yScale, {
        width: r.width,
        height: r.height,
        margin,
        format: (v) => yFormat(v),
        ticks: r.ticks,
      });

      // ----- marks (svg) and words (always svg) -----
      if (r.renderer === "svg") {
        renderFountainSvg(svg, built, { enableTransitions: r.enableTransitions });
      }
      renderFountainSvgText(svg, text);

      // ----- marks (canvas / webgpu) -----
      const cs = getComputedStyle(host);
      const theme: FountainPaintTheme = {
        ink: themeColor(cs, "--michi-vz-ink", cs.color || "rgba(130,130,130,1)"),
        surface: themeColor(cs, "--michi-vz-surface", "#ffffff"),
        attention: themeColor(cs, "--michi-vz-attention", "#c0392b"),
        lake: themeColor(cs, "--michi-vz-lake", "#9cc3dd"),
      };
      const paintCanvas = (revealX?: number): void =>
        drawFountainCanvas(canvas, svg, built, {
          width: r.width,
          height: r.height,
          ...theme,
          revealX,
        });

      if (r.renderer === "webgpu") {
        if (!webgpuCanvas) webgpuCanvas = makeLayerCanvas("fountainChart-webgpu-canvas");
        const ready = drawFountainWebgpu(webgpuCanvas, svg, built, {
          width: r.width,
          height: r.height,
          ...theme,
          // Re-render once the async GPU device resolves, upgrading canvas -> GPU.
          onReady: render,
        });
        if (ready) {
          removeCanvas();
        } else {
          // Device not ready / unavailable (incl. jsdom): the canvas-2D stopgap keeps
          // the chart from being blank, and the context says what painted (audit #11).
          if (!canvas) canvas = makeLayerCanvas("fountain-chart-canvas");
          paintCanvas();
          painted = "canvas";
        }
        for (const name of ["timeline", "progressiveDraw"] as const) {
          if (!props[name]) continue;
          layoutWarnings.push({
            type: "ignored-option",
            message: `FountainChart: \`${name}\` is ignored with renderer "webgpu" (the GPU layer has no reveal clip); use "canvas" or "svg" to animate.`,
          });
        }
      } else if (r.renderer === "canvas") {
        removeWebgpuCanvas();
        if (!canvas) canvas = makeLayerCanvas("fountain-chart-canvas");
        paintCanvas();
      } else {
        removeCanvas();
        removeWebgpuCanvas();
      }

      // ----- reveal: progressive draw and the timeline (not on the GPU) -----
      // The value labels (SVG text outside the clipped marks) follow the reveal too.
      const onReveal = (x: number): void => gateFountainText(svg, x >= r.width - 0.5 ? null : x);
      const marksRoot = svg.querySelector("g.fountain-chart-content");
      const canvasRedraw = r.renderer === "canvas" ? paintCanvas : undefined;
      const animate = r.renderer !== "webgpu";
      engineRv.afterRender(animate && !r.timeline ? r.progressiveDraw : null, {
        renderer: r.renderer,
        svg,
        marksRoot,
        height: r.height,
        startPx: 0,
        endPx: r.width,
        canvasRedraw,
        onReveal,
      });
      if (animate && r.timeline && resolved.mode === "trend" && sc.xLinear) {
        // Each period reveals to the painted right edge of its jets: never half a bell.
        const periods: CumulativePeriod[] = built.periods.map((p) => ({
          period: p.date,
          px: p.x,
          revealPx: p.revealPx + 1,
        }));
        cumTl.afterRender(r.timeline, {
          host,
          renderer: r.renderer,
          svg,
          marksRoot,
          height: r.height,
          periods,
          startPx: margin.left,
          endPx: r.width,
          canvasRedraw,
          onReveal,
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
    }

    // A pinned jet that is gone (disabled, filtered, no data) lets go of its pin.
    if (pinnedIndex !== null && !model?.jets.some((j) => j.index === pinnedIndex)) unpin();

    context = buildFountainContext({
      title: props.title,
      renderer: painted,
      mode: resolved.mode,
      // xAxis.type follows the resolved mode: "band" in snapshot, the temporal type in trend.
      xAxisType: resolved.mode === "trend" ? (resolved.temporalType ?? "number") : "band",
      jets: resolved.jets,
      allLabels: resolved.allLabels,
      labels: resolved.labels,
      disabledItems: props.disabledItems,
      xDomain: resolved.xDomain,
      yAxisDomain: scales ? (scales.yScale.domain() as [number, number]) : yDomain,
      colorsMapping: colors.generatedColorsMapping,
      colorOf: colors.colorOf,
      referenceLines: props.referenceLines,
      words,
      formatPeriod: (j) =>
        fountainPeriodLabel(j, resolved.temporalType, props.xAxisFormat, props.locale) ??
        String(j.date ?? ""),
    });
    // Plugin hook #3 - enrichContext (before the a11y mirror + dataprocessed event).
    context = applyEnrichContext(pluginList, context, pc);
    renderA11yMirror(a11y, context);
    // Only a changed context is announced: a re-fire can loop a consumer's dispatch.
    const sig = contextSignature(context);
    if (sig !== lastContextSig) {
      lastContextSig = sig;
      props.onChartDataProcessed?.(context);
    }

    // Plugin hook #2 - validate the USER's data (baseProps), plus the layout warnings.
    if (baseProps.onDataWarning) {
      const warnings: DataWarning[] = [
        ...checkFountainData(baseProps),
        ...layoutWarnings,
        ...collectValidate(pluginList, baseProps, pc),
      ];
      if (warnings.length > 0) baseProps.onDataWarning(warnings);
    }
  }

  render();
  const teardowns = setupPlugins(pluginList, pc);

  // A web font that is still loading is measured as its fallback, so the margins
  // reserved for the words would be off: lay them out again once the fonts are in.
  let destroyed = false;
  const fonts =
    typeof document !== "undefined"
      ? (document as Document & { fonts?: { status: string; ready: Promise<unknown> } }).fonts
      : undefined;
  if (fonts?.status === "loading") {
    fonts.ready.then(
      () => {
        if (!destroyed) render();
      },
      () => undefined,
    );
  }

  const instance: ChartInstance<FountainChartProps> = {
    update(next: FountainChartProps) {
      baseProps = next;
      render();
    },
    getContext() {
      return context;
    },
    use(plugin: MichiVzPlugin<FountainChartProps>) {
      pluginList.push(plugin);
      const t = plugin.setup?.(pc);
      if (typeof t === "function") teardowns.push(t);
      render();
    },
    getTools(): AgentTool[] {
      return collectTools(pluginList, pc);
    },
    destroy() {
      destroyed = true;
      engineRv.stop();
      cumTl.destroy();
      disposeStickyDismiss();
      releasePin();
      for (const t of teardowns) t();
      host.removeEventListener("mousemove", onHostMove);
      host.removeEventListener("click", onHostClick);
      host.removeEventListener("mouseleave", onHostLeave);
      model = null;
      dotCache.clear();
      canvas = null;
      webgpuCanvas = null;
      clear(host);
      host.classList.remove("michi-vz", "michi-vz-fountain-chart");
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

  return attachDevtools(instance, host, "fountain-chart", () => baseProps, {
    hitReporting: "canvas",
  });
}
