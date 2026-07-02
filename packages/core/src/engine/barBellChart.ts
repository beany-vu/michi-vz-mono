// BarBell engine: mount/update/getContext/destroy. Band y (dates) + linear x
// (cumulative); thin bars + end-cap circles in LIGHT DOM (SVG) or canvas.
import DOMPurify from "dompurify";
import { wireStickyDismiss } from "../render/stickyDismiss";
import { attachDevtools } from "../devtools/hook";
import { ensureStyles } from "../styles";
import { svgEl, htmlEl, clear } from "../dom";
import { defaultNumberFormatter } from "../i18n/formatters";
import { renderTitle, renderXAxisLinear, renderYAxisBand } from "../render/svg";
import { processBarBellData } from "../barBell/data";
import { buildBarBellColors } from "../barBell/colors";
import { createBarBellScales } from "../barBell/scales";
import { buildBarBellRenderModel } from "../barBell/renderModel";
import type { BarBellSegment } from "../barBell/renderModel";
import { renderBarBellSvg } from "../barBell/renderSvg";
import { placeTooltip } from "../render/placeTooltip";
import { drawBarBellCanvas } from "../barBell/renderCanvas";
import { drawBarBellWebgpu } from "../barBell/renderWebgpu";
import { resolveRenderer } from "../webgpu/capability";
import { buildBarBellContext } from "../context/buildBarBellContext";
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
  BarBellChartProps,
  BarBellDataRow,
  ChartContext,
  ChartInstance,
  DataWarning,
  Margin,
  MountOptions,
} from "../types";

const DEFAULT_MARGIN: Margin = { top: 50, right: 50, bottom: 50, left: 100 };

interface Resolved {
  width: number;
  height: number;
  margin: Margin;
  ticks: number;
  tickHtmlWidth: number;
  renderer: "svg" | "canvas" | "webgpu";
  enableTransitions: boolean;
}

// canvas + webgpu both paint into a <canvas> layer (no DOM marks), so they share
// the host-level hit-test / click-to-pin interaction path. svg does not.
const isPainted = (rr: Resolved["renderer"]): boolean => rr === "canvas" || rr === "webgpu";

function resolve(p: BarBellChartProps): Resolved {
  return {
    width: p.width ?? 900,
    height: p.height ?? 480,
    margin: p.margin ?? DEFAULT_MARGIN,
    ticks: p.ticks ?? 5,
    tickHtmlWidth: p.tickHtmlWidth ?? 80,
    // EFFECTIVE renderer: an opt-in "webgpu" request downgrades to "canvas" when
    // WebGPU is unavailable, so everything downstream (incl. getContext().renderer)
    // reflects what actually painted.
    renderer: resolveRenderer(p.renderer),
    enableTransitions: p.enableTransitions ?? true,
  };
}

function checkData(dataSet: BarBellDataRow[], keys: string[]): DataWarning[] {
  const warnings: DataWarning[] = [];
  if (!dataSet || dataSet.length === 0) {
    warnings.push({ type: "empty-dataset", message: "BarBell received an empty dataSet." });
  }
  if (!keys || keys.length === 0) {
    warnings.push({ type: "empty-dataset", message: "BarBell received no keys." });
  }
  return warnings;
}

export function mountBarBellChart(
  host: HTMLElement,
  initial: BarBellChartProps,
  opts?: MountOptions<BarBellChartProps>
): ChartInstance<BarBellChartProps> {
  ensureStyles();
  host.classList.add("michi-vz", "michi-vz-bar-bell-chart");

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

  let baseProps: BarBellChartProps = initial;
  let context: ChartContext | null = null;
  const pluginList: MichiVzPlugin<BarBellChartProps>[] = [...(opts?.plugins ?? [])];
  const pc: PluginContext<BarBellChartProps> = {
    chartType: "bar-bell-chart",
    getProps: () => baseProps,
    getContext: () => context,
    setProps: (patch) => {
      baseProps = { ...baseProps, ...patch };
      render();
    },
  };
  let sticky = false;
  let lastColorMappingSent: Record<string, string> = {};
  // Idempotency guard: only fire onChartDataProcessed when the serialized context
  // changes - an unconditional re-fire loops "Maximum update depth" in any consumer
  // that dispatches on each call (two-colour-writer indicators). Mirrors VSB.
  let lastContextSig = "";
  let model: ReturnType<typeof buildBarBellRenderModel> | null = null;

  const showTooltip = (seg: BarBellSegment, ev: MouseEvent): void => {
    const row = baseProps.dataSet.find((d) => String(d.date) === seg.date) ?? baseProps.dataSet[0];
    const htmlStr = baseProps.tooltipFormatter
      ? baseProps.tooltipFormatter(row, seg.key, seg.value)
      : `<strong>${seg.key}</strong><br/>${seg.date}: ${seg.value}`;
    tooltip.innerHTML = DOMPurify.sanitize(htmlStr);
    tooltip.style.visibility = "visible";
    // Position AFTER content+visible so placeTooltip can measure offsetWidth/Height
    // and flip left near the host's right edge (avoid sliding under the sidebar).
    placeTooltip(host, tooltip, ev);
  };
  const hideTooltip = (): void => {
    if (sticky) return;
    tooltip.style.visibility = "hidden";
  };

  const onHostMove = (ev: MouseEvent): void => {
    if (!isPainted(resolve(baseProps).renderer) || !model || sticky) return;
    const svgRect = svg.getBoundingClientRect();
    const x = ev.clientX - svgRect.left;
    const y = ev.clientY - svgRect.top;
    let hit: BarBellSegment | null = null;
    for (const seg of model.segments) {
      const inCap = Math.hypot(x - seg.cx, y - seg.capCy) <= model.capRadius + 1;
      const inBar =
        seg.width > 0 &&
        x >= seg.x &&
        x <= seg.x + seg.width &&
        Math.abs(y - seg.cy) <= model.barHeight / 2 + 1;
      if (inCap || inBar) {
        hit = seg;
        break;
      }
    }
    if (hit) {
      showTooltip(hit, ev);
      baseProps.onHighlightItem?.([hit.key]);
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

  function render(): void {
    // Plugin hook #1 - transformData: append/rewrite rows before layout.
    // With no plugins this is an identity fold, so behaviour is unchanged.
    const props = applyTransformData(pluginList, baseProps, pc);
    const r = resolve(props);
    svg.setAttribute("width", String(r.width));
    svg.setAttribute("height", String(r.height));
    svg.style.position = "relative";

    const { activeKeys, dates, xAxisDomain } = processBarBellData(
      props.dataSet,
      props.keys,
      props.disabledItems,
      props.yAxisDomain
    );

    const colors = buildBarBellColors(
      props.keys,
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

    const scales = createBarBellScales(dates, xAxisDomain, r.width, r.height, r.margin);
    model = buildBarBellRenderModel(props.dataSet, scales, colors, {
      activeKeys,
      highlightItems: props.highlightItems ?? [],
      // Default ON (legacy parity): end-caps that pile at the same x spread
      // vertically, centred on the row line, so none hide behind another. A consumer
      // can pass false to keep them stacked.
      dodgeOverlappingCaps: props.dodgeOverlappingCaps ?? true,
    });

    const xFormat = props.xAxisFormat ?? defaultNumberFormatter(props.locale);
    const yFormat = props.yAxisFormat ?? ((d: number | string) => String(d));

    clear(svg);
    renderTitle(svg, { text: props.title, x: r.width / 2, y: r.margin.top / 2 });
    renderXAxisLinear(svg, scales.xScale, {
      width: r.width,
      height: r.height,
      margin: r.margin,
      xAxisDataType: "number",
      format: (v) => xFormat(v),
      ticks: r.ticks,
      enableExplicitTickValues: false,
      // Legacy BarBell renders the value axis as a header ABOVE the date rows.
      position: "top",
    });
    renderYAxisBand(svg, scales.yScale, {
      width: r.width,
      margin: r.margin,
      format: (label) => yFormat(label),
      // Pass the RAW prop (undefined when unset) so renderYAxisBand sizes the label
      // box to the left margin - the full gutter - instead of a fixed 100px box that
      // strands free space on the left and truncates long "MM-YYYY | step" labels.
      tickHtmlWidth: props.tickHtmlWidth,
      showGrid: false,
    });

    if (r.renderer === "svg") {
      renderBarBellSvg(
        svg,
        model,
        { enableTransitions: r.enableTransitions },
        {
          onEnter: (seg, ev) => {
            if (sticky) return;
            showTooltip(seg, ev);
            props.onHighlightItem?.([seg.key]);
          },
          onLeave: () => {
            hideTooltip();
            if (!sticky) props.onHighlightItem?.([]);
          },
          onClick: (seg, ev) => {
            sticky = true;
            tooltip.classList.add("sticky");
            showTooltip(seg, ev);
          },
        }
      );
    }

    if (r.renderer === "webgpu") {
      if (!webgpuCanvas) webgpuCanvas = makeLayerCanvas("barBellChart-webgpu-canvas");
      const painted = drawBarBellWebgpu(webgpuCanvas, svg, model, {
        width: r.width,
        height: r.height,
        // Re-render once the async GPU device resolves, upgrading canvas → GPU.
        onReady: render,
      });
      if (painted) {
        // GPU painted - drop any first-frame 2D fallback canvas.
        removeCanvas();
      } else {
        // Device not ready / unavailable (incl. jsdom): paint the canvas-2D stopgap
        // so the chart is never blank; the onReady re-render swaps in the GPU layer.
        if (!canvas) canvas = makeLayerCanvas("bar-bell-canvas");
        drawBarBellCanvas(canvas, svg, model, { width: r.width, height: r.height });
      }
    } else if (r.renderer === "canvas") {
      removeWebgpuCanvas();
      if (!canvas) canvas = makeLayerCanvas("bar-bell-canvas");
      drawBarBellCanvas(canvas, svg, model, { width: r.width, height: r.height });
    } else {
      removeCanvas();
      removeWebgpuCanvas();
    }

    context = buildBarBellContext({
      title: props.title,
      renderer: r.renderer,
      xAxisDomain,
      dataSet: props.dataSet,
      activeKeys,
      dates,
      colorsMapping: colors.generatedColorsMapping,
      disabledItems: props.disabledItems,
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
    // USER's data (baseProps), not the plugin-synthesised rows.
    if (baseProps.onDataWarning) {
      const warnings = [
        ...checkData(baseProps.dataSet, baseProps.keys),
        ...collectValidate(pluginList, baseProps, pc),
      ];
      if (warnings.length > 0) baseProps.onDataWarning(warnings);
    }
  }

  render();
  const teardowns = setupPlugins(pluginList, pc);

  const instance = {
    update(next: BarBellChartProps) {
      baseProps = next;
      render();
    },
    getContext() {
      return context;
    },
    use(plugin: MichiVzPlugin<BarBellChartProps>) {
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
      host.classList.remove("michi-vz", "michi-vz-bar-bell-chart");
    },
  };

  return attachDevtools(instance, host, "bar-bell-chart", () => baseProps);
}
