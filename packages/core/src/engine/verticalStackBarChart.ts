// VerticalStackBar engine: mount/update/getContext/destroy. Band x (dates) +
// linear y; stacked rects in LIGHT DOM (SVG) or canvas. The hasOwnProperty marker
// guard lives in the pure stack layer; this engine just orchestrates.
import DOMPurify from "dompurify";
import { wireStickyDismiss } from "../render/stickyDismiss";
import { attachDevtools } from "../devtools/hook";
import { ensureStyles } from "../styles";
import { svgEl, htmlEl, clear } from "../dom";
import { defaultNumberFormatter } from "../i18n/formatters";
import {
  renderTitle,
  renderXAxisBand,
  renderXAxisLinear,
  renderYAxisBand,
  renderYAxisLinear,
  ROTATED_LABEL_OFFSET,
} from "../render/svg";
import { chooseAxisMode } from "../render/svg/chooseAxisMode";
import { measureLabelWidth } from "../render/svg/measureLabelWidth";
import { applyChartChrome, createChromeRefs } from "../render/chrome";
import {
  extractDataKeys,
  resolveEffectiveKeys,
  collectDates,
  applySeriesFilter,
  computeYDomain,
} from "../verticalStackBarChart/data";
import { buildStackColors } from "../verticalStackBarChart/colors";
import { createHorizontalStackScales, createStackScales } from "../verticalStackBarChart/scales";
import { prepareStackedData, prepareStackedDataHorizontal } from "../verticalStackBarChart/stack";
import { ABBREV_LABEL_OFFSET, buildStackRenderModel } from "../verticalStackBarChart/renderModel";
import { renderStackSvg } from "../verticalStackBarChart/renderSvg";
import { drawStackCanvas } from "../verticalStackBarChart/renderCanvas";
import { drawVerticalStackBarWebgpu } from "../verticalStackBarChart/renderWebgpu";
import { resolveRenderer } from "../webgpu/capability";
import { resolveReveal, createEngineReveal, type ResolvedReveal } from "../animation/reveal";
import { resolveTimeline, type ResolvedTimeline } from "../animation/chartTimeline";
import { createCumulativeTimeline, type CumulativePeriod } from "../animation/cumulativeTimeline";
import { buildStackContext } from "../context/buildStackContext";
import { renderA11yMirror } from "../context/a11yMirror";
import { contextSignature } from "../context/signature";
import { checkStackData } from "../validate/stackWarnings";
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
  StackLegendItem,
  StackRectData,
  VerticalStackBarChartProps,
} from "../types";

const DEFAULT_MARGIN: Margin = { top: 50, right: 50, bottom: 100, left: 60 };

// canvas + webgpu both paint into a <canvas> layer (no DOM marks), so they share
// the host-level hit-test / interaction path. svg does not.
const isPainted = (rr: Renderer): boolean => rr === "canvas" || rr === "webgpu";

interface Resolved {
  width: number;
  height: number;
  margin: Margin;
  renderer: Renderer;
  keysOrder: "topToBottom" | "bottomToTop";
  layout: "vertical" | "horizontal";
  minBarWidth: number;
  minBarHeight: number;
  minBarHeightZero: number;
  enableTransitions: boolean;
  progressiveDraw: ResolvedReveal | null;
  timeline: ResolvedTimeline | null;
}

function resolve(p: VerticalStackBarChartProps): Resolved {
  return {
    width: p.width ?? 900,
    height: p.height ?? 480,
    margin: p.margin ?? DEFAULT_MARGIN,
    // EFFECTIVE renderer: an opt-in "webgpu" request downgrades to "canvas" when
    // WebGPU is unavailable, so everything downstream (incl. getContext().renderer)
    // reflects what actually painted.
    renderer: resolveRenderer(p.renderer),
    keysOrder: p.keysOrder ?? "topToBottom",
    layout: p.layout ?? "vertical",
    minBarWidth: p.minBarWidth ?? 5,
    minBarHeight: p.minBarHeight ?? 15,
    minBarHeightZero: p.minBarHeightZero ?? 0,
    enableTransitions: p.enableTransitions ?? true,
    progressiveDraw: resolveReveal(p.progressiveDraw),
    timeline: resolveTimeline(p.timeline),
  };
}

export function mountVerticalStackBarChart(
  host: HTMLElement,
  initial: VerticalStackBarChartProps,
  opts?: MountOptions<VerticalStackBarChartProps>,
): ChartInstance<VerticalStackBarChartProps> {
  ensureStyles();
  host.classList.add("michi-vz", "michi-vz-vertical-stack-bar-chart");

  const svg = svgEl("svg");
  const tooltip = htmlEl("div", { class: "tooltip" });
  tooltip.style.visibility = "hidden";
  const a11y = htmlEl("div", { class: "mv-a11y" });
  a11y.setAttribute("role", "img");
  let canvas: HTMLCanvasElement | null = null;
  let webgpuCanvas: HTMLCanvasElement | null = null;
  // Tracks whether the LAST webgpu draw actually painted to the GPU canvas (true)
  // vs fell back to the 2D stopgap (false) - same-frame hover redraws below need
  // to know which layer to repaint.
  let webgpuPainted = false;
  const chrome = createChromeRefs();

  host.appendChild(svg);
  host.appendChild(tooltip);
  host.appendChild(a11y);

  // Opt-in progressive-draw reveal (generic engine helper: SVG clip / canvas redraw).
  const engineRv = createEngineReveal({ ticker: opts?.ticker, motion: opts?.motion });
  // Cumulative timeline (opt-in play-through-years): wins over progressiveDraw
  // when both are configured.
  const cumTl = createCumulativeTimeline({ ticker: opts?.ticker, motion: opts?.motion });

  let baseProps: VerticalStackBarChartProps = initial;
  let context: ChartContext | null = null;
  const pluginList: MichiVzPlugin<VerticalStackBarChartProps>[] = [...(opts?.plugins ?? [])];
  const pc: PluginContext<VerticalStackBarChartProps> = {
    chartType: "vertical-stack-bar-chart",
    getProps: () => baseProps,
    getContext: () => context,
    setProps: (patch) => {
      baseProps = { ...baseProps, ...patch };
      render();
    },
  };
  let sticky = false;
  let lastColorMappingSent: Record<string, string> = {};
  let lastLegendSent = "";
  // Idempotency guard for onChartDataProcessed: re-firing an unchanged context
  // every render loops "Maximum update depth" in any consumer that dispatches on
  // each call - fatal under Tariff Structure, where ByTrend runs TWO colour
  // writers (useColorV2 for the fixed buckets + onChartDataProcessed=setMetadata)
  // so the second writer never converges. Mirrors comparableHorizontalBarChart.
  let lastContextSig = "";
  let model: ReturnType<typeof buildStackRenderModel> | null = null;

  const showTooltip = (rect: StackRectData, ev: MouseEvent): void => {
    // Legacy contract: pass { item, key, seriesKey, series, isMissing } - NOT the flat
    // rect - so consumers can read data.item[data.key] and data.series. `series` mirrors
    // the legacy: the hovered segment's rows across dates for the same seriesKey.
    const series = (model?.stackedRectData[rect.key] ?? [])
      .filter((s) => s.seriesKey === rect.seriesKey)
      .map((s) => ({ label: s.key, value: s.value ?? null, date: s.date, code: s.code }));
    const htmlStr = baseProps.tooltipFormatter
      ? baseProps.tooltipFormatter({
          item: rect.data,
          key: rect.key,
          seriesKey: rect.seriesKey,
          series,
          isMissing: rect.isMissing,
        })
      : `<strong>${rect.key}</strong> (${rect.seriesKeyAbbreviation})<br/>${String(rect.date)}: ${
          rect.value ?? "-"
        }`;
    // Set content BEFORE measuring so the box size is known, then position with
    // edge awareness (mirrors legacy): flip to the LEFT of the cursor when the
    // tooltip would overflow the host's right edge; drop BELOW when it would clip
    // the top. Otherwise it gets pushed off-screen on the right-most bars.
    tooltip.innerHTML = DOMPurify.sanitize(htmlStr);
    tooltip.style.visibility = "visible";
    const r = host.getBoundingClientRect();
    const x = ev.clientX - r.left;
    const y = ev.clientY - r.top;
    const tw = tooltip.offsetWidth;
    const th = tooltip.offsetHeight;
    tooltip.style.left = `${x + tw + 10 > r.width ? Math.max(0, x - tw - 10) : x + 10}px`;
    tooltip.style.top = `${y - th - 10 < 0 ? y + 10 : y - th - 10}px`;
  };
  const hideTooltip = (): void => {
    if (sticky) return;
    tooltip.style.visibility = "hidden";
  };

  // Shared canvas hit-test: topmost segment under the cursor (scan keys last-to-first).
  const hitTestAt = (ev: MouseEvent): StackRectData | null => {
    if (!model) return null;
    const svgRect = svg.getBoundingClientRect();
    const x = ev.clientX - svgRect.left;
    const y = ev.clientY - svgRect.top;
    for (let i = model.keys.length - 1; i >= 0; i--) {
      for (const d of model.stackedRectData[model.keys[i]] ?? []) {
        if (x >= d.x && x <= d.x + d.width && y >= d.y && y <= d.y + d.height) return d;
      }
    }
    return null;
  };
  // Same-frame canvas/webgpu dim: redraw immediately with `keys` highlighted,
  // bypassing the throttled Redux round-trip so dimming isn't ~50ms late. The
  // Redux path still fires (cross-chart legend) and later redraws identically.
  let lastHoverKey: string | null = null;
  const redrawHighlight = (keys: string[]): void => {
    if (!model) return;
    const rr = resolve(baseProps);
    if (rr.renderer === "webgpu" && webgpuPainted && webgpuCanvas) {
      // Same model, per-call highlightSet override (mirrors drawStackCanvas's
      // highlightSet option) so the hovered key dims without rebuilding geometry.
      drawVerticalStackBarWebgpu(
        webgpuCanvas,
        svg,
        { ...model, highlightSet: new Set(keys) },
        { width: rr.width, height: rr.height },
      );
    } else if (canvas) {
      drawStackCanvas(canvas, svg, model, {
        width: rr.width,
        height: rr.height,
        highlightSet: new Set(keys),
      });
    }
  };
  const onHostMove = (ev: MouseEvent): void => {
    if (!isPainted(resolve(baseProps).renderer) || !model || sticky) return;
    const hit = hitTestAt(ev);
    if (hit) {
      showTooltip(hit, ev);
      if (hit.key !== lastHoverKey) {
        lastHoverKey = hit.key;
        redrawHighlight([hit.key]);
        baseProps.onHighlightItem?.([hit.key]);
      }
    } else {
      hideTooltip();
      if (lastHoverKey !== null) {
        lastHoverKey = null;
        redrawHighlight([]);
        baseProps.onHighlightItem?.([]);
      }
    }
  };
  // Canvas/webgpu click (marks have no DOM, so the host catches it): hit-test to
  // decide. hit → (re-)pin; miss while pinned → unpin; miss while unpinned → no-op.
  const onHostClick = (ev: MouseEvent): void => {
    if (!isPainted(resolve(baseProps).renderer)) return;
    const hit = hitTestAt(ev);
    if (hit) {
      sticky = true;
      tooltip.classList.add("sticky");
      showTooltip(hit, ev);
    } else if (sticky) {
      sticky = false;
      tooltip.classList.remove("sticky");
      tooltip.style.visibility = "hidden";
    }
  };
  // Cursor leaves the chart: hide the tooltip and clear the highlight, else the
  // last-hovered segment stays dimmed at 0.2 opacity (legacy mouseleave parity).
  const onHostLeave = (): void => {
    if (sticky) return;
    hideTooltip();
    if (lastHoverKey !== null) {
      lastHoverKey = null;
      redrawHighlight([]);
    }
    baseProps.onHighlightItem?.([]);
  };
  host.addEventListener("mousemove", onHostMove);
  host.addEventListener("mouseleave", onHostLeave);
  host.addEventListener("click", onHostClick);
  const disposeStickyDismiss = wireStickyDismiss(host, tooltip, {
    isSticky: () => sticky,
    unpin: () => {
      sticky = false;
      redrawHighlight([]);
      baseProps.onHighlightItem?.([]);
    },
  });

  function render(): void {
    // Plugin hook #1 - transformData: forecast/etc. append predicted points/series.
    // With no plugins this is an identity fold, so behaviour is unchanged.
    const props = applyTransformData(pluginList, baseProps, pc);
    const r = resolve(props);
    svg.setAttribute("width", String(r.width));
    svg.setAttribute("height", String(r.height));
    svg.style.position = "relative";

    // data-mv-state + font var + default loading/no-data overlays (shared chrome).
    const dataState = applyChartChrome(host, props, props.dataSet, chrome);

    // Top/Bottom filter ranks the DataSets (groups) by grand total and slices to
    // limit; EVERYTHING downstream (keys, dates, legend, y-domain, bars) derives from
    // the result so the legend mirrors exactly the drawn bars (legacy invariant).
    const filteredDataSet = props.filter
      ? applySeriesFilter(props.dataSet, props.filter)
      : props.dataSet;
    const dataKeys = extractDataKeys(filteredDataSet);
    // Full ordered key set BEFORE the disabled drop: the LEGEND keeps disabled
    // keys (flagged disabled, greyed by the consumer) so a clicked pill dims
    // instead of disappearing — same contract as LineChart's buildLegendData.
    // Bars/stack/y-domain keep using effectiveKeys, so disabled bars still
    // vanish and the remaining bars widen (legacy behavior).
    const orderedKeys = resolveEffectiveKeys(dataKeys, props.keys, []);
    const effectiveKeys = resolveEffectiveKeys(dataKeys, props.keys, props.disabledItems);
    // keysOrder=bottomToTop reverses the LEGEND / colour-slot order to match the
    // legacy chart (the consumer colour authority assigns colours by appearance
    // order in legendData). The stack DRAW order is decided independently in
    // stack.ts from keysOrder and is NOT affected by this.
    const legendKeys = r.keysOrder === "bottomToTop" ? [...orderedKeys].reverse() : orderedKeys;
    const dates = collectDates(filteredDataSet, props.xAxisDomain);
    const yDomain = computeYDomain(filteredDataSet, effectiveKeys, props.yAxisDomain);

    // Colour slots are assigned over the FULL key set so a disabled key keeps
    // its slot and no other key changes colour across a disable/enable toggle.
    const colors = buildStackColors(
      orderedKeys,
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

    const xFormat = props.xAxisFormat ?? ((d: number | string) => String(d));

    // Band x-axis layout (ported from legacy): fit labels horizontally, else
    // rotate -45° (all labels), else thin to a readable subset. Reserve bottom
    // margin for rotated labels so they don't clip. bandWidth = xScale.step() is
    // independent of margin.bottom, so deciding the mode before the final scales
    // is safe (no feedback loop).
    // The series-abbreviation letters (E / I …) are painted at ABBREV_LABEL_OFFSET below
    // the axis line, which is the same row the x tick labels start in - a rotated
    // "MM-YYYY" label runs straight through them. When any DataSet carries an
    // abbreviation, drop the tick labels so their anchor lands below the abbreviation
    // BASELINE: ABBREV_LABEL_OFFSET puts it level, and the gap covers the tick glyph's
    // own ascent above its anchor (dy 0.32em) plus breathing room. Charts with no
    // abbreviation drop by 0 and render exactly as before.
    const ABBREV_ROW_GAP = 11;
    const hasAbbrevRow = filteredDataSet.some((ds) => !!ds.seriesKeyAbbreviation);
    const tickLabelDrop = hasAbbrevRow
      ? ABBREV_LABEL_OFFSET - ROTATED_LABEL_OFFSET + ABBREV_ROW_GAP
      : 0;

    const horizontal = r.layout === "horizontal";
    let margin = r.margin;
    let scales = createStackScales(dates, yDomain, r.width, r.height, margin);
    // layout="horizontal": categories move to a band y-axis whose HTML labels
    // ellipsize instead of rotating, so the chooseAxisMode ladder and the
    // rotated-label margin reserve below are vertical-only concerns.
    const hScales = horizontal
      ? createHorizontalStackScales(dates, yDomain, r.width, r.height, margin)
      : null;
    const axis = horizontal
      ? null
      : chooseAxisMode({
          domain: dates,
          formatter: (d) => xFormat(d),
          bandWidth: scales.xScale.step(),
          measure: measureLabelWidth,
          // Min gap (px) a horizontal label needs before it tilts -45°. Bump it to give
          // crowded date labels (e.g. "MM-YYYY") more breathing room - they rotate sooner
          // instead of sitting flush against each other. Default 8 (legacy parity).
          padding: props.xAxisLabelPadding,
          // "horizontal" keeps labels flat (thinning if needed) instead of rotating -45°,
          // so no rotated-label bottom-margin is reserved - useful when labels are hidden
          // (thumbnails) or you simply never want tilted dates.
          forceMode: props.xAxisMode,
        });
    if (axis && axis.mode === "rotated") {
      const maxLabelWidth = axis.tickValues.reduce(
        (m, v) => Math.max(m, measureLabelWidth(xFormat(v))),
        0,
      );
      // 25 (axis offset) + label translate + label·sin45 + 12 (descender pad). The
      // translate has to include tickLabelDrop, otherwise pushing the labels past the
      // abbreviation row spends the descender pad instead of reserving more margin.
      const required = Math.ceil(
        25 + ROTATED_LABEL_OFFSET + tickLabelDrop + maxLabelWidth * Math.SQRT1_2 + 12,
      );
      if (required > margin.bottom) {
        margin = { ...margin, bottom: required };
        scales = createStackScales(dates, yDomain, r.width, r.height, margin);
      }
    }

    const stackOptions = {
      keysOrder: r.keysOrder,
      minBarWidth: r.minBarWidth,
      minBarHeight: r.minBarHeight,
      minBarHeightZero: r.minBarHeightZero,
      missingDataMarker: props.missingDataMarker,
      disabledItems: props.disabledItems,
    };
    const prepared = horizontal
      ? prepareStackedDataHorizontal(filteredDataSet, effectiveKeys, hScales!, colors, stackOptions)
      : prepareStackedData(filteredDataSet, effectiveKeys, scales, colors, stackOptions);
    model = buildStackRenderModel(prepared, effectiveKeys, dates, colors, {
      height: r.height,
      margin,
      highlightItems: props.highlightItems ?? [],
      legendOrder: legendKeys,
      disabledItems: props.disabledItems,
      // The series-abbreviation row sits below the band x-axis; it has no home
      // in the horizontal layout.
      abbrevLabels: !horizontal,
    });

    if (props.onLegendDataChange) {
      const sig = JSON.stringify(model.legend);
      if (sig !== lastLegendSent) {
        lastLegendSent = sig;
        props.onLegendDataChange(model.legend as StackLegendItem[]);
      }
    }

    const yFormat = props.yAxisFormat ?? defaultNumberFormatter(props.locale);

    clear(svg);
    renderTitle(svg, { text: props.title, x: r.width / 2, y: r.margin.top / 2 });
    // No-data: render only the title; the overlay covers the rest.
    if (dataState !== "nodata") {
      if (horizontal) {
        // Value axis along the bottom (linear x), categories on a band y-axis.
        // Prop semantics stay orientation-independent: xAxis* formats the
        // category labels, yAxis*/yTicks the value axis.
        renderXAxisLinear(svg, hScales!.xScale, {
          width: r.width,
          height: r.height,
          margin,
          xAxisDataType: "number",
          format: (v) => yFormat(v),
          ticks: props.yTicks ?? 5,
          showGrid: props.showGridLines !== false,
        });
        renderYAxisBand(svg, hScales!.yScale, {
          width: r.width,
          margin,
          format: (label) => xFormat(label),
          showGrid: false,
        });
      } else {
        renderXAxisBand(svg, scales.xScale, {
          width: r.width,
          height: r.height,
          margin,
          format: (label) => xFormat(label),
          mode: axis!.mode,
          tickValues: axis!.tickValues,
          labelOffset: tickLabelDrop,
        });
        renderYAxisLinear(svg, scales.yScale, {
          width: r.width,
          height: r.height,
          margin,
          format: (v) => yFormat(v),
          ticks: props.yTicks ?? 10,
          showGrid: props.showGridLines !== false,
          highlightZeroLine: props.highlightZeroLine !== false,
        });
      }

      if (r.renderer === "svg") {
        renderStackSvg(
          svg,
          model,
          { enableTransitions: r.enableTransitions },
          {
            onEnter: (rect, ev) => {
              if (sticky) return;
              showTooltip(rect, ev);
              props.onHighlightItem?.([rect.key]);
            },
            onLeave: () => {
              hideTooltip();
              if (!sticky) props.onHighlightItem?.([]);
            },
            onClick: (rect, ev) => {
              sticky = true;
              tooltip.classList.add("sticky");
              showTooltip(rect, ev);
            },
          },
        );
      }

      if (isPainted(r.renderer)) {
        if (r.renderer === "webgpu") {
          if (!webgpuCanvas) {
            webgpuCanvas = htmlEl("canvas", { class: "stack-chart-webgpu-canvas" });
            webgpuCanvas.style.position = "absolute";
            webgpuCanvas.style.top = getComputedStyle(host).paddingTop;
            webgpuCanvas.style.left = getComputedStyle(host).paddingLeft;
            webgpuCanvas.style.pointerEvents = "none";
            host.insertBefore(webgpuCanvas, tooltip);
          }
          webgpuPainted = drawVerticalStackBarWebgpu(webgpuCanvas, svg, model, {
            width: r.width,
            height: r.height,
            // Re-render once the async GPU device resolves, upgrading canvas → GPU.
            onReady: render,
          });
          if (webgpuPainted) {
            // GPU painted - drop any first-frame 2D fallback canvas.
            if (canvas) {
              canvas.remove();
              canvas = null;
            }
          } else {
            // Device not ready / unavailable (incl. jsdom): paint the canvas-2D
            // stopgap so the chart is never blank; the onReady re-render swaps in
            // the GPU layer.
            if (!canvas) {
              canvas = htmlEl("canvas", { class: "stack-chart-canvas" });
              canvas.style.position = "absolute";
              canvas.style.top = getComputedStyle(host).paddingTop;
              canvas.style.left = getComputedStyle(host).paddingLeft;
              canvas.style.pointerEvents = "none";
              host.insertBefore(canvas, tooltip);
            }
            drawStackCanvas(canvas, svg, model, { width: r.width, height: r.height });
          }
        } else {
          // canvas mode
          if (webgpuCanvas) {
            webgpuCanvas.remove();
            webgpuCanvas = null;
          }
          webgpuPainted = false;
          if (!canvas) {
            canvas = htmlEl("canvas", { class: "stack-chart-canvas" });
            canvas.style.position = "absolute";
            canvas.style.top = getComputedStyle(host).paddingTop;
            canvas.style.left = getComputedStyle(host).paddingLeft;
            canvas.style.pointerEvents = "none";
            host.insertBefore(canvas, tooltip);
          }
          drawStackCanvas(canvas, svg, model, { width: r.width, height: r.height });
        }
      } else {
        if (canvas) {
          canvas.remove();
          canvas = null;
        }
        if (webgpuCanvas) {
          webgpuCanvas.remove();
          webgpuCanvas = null;
        }
        webgpuPainted = false;
      }
    } else {
      if (canvas) {
        canvas.remove();
        canvas = null;
      }
      if (webgpuCanvas) {
        webgpuCanvas.remove();
        webgpuCanvas = null;
      }
      webgpuPainted = false;
    }

    // ----- Progressive draw (opt-in reveal animation) -----
    // SVG mode: clip g.stack-chart-content; canvas mode: redraw under an equivalent
    // ctx.clip. WebGPU always paints the full frame instantly (no reveal there).
    // No-data: the marks group/canvas above never exist, so the helper naturally
    // no-ops (null marksRoot / null canvasRedraw). Timeline wins over
    // progressiveDraw when both are configured.
    const canvasLayer = r.renderer === "canvas" ? canvas : null;
    engineRv.afterRender(r.timeline ? null : r.progressiveDraw, {
      renderer: r.renderer,
      svg,
      marksRoot: svg.querySelector("g.stack-chart-content"),
      height: r.height,
      startPx: margin.left,
      endPx: r.width,
      canvasRedraw: canvasLayer
        ? (x) =>
            drawStackCanvas(canvasLayer, svg, model!, {
              width: r.width,
              height: r.height,
              revealX: x,
            })
        : undefined,
    });

    // ----- Cumulative timeline (opt-in play-through-years) -----
    // The bars draw UP TO the active period (band edge); play/scrub sweeps the
    // same reveal clip progressiveDraw uses. Data + getContext() stay full.
    // Horizontal layout: the reveal clip sweeps x while the periods live on the
    // band Y-axis, so period playback doesn't map - vertical-only for now.
    if (r.timeline && !horizontal && dataState !== "nodata" && r.renderer !== "webgpu") {
      const periods: CumulativePeriod[] = dates
        .map((d) => ({
          period: d,
          px: (scales.xScale(d) ?? margin.left) + scales.xScale.bandwidth(),
        }))
        .sort((a, b) => a.px - b.px);
      cumTl.afterRender(r.timeline, {
        host,
        renderer: r.renderer,
        svg,
        marksRoot: svg.querySelector("g.stack-chart-content"),
        height: r.height,
        periods,
        startPx: margin.left,
        endPx: r.width,
        canvasRedraw: canvasLayer
          ? (x) =>
              drawStackCanvas(canvasLayer, svg, model!, {
                width: r.width,
                height: r.height,
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

    context = buildStackContext({
      title: props.title,
      renderer: r.renderer,
      dates,
      keys: effectiveKeys,
      stackedRectData: model.stackedRectData,
      visibleItems: model.visibleItems,
      legend: model.legend,
      colorsMapping: colors.generatedColorsMapping,
      yAxisDomain: yDomain,
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
        ...checkStackData(baseProps.dataSet),
        ...collectValidate(pluginList, baseProps, pc),
      ];
      if (warnings.length > 0) baseProps.onDataWarning(warnings);
    }
  }

  render();
  const teardowns = setupPlugins(pluginList, pc);

  const instance: ChartInstance<VerticalStackBarChartProps> = {
    update(next: VerticalStackBarChartProps) {
      baseProps = next;
      render();
    },
    getContext() {
      return context;
    },
    use(plugin: MichiVzPlugin<VerticalStackBarChartProps>) {
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
      host.removeEventListener("mousemove", onHostMove);
      host.removeEventListener("mouseleave", onHostLeave);
      host.removeEventListener("click", onHostClick);
      canvas = null;
      webgpuCanvas = null;
      clear(host);
      host.classList.remove("michi-vz", "michi-vz-vertical-stack-bar-chart");
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

  return attachDevtools(instance, host, "vertical-stack-bar-chart", () => baseProps);
}
