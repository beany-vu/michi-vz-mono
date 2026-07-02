// RibbonChart engine: mount/update/getContext/destroy. Stacked columns + ribbon
// connectors; band x (dates), linear y. LIGHT DOM (SVG) or canvas.
import DOMPurify from "dompurify";
import { wireStickyDismiss } from "../render/stickyDismiss";
import { attachDevtools } from "../devtools/hook";
import { ensureStyles } from "../styles";
import { svgEl, htmlEl, clear } from "../dom";
import { defaultNumberFormatter } from "../i18n/formatters";
import { renderTitle, renderXAxisBand, renderYAxisLinear } from "../render/svg";
import { processRibbonData } from "../ribbonChart/data";
import { buildRibbonColors } from "../ribbonChart/colors";
import { createRibbonScales } from "../ribbonChart/scales";
import { buildRibbonRenderModel } from "../ribbonChart/renderModel";
import type { RibbonColumn } from "../ribbonChart/renderModel";
import { renderRibbonSvg } from "../ribbonChart/renderSvg";
import { drawRibbonCanvas } from "../ribbonChart/renderCanvas";
import { drawRibbonWebgpu } from "../ribbonChart/renderWebgpu";
import { resolveRenderer } from "../webgpu/capability";
import { buildRibbonContext } from "../context/buildRibbonContext";
import { renderA11yMirror } from "../context/a11yMirror";
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
  DataWarning,
  Margin,
  MountOptions,
  Renderer,
  RibbonChartProps,
  RibbonDataRow,
} from "../types";

const DEFAULT_MARGIN: Margin = { top: 50, right: 50, bottom: 60, left: 60 };

// canvas + webgpu both paint into a <canvas> layer (no DOM marks), so they share
// the host-level hit-test / click-to-pin interaction path. svg does not.
const isPainted = (rr: Renderer): boolean => rr === "canvas" || rr === "webgpu";

interface Resolved {
  width: number;
  height: number;
  margin: Margin;
  ticks: number;
  columnWidth: number;
  renderer: Renderer;
  enableTransitions: boolean;
}

function resolve(p: RibbonChartProps): Resolved {
  return {
    width: p.width ?? 900,
    height: p.height ?? 480,
    margin: p.margin ?? DEFAULT_MARGIN,
    ticks: p.ticks ?? 5,
    columnWidth: p.columnWidth ?? 30,
    // EFFECTIVE renderer: an opt-in "webgpu" request downgrades to "canvas" when
    // WebGPU is unavailable, so everything downstream (incl. getContext().renderer)
    // reflects what actually painted.
    renderer: resolveRenderer(p.renderer),
    enableTransitions: p.enableTransitions ?? true,
  };
}

function checkData(series: RibbonDataRow[], keys: string[]): DataWarning[] {
  const warnings: DataWarning[] = [];
  if (!series || series.length === 0) warnings.push({ type: "empty-dataset", message: "RibbonChart received an empty series." });
  if (!keys || keys.length === 0) warnings.push({ type: "empty-dataset", message: "RibbonChart received no keys." });
  return warnings;
}

export function mountRibbonChart(
  host: HTMLElement,
  initial: RibbonChartProps,
  opts?: MountOptions<RibbonChartProps>
): ChartInstance<RibbonChartProps> {
  ensureStyles();
  host.classList.add("michi-vz", "michi-vz-ribbon-chart");

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

  let baseProps: RibbonChartProps = initial;
  let context: ChartContext | null = null;
  const pluginList: MichiVzPlugin<RibbonChartProps>[] = [...(opts?.plugins ?? [])];
  const pc: PluginContext<RibbonChartProps> = {
    chartType: "ribbon-chart",
    getProps: () => baseProps,
    getContext: () => context,
    setProps: (patch) => {
      baseProps = { ...baseProps, ...patch };
      render();
    },
  };
  let sticky = false;
  let lastColorMappingSent: Record<string, string> = {};
  let model: ReturnType<typeof buildRibbonRenderModel> | null = null;

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

  const showTooltip = (col: RibbonColumn, ev: MouseEvent): void => {
    const r = host.getBoundingClientRect();
    tooltip.style.left = `${ev.clientX - r.left + 10}px`;
    tooltip.style.top = `${ev.clientY - r.top - 10}px`;
    const row = baseProps.series.find((d) => String(d.date) === col.date) ?? baseProps.series[0];
    const htmlStr = baseProps.tooltipFormatter
      ? baseProps.tooltipFormatter(row, col.key, col.value)
      : `<strong>${col.key}</strong><br/>${col.date}: ${col.value}`;
    tooltip.innerHTML = DOMPurify.sanitize(htmlStr);
    tooltip.style.visibility = "visible";
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
    let hit: RibbonColumn | null = null;
    for (const col of model.columns) {
      if (x >= col.x && x <= col.x + col.width && y >= col.y && y <= col.y + col.height) {
        hit = col;
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
    // Plugin hook #1 - transformData: append/transform series before processing.
    // With no plugins this is an identity fold, so behaviour is unchanged.
    const props = applyTransformData(pluginList, baseProps, pc);
    const r = resolve(props);
    svg.setAttribute("width", String(r.width));
    svg.setAttribute("height", String(r.height));
    svg.style.position = "relative";

    const { activeKeys, dates, yAxisDomain } = processRibbonData(
      props.series,
      props.keys,
      props.disabledItems,
      props.yAxisDomain
    );

    const colors = buildRibbonColors(
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

    const scales = createRibbonScales(dates, yAxisDomain, r.width, r.height, r.margin);
    model = buildRibbonRenderModel(props.series, scales, colors, {
      activeKeys,
      columnWidth: r.columnWidth,
      highlightItems: props.highlightItems ?? [],
    });

    const xFormat = props.xAxisFormat ?? ((d: number | string) => String(d));
    const yFormat = props.yAxisFormat ?? defaultNumberFormatter(props.locale);

    clear(svg);
    renderTitle(svg, { text: props.title, x: r.width / 2, y: r.margin.top / 2 });
    renderXAxisBand(svg, scales.xScale, {
      width: r.width,
      height: r.height,
      margin: r.margin,
      format: (label) => xFormat(label),
    });
    renderYAxisLinear(svg, scales.yScale, {
      width: r.width,
      height: r.height,
      margin: r.margin,
      format: (v) => yFormat(v),
      ticks: r.ticks,
    });

    if (r.renderer === "svg") {
      renderRibbonSvg(
        svg,
        model,
        { enableTransitions: r.enableTransitions },
        {
          onEnter: (col, ev) => {
            if (sticky) return;
            showTooltip(col, ev);
            props.onHighlightItem?.([col.key]);
          },
          onLeave: () => {
            hideTooltip();
            if (!sticky) props.onHighlightItem?.([]);
          },
          onClick: (col, ev) => {
            sticky = true;
            tooltip.classList.add("sticky");
            showTooltip(col, ev);
          },
        }
      );
    }

    if (r.renderer === "webgpu") {
      if (!webgpuCanvas) webgpuCanvas = makeLayerCanvas("ribbonChart-webgpu-canvas");
      const ready = drawRibbonWebgpu(webgpuCanvas, svg, model, {
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
        if (!canvas) canvas = makeLayerCanvas("ribbon-chart-canvas");
        drawRibbonCanvas(canvas, svg, model, { width: r.width, height: r.height });
      }
    } else if (r.renderer === "canvas") {
      if (webgpuCanvas) {
        webgpuCanvas.remove();
        webgpuCanvas = null;
      }
      if (!canvas) canvas = makeLayerCanvas("ribbon-chart-canvas");
      drawRibbonCanvas(canvas, svg, model, { width: r.width, height: r.height });
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

    context = buildRibbonContext({
      title: props.title,
      renderer: r.renderer,
      series: props.series,
      activeKeys,
      dates,
      yAxisDomain,
      colorsMapping: colors.generatedColorsMapping,
    });
    // Plugin hook #3 - enrichContext: rewrite summary BEFORE the a11y mirror + the
    // dataprocessed event, so narration flows to both for free.
    context = applyEnrichContext(pluginList, context, pc);
    renderA11yMirror(a11y, context);
    props.onChartDataProcessed?.(context);

    // Plugin hook #2 - validate: merge core checks with plugin warnings. Validate the
    // USER's data (baseProps), not the plugin-synthesised series.
    if (baseProps.onDataWarning) {
      const warnings = [
        ...checkData(baseProps.series, baseProps.keys),
        ...collectValidate(pluginList, baseProps, pc),
      ];
      if (warnings.length > 0) baseProps.onDataWarning(warnings);
    }
  }

  render();
  const teardowns = setupPlugins(pluginList, pc);

  const instance = {
    update(next: RibbonChartProps) {
      baseProps = next;
      render();
    },
    getContext() {
      return context;
    },
    use(plugin: MichiVzPlugin<RibbonChartProps>) {
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
      host.classList.remove("michi-vz", "michi-vz-ribbon-chart");
    },
  };

  return attachDevtools(instance, host, "ribbon-chart", () => baseProps);
}
