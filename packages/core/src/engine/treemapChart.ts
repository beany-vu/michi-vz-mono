// Treemap engine: mount/update/getContext/destroy. Squarified tiling (d3-hierarchy)
// with an optional two-part split per leaf, in LIGHT DOM (SVG) or canvas. No axes -
// just a title, the tiles, and an optional split legend. Mirrors the other engines'
// plugin wiring + colour-mapping dispatch; the tiling/geometry live in the pure layer.
import DOMPurify from "dompurify";
import { wireStickyDismiss } from "../render/stickyDismiss";
import { attachDevtools, reportDevtoolsHit } from "../devtools/hook";
import { ensureStyles } from "../styles";
import { svgEl, htmlEl, clear } from "../dom";
import { defaultNumberFormatter } from "../i18n/formatters";
import { renderTitle } from "../render/svg";
import { processTreemapData } from "../treemapChart/data";
import { buildTreemapColors } from "../treemapChart/colors";
import { layoutTreemap, layoutStack } from "../treemapChart/layout";
import { buildTreemapRenderModel, type TreemapLeafMark, type TreemapRenderModel } from "../treemapChart/renderModel";
import { renderTreemapSvg } from "../treemapChart/renderSvg";
import { drawTreemapCanvas } from "../treemapChart/renderCanvas";
import { drawTreemapWebgpu } from "../treemapChart/renderWebgpu";
import { resolveRenderer } from "../webgpu/capability";
import { buildTreemapContext } from "../context/buildTreemapContext";
import { renderA11yMirror } from "../context/a11yMirror";
import { checkTreemapData } from "../validate/treemapWarnings";
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
  TreemapChartProps,
  TreemapLeafContext,
} from "../types";

const DEFAULT_MARGIN: Margin = { top: 36, right: 6, bottom: 6, left: 6 };

// canvas + webgpu both paint into a <canvas> layer (no DOM marks), so they share
// the host-level hit-test / click-to-pin interaction path. svg does not.
const isPainted = (rr: Renderer): boolean => rr === "canvas" || rr === "webgpu";

interface Resolved {
  width: number;
  height: number;
  margin: Margin;
  renderer: Renderer;
  paddingInner: number;
  paddingTop: number;
  layout: "squarify" | "stack";
  splitOpacity: number;
  splitLabels: [string, string];
  showLegend: boolean;
  enableTransitions: boolean;
}

function resolve(p: TreemapChartProps): Resolved {
  const width = p.width ?? 900;
  const mode = p.layout ?? "squarify";
  const layout: "squarify" | "stack" =
    mode === "auto" ? (width < (p.stackBreakpoint ?? 480) ? "stack" : "squarify") : mode;
  return {
    width,
    height: p.height ?? 520,
    margin: p.margin ?? DEFAULT_MARGIN,
    // EFFECTIVE renderer: an opt-in "webgpu" request downgrades to "canvas" when
    // WebGPU is unavailable, so everything downstream (incl. getContext().renderer)
    // reflects what actually painted.
    renderer: resolveRenderer(p.renderer),
    paddingInner: p.paddingInner ?? 1,
    paddingTop: p.paddingTop ?? 18,
    layout,
    splitOpacity: p.splitOpacity ?? 0.35,
    splitLabels: p.splitLabels ?? ["Filled", "Remaining"],
    showLegend: p.showLegend ?? false,
    enableTransitions: p.enableTransitions ?? true,
  };
}

export function mountTreemapChart(
  host: HTMLElement,
  initial: TreemapChartProps,
  opts?: MountOptions<TreemapChartProps>
): ChartInstance<TreemapChartProps> {
  ensureStyles();
  host.classList.add("michi-vz", "michi-vz-treemap-chart");

  const svg = svgEl("svg");
  const tooltip = htmlEl("div", { class: "tooltip" });
  tooltip.style.visibility = "hidden";
  const a11y = htmlEl("div", { class: "mv-a11y" });
  a11y.setAttribute("role", "img");
  let canvas: HTMLCanvasElement | null = null;
  let webgpuCanvas: HTMLCanvasElement | null = null;

  host.appendChild(svg);
  host.appendChild(tooltip);
  host.appendChild(a11y);

  let baseProps: TreemapChartProps = initial;
  let context: ChartContext | null = null;
  const pluginList: MichiVzPlugin<TreemapChartProps>[] = [...(opts?.plugins ?? [])];
  const pc: PluginContext<TreemapChartProps> = {
    chartType: "treemap-chart",
    getProps: () => baseProps,
    getContext: () => context,
    setProps: (patch) => {
      baseProps = { ...baseProps, ...patch };
      render();
    },
  };
  let sticky = false;
  let lastColorMappingSent: Record<string, string> = {};
  let model: TreemapRenderModel | null = null;

  const leafToContext = (leaf: TreemapLeafMark): TreemapLeafContext => ({
    label: leaf.label,
    code: leaf.code,
    color: leaf.fill,
    path: leaf.path,
    value: leaf.value,
    partial: leaf.partial,
    remainder: leaf.remainder,
    partialPct: leaf.partialPct,
  });

  const showTooltip = (leaf: TreemapLeafMark, ev: MouseEvent): void => {
    const r = host.getBoundingClientRect();
    tooltip.style.left = `${ev.clientX - r.left + 10}px`;
    tooltip.style.top = `${ev.clientY - r.top - 10}px`;
    let htmlStr: string;
    if (baseProps.tooltipFormatter) {
      htmlStr = baseProps.tooltipFormatter(leafToContext(leaf));
    } else {
      const fmt = baseProps.valueFormatter ?? defaultNumberFormatter(baseProps.locale);
      const labels = baseProps.splitLabels ?? ["Filled", "Remaining"];
      htmlStr = `<strong>${leaf.label}</strong>`;
      if (leaf.path.length > 1) {
        htmlStr += `<br/><span style="color:#888">${leaf.path.slice(0, -1).join(" › ")}</span>`;
      }
      htmlStr += `<br/>${fmt(leaf.value)}`;
      if (leaf.partial != null) {
        const pct = leaf.partialPct != null ? Math.round(leaf.partialPct * 100) : 0;
        htmlStr += `<br/>${labels[0]}: ${fmt(leaf.partial)} (${pct}%)`;
        htmlStr += `<br/>${labels[1]}: ${fmt(leaf.remainder ?? 0)}`;
      }
    }
    tooltip.innerHTML = DOMPurify.sanitize(htmlStr);
    tooltip.style.visibility = "visible";
  };
  const hideTooltip = (): void => {
    if (sticky) return;
    tooltip.style.visibility = "hidden";
  };

  // Canvas-mode hit-test: tiles don't overlap, so the first containing rect wins.
  const onHostMove = (ev: MouseEvent): void => {
    if (!isPainted(resolve(baseProps).renderer) || !model || sticky) return;
    const svgRect = svg.getBoundingClientRect();
    const x = ev.clientX - svgRect.left;
    const y = ev.clientY - svgRect.top;
    let hit: TreemapLeafMark | null = null;
    for (const d of model.leaves) {
      if (x >= d.x && x <= d.x + d.w && y >= d.y && y <= d.y + d.h) {
        hit = d;
        break;
      }
    }
    reportDevtoolsHit(host, x, y, hit ? hit.label : null);
    if (hit) {
      showTooltip(hit, ev);
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
  host.addEventListener("mousemove", onHostMove);
  host.addEventListener("click", onHostClick);
  const disposeStickyDismiss = wireStickyDismiss(host, tooltip, {
    isSticky: () => sticky,
    unpin: () => {
      sticky = false;
    },
  });

  function renderLegend(parent: SVGElement, m: TreemapRenderModel, x: number, y: number): void {
    const g = svgEl("g", { class: "treemap-legend" });
    let cx = x;
    for (const item of m.legend) {
      // Swatch = the representative tile colour; the "remainder" swatch gets a
      // white veil so it matches the lighter untapped tiles (works on any theme).
      g.appendChild(
        svgEl("rect", {
          class: "treemap-legend-swatch",
          x: cx,
          y: y - 10,
          width: 12,
          height: 12,
          rx: 2,
          fill: m.legendColor,
        })
      );
      if (item.opacity < 1) {
        g.appendChild(
          svgEl("rect", {
            class: "treemap-legend-veil",
            x: cx,
            y: y - 10,
            width: 12,
            height: 12,
            rx: 2,
            fill: "#ffffff",
            opacity: Math.max(0, Math.min(0.95, 1 - item.opacity)),
          })
        );
      }
      const text = svgEl("text", {
        class: "treemap-legend-label",
        x: cx + 16,
        y: y,
        fill: "var(--michi-vz-ink, currentColor)",
      });
      text.textContent = item.label;
      g.appendChild(text);
      cx += 16 + item.label.length * 7 + 18;
    }
    parent.appendChild(g);
  }

  function render(): void {
    // Plugin hook #1 - transformData (identity with no plugins).
    const props = applyTransformData(pluginList, baseProps, pc);
    const r = resolve(props);
    svg.setAttribute("width", String(r.width));
    svg.setAttribute("height", String(r.height));
    svg.style.position = "relative";

    const processed = processTreemapData(props.dataSet ?? [], {
      disabledItems: props.disabledItems,
      filter: props.filter,
      minTileShare: props.minTileShare,
    });
    const showSplit = props.showSplit ?? processed.hasPartial;

    // Per-node `color` seeds the mapping; an explicit colorsMapping prop overrides it,
    // and the palette fills any group still unmapped.
    const seededMapping = { ...processed.groupColors, ...(props.colorsMapping ?? {}) };
    const colors = buildTreemapColors(
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

    const legendH = r.showLegend && showSplit ? 26 : 0;
    const plotW = Math.max(0, r.width - r.margin.left - r.margin.right);
    const plotH = Math.max(0, r.height - r.margin.top - r.margin.bottom - legendH);
    const paddingTop = processed.nested ? r.paddingTop : 0;

    const laidOut =
      r.layout === "stack"
        ? layoutStack(processed.root, {
            width: plotW,
            height: plotH,
            paddingInner: r.paddingInner,
            paddingTop,
          })
        : layoutTreemap(processed.root, {
            width: plotW,
            height: plotH,
            paddingInner: r.paddingInner,
            paddingTop,
          });

    model = buildTreemapRenderModel(laidOut, colors, {
      margin: r.margin,
      groupKeys: processed.groupKeys,
      showSplit,
      splitOpacity: r.splitOpacity,
      splitLabels: r.splitLabels,
      paddingTop,
      highlightItems: props.highlightItems ?? [],
    });

    clear(svg);
    renderTitle(svg, { text: props.title, x: r.width / 2, y: r.margin.top / 2 });

    if (r.renderer === "svg") {
      renderTreemapSvg(
        svg,
        model,
        { enableTransitions: r.enableTransitions },
        {
          onEnter: (leaf, ev) => {
            if (sticky) return;
            showTooltip(leaf, ev);
            props.onHighlightItem?.([leaf.label]);
          },
          onLeave: () => {
            hideTooltip();
            if (!sticky) props.onHighlightItem?.([]);
          },
          onClick: (leaf, ev) => {
            sticky = true;
            tooltip.classList.add("sticky");
            showTooltip(leaf, ev);
          },
        }
      );
    }

    if (legendH > 0) renderLegend(svg, model, r.margin.left, r.height - r.margin.bottom - 6);

    const makeLayerCanvas = (className: string): HTMLCanvasElement => {
      const c = htmlEl("canvas", { class: className });
      c.style.position = "absolute";
      c.style.top = getComputedStyle(host).paddingTop;
      c.style.left = getComputedStyle(host).paddingLeft;
      c.style.pointerEvents = "none";
      host.insertBefore(c, tooltip);
      return c;
    };

    if (r.renderer === "webgpu") {
      if (!webgpuCanvas) webgpuCanvas = makeLayerCanvas("treemapChart-webgpu-canvas");
      const ready = drawTreemapWebgpu(webgpuCanvas, svg, model, {
        width: r.width,
        height: r.height,
        // Re-render once the async GPU device resolves, upgrading canvas → GPU.
        onReady: render,
      });
      if (ready) {
        // GPU painted - drop any first-frame 2D fallback canvas.
        if (canvas) {
          canvas.remove();
          canvas = null;
        }
      } else {
        // Device not ready / unavailable (incl. jsdom): paint the canvas-2D stopgap
        // so the chart is never blank; the onReady re-render swaps in the GPU layer.
        if (!canvas) canvas = makeLayerCanvas("treemap-chart-canvas");
        drawTreemapCanvas(canvas, svg, model, { width: r.width, height: r.height });
      }
    } else if (r.renderer === "canvas") {
      if (webgpuCanvas) {
        webgpuCanvas.remove();
        webgpuCanvas = null;
      }
      if (!canvas) canvas = makeLayerCanvas("treemap-chart-canvas");
      drawTreemapCanvas(canvas, svg, model, { width: r.width, height: r.height });
    } else {
      if (canvas) {
        canvas.remove();
        canvas = null;
      }
      if (webgpuCanvas) {
        webgpuCanvas.remove();
        webgpuCanvas = null;
      }
    }

    const depth = processed.leaves.reduce((m, l) => Math.max(m, l.path.length), 1);
    context = buildTreemapContext({
      title: props.title,
      renderer: r.renderer,
      layout: r.layout,
      leaves: processed.leaves,
      colorsMapping: colors.generatedColorsMapping,
      splitLabels: r.splitLabels,
      splitOpacity: r.splitOpacity,
      showSplit,
      depth,
    });
    // Plugin hook #3 - enrichContext before a11y + dataprocessed.
    context = applyEnrichContext(pluginList, context, pc);
    renderA11yMirror(a11y, context);
    props.onChartDataProcessed?.(context);

    // Plugin hook #2 - validate the USER's data, merged with plugin warnings.
    if (baseProps.onDataWarning) {
      const warnings = [
        ...checkTreemapData(baseProps.dataSet),
        ...collectValidate(pluginList, baseProps, pc),
      ];
      if (warnings.length > 0) baseProps.onDataWarning(warnings);
    }
  }

  render();
  const teardowns = setupPlugins(pluginList, pc);

  const instance = {
    update(next: TreemapChartProps) {
      baseProps = next;
      render();
    },
    getContext() {
      return context;
    },
    use(plugin: MichiVzPlugin<TreemapChartProps>) {
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
      host.classList.remove("michi-vz", "michi-vz-treemap-chart");
    },
  };

  return attachDevtools(instance, host, "treemap-chart", () => baseProps);
}
