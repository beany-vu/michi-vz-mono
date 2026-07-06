// Sankey engine: mount/update/getContext/destroy. Nodes laid out in columns with
// flow-proportional link bands via d3-sankey. LIGHT DOM (SVG) or canvas. No axes -
// just a title, the links, and the nodes. Mirrors the other engines' plugin wiring
// + colour-mapping dispatch; the layout lives in the pure layer.
import DOMPurify from "dompurify";
import { wireStickyDismiss } from "../render/stickyDismiss";
import { attachDevtools } from "../devtools/hook";
import { ensureStyles } from "../styles";
import { svgEl, htmlEl, clear } from "../dom";
import { defaultNumberFormatter } from "../i18n/formatters";
import { applyChartChrome, createChromeRefs } from "../render/chrome";
import { renderTitle } from "../render/svg";
import { processSankeyData } from "../sankeyChart/data";
import { buildSankeyColors } from "../sankeyChart/colors";
import { layoutSankey } from "../sankeyChart/layout";
import { buildSankeyRenderModel, type SankeyRenderModel } from "../sankeyChart/renderModel";
import { renderSankeySvg, type SankeyHoverTarget } from "../sankeyChart/renderSvg";
import { drawSankeyCanvas } from "../sankeyChart/renderCanvas";
import { drawSankeyWebgpu } from "../sankeyChart/renderWebgpu";
import { resolveRenderer } from "../webgpu/capability";
import { buildSankeyContext } from "../context/buildSankeyContext";
import { renderA11yMirror } from "../context/a11yMirror";
import { checkSankeyData } from "../validate/sankeyWarnings";
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
  SankeyChartProps,
  SankeyNodeContext,
  SankeyLinkContext,
} from "../types";

const DEFAULT_MARGIN: Margin = { top: 36, right: 12, bottom: 12, left: 12 };

// canvas + webgpu both paint into a <canvas> layer (no DOM marks), so they share
// the host-level hit-test / click-to-pin interaction path. svg does not.
const isPainted = (rr: Renderer): boolean => rr === "canvas" || rr === "webgpu";

interface Resolved {
  width: number;
  height: number;
  margin: Margin;
  renderer: Renderer;
  nodeWidth: number;
  nodePadding: number;
  nodeRadius: number;
  linkRadius: number;
  linkColorMode: "source" | "target";
  linkOpacity: number;
  showLabels: boolean;
  enableTransitions: boolean;
}

function resolve(p: SankeyChartProps): Resolved {
  return {
    width: p.width ?? 800,
    height: p.height ?? 500,
    margin: p.margin ?? DEFAULT_MARGIN,
    // EFFECTIVE renderer: an opt-in "webgpu" request downgrades to "canvas" when
    // WebGPU is unavailable, so everything downstream (incl. getContext().renderer)
    // reflects what actually painted.
    renderer: resolveRenderer(p.renderer),
    nodeWidth: p.nodeWidth ?? 18,
    nodePadding: p.nodePadding ?? 12,
    nodeRadius: p.nodeRadius ?? 2,
    linkRadius: p.linkRadius ?? 2,
    linkColorMode: p.linkColorMode ?? "source",
    linkOpacity: p.linkOpacity ?? 0.45,
    showLabels: p.showLabels ?? true,
    enableTransitions: p.enableTransitions ?? true,
  };
}

export function mountSankeyChart(
  host: HTMLElement,
  initial: SankeyChartProps,
  opts?: MountOptions<SankeyChartProps>
): ChartInstance<SankeyChartProps> {
  ensureStyles();
  host.classList.add("michi-vz", "michi-vz-sankey-chart");

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

  let baseProps: SankeyChartProps = initial;
  let context: ChartContext | null = null;
  const pluginList: MichiVzPlugin<SankeyChartProps>[] = [...(opts?.plugins ?? [])];
  const pc: PluginContext<SankeyChartProps> = {
    chartType: "sankey-chart",
    getProps: () => baseProps,
    getContext: () => context,
    setProps: (patch) => {
      baseProps = { ...baseProps, ...patch };
      render();
    },
  };
  let sticky = false;
  const chrome = createChromeRefs();
  let lastColorMappingSent: Record<string, string> = {};
  let model: SankeyRenderModel | null = null;

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

  const showTooltip = (target: SankeyHoverTarget, ev: MouseEvent): void => {
    const r = host.getBoundingClientRect();
    tooltip.style.left = `${ev.clientX - r.left + 10}px`;
    tooltip.style.top = `${ev.clientY - r.top - 10}px`;
    const fmt = baseProps.valueFormatter ?? defaultNumberFormatter(baseProps.locale);
    let htmlStr: string;
    if (baseProps.tooltipFormatter) {
      const ctxMark: SankeyNodeContext | SankeyLinkContext =
        target.kind === "node"
          ? {
              kind: "node",
              id: target.node.id,
              label: target.node.label,
              color: target.node.fill,
              value: target.node.value,
              depth: target.node.depth,
            }
          : {
              kind: "link",
              source: target.link.sourceId,
              target: target.link.targetId,
              value: target.link.value,
              color: target.link.color,
            };
      htmlStr = baseProps.tooltipFormatter(ctxMark);
    } else if (target.kind === "node") {
      htmlStr = `<strong>${target.node.label}</strong><br/>${fmt(target.node.value)}`;
    } else {
      htmlStr = `<strong>${target.link.sourceId} → ${target.link.targetId}</strong><br/>${fmt(target.link.value)}`;
    }
    tooltip.innerHTML = DOMPurify.sanitize(htmlStr);
    tooltip.style.visibility = "visible";
  };
  const hideTooltip = (): void => {
    if (sticky) return;
    tooltip.style.visibility = "hidden";
  };
  const highlightFor = (target: SankeyHoverTarget): string[] =>
    target.kind === "node" ? [target.node.id] : [target.link.sourceId, target.link.targetId];

  // Canvas/webgpu-mode hit-test: nodes (point-in-rect) first, then links via
  // isPointInPath under an identity transform (path + point both in CSS px).
  const onHostMove = (ev: MouseEvent): void => {
    if (!isPainted(resolve(baseProps).renderer) || !model || sticky) return;
    const svgRect = svg.getBoundingClientRect();
    const x = ev.clientX - svgRect.left;
    const y = ev.clientY - svgRect.top;

    for (const n of model.nodes) {
      if (x >= n.x && x <= n.x + n.w && y >= n.y && y <= n.y + n.h) {
        showTooltip({ kind: "node", node: n }, ev);
        baseProps.onHighlightItem?.([n.id]);
        return;
      }
    }

    // Link hit-test needs a real 2D canvas context. In webgpu mode that canvas
    // is only present while the GPU device isn't ready (the first-frame canvas
    // fallback) - once GPU actually paints, link hover falls through to
    // hideTooltip() below (node hover keeps working via geometry above).
    const ctx = canvas?.getContext("2d") ?? null;
    if (ctx) {
      // Filled ribbons → point-in-path. Identity transform so the path (CSS px)
      // and the point (CSS px) share one coordinate space.
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      for (const l of model.links) {
        if (l.d && ctx.isPointInPath(new Path2D(l.d), x, y)) {
          ctx.restore();
          showTooltip({ kind: "link", link: l }, ev);
          baseProps.onHighlightItem?.([l.sourceId, l.targetId]);
          return;
        }
      }
      ctx.restore();
    }
    hideTooltip();
    baseProps.onHighlightItem?.([]);
  };
  // Canvas/webgpu-mode click-to-pin: SVG marks pin via their own onClick, but
  // painted marks have no DOM, so a click on the host toggles the hovered tooltip's pin.
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
    // Plugin hook #1 - transformData (identity with no plugins).
    const props = applyTransformData(pluginList, baseProps, pc);
    const r = resolve(props);
    svg.setAttribute("width", String(r.width));
    svg.setAttribute("height", String(r.height));
    svg.style.position = "relative";

    // data-mv-state + font var + default loading/no-data overlays (shared chrome).
    // Mirrors LineChart: the engine gates mark/canvas drawing on the returned
    // DataState so a wrapped chart with a custom isNodataComponent doesn't show
    // the overlay alongside a fully-drawn chart underneath.
    const dataState = applyChartChrome(host, props, props.nodes, chrome);

    const processed = processSankeyData(props.nodes ?? [], props.links ?? [], {
      disabledItems: props.disabledItems,
    });

    const seededMapping = { ...processed.nodeColors, ...(props.colorsMapping ?? {}) };
    const colors = buildSankeyColors(
      processed.nodeKeys,
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

    const laid = layoutSankey(
      { nodes: processed.nodes, links: processed.links },
      {
        x0: r.margin.left,
        y0: r.margin.top,
        x1: r.width - r.margin.right,
        y1: r.height - r.margin.bottom,
        nodeWidth: r.nodeWidth,
        nodePadding: r.nodePadding,
      }
    );

    model = buildSankeyRenderModel(laid, colors, {
      width: r.width,
      nodeKeys: processed.nodeKeys,
      nodeRadius: r.nodeRadius,
      linkRadius: r.linkRadius,
      linkColorMode: r.linkColorMode,
      linkOpacity: r.linkOpacity,
      showLabels: r.showLabels,
      highlightItems: props.highlightItems ?? [],
    });

    clear(svg);
    renderTitle(svg, { text: props.title, x: r.width / 2, y: r.margin.top / 2 });

    // No-data: render only the title (nodes/links/canvas/webgpu hidden, matching
    // LineChart's `dataState !== "nodata"` gating); the overlay covers it.
    if (dataState !== "nodata") {
      if (r.renderer === "svg") {
        renderSankeySvg(
          svg,
          model,
          { enableTransitions: r.enableTransitions },
          {
            onEnter: (target, ev) => {
              if (sticky) return;
              showTooltip(target, ev);
              props.onHighlightItem?.(highlightFor(target));
            },
            onLeave: () => {
              hideTooltip();
              if (!sticky) props.onHighlightItem?.([]);
            },
            onClick: (target, ev) => {
              sticky = true;
              tooltip.classList.add("sticky");
              showTooltip(target, ev);
            },
          }
        );
      }

      if (r.renderer === "webgpu") {
        if (!webgpuCanvas) webgpuCanvas = makeLayerCanvas("sankeyChart-webgpu-canvas");
        const ready = drawSankeyWebgpu(webgpuCanvas, svg, model, {
          width: r.width,
          height: r.height,
          // Re-render once the async GPU device resolves, upgrading canvas → GPU.
          onReady: render,
        });
        if (ready) {
          // GPU painted - drop any first-frame 2D fallback canvas.
          removeCanvas();
        } else {
          // Device not ready / unavailable (incl. jsdom): paint the canvas-2D stopgap
          // so the chart is never blank; the onReady re-render swaps in the GPU layer.
          if (!canvas) canvas = makeLayerCanvas("sankey-chart-canvas");
          drawSankeyCanvas(canvas, svg, model, { width: r.width, height: r.height });
        }
      } else if (r.renderer === "canvas") {
        removeWebgpuCanvas();
        if (!canvas) canvas = makeLayerCanvas("sankey-chart-canvas");
        drawSankeyCanvas(canvas, svg, model, { width: r.width, height: r.height });
      } else {
        removeCanvas();
        removeWebgpuCanvas();
      }
    } else {
      removeCanvas();
      removeWebgpuCanvas();
    }

    context = buildSankeyContext({
      title: props.title,
      renderer: r.renderer,
      nodes: laid.nodes,
      links: laid.links,
      colorsMapping: colors.generatedColorsMapping,
      linkColorMode: r.linkColorMode,
    });
    // Plugin hook #3 - enrichContext before a11y + dataprocessed.
    context = applyEnrichContext(pluginList, context, pc);
    renderA11yMirror(a11y, context);
    props.onChartDataProcessed?.(context);

    // Plugin hook #2 - validate the USER's data, merged with plugin warnings.
    if (baseProps.onDataWarning) {
      const warnings = [
        ...checkSankeyData(baseProps.nodes, baseProps.links),
        ...collectValidate(pluginList, baseProps, pc),
      ];
      if (warnings.length > 0) baseProps.onDataWarning(warnings);
    }
  }

  render();
  const teardowns = setupPlugins(pluginList, pc);

  const instance = {
    update(next: SankeyChartProps) {
      baseProps = next;
      render();
    },
    getContext() {
      return context;
    },
    use(plugin: MichiVzPlugin<SankeyChartProps>) {
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
      canvas = null;
      webgpuCanvas = null;
      clear(host);
      host.classList.remove("michi-vz", "michi-vz-sankey-chart");
    },
  };

  return attachDevtools(instance, host, "sankey-chart", () => baseProps);
}
