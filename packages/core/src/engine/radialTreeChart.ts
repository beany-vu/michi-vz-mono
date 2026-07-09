// RadialTree engine: mount/update/getContext/destroy. Migration target: legacy
// sdg-trade TreeRadial - a d3-hierarchy `cluster()` radial dendrogram (leaves
// equidistant from the centre) with circles sized at BOTH the group AND leaf
// level, adaptive label density (abbreviate/truncate/hide/rotate by leaf count),
// and an optional word-wrapped centre title. No axes - a title, the dendrogram,
// and the centre label. Mirrors the other engines' plugin wiring + colour-mapping
// dispatch; the polar geometry lives entirely in the pure layer (radialTree/*).
import DOMPurify from "dompurify";
import { wireStickyDismiss } from "../render/stickyDismiss";
import { attachDevtools, reportDevtoolsHit } from "../devtools/hook";
import { ensureStyles } from "../styles";
import { svgEl, htmlEl, clear } from "../dom";
import { renderTitle } from "../render/svg";
import { applyChartChrome, createChromeRefs } from "../render/chrome";
import { defaultNumberFormatter } from "../i18n/formatters";
import { processRadialTreeData } from "../radialTree/data";
import { buildRadialTreeColors } from "../radialTree/colors";
import { buildRadialTreeRadiusScale } from "../radialTree/scales";
import { layoutRadialTree } from "../radialTree/layout";
import { buildRadialTreeRenderModel } from "../radialTree/renderModel";
import type { RadialTreeMark, RadialTreeRenderModel } from "../radialTree/renderModel";
import { renderRadialTreeSvg } from "../radialTree/renderSvg";
import { drawRadialTreeCanvas } from "../radialTree/renderCanvas";
import { drawRadialTreeWebgpu } from "../radialTree/renderWebgpu";
import { resolveRenderer } from "../webgpu/capability";
import { resolveReveal, createEngineReveal, type ResolvedReveal } from "../animation/reveal";
import {
  resolveTimeline,
  createEngineTimeline,
  type ResolvedTimeline,
} from "../animation/chartTimeline";
import { buildRadialTreeContext } from "../context/buildRadialTreeContext";
import { renderA11yMirror } from "../context/a11yMirror";
import { contextSignature } from "../context/signature";
import { checkRadialTreeData } from "../validate/radialTreeWarnings";
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
  RadialTreeChartProps,
  RadialTreeNode,
} from "../types";

const DEFAULT_MARGIN: Margin = { top: 36, right: 10, bottom: 10, left: 10 };
const DEFAULT_RADIUS_RANGE: [number, number] = [2, 32];
const DEFAULT_ROTATE_ABOVE = 20;
const DEFAULT_HIDE_ABOVE = 100;
// Distance kept between the outer edge of the dendrogram and the plot bounds
// (legacy `circlePadding`).
const CIRCLE_PADDING = 12;

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
  rotateAbove: number;
  hideAbove: number;
  enableTransitions: boolean;
  progressiveDraw: ResolvedReveal | null;
  timeline: ResolvedTimeline | null;
}

function resolve(p: RadialTreeChartProps): Resolved {
  return {
    width: p.width ?? 900,
    height: p.height ?? 520,
    margin: p.margin ?? DEFAULT_MARGIN,
    // EFFECTIVE renderer: an opt-in "webgpu" request downgrades to "canvas" when
    // WebGPU is unavailable, so everything downstream (incl. getContext().renderer)
    // reflects what actually painted.
    renderer: resolveRenderer(p.renderer),
    radiusRange: p.radiusRange ?? DEFAULT_RADIUS_RANGE,
    rotateAbove: p.labelDensityThresholds?.rotateAbove ?? DEFAULT_ROTATE_ABOVE,
    hideAbove: p.labelDensityThresholds?.hideAbove ?? DEFAULT_HIDE_ABOVE,
    enableTransitions: p.enableTransitions ?? true,
    progressiveDraw: resolveReveal(p.progressiveDraw),
    timeline: resolveTimeline(p.timeline),
  };
}

export function mountRadialTreeChart(
  host: HTMLElement,
  initial: RadialTreeChartProps,
  opts?: MountOptions<RadialTreeChartProps>
): ChartInstance<RadialTreeChartProps> {
  ensureStyles();
  host.classList.add("michi-vz", "michi-vz-radial-tree-chart");

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

  let baseProps: RadialTreeChartProps = initial;
  let context: ChartContext | null = null;
  const pluginList: MichiVzPlugin<RadialTreeChartProps>[] = [...(opts?.plugins ?? [])];
  const pc: PluginContext<RadialTreeChartProps> = {
    chartType: "radial-tree-chart",
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
  let model: RadialTreeRenderModel | null = null;
  let centerX = 0;
  let centerY = 0;
  const engineRv = createEngineReveal({ ticker: opts?.ticker, motion: opts?.motion });
  // Opt-in "play through years": the controller + built-in control lifecycle is
  // shared engine glue; render() consumes the period-filtered dataSet it returns.
  const engineTl = createEngineTimeline({
    ticker: opts?.ticker,
    motion: opts?.motion,
    requestRender: () => render(),
  });

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

  const markToNode = (m: RadialTreeMark): RadialTreeNode => ({
    label: m.label,
    code: m.code,
    value: m.value,
    color: m.fill,
  });

  const showTooltip = (mark: RadialTreeMark, ev: MouseEvent): void => {
    const htmlStr = baseProps.tooltipFormatter
      ? baseProps.tooltipFormatter(markToNode(mark))
      : `<strong>${mark.label}</strong><br/>${defaultNumberFormatter(baseProps.locale)(mark.value)}`;
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

  // Canvas/webgpu host-level hit-test: point-in-circle, checking the SMALLEST
  // circle first (so a leaf nested visually inside a bigger group circle is
  // still reachable) - the opposite convention from de-overlapped bubble charts,
  // since here overlap is the NORMAL, expected layout (a leaf sits along its
  // group's own radial spoke).
  const onHostMove = (ev: MouseEvent): void => {
    if (!isPainted(resolve(baseProps).renderer) || !model || sticky) return;
    const svgRect = svg.getBoundingClientRect();
    const r = resolve(baseProps);
    const x = ev.clientX - svgRect.left - r.margin.left - centerX;
    const y = ev.clientY - svgRect.top - r.margin.top - centerY;
    let hit: RadialTreeMark | null = null;
    let hitR = Infinity;
    for (const m of model.marks) {
      const dx = x - m.x;
      const dy = y - m.y;
      if (dx * dx + dy * dy <= m.markRadius * m.markRadius && m.markRadius < hitR) {
        hit = m;
        hitR = m.markRadius;
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
    const outerRadius = Math.max(0, Math.min(innerWidth, innerHeight) / 2 - CIRCLE_PADDING);
    centerX = innerWidth / 2;
    centerY = innerHeight / 2;

    // Timeline (opt-in): swap in the active period's root nodes (ROOT-level
    // `date` tags; children need no dates - interpolateRows recurses into them).
    // This chart has no own `filter` prop, so nothing to neutralize.
    const tlData = engineTl.beforeRender(r.timeline, props.dataSet ?? [], undefined);
    const processed = processRadialTreeData(tlData.dataSet, { disabledItems: props.disabledItems });

    const seededMapping = { ...processed.groupColors, ...(props.colorsMapping ?? {}) };
    const colors = buildRadialTreeColors(
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

    const radiusOf = buildRadialTreeRadiusScale(processed.nodes, r.radiusRange);
    const laidOut = layoutRadialTree(processed.root, { outerRadius });

    model = buildRadialTreeRenderModel(laidOut, colors, radiusOf, {
      leafCount: processed.leaves.length,
      rotateAbove: r.rotateAbove,
      hideAbove: r.hideAbove,
      outerRadius,
      centerLabel: props.centerLabel,
      highlightItems: props.highlightItems ?? [],
      valueFormatter: defaultNumberFormatter(props.locale),
    });

    clear(svg);
    renderTitle(svg, { text: props.title, x: r.width / 2, y: r.margin.top / 2 });

    if (dataState !== "nodata") {
      // Outer wrapper carries NO transform of its own (unlike `plot`, which
      // translates to the polar centre) so its local user space equals the SVG's
      // absolute pixel space - the frame the progressive-draw reveal clips in
      // below. Clipping `plot` itself would clip in ITS post-translate frame,
      // permanently hiding every node with a negative local x (the left half of
      // the dendrogram, centred on the origin).
      const marksWrap = svgEl("g", { class: "radial-tree-marks" });
      svg.appendChild(marksWrap);
      const plot = svgEl("g", {
        transform: `translate(${r.margin.left + centerX}, ${r.margin.top + centerY})`,
      });
      marksWrap.appendChild(plot);

      if (r.renderer === "svg") {
        renderRadialTreeSvg(
          plot,
          model,
          { enableTransitions: r.enableTransitions },
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
        if (!webgpuCanvas) webgpuCanvas = makeLayerCanvas("radial-tree-webgpu-canvas");
        webgpuCanvas.style.top = `${r.margin.top}px`;
        webgpuCanvas.style.left = `${r.margin.left}px`;
        // Always paints synchronously (delegated to the canvas-2D renderer - see
        // radialTree/renderWebgpu.ts) and always returns true.
        drawRadialTreeWebgpu(webgpuCanvas, svg, model, {
          width: innerWidth,
          height: innerHeight,
          centerX,
          centerY,
        });
      } else {
        removeWebgpuCanvas();
        if (!canvas) canvas = makeLayerCanvas("radial-tree-canvas");
        canvas.style.top = `${r.margin.top}px`;
        canvas.style.left = `${r.margin.left}px`;
        drawRadialTreeCanvas(canvas, svg, model, {
          width: innerWidth,
          height: innerHeight,
          centerX,
          centerY,
        });
      }

      // Opt-in reveal animation: wipes the dendrogram left to right. Suppressed
      // when timeline is active (it wins over progressiveDraw).
      engineRv.afterRender(r.timeline ? null : r.progressiveDraw, {
        renderer: r.renderer,
        svg,
        marksRoot: svg.querySelector("g.radial-tree-marks"),
        height: r.height,
        startPx: 0,
        endPx: r.width,
        // The canvas layer is offset by the margin (`canvas.style.left`) and sized
        // to the inner plot only, so its local frame starts at margin.left - shift
        // the absolute revealX into that local frame to keep the sweep in sync.
        canvasRedraw:
          r.renderer === "canvas"
            ? (x) =>
                drawRadialTreeCanvas(canvas, svg, model!, {
                  width: innerWidth,
                  height: innerHeight,
                  centerX,
                  centerY,
                  revealX: Math.max(0, x - r.margin.left),
                })
            : undefined,
      });
    } else {
      removeCanvas();
      removeWebgpuCanvas();
    }

    context = buildRadialTreeContext({
      title: props.title,
      renderer: r.renderer,
      centerLabel: props.centerLabel,
      marks: model.marks,
      groupCount: processed.groups.length,
      leafCount: processed.leaves.length,
      maxDepth: processed.maxDepth,
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
        ...checkRadialTreeData(baseProps.dataSet),
        ...collectValidate(pluginList, baseProps, pc),
      ];
      if (warnings.length > 0) baseProps.onDataWarning(warnings);
    }

    engineTl.afterRender(host, r.timeline);
  }

  render();
  const teardowns = setupPlugins(pluginList, pc);

  const instance: ChartInstance<RadialTreeChartProps> = {
    update(next: RadialTreeChartProps) {
      baseProps = next;
      render();
    },
    getContext() {
      return context;
    },
    use(plugin: MichiVzPlugin<RadialTreeChartProps>) {
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
      engineRv.stop();
      disposeStickyDismiss();
      for (const t of teardowns) t();
      host.removeEventListener("mousemove", onHostMove);
      host.removeEventListener("mouseleave", onHostLeave);
      host.removeEventListener("click", onHostClick);
      canvas = null;
      webgpuCanvas = null;
      clear(host);
      host.classList.remove("michi-vz", "michi-vz-radial-tree-chart");
    },
  };
  // replay() only exists when the chart opted into the reveal animation, so
  // feature-off charts keep an unchanged instance surface.
  if (resolve(initial).progressiveDraw) {
    instance.replay = () => engineRv.replay();
  }
  // timeline() only exists when the chart opted into playback at mount, so
  // feature-off charts keep an unchanged instance surface.
  if (resolve(initial).timeline) {
    instance.timeline = () => engineTl.controller();
  }

  return attachDevtools(instance, host, "radial-tree-chart", () => baseProps);
}
