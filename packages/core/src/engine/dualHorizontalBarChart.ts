// DualHorizontalBar (tornado) engine: mount/update/getContext/destroy. Band y +
// centred dual linear x; value1 right, value2 left. LIGHT DOM (SVG) or canvas.
import DOMPurify from "dompurify";
import { wireStickyDismiss } from "../render/stickyDismiss";
import { attachDevtools } from "../devtools/hook";
import { ensureStyles } from "../styles";
import { svgEl, htmlEl, clear } from "../dom";
import { renderTitle, renderYAxisBand } from "../render/svg";
import { processDualBarData } from "../dualBar/data";
import { buildDualBarColors } from "../dualBar/colors";
import { createDualBarScales } from "../dualBar/scales";
import { buildDualRenderModel } from "../dualBar/renderModel";
import type { DualBarModel } from "../dualBar/renderModel";
import { renderDualSvg } from "../dualBar/renderSvg";
import { drawDualCanvas } from "../dualBar/renderCanvas";
import { drawDualBarWebgpu } from "../dualBar/renderWebgpu";
import { resolveRenderer } from "../webgpu/capability";
import { buildDualBarContext } from "../context/buildDualBarContext";
import { renderA11yMirror } from "../context/a11yMirror";
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
  DataWarning,
  DualBarChartProps,
  DualBarDataPoint,
  Filter,
  Margin,
  MountOptions,
  Renderer,
} from "../types";

const DEFAULT_MARGIN: Margin = { top: 50, right: 50, bottom: 50, left: 120 };

// canvas + webgpu both paint into a <canvas> layer (no DOM marks), so they share
// the host-level hit-test / click-to-pin interaction path. svg does not.
const isPainted = (rr: Renderer): boolean => rr === "canvas" || rr === "webgpu";

interface Resolved {
  width: number;
  height: number;
  margin: Margin;
  tickHtmlWidth: number;
  yAxisPosition: "center" | "left";
  interactiveRowLabels: boolean;
  renderer: Renderer;
  value1Opacity: number;
  value2Opacity: number;
  enableTransitions: boolean;
  timeline: ResolvedTimeline | null;
}

function resolve(p: DualBarChartProps): Resolved {
  return {
    width: p.width ?? 900,
    height: p.height ?? 480,
    margin: p.margin ?? DEFAULT_MARGIN,
    tickHtmlWidth: p.tickHtmlWidth ?? 100,
    yAxisPosition: p.yAxisPosition ?? "center",
    interactiveRowLabels: p.interactiveRowLabels ?? false,
    // EFFECTIVE renderer: an opt-in "webgpu" request downgrades to "canvas" when
    // WebGPU is unavailable, so everything downstream (incl. getContext().renderer)
    // reflects what actually painted.
    renderer: resolveRenderer(p.renderer),
    value1Opacity: p.value1Opacity ?? 0.9,
    value2Opacity: p.value2Opacity ?? 0.55,
    enableTransitions: p.enableTransitions ?? true,
    timeline: resolveTimeline(p.timeline),
  };
}

function checkData(dataSet: DualBarDataPoint[]): DataWarning[] {
  const warnings: DataWarning[] = [];
  if (!dataSet || dataSet.length === 0) {
    warnings.push({ type: "empty-dataset", message: "DualHorizontalBar received an empty dataSet." });
    return warnings;
  }
  const seen = new Set<string>();
  for (const d of dataSet) {
    if (!Number.isFinite(d.value1) || !Number.isFinite(d.value2)) {
      warnings.push({ type: "non-finite-value", message: `"${d.label}" has a non-finite value.`, label: d.label });
    }
    if (seen.has(d.label)) warnings.push({ type: "duplicate-label", message: `Duplicate label "${d.label}".`, label: d.label });
    seen.add(d.label);
  }
  return warnings;
}

export function mountDualHorizontalBarChart(
  host: HTMLElement,
  initial: DualBarChartProps,
  opts?: MountOptions<DualBarChartProps>
): ChartInstance<DualBarChartProps> {
  ensureStyles();
  host.classList.add("michi-vz", "michi-vz-dual-bar-chart");

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

  let baseProps: DualBarChartProps = initial;
  let context: ChartContext | null = null;
  const pluginList: MichiVzPlugin<DualBarChartProps>[] = [...(opts?.plugins ?? [])];
  const pc: PluginContext<DualBarChartProps> = {
    chartType: "dual-horizontal-bar-chart",
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
  // While the pointer is on the row-label scrub gutter, the host-level canvas
  // hit-test must stand down (it would miss and hide the scrub tooltip).
  let scrubbing = false;
  let lastColorMappingSent: Record<string, string> = {};
  let model: ReturnType<typeof buildDualRenderModel> | null = null;

  const showTooltip = (d: DualBarDataPoint, ev: MouseEvent): void => {
    const r = host.getBoundingClientRect();
    tooltip.style.left = `${ev.clientX - r.left + 10}px`;
    tooltip.style.top = `${ev.clientY - r.top - 10}px`;
    const htmlStr = baseProps.tooltipFormatter
      ? baseProps.tooltipFormatter(d)
      : `<strong>${d.label}</strong><br/>Value 1: ${d.value1}<br/>Value 2: ${d.value2}`;
    tooltip.innerHTML = DOMPurify.sanitize(htmlStr);
    tooltip.style.visibility = "visible";
  };
  const hideTooltip = (): void => {
    if (sticky) return;
    tooltip.style.visibility = "hidden";
  };

  const onHostMove = (ev: MouseEvent): void => {
    if (scrubbing) return;
    if (!isPainted(resolve(baseProps).renderer) || !model || sticky) return;
    const svgRect = svg.getBoundingClientRect();
    const x = ev.clientX - svgRect.left;
    const y = ev.clientY - svgRect.top;
    let hit: DualBarModel | null = null;
    for (const bar of model.bars) {
      if (y < bar.y || y > bar.y + bar.height) continue;
      const inRight = x >= bar.bar1.x && x <= bar.bar1.x + bar.bar1.width;
      const inLeft = x >= bar.bar2.x && x <= bar.bar2.x + bar.bar2.width;
      if (inRight || inLeft) {
        hit = bar;
        break;
      }
    }
    if (hit) {
      showTooltip(hit.raw, ev);
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

  function render(): void {
    // Plugin hook #1 - transformData: forecast/etc. append predicted points/series.
    // With no plugins this is an identity fold, so behaviour is unchanged.
    const props = applyTransformData(pluginList, baseProps, pc);
    const r = resolve(props);
    svg.setAttribute("width", String(r.width));
    svg.setAttribute("height", String(r.height));
    svg.style.position = "relative";

    // Timeline (opt-in): swap in the active period's rows; the user's own filter
    // still applies within the period (its `date` is neutralized while playing).
    // This chart's own `filter` shape has no `date` field (unlike the shared
    // `Filter` type engineTl speaks) - cast across the boundary; the neutralize
    // check is simply a no-op here.
    const tlData = engineTl.beforeRender(
      r.timeline,
      props.dataSet,
      props.filter as unknown as Filter | undefined
    );
    const { points, labels, xAxisDomain } = processDualBarData(tlData.dataSet, {
      disabledItems: props.disabledItems,
      filter: tlData.filter as unknown as DualBarChartProps["filter"],
      xAxisDomain: props.xAxisDomain,
    });

    const colors = buildDualBarColors(
      tlData.dataSet,
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

    const scales = createDualBarScales(xAxisDomain, labels, r.width, r.height, r.margin);
    model = buildDualRenderModel(points, scales, colors, props.highlightItems ?? []);

    const yFormat = props.yAxisFormat ?? ((d: number | string) => String(d));

    clear(svg);
    renderTitle(svg, { text: props.title, x: r.width / 2, y: r.margin.top / 2 });
    // Legacy "center" anchors the label column to the shared centre line (labels sit
    // over the left-extending bars); "left" keeps them in the left margin, clear of
    // the plot - the classic population-pyramid look.
    // interactiveRowLabels: label hover/focus = leader line + row tooltip +
    // highlight; click pins (same sticky contract as the bars). Composed from the
    // row model, so it works in svg, canvas, and webgpu modes alike.
    const rowByLabel = new Map(model.bars.map((b) => [b.label, b]));
    const labelTooltipEvent = (rowCenterY: number): MouseEvent => {
      const hostRect = host.getBoundingClientRect();
      return {
        clientX: hostRect.left + scales.center + 12,
        clientY: hostRect.top + rowCenterY,
      } as MouseEvent;
    };
    renderYAxisBand(svg, scales.yScale, {
      width: r.width,
      margin: r.yAxisPosition === "center" ? { ...r.margin, left: scales.center } : r.margin,
      format: (label) => yFormat(label),
      tickHtmlWidth: r.tickHtmlWidth,
      showGrid: false,
      interactions: r.interactiveRowLabels
        ? {
            leaderToX: (label) => {
              const b = rowByLabel.get(label);
              // The row's full extent starts at the left bar's left edge.
              return b && b.bar2.width > 0 ? b.bar2.x : scales.center;
            },
            onEnter: (label, rowCenterY, pointer) => {
              scrubbing = true;
              if (sticky) return;
              const b = rowByLabel.get(label);
              if (!b) return;
              showTooltip(b.raw, (pointer as MouseEvent) ?? labelTooltipEvent(rowCenterY));
              props.onHighlightItem?.([label]);
            },
            onLeave: () => {
              scrubbing = false;
              hideTooltip();
              if (!sticky) props.onHighlightItem?.([]);
            },
            onClick: (label, rowCenterY, pointer) => {
              const b = rowByLabel.get(label);
              if (!b) return;
              sticky = true;
              tooltip.classList.add("sticky");
              showTooltip(b.raw, (pointer as MouseEvent) ?? labelTooltipEvent(rowCenterY));
            },
          }
        : undefined,
    });

    if (r.renderer === "svg") {
      renderDualSvg(
        svg,
        model,
        { value1Opacity: r.value1Opacity, value2Opacity: r.value2Opacity, enableTransitions: r.enableTransitions },
        {
          onEnter: (bar, ev) => {
            if (sticky) return;
            showTooltip(bar.raw, ev);
            props.onHighlightItem?.([bar.label]);
          },
          onLeave: () => {
            hideTooltip();
            if (!sticky) props.onHighlightItem?.([]);
          },
          onClick: (bar, ev) => {
            sticky = true;
            tooltip.classList.add("sticky");
            showTooltip(bar.raw, ev);
          },
        }
      );
    }

    if (r.renderer === "webgpu") {
      if (!webgpuCanvas) webgpuCanvas = makeLayerCanvas("dual-bar-webgpu-canvas");
      const ready = drawDualBarWebgpu(webgpuCanvas, svg, model, {
        width: r.width,
        height: r.height,
        value1Opacity: r.value1Opacity,
        value2Opacity: r.value2Opacity,
        // Re-render once the async GPU device resolves, upgrading canvas → GPU.
        onReady: render,
      });
      if (ready) {
        // GPU painted - drop any first-frame 2D fallback canvas.
        removeCanvas();
      } else {
        // Device not ready / unavailable (incl. jsdom): paint the canvas-2D stopgap
        // so the chart is never blank; the onReady re-render swaps in the GPU layer.
        if (!canvas) canvas = makeLayerCanvas("dual-bar-canvas");
        drawDualCanvas(canvas, svg, model, {
          width: r.width,
          height: r.height,
          value1Opacity: r.value1Opacity,
          value2Opacity: r.value2Opacity,
        });
      }
    } else if (r.renderer === "canvas") {
      removeWebgpuCanvas();
      if (!canvas) canvas = makeLayerCanvas("dual-bar-canvas");
      drawDualCanvas(canvas, svg, model, {
        width: r.width,
        height: r.height,
        value1Opacity: r.value1Opacity,
        value2Opacity: r.value2Opacity,
      });
    } else {
      removeCanvas();
      removeWebgpuCanvas();
    }

    context = buildDualBarContext({
      title: props.title,
      renderer: r.renderer,
      xAxisDomain,
      points,
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

    engineTl.afterRender(host, r.timeline);
  }

  render();
  const teardowns = setupPlugins(pluginList, pc);

  const instance: ChartInstance<DualBarChartProps> = {
    update(next: DualBarChartProps) {
      baseProps = next;
      render();
    },
    getContext() {
      return context;
    },
    use(plugin: MichiVzPlugin<DualBarChartProps>) {
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
      host.removeEventListener("click", onHostClick);
      canvas = null;
      webgpuCanvas = null;
      clear(host);
      host.classList.remove("michi-vz", "michi-vz-dual-bar-chart");
    },
  };
  // timeline() only exists when the chart opted into playback at mount, so
  // feature-off charts keep an unchanged instance surface.
  if (resolve(initial).timeline) {
    instance.timeline = () => engineTl.controller();
  }

  return attachDevtools(instance, host, "dual-horizontal-bar-chart", () => baseProps);
}
