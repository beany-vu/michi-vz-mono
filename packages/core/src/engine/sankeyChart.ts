// Sankey engine: mount/update/getContext/destroy. Nodes laid out in columns with
// flow-proportional link bands via d3-sankey. LIGHT DOM (SVG) or canvas. No axes —
// just a title, the links, and the nodes. Mirrors the other engines' plugin wiring
// + colour-mapping dispatch; the layout lives in the pure layer.
import DOMPurify from "dompurify";
import { attachDevtools } from "../devtools/hook";
import { ensureStyles } from "../styles";
import { svgEl, htmlEl, clear } from "../dom";
import { defaultNumberFormatter } from "../i18n/formatters";
import { renderTitle } from "../render/svg";
import { processSankeyData } from "../sankeyChart/data";
import { buildSankeyColors } from "../sankeyChart/colors";
import { layoutSankey } from "../sankeyChart/layout";
import { buildSankeyRenderModel, type SankeyRenderModel } from "../sankeyChart/renderModel";
import { renderSankeySvg, type SankeyHoverTarget } from "../sankeyChart/renderSvg";
import { drawSankeyCanvas } from "../sankeyChart/renderCanvas";
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
  SankeyChartProps,
  SankeyNodeContext,
  SankeyLinkContext,
} from "../types";

const DEFAULT_MARGIN: Margin = { top: 36, right: 12, bottom: 12, left: 12 };

interface Resolved {
  width: number;
  height: number;
  margin: Margin;
  renderer: "svg" | "canvas";
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
    renderer: p.renderer ?? "svg",
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
  let canvas: HTMLCanvasElement | null = null;

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
  let lastColorMappingSent: Record<string, string> = {};
  let model: SankeyRenderModel | null = null;

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

  // Canvas-mode hit-test: nodes (point-in-rect) first, then links via
  // isPointInStroke under an identity transform (path + point both in CSS px).
  const onHostMove = (ev: MouseEvent): void => {
    if (resolve(baseProps).renderer !== "canvas" || !model || sticky) return;
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
  // Canvas-mode click-to-pin: SVG marks pin via their own onClick, but canvas
  // marks have no DOM, so a click on the host toggles the hovered tooltip's pin.
  const onHostClick = (): void => {
    if (resolve(baseProps).renderer !== "canvas") return;
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
  tooltip.addEventListener("click", () => {
    sticky = false;
    tooltip.classList.remove("sticky");
    tooltip.style.visibility = "hidden";
  });

  function render(): void {
    // Plugin hook #1 — transformData (identity with no plugins).
    const props = applyTransformData(pluginList, baseProps, pc);
    const r = resolve(props);
    svg.setAttribute("width", String(r.width));
    svg.setAttribute("height", String(r.height));
    svg.style.position = "relative";

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

    if (r.renderer !== "canvas") {
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

    if (r.renderer === "canvas") {
      if (!canvas) {
        canvas = htmlEl("canvas", { class: "sankey-chart-canvas" });
        canvas.style.position = "absolute";
        canvas.style.top = getComputedStyle(host).paddingTop;
        canvas.style.left = getComputedStyle(host).paddingLeft;
        canvas.style.pointerEvents = "none";
        host.insertBefore(canvas, tooltip);
      }
      drawSankeyCanvas(canvas, svg, model, { width: r.width, height: r.height });
    } else if (canvas) {
      canvas.remove();
      canvas = null;
    }

    context = buildSankeyContext({
      title: props.title,
      renderer: r.renderer,
      nodes: laid.nodes,
      links: laid.links,
      colorsMapping: colors.generatedColorsMapping,
      linkColorMode: r.linkColorMode,
    });
    // Plugin hook #3 — enrichContext before a11y + dataprocessed.
    context = applyEnrichContext(pluginList, context, pc);
    renderA11yMirror(a11y, context);
    props.onChartDataProcessed?.(context);

    // Plugin hook #2 — validate the USER's data, merged with plugin warnings.
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
      for (const t of teardowns) t();
      host.removeEventListener("mousemove", onHostMove);
      host.removeEventListener("click", onHostClick);
      clear(host);
      host.classList.remove("michi-vz", "michi-vz-sankey-chart");
    },
  };

  return attachDevtools(instance, host, "sankey-chart", () => baseProps);
}
