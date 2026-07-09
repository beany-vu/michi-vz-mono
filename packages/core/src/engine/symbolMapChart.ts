// SymbolMap engine: mount/update/getContext/destroy. Migration target: legacy
// sdg-trade MapSymbolForce (Chart.js + ForceNode.js) - a dot-only force-de-
// overlapped bubble map. Geography is OPTIONAL (unlike ChoroplethMap, where it is
// required): omit it for the legacy chart's own look (an untuned projection +
// rescale-to-fill, see symbolMap/scales.ts); supply it to draw a muted backdrop
// landmass behind the symbols, sharing ChoroplethMap's tuned projection so both
// layers frame the same geography consistently. The one-shot force de-overlap
// (symbolMap/layout.ts) is the heart of this chart - see its header comment.
import DOMPurify from "dompurify";
import { wireStickyDismiss } from "../render/stickyDismiss";
import { attachDevtools, reportDevtoolsHit } from "../devtools/hook";
import { ensureStyles } from "../styles";
import { svgEl, htmlEl, clear } from "../dom";
import { renderTitle } from "../render/svg";
import { applyChartChrome, createChromeRefs } from "../render/chrome";
import { processSymbolMapData } from "../symbolMap/data";
import { buildSymbolMapColors } from "../symbolMap/colors";
import { projectSymbolMapPoints, buildSymbolMapRadiusScale, DEFAULT_PROJECTION } from "../symbolMap/scales";
import { layoutSymbolMap } from "../symbolMap/layout";
import { buildSymbolMapRenderModel, buildSymbolMapBackdrop } from "../symbolMap/renderModel";
import type { SymbolMapMark, SymbolMapRenderModel } from "../symbolMap/renderModel";
import { pickNearestSymbolHit } from "../symbolMap/hitTest";
import { normalizeGeography } from "../choroplethMap/data";
import { renderSymbolMapSvg } from "../symbolMap/renderSvg";
import { drawSymbolMapCanvas } from "../symbolMap/renderCanvas";
import { drawSymbolMapWebgpu } from "../symbolMap/renderWebgpu";
import { resolveRenderer } from "../webgpu/capability";
import { buildSymbolMapContext } from "../context/buildSymbolMapContext";
import { renderA11yMirror } from "../context/a11yMirror";
import { contextSignature } from "../context/signature";
import { checkSymbolMapData } from "../validate/symbolMapWarnings";
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
  Margin,
  MountOptions,
  Renderer,
  SymbolMapChartProps,
  SymbolMapDataItem,
} from "../types";

const DEFAULT_MARGIN: Margin = { top: 40, right: 10, bottom: 10, left: 10 };
const DEFAULT_RADIUS_RANGE: [number, number] = [3, 70];
const DEFAULT_GEOGRAPHY_COLOR = "#eef1f5";
const DEFAULT_STROKE_COLOR = "#d7dce3";

// canvas + webgpu (delegated) both paint into a <canvas> layer (no DOM marks), so
// they share the host-level hit-test. svg does not - its marks carry their own
// mouse listeners.
const isPainted = (rr: Renderer): boolean => rr === "canvas" || rr === "webgpu";

interface Resolved {
  width: number;
  height: number;
  margin: Margin;
  renderer: Renderer;
  radiusRange: [number, number];
  positionMode: "force" | "precise";
  geographyColor: string;
  strokeColor: string;
  strokeWidth: number;
  showLabels: boolean;
  enableTransitions: boolean;
  timeline: ResolvedTimeline | null;
}

function resolve(p: SymbolMapChartProps): Resolved {
  return {
    width: p.width ?? 900,
    height: p.height ?? 520,
    margin: p.margin ?? DEFAULT_MARGIN,
    // EFFECTIVE renderer: an opt-in "webgpu" request downgrades to "canvas" when
    // WebGPU is unavailable, so everything downstream (incl. getContext().renderer)
    // reflects what actually painted.
    renderer: resolveRenderer(p.renderer),
    radiusRange: p.radiusRange ?? DEFAULT_RADIUS_RANGE,
    positionMode: p.positionMode ?? "force",
    geographyColor: p.geographyColor ?? DEFAULT_GEOGRAPHY_COLOR,
    strokeColor: p.strokeColor ?? DEFAULT_STROKE_COLOR,
    strokeWidth: p.strokeWidth ?? 1,
    showLabels: p.showLabels ?? true,
    enableTransitions: p.enableTransitions ?? true,
    timeline: resolveTimeline(p.timeline),
  };
}

export function mountSymbolMapChart(
  host: HTMLElement,
  initial: SymbolMapChartProps,
  opts?: MountOptions<SymbolMapChartProps>
): ChartInstance<SymbolMapChartProps> {
  ensureStyles();
  host.classList.add("michi-vz", "michi-vz-symbol-map-chart");

  const svg = svgEl("svg");
  const tooltip = htmlEl("div", { class: "tooltip" });
  tooltip.style.visibility = "hidden";
  const a11y = htmlEl("div", { class: "mv-a11y" });
  a11y.setAttribute("role", "img");
  // The 2D canvas (canvas mode, and the delegated webgpu layer) layered
  // absolutely behind the SVG.
  let canvas: HTMLCanvasElement | null = null;
  let webgpuCanvas: HTMLCanvasElement | null = null;
  const chrome = createChromeRefs();

  host.appendChild(svg);
  host.appendChild(tooltip);
  host.appendChild(a11y);

  let baseProps: SymbolMapChartProps = initial;
  let context: ChartContext | null = null;
  const pluginList: MichiVzPlugin<SymbolMapChartProps>[] = [...(opts?.plugins ?? [])];
  const pc: PluginContext<SymbolMapChartProps> = {
    chartType: "symbol-map-chart",
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
  let lastContextSig = "";
  let model: SymbolMapRenderModel | null = null;

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

  const markToItem = (m: SymbolMapMark): SymbolMapDataItem => ({
    id: m.id,
    label: m.label,
    lng: m.lng,
    lat: m.lat,
    value: m.value,
    valueSecond: m.valueSecond ?? undefined,
    color: m.fill,
  });

  const showTooltip = (mark: SymbolMapMark, ev: MouseEvent): void => {
    const htmlStr = baseProps.tooltipFormatter
      ? baseProps.tooltipFormatter(markToItem(mark))
      : `<strong>${mark.label}</strong><br/>${mark.value}${mark.valueSecond != null ? ` / ${mark.valueSecond}` : ""}`;
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

  // Canvas/webgpu host-level hit-test (B3.7 - see symbolMap/hitTest.ts).
  //
  // ROOT CAUSE (the actual reported bug, found while writing a real-browser
  // repro - jsdom's always-zero getBoundingClientRect had masked it): `svg`
  // spans the FULL host box (title + margins + plot), so `ev.clientX -
  // svgRect.left` yields a HOST-space pixel - but `model.symbols[].x/y` are
  // PLOT-local (margin-excluded; the SVG renderer draws them inside a
  // `translate(margin.left, margin.top)` group, and the canvas layer is
  // itself CSS-positioned at that same offset). Comparing a host-space point
  // straight against plot-local mark centres left every mark short by a
  // CONSTANT (margin.left, margin.top) vector - here sqrt(10^2+40^2)~=41px -
  // so only marks whose radius happened to exceed that margin vector could
  // ever be hit at all, no matter how precisely the real pointer landed.
  // That's exactly "small circles never tooltip, big ones are fine": it was
  // never about small-circle precision alone, the margin offset alone made
  // most marks unhittable outright. Subtracting the margin restores the
  // correct plot-local space; MIN_HIT_RADIUS forgiveness + nearest-match-wins
  // (pickNearestSymbolHit) is the SEPARATE, compounding fix for real pointer
  // imprecision on genuinely small marks, replacing the old "first hit in
  // array order wins" convention.
  const onHostMove = (ev: MouseEvent): void => {
    const r = resolve(baseProps);
    if (!isPainted(r.renderer) || !model || sticky) return;
    const svgRect = svg.getBoundingClientRect();
    const x = ev.clientX - svgRect.left - r.margin.left;
    const y = ev.clientY - svgRect.top - r.margin.top;
    const hit = pickNearestSymbolHit(model.symbols, x, y);
    reportDevtoolsHit(host, x, y, hit ? hit.label : null);
    if (hit) {
      showTooltip(hit, ev);
      baseProps.onHighlightItem?.([hit.label]);
    } else {
      hideTooltip();
      baseProps.onHighlightItem?.([]);
    }
  };
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
    // Plugin hook #1 - transformData: append/derive rows before processing.
    const props = applyTransformData(pluginList, baseProps, pc);
    const r = resolve(props);
    svg.setAttribute("width", String(r.width));
    svg.setAttribute("height", String(r.height));
    svg.style.position = "relative";

    const dataState = applyChartChrome(host, props, props.dataSet, chrome);

    const innerWidth = r.width - r.margin.left - r.margin.right;
    const innerHeight = r.height - r.margin.top - r.margin.bottom;

    // Timeline (opt-in): swap in the active period's rows. SymbolMapChart has no
    // `filter` prop, so only the dataSet arg matters here; the de-overlap force
    // layout below consumes tlData.dataSet so symbols re-place per period.
    const tlData = engineTl.beforeRender(r.timeline, props.dataSet ?? [], undefined);
    const processed = processSymbolMapData(tlData.dataSet, {
      disabledItems: props.disabledItems,
      radiusVisibleMin: props.radiusVisibleMin,
    });

    const seededMapping = { ...processed.groupColors, ...(props.colorsMapping ?? {}) };
    const colors = buildSymbolMapColors(
      processed.groupKeys,
      props.colors,
      seededMapping,
      props.skipColorMappingDispatch ?? false
    );
    if (!props.skipColorMappingDispatch && props.onColorMappingGenerated) {
      const next = colors.generatedColorsMapping;
      if (JSON.stringify(next) !== JSON.stringify(lastColorMappingSent)) {
        lastColorMappingSent = { ...next };
        props.onColorMappingGenerated(next);
      }
    }

    // Radius scale built BEFORE projecting points (it only depends on
    // `processed.located` + `radiusRange`/`radiusVisibleMin` - never on
    // width/height or the projection), so the dot-only fit below can inset
    // for the radii it's about to draw (B3.6 - see scales.ts's
    // projectSymbolMapPoints comment).
    const { radiusOf, opacityOf } = buildSymbolMapRadiusScale(
      processed.located,
      r.radiusRange,
      props.radiusVisibleMin
    );
    // Effective (rendered) radius per node - the larger of the primary and
    // (if present) `valueSecond` ring, since both circles share one centre and
    // either can be the one that visually overflows the plot edge.
    const effectiveRadiusOf = (node: (typeof processed.visible)[number]): number => {
      const primary = radiusOf(node.value);
      const secondary = node.valueSecond != null ? radiusOf(node.valueSecond) : 0;
      return Math.max(primary, secondary);
    };

    const hasGeography = props.geography != null;
    const { points, projection } = projectSymbolMapPoints(
      processed.visible,
      props.projection,
      hasGeography,
      props.projectionConfig,
      innerWidth,
      innerHeight,
      effectiveRadiusOf
    );

    // "precise" keeps every symbol at its exact projected lng/lat (overlaps
    // allowed, no clamp - scales.ts's radius-aware fit inset already reserves
    // edge room). "force" (default, legacy parity) runs the one-shot de-overlap
    // sim, which trades positional accuracy for readability - see the
    // positionMode JSDoc for when that trade-off is NOT acceptable.
    const laidOut =
      r.positionMode === "precise"
        ? points.map((point) => ({
            point,
            radius: radiusOf(point.node.value),
            x: point.x,
            y: point.y,
          }))
        : layoutSymbolMap(points, (point) => radiusOf(point.node.value), {
            width: innerWidth,
            height: innerHeight,
            radiusOf: (point) => effectiveRadiusOf(point.node),
          });

    const backdrop = hasGeography ? buildSymbolMapBackdrop(normalizeGeography(props.geography!), projection) : [];

    model = buildSymbolMapRenderModel(
      laidOut,
      colors,
      radiusOf,
      opacityOf,
      { highlightItems: props.highlightItems ?? [] },
      projection,
      backdrop
    );

    clear(svg);
    renderTitle(svg, { text: props.title, x: r.width / 2, y: r.margin.top / 2 });

    if (dataState !== "nodata") {
      const plot = svgEl("g", { transform: `translate(${r.margin.left}, ${r.margin.top})` });
      svg.appendChild(plot);

      if (r.renderer === "svg") {
        renderSymbolMapSvg(
          plot,
          model,
          {
            enableTransitions: r.enableTransitions,
            showLabels: r.showLabels,
            geographyColor: r.geographyColor,
            strokeColor: r.strokeColor,
            strokeWidth: r.strokeWidth,
          },
          {
            onEnter: (mark, ev) => {
              if (sticky) return;
              showTooltip(mark, ev);
              props.onHighlightItem?.([mark.label]);
            },
            onLeave: () => {
              hideTooltip();
              if (!sticky) props.onHighlightItem?.([]);
            },
            onClick: (mark, ev) => {
              sticky = true;
              tooltip.classList.add("sticky");
              showTooltip(mark, ev);
            },
          }
        );
        removeCanvas();
        removeWebgpuCanvas();
      } else if (r.renderer === "webgpu") {
        removeCanvas();
        if (!webgpuCanvas) webgpuCanvas = makeLayerCanvas("symbol-map-webgpu-canvas");
        webgpuCanvas.style.top = `${r.margin.top}px`;
        webgpuCanvas.style.left = `${r.margin.left}px`;
        // Always paints synchronously (delegated to the canvas-2D renderer - see
        // symbolMap/renderWebgpu.ts) and always returns true.
        drawSymbolMapWebgpu(webgpuCanvas, svg, model, {
          width: innerWidth,
          height: innerHeight,
          showLabels: r.showLabels,
          geographyColor: r.geographyColor,
          strokeColor: r.strokeColor,
          strokeWidth: r.strokeWidth,
        });
      } else {
        removeWebgpuCanvas();
        if (!canvas) canvas = makeLayerCanvas("symbol-map-canvas");
        canvas.style.top = `${r.margin.top}px`;
        canvas.style.left = `${r.margin.left}px`;
        drawSymbolMapCanvas(canvas, svg, model, {
          width: innerWidth,
          height: innerHeight,
          showLabels: r.showLabels,
          geographyColor: r.geographyColor,
          strokeColor: r.strokeColor,
          strokeWidth: r.strokeWidth,
        });
      }
    } else {
      removeCanvas();
      removeWebgpuCanvas();
    }

    context = buildSymbolMapContext({
      title: props.title,
      renderer: r.renderer,
      projection: props.projection ?? DEFAULT_PROJECTION,
      locatedCount: processed.located.length,
      invalidCount: processed.invalidCount,
      symbols: model.symbols,
      colorsMapping: colors.generatedColorsMapping,
      disabledItems: props.disabledItems,
    });
    // Plugin hook #3 - enrichContext.
    context = applyEnrichContext(pluginList, context, pc);
    renderA11yMirror(a11y, context);
    const sig = contextSignature(context);
    if (sig !== lastContextSig) {
      lastContextSig = sig;
      props.onChartDataProcessed?.(context);
    }

    // Plugin hook #2 - validate: merge core checks with plugin warnings. Validate
    // the USER's data (baseProps), not the plugin-synthesised rows.
    if (baseProps.onDataWarning) {
      const warnings = [
        ...checkSymbolMapData(baseProps.dataSet),
        ...collectValidate(pluginList, baseProps, pc),
      ];
      if (warnings.length > 0) baseProps.onDataWarning(warnings);
    }

    engineTl.afterRender(host, r.timeline);
  }

  render();
  const teardowns = setupPlugins(pluginList, pc);

  const instance: ChartInstance<SymbolMapChartProps> = {
    update(next: SymbolMapChartProps) {
      baseProps = next;
      render();
    },
    getContext() {
      return context;
    },
    use(plugin: MichiVzPlugin<SymbolMapChartProps>) {
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
      host.classList.remove("michi-vz", "michi-vz-symbol-map-chart");
    },
  };
  // timeline() only exists when the chart opted into playback at mount, so
  // feature-off charts keep an unchanged instance surface.
  if (resolve(initial).timeline) {
    instance.timeline = () => engineTl.controller();
  }

  return attachDevtools(instance, host, "symbol-map-chart", () => baseProps);
}
