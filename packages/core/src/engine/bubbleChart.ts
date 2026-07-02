// Bubble engine: mount/update/getContext/destroy. Circles sized by value, packed
// into a cluster by a d3-force gravity simulation (settled synchronously), with
// an optional realized/untapped split. LIGHT DOM (SVG) or canvas. No axes - just a
// title, the bubbles, and an optional split legend. Mirrors the other engines'
// plugin wiring + colour-mapping dispatch; the force layout lives in the pure layer.
import DOMPurify from "dompurify";
import { wireStickyDismiss } from "../render/stickyDismiss";
import { attachDevtools, reportDevtoolsHit } from "../devtools/hook";
import { ensureStyles } from "../styles";
import { svgEl, htmlEl, clear } from "../dom";
import { defaultNumberFormatter } from "../i18n/formatters";
import { renderTitle } from "../render/svg";
import { processBubbleData } from "../bubbleChart/data";
import { buildBubbleColors } from "../bubbleChart/colors";
import { layoutBubbles } from "../bubbleChart/layout";
import { buildBubbleRenderModel, type BubbleMark, type BubbleRenderModel } from "../bubbleChart/renderModel";
import { renderBubbleSvg } from "../bubbleChart/renderSvg";
import { drawBubbleCanvas } from "../bubbleChart/renderCanvas";
import { drawBubbleWebgpu } from "../bubbleChart/renderWebgpu";
import { resolveRenderer } from "../webgpu/capability";
import { buildBubbleContext } from "../context/buildBubbleContext";
import { renderA11yMirror } from "../context/a11yMirror";
import { checkBubbleData } from "../validate/bubbleWarnings";
import {
  applyTransformData,
  applyEnrichContext,
  collectValidate,
  collectTools,
  setupPlugins,
} from "../plugins/runner";
import type { AgentTool, MichiVzPlugin, PluginContext } from "../plugins/types";
import type {
  BubbleChartProps,
  BubbleContext,
  ChartContext,
  ChartInstance,
  Margin,
  MountOptions,
  Renderer,
} from "../types";

const DEFAULT_MARGIN: Margin = { top: 36, right: 8, bottom: 8, left: 8 };

// canvas + webgpu both paint into a <canvas> layer (no DOM marks), so they share
// the host-level hit-test path. svg does not.
const isPainted = (rr: Renderer): boolean => rr === "canvas" || rr === "webgpu";

interface Resolved {
  width: number;
  height: number;
  margin: Margin;
  renderer: Renderer;
  gravity: number;
  chargeStrength: number;
  padding: number;
  fillRatio: number;
  splitOpacity: number;
  splitLabels: [string, string];
  showLegend: boolean;
  showLabels: boolean;
  enableTransitions: boolean;
}

function resolve(p: BubbleChartProps): Resolved {
  return {
    width: p.width ?? 700,
    height: p.height ?? 500,
    margin: p.margin ?? DEFAULT_MARGIN,
    // EFFECTIVE renderer: an opt-in "webgpu" request downgrades to "canvas" when
    // WebGPU is unavailable, so everything downstream (incl. getContext().renderer)
    // reflects what actually painted.
    renderer: resolveRenderer(p.renderer),
    gravity: p.gravity ?? 0.09,
    chargeStrength: p.chargeStrength ?? 0,
    padding: p.padding ?? 2,
    fillRatio: p.fillRatio ?? 0.62,
    splitOpacity: p.splitOpacity ?? 0.35,
    splitLabels: p.splitLabels ?? ["Realized", "Untapped"],
    showLegend: p.showLegend ?? false,
    showLabels: p.showLabels ?? true,
    enableTransitions: p.enableTransitions ?? true,
  };
}

export function mountBubbleChart(
  host: HTMLElement,
  initial: BubbleChartProps,
  opts?: MountOptions<BubbleChartProps>
): ChartInstance<BubbleChartProps> {
  ensureStyles();
  host.classList.add("michi-vz", "michi-vz-bubble-chart");

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

  // Lazily create an absolutely-positioned <canvas> layered behind the SVG,
  // matching the host padding (shared by canvas mode + the webgpu fallback).
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

  let baseProps: BubbleChartProps = initial;
  let context: ChartContext | null = null;
  const pluginList: MichiVzPlugin<BubbleChartProps>[] = [...(opts?.plugins ?? [])];
  const pc: PluginContext<BubbleChartProps> = {
    chartType: "bubble-chart",
    getProps: () => baseProps,
    getContext: () => context,
    setProps: (patch) => {
      baseProps = { ...baseProps, ...patch };
      render();
    },
  };
  let sticky = false;
  let lastColorMappingSent: Record<string, string> = {};
  let model: BubbleRenderModel | null = null;

  const bubbleToContext = (b: BubbleMark): BubbleContext => ({
    label: b.label,
    code: b.code,
    color: b.fill,
    value: b.value,
    partial: b.partial,
    remainder: b.remainder,
    partialPct: b.partialPct,
  });

  const showTooltip = (b: BubbleMark, ev: MouseEvent): void => {
    const r = host.getBoundingClientRect();
    tooltip.style.left = `${ev.clientX - r.left + 10}px`;
    tooltip.style.top = `${ev.clientY - r.top - 10}px`;
    let htmlStr: string;
    if (baseProps.tooltipFormatter) {
      htmlStr = baseProps.tooltipFormatter(bubbleToContext(b));
    } else {
      const fmt = baseProps.valueFormatter ?? defaultNumberFormatter(baseProps.locale);
      const labels = baseProps.splitLabels ?? ["Realized", "Untapped"];
      htmlStr = `<strong>${b.label}</strong><br/>${fmt(b.value)}`;
      if (b.partial != null) {
        const pct = b.partialPct != null ? Math.round(b.partialPct * 100) : 0;
        htmlStr += `<br/>${labels[0]}: ${fmt(b.partial)} (${pct}%)`;
        htmlStr += `<br/>${labels[1]}: ${fmt(b.remainder ?? 0)}`;
      }
    }
    tooltip.innerHTML = DOMPurify.sanitize(htmlStr);
    tooltip.style.visibility = "visible";
  };
  const hideTooltip = (): void => {
    if (sticky) return;
    tooltip.style.visibility = "hidden";
  };

  // Canvas-mode hit-test: point-in-circle. Packed circles don't overlap, so the
  // first containing bubble wins.
  const onHostMove = (ev: MouseEvent): void => {
    if (!isPainted(resolve(baseProps).renderer) || !model || sticky) return;
    const svgRect = svg.getBoundingClientRect();
    const x = ev.clientX - svgRect.left;
    const y = ev.clientY - svgRect.top;
    let hit: BubbleMark | null = null;
    for (const b of model.bubbles) {
      const dx = x - b.x;
      const dy = y - b.y;
      if (dx * dx + dy * dy <= b.r * b.r) {
        hit = b;
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

  function renderLegend(parent: SVGElement, m: BubbleRenderModel, x: number, y: number): void {
    const g = svgEl("g", { class: "bubble-legend" });
    let cx = x;
    for (const item of m.legend) {
      g.appendChild(
        svgEl("rect", {
          class: "bubble-legend-swatch",
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
            class: "bubble-legend-veil",
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
        class: "bubble-legend-label",
        x: cx + 16,
        y,
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

    const processed = processBubbleData(props.dataSet ?? [], {
      disabledItems: props.disabledItems,
      filter: props.filter,
    });
    const showSplit = props.showSplit ?? processed.hasPartial;

    const seededMapping = { ...processed.groupColors, ...(props.colorsMapping ?? {}) };
    const colors = buildBubbleColors(
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

    const packed = layoutBubbles(processed.nodes, {
      width: plotW,
      height: plotH,
      gravity: r.gravity,
      chargeStrength: r.chargeStrength,
      padding: r.padding,
      fillRatio: r.fillRatio,
    });

    model = buildBubbleRenderModel(packed, colors, {
      margin: r.margin,
      groupKeys: processed.groupKeys,
      showSplit,
      splitOpacity: r.splitOpacity,
      splitLabels: r.splitLabels,
      showLabels: r.showLabels,
      highlightItems: props.highlightItems ?? [],
    });

    clear(svg);
    renderTitle(svg, { text: props.title, x: r.width / 2, y: r.margin.top / 2 });

    if (r.renderer === "svg") {
      renderBubbleSvg(
        svg,
        model,
        { enableTransitions: r.enableTransitions },
        {
          onEnter: (bubble, ev) => {
            if (sticky) return;
            showTooltip(bubble, ev);
            props.onHighlightItem?.([bubble.label]);
          },
          onLeave: () => {
            hideTooltip();
            if (!sticky) props.onHighlightItem?.([]);
          },
          onClick: (bubble, ev) => {
            sticky = true;
            tooltip.classList.add("sticky");
            showTooltip(bubble, ev);
          },
        }
      );
    }

    if (legendH > 0) renderLegend(svg, model, r.margin.left, r.height - r.margin.bottom - 6);

    if (r.renderer === "webgpu") {
      if (!webgpuCanvas) webgpuCanvas = makeLayerCanvas("bubbleChart-webgpu-canvas");
      const ready = drawBubbleWebgpu(webgpuCanvas, svg, model, {
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
        if (!canvas) canvas = makeLayerCanvas("bubble-chart-canvas");
        drawBubbleCanvas(canvas, svg, model, { width: r.width, height: r.height });
      }
    } else if (r.renderer === "canvas") {
      removeWebgpuCanvas();
      if (!canvas) canvas = makeLayerCanvas("bubble-chart-canvas");
      drawBubbleCanvas(canvas, svg, model, { width: r.width, height: r.height });
    } else {
      removeCanvas();
      removeWebgpuCanvas();
    }

    context = buildBubbleContext({
      title: props.title,
      renderer: r.renderer,
      nodes: processed.nodes,
      colorsMapping: colors.generatedColorsMapping,
      splitLabels: r.splitLabels,
      showSplit,
    });
    // Plugin hook #3 - enrichContext before a11y + dataprocessed.
    context = applyEnrichContext(pluginList, context, pc);
    renderA11yMirror(a11y, context);
    props.onChartDataProcessed?.(context);

    // Plugin hook #2 - validate the USER's data, merged with plugin warnings.
    if (baseProps.onDataWarning) {
      const warnings = [
        ...checkBubbleData(baseProps.dataSet),
        ...collectValidate(pluginList, baseProps, pc),
      ];
      if (warnings.length > 0) baseProps.onDataWarning(warnings);
    }
  }

  render();
  const teardowns = setupPlugins(pluginList, pc);

  const instance = {
    update(next: BubbleChartProps) {
      baseProps = next;
      render();
    },
    getContext() {
      return context;
    },
    use(plugin: MichiVzPlugin<BubbleChartProps>) {
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
      host.classList.remove("michi-vz", "michi-vz-bubble-chart");
    },
  };

  return attachDevtools(instance, host, "bubble-chart", () => baseProps);
}
