// ChoroplethMap engine: mount/update/getContext/destroy. The house's FIRST geo
// chart - no cartesian axes, just a title + one region path per geography
// feature, in LIGHT DOM (SVG) or canvas (webgpu DELEGATES to canvas - see
// choroplethMap/renderWebgpu.ts). Geography is ALWAYS a prop (no bundled
// topology data); see choroplethMap/data.ts for the FeatureCollection/flat-array
// normalization and the id/name join. Parity target: legacy sdg-trade
// MapChoropleth/Chart.js + MakeProjection.js + MakeColors.js.
import DOMPurify from "dompurify";
import { wireStickyDismiss } from "../render/stickyDismiss";
import { attachDevtools } from "../devtools/hook";
import { ensureStyles } from "../styles";
import { svgEl, htmlEl, clear } from "../dom";
import { renderTitle } from "../render/svg";
import { applyChartChrome, createChromeRefs } from "../render/chrome";
import { processChoroplethMapData } from "../choroplethMap/data";
import { buildChoroplethColors } from "../choroplethMap/colors";
import { createChoroplethProjection, DEFAULT_PROJECTION } from "../choroplethMap/scales";
import { buildChoroplethRenderModel } from "../choroplethMap/renderModel";
import type { ChoroplethFeatureMark } from "../choroplethMap/renderModel";
import { renderChoroplethSvg } from "../choroplethMap/renderSvg";
import { drawChoroplethMapCanvas } from "../choroplethMap/renderCanvas";
import { drawChoroplethMapWebgpu } from "../choroplethMap/renderWebgpu";
import { pointInGeometry } from "../choroplethMap/hitTest";
import { resolveRenderer } from "../webgpu/capability";
import { buildChoroplethMapContext } from "../context/buildChoroplethMapContext";
import { renderA11yMirror } from "../context/a11yMirror";
import { contextSignature } from "../context/signature";
import { checkChoroplethMapData } from "../validate/choroplethMapWarnings";
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
  ChoroplethDataItem,
  ChoroplethMapChartProps,
  DataWarning,
  Margin,
  MountOptions,
  Renderer,
} from "../types";

const DEFAULT_MARGIN: Margin = { top: 40, right: 10, bottom: 10, left: 10 };
// Legacy MapChoropleth/Chart.js default no-match fill (colors.WHITE_SMOKE_DARKEST).
const DEFAULT_NO_DATA_COLOR = "#d2d7dd";
// Legacy default border colour (colors.WHITE_SMOKE).
const DEFAULT_STROKE_COLOR = "#F4F7FC";

// canvas + webgpu (delegated) both paint into a <canvas> layer (no DOM marks),
// so they share the host-level point-in-geometry hit-test. svg does not - its
// <path> marks carry their own mouse listeners.
const isPainted = (rr: Renderer): boolean => rr === "canvas" || rr === "webgpu";

interface Resolved {
  width: number;
  height: number;
  margin: Margin;
  renderer: Renderer;
  noDataColor: string;
  strokeColor: string;
  strokeWidth: number;
  joinBy: "id" | "name";
  enableTransitions: boolean;
}

function resolve(p: ChoroplethMapChartProps): Resolved {
  return {
    width: p.width ?? 900,
    height: p.height ?? 520,
    margin: p.margin ?? DEFAULT_MARGIN,
    // EFFECTIVE renderer: an opt-in "webgpu" request downgrades to "canvas" when
    // WebGPU is unavailable, so everything downstream (incl. getContext().renderer)
    // reflects what actually painted.
    renderer: resolveRenderer(p.renderer),
    noDataColor: p.noDataColor ?? DEFAULT_NO_DATA_COLOR,
    strokeColor: p.strokeColor ?? DEFAULT_STROKE_COLOR,
    strokeWidth: p.strokeWidth ?? 1,
    joinBy: p.joinBy ?? "id",
    enableTransitions: p.enableTransitions ?? true,
  };
}

export function mountChoroplethMapChart(
  host: HTMLElement,
  initial: ChoroplethMapChartProps,
  opts?: MountOptions<ChoroplethMapChartProps>
): ChartInstance<ChoroplethMapChartProps> {
  ensureStyles();
  host.classList.add("michi-vz", "michi-vz-choropleth-map-chart");

  const svg = svgEl("svg");
  const tooltip = htmlEl("div", { class: "tooltip" });
  tooltip.style.visibility = "hidden";
  const a11y = htmlEl("div", { class: "mv-a11y" });
  a11y.setAttribute("role", "img");
  // The 2D canvas (canvas mode, and the delegated webgpu layer - see
  // choroplethMap/renderWebgpu.ts) layered absolutely behind the SVG.
  let canvas: HTMLCanvasElement | null = null;
  let webgpuCanvas: HTMLCanvasElement | null = null;
  const chrome = createChromeRefs();

  host.appendChild(svg);
  host.appendChild(tooltip);
  host.appendChild(a11y);

  let baseProps: ChoroplethMapChartProps = initial;
  let context: ChartContext | null = null;
  const pluginList: MichiVzPlugin<ChoroplethMapChartProps>[] = [...(opts?.plugins ?? [])];
  const pc: PluginContext<ChoroplethMapChartProps> = {
    chartType: "choropleth-map-chart",
    getProps: () => baseProps,
    getContext: () => context,
    setProps: (patch) => {
      baseProps = { ...baseProps, ...patch };
      render();
    },
  };
  let sticky = false;
  let lastColorMappingSent: Record<string, string> = {};
  let lastContextSig = "";
  let model: ReturnType<typeof buildChoroplethRenderModel> | null = null;

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

  const showTooltip = (mark: ChoroplethFeatureMark, ev: MouseEvent): void => {
    const payload: ChoroplethDataItem | { id: string; name?: string } =
      mark.matched ?? { id: mark.id, name: mark.name };
    const htmlStr = baseProps.tooltipFormatter
      ? baseProps.tooltipFormatter(payload)
      : `<strong>${mark.name ?? mark.id}</strong><br/>${
          mark.matched ? (mark.matched.value ?? mark.matched.label) : "N/A"
        }`;
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

  // Canvas/webgpu host-level hit-test (B3.8 - same coordinate-space bug class
  // as SymbolMapChart's B3.7, see engine/symbolMapChart.ts's onHostMove).
  //
  // ROOT CAUSE: `svg` spans the FULL host box (title + margins + plot), so
  // `ev.clientX - svgRect.left` yields a HOST-space pixel - but `model`'s
  // projection was built from `innerWidth`/`innerHeight` (margin-EXCLUDED
  // plot space), and both the SVG renderer's plot `<g>` and the canvas layer
  // are offset by `translate(margin.left, margin.top)` / CSS
  // top/left:margin. Comparing a host-space point straight against
  // plot-local projected polygon coordinates left every polygon short by a
  // CONSTANT (margin.left, margin.top) vector, so hover/hit-testing was
  // offset by the margin on canvas/webgpu. jsdom's always-zero
  // getBoundingClientRect had masked this from existing tests. Fix:
  // subtract the margin before running point-in-polygon - no MIN_HIT_RADIUS
  // forgiveness needed here (unlike B3.7's circles), since polygons are area
  // targets, not point targets.
  //
  // No DOM marks to attach mouse listeners to, so re-project each feature's
  // raw geometry and run a point-in-polygon test (see choroplethMap/hitTest.ts).
  // Last-drawn (topmost) match wins.
  const onHostMove = (ev: MouseEvent): void => {
    const r = resolve(baseProps);
    if (!isPainted(r.renderer) || !model || sticky) return;
    const svgRect = svg.getBoundingClientRect();
    const x = ev.clientX - svgRect.left - r.margin.left;
    const y = ev.clientY - svgRect.top - r.margin.top;
    let hit: ChoroplethFeatureMark | null = null;
    for (let i = model.features.length - 1; i >= 0; i--) {
      const mark = model.features[i];
      if (pointInGeometry(model.projection, mark.geometry, x, y)) {
        hit = mark;
        break;
      }
    }
    if (hit) {
      showTooltip(hit, ev);
      baseProps.onHighlightItem?.([hit.matched?.label ?? hit.name ?? hit.id]);
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

    const { features, matchFor } = processChoroplethMapData(props.geography, props.dataSet, {
      disabledItems: props.disabledItems,
      joinBy: r.joinBy,
    });

    const colors = buildChoroplethColors(
      props.dataSet,
      props.colors,
      props.colorsMapping,
      props.colorScale,
      props.skipColorMappingDispatch ?? false
    );

    if (!props.skipColorMappingDispatch && props.onColorMappingGenerated) {
      const next = colors.generatedColorsMapping;
      if (JSON.stringify(next) !== JSON.stringify(lastColorMappingSent)) {
        lastColorMappingSent = { ...next };
        props.onColorMappingGenerated(next);
      }
    }

    const projection = createChoroplethProjection(
      props.projection ?? DEFAULT_PROJECTION,
      props.projectionConfig,
      innerWidth,
      innerHeight
    );

    model = buildChoroplethRenderModel(features, matchFor, projection, colors, {
      highlightItems: props.highlightItems ?? [],
      noDataColor: r.noDataColor,
    });

    clear(svg);
    renderTitle(svg, { text: props.title, x: r.width / 2, y: r.margin.top / 2 });

    if (dataState !== "nodata") {
      const plot = svgEl("g", { transform: `translate(${r.margin.left}, ${r.margin.top})` });
      svg.appendChild(plot);

      if (r.renderer === "svg") {
        renderChoroplethSvg(
          plot,
          model,
          {
            strokeColor: r.strokeColor,
            strokeWidth: r.strokeWidth,
            enableTransitions: r.enableTransitions,
          },
          {
            onEnter: (mark, ev) => {
              if (sticky) return;
              showTooltip(mark, ev);
              props.onHighlightItem?.([mark.matched?.label ?? mark.name ?? mark.id]);
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
        if (!webgpuCanvas) webgpuCanvas = makeLayerCanvas("choropleth-map-webgpu-canvas");
        webgpuCanvas.style.top = `${r.margin.top}px`;
        webgpuCanvas.style.left = `${r.margin.left}px`;
        // Always paints synchronously (delegated to the canvas-2D renderer - see
        // choroplethMap/renderWebgpu.ts) and always returns true.
        drawChoroplethMapWebgpu(webgpuCanvas, svg, model, {
          width: innerWidth,
          height: innerHeight,
          strokeColor: r.strokeColor,
          strokeWidth: r.strokeWidth,
        });
      } else {
        removeWebgpuCanvas();
        if (!canvas) canvas = makeLayerCanvas("choropleth-map-canvas");
        canvas.style.top = `${r.margin.top}px`;
        canvas.style.left = `${r.margin.left}px`;
        drawChoroplethMapCanvas(canvas, svg, model, {
          width: innerWidth,
          height: innerHeight,
          strokeColor: r.strokeColor,
          strokeWidth: r.strokeWidth,
        });
      }
    } else {
      removeCanvas();
      removeWebgpuCanvas();
    }

    context = buildChoroplethMapContext({
      title: props.title,
      renderer: r.renderer,
      projection: props.projection ?? DEFAULT_PROJECTION,
      features,
      matchFor,
      colorsMapping: colors.generatedColorsMapping,
      disabledItems: props.disabledItems,
      getColor: colors.getColor,
      noDataColor: r.noDataColor,
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
      const warnings: DataWarning[] = [
        ...checkChoroplethMapData(baseProps.geography, baseProps.dataSet, r.joinBy),
        ...collectValidate(pluginList, baseProps, pc),
      ];
      if (warnings.length > 0) baseProps.onDataWarning(warnings);
    }
  }

  render();
  const teardowns = setupPlugins(pluginList, pc);

  const instance = {
    update(next: ChoroplethMapChartProps) {
      baseProps = next;
      render();
    },
    getContext() {
      return context;
    },
    use(plugin: MichiVzPlugin<ChoroplethMapChartProps>) {
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
      host.classList.remove("michi-vz", "michi-vz-choropleth-map-chart");
    },
  };

  return attachDevtools(instance, host, "choropleth-map-chart", () => baseProps);
}
