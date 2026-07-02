// FountainChart ("Jet d'Eau") engine: mount/update/getContext/destroy. One jet
// per data item; categorical x = snapshot, temporal/numeric x = trend. LIGHT DOM
// (SVG) or canvas. Mirrors the Ribbon engine's plugin/devtools/tooltip wiring.
import DOMPurify from "dompurify";
import { wireStickyDismiss } from "../render/stickyDismiss";
import { attachDevtools } from "../devtools/hook";
import { ensureStyles } from "../styles";
import { svgEl, htmlEl, clear } from "../dom";
import { defaultNumberFormatter, defaultXAxisFormatter } from "../i18n/formatters";
import { renderTitle, renderXAxisBand, renderXAxisLinear, renderYAxisLinear } from "../render/svg";
import { processFountainData } from "../fountainChart/data";
import { buildFountainColors } from "../fountainChart/colors";
import { createFountainScales } from "../fountainChart/scales";
import { buildFountainRenderModel } from "../fountainChart/renderModel";
import type { FountainJetModel } from "../fountainChart/renderModel";
import { renderFountainSvg } from "../fountainChart/renderSvg";
import { drawFountainCanvas } from "../fountainChart/renderCanvas";
import { drawFountainWebgpu } from "../fountainChart/renderWebgpu";
import { resolveRenderer } from "../webgpu/capability";
import { buildFountainContext } from "../context/buildFountainContext";
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
  FountainChartProps,
  FountainDataItem,
  Margin,
  MountOptions,
} from "../types";

const DEFAULT_MARGIN: Margin = { top: 50, right: 40, bottom: 50, left: 60 };

// canvas + webgpu both paint into a <canvas> layer (no DOM marks), so they share
// the host-level hit-test / click-to-pin interaction path. svg does not.
const isPainted = (rr: "svg" | "canvas" | "webgpu"): boolean => rr === "canvas" || rr === "webgpu";

interface Resolved {
  width: number;
  height: number;
  margin: Margin;
  ticks: number;
  style: "jet" | "plume";
  frothLayers: number;
  bloomExponent: number;
  stemFraction: number;
  showDroplets: boolean;
  showMist: boolean;
  showTrendLine: boolean;
  renderer: "svg" | "canvas" | "webgpu";
  enableTransitions: boolean;
}

function resolve(p: FountainChartProps): Resolved {
  return {
    width: p.width ?? 900,
    height: p.height ?? 480,
    margin: p.margin ?? DEFAULT_MARGIN,
    ticks: p.ticks ?? 5,
    style: p.style ?? "jet",
    frothLayers: p.frothLayers ?? 14,
    bloomExponent: p.bloomExponent ?? 5,
    stemFraction: p.stemFraction ?? 0.045,
    showDroplets: p.showDroplets ?? true,
    showMist: p.showMist ?? true,
    showTrendLine: p.showTrendLine ?? true,
    // EFFECTIVE renderer: an opt-in "webgpu" request downgrades to "canvas" when
    // WebGPU is unavailable, so everything downstream (incl. getContext().renderer)
    // reflects what actually painted.
    renderer: resolveRenderer(p.renderer),
    enableTransitions: p.enableTransitions ?? true,
  };
}

function checkData(dataSet: FountainDataItem[]): DataWarning[] {
  const warnings: DataWarning[] = [];
  if (!dataSet || dataSet.length === 0) {
    warnings.push({ type: "empty-dataset", message: "FountainChart received an empty dataSet." });
    return warnings;
  }
  for (const d of dataSet) {
    if (!Number.isFinite(Number(d.value)) || !Number.isFinite(Number(d.spread))) {
      warnings.push({
        type: "non-finite-value",
        message: `FountainChart: non-finite value/spread for "${d.label}".`,
        label: d.label,
      });
    }
  }
  return warnings;
}

export function mountFountainChart(
  host: HTMLElement,
  initial: FountainChartProps,
  opts?: MountOptions<FountainChartProps>
): ChartInstance<FountainChartProps> {
  ensureStyles();
  host.classList.add("michi-vz", "michi-vz-fountain-chart");

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

  let baseProps: FountainChartProps = initial;
  let context: ChartContext | null = null;
  const pluginList: MichiVzPlugin<FountainChartProps>[] = [...(opts?.plugins ?? [])];
  const pc: PluginContext<FountainChartProps> = {
    chartType: "fountain-chart",
    getProps: () => baseProps,
    getContext: () => context,
    setProps: (patch) => {
      baseProps = { ...baseProps, ...patch };
      render();
    },
  };
  let sticky = false;
  let lastColorMappingSent: Record<string, string> = {};
  let model: ReturnType<typeof buildFountainRenderModel> | null = null;

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

  const showTooltip = (jet: FountainJetModel, ev: MouseEvent): void => {
    const r = host.getBoundingClientRect();
    tooltip.style.left = `${ev.clientX - r.left + 10}px`;
    tooltip.style.top = `${ev.clientY - r.top - 10}px`;
    const htmlStr = baseProps.tooltipFormatter
      ? baseProps.tooltipFormatter(jet.item)
      : `<strong>${jet.label}</strong><br/>value ${jet.value} &plusmn; ${jet.spread}` +
        (jet.predicted ? " (forecast)" : "");
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
    let hit: FountainJetModel | null = null;
    for (const jet of model.jets) {
      if (x >= jet.hit.left && x <= jet.hit.right && y >= jet.hit.top && y <= jet.hit.bottom) {
        hit = jet;
        break;
      }
    }
    if (hit) {
      showTooltip(hit, ev);
      baseProps.onHighlightItem?.([hit.label]);
    } else {
      hideTooltip();
      baseProps.onHighlightItem?.([]);
    }
  };
  // Canvas-mode click-to-pin (canvas marks have no DOM to click on).
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
    // Plugin hook #1 - transformData.
    const props = applyTransformData(pluginList, baseProps, pc);
    const r = resolve(props);
    svg.setAttribute("width", String(r.width));
    svg.setAttribute("height", String(r.height));
    svg.style.position = "relative";

    const processed = processFountainData(
      props.dataSet,
      props.xAxisDataType,
      props.disabledItems,
      props.yAxisDomain
    );

    const colors = buildFountainColors(
      processed.items,
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

    const scales = createFountainScales(
      processed.mode,
      processed.labels,
      processed.items.length,
      processed.xDomain,
      processed.yAxisDomain,
      r.width,
      r.height,
      r.margin,
      processed.temporalType
    );

    model = buildFountainRenderModel(processed.items, processed.mode, processed.temporalType, scales, colors, {
      style: r.style,
      frothLayers: r.frothLayers,
      bloomExponent: r.bloomExponent,
      stemFraction: r.stemFraction,
      showDroplets: r.showDroplets,
      showMist: r.showMist,
      showTrendLine: r.showTrendLine,
      highlightItems: props.highlightItems ?? [],
      maxDensity: processed.maxDensity,
    });

    const yFormat = props.yAxisFormat ?? defaultNumberFormatter(props.locale);

    clear(svg);
    renderTitle(svg, { text: props.title, x: r.width / 2, y: r.margin.top / 2 });

    if (processed.mode === "trend" && scales.xLinear && processed.temporalType) {
      const xFormat = props.xAxisFormat ?? defaultXAxisFormatter(processed.temporalType, props.locale);
      renderXAxisLinear(svg, scales.xLinear, {
        width: r.width,
        height: r.height,
        margin: r.margin,
        xAxisDataType: processed.temporalType,
        format: (v) => xFormat(v),
        ticks: r.ticks,
        tickValues: props.tickValues,
      });
    } else if (scales.xBand) {
      const xFormat = props.xAxisFormat ?? ((d: number | string) => String(d));
      renderXAxisBand(svg, scales.xBand, {
        width: r.width,
        height: r.height,
        margin: r.margin,
        format: (label) => xFormat(label),
      });
    }

    renderYAxisLinear(svg, scales.yScale, {
      width: r.width,
      height: r.height,
      margin: r.margin,
      format: (v) => yFormat(v),
      ticks: r.ticks,
    });

    if (r.renderer === "svg") {
      renderFountainSvg(
        svg,
        model,
        { enableTransitions: r.enableTransitions },
        {
          onEnter: (jet, ev) => {
            if (sticky) return;
            showTooltip(jet, ev);
            props.onHighlightItem?.([jet.label]);
          },
          onLeave: () => {
            hideTooltip();
            if (!sticky) props.onHighlightItem?.([]);
          },
          onClick: (jet, ev) => {
            sticky = true;
            tooltip.classList.add("sticky");
            showTooltip(jet, ev);
          },
        }
      );
    }

    if (isPainted(r.renderer)) {
      // Resolve the consumer ink colour so the canvas trend line matches the SVG
      // var(--michi-vz-ink, currentColor) instead of a hardcoded grey.
      const cs = getComputedStyle(host);
      const inkColor = (cs.getPropertyValue("--michi-vz-ink") || "").trim() || cs.color || "rgba(130,130,130,1)";

      if (r.renderer === "webgpu") {
        if (!webgpuCanvas) webgpuCanvas = makeLayerCanvas("fountainChart-webgpu-canvas");
        const ready = drawFountainWebgpu(webgpuCanvas, svg, model, {
          width: r.width,
          height: r.height,
          inkColor,
          // Re-render once the async GPU device resolves, upgrading canvas → GPU.
          onReady: render,
        });
        if (ready) {
          // GPU painted - drop any first-frame 2D fallback canvas.
          removeCanvas();
        } else {
          // Device not ready / unavailable (incl. jsdom): paint the canvas-2D
          // stopgap so the chart is never blank.
          if (!canvas) canvas = makeLayerCanvas("fountain-chart-canvas");
          drawFountainCanvas(canvas, svg, model, { width: r.width, height: r.height, inkColor });
        }
      } else {
        // canvas mode
        removeWebgpuCanvas();
        if (!canvas) canvas = makeLayerCanvas("fountain-chart-canvas");
        drawFountainCanvas(canvas, svg, model, { width: r.width, height: r.height, inkColor });
      }
    } else {
      removeCanvas();
      removeWebgpuCanvas();
    }

    context = buildFountainContext({
      title: props.title,
      renderer: r.renderer,
      mode: processed.mode,
      // Keep xAxis.type aligned with the resolved mode + domain shape: "band" when
      // snapshot (string[] domain), the temporal type when trend ([number,number]).
      xAxisType: processed.mode === "trend" ? (processed.temporalType ?? "number") : "band",
      items: processed.items,
      labels: processed.labels,
      xDomain: processed.xDomain,
      yAxisDomain: processed.yAxisDomain,
      colorsMapping: colors.generatedColorsMapping,
    });
    // Plugin hook #3 - enrichContext (before the a11y mirror + dataprocessed event).
    context = applyEnrichContext(pluginList, context, pc);
    renderA11yMirror(a11y, context);
    props.onChartDataProcessed?.(context);

    // Plugin hook #2 - validate. Validate the USER's data (baseProps); add layout
    // warnings from the processed model (crowding / clipped spread).
    if (baseProps.onDataWarning) {
      const warnings: DataWarning[] = [
        ...checkData(baseProps.dataSet),
        ...collectValidate(pluginList, baseProps, pc),
      ];
      // Snapshot bands dedupe labels, so duplicate-labelled jets would stack on
      // the same slot; warn (trend legitimately reuses a label across periods).
      if (processed.mode === "snapshot") {
        const seen = new Set<string>();
        const dupes = new Set<string>();
        for (const it of processed.items) {
          if (seen.has(it.label)) dupes.add(it.label);
          seen.add(it.label);
        }
        for (const label of dupes) {
          warnings.push({
            type: "duplicate-label",
            message: `FountainChart: duplicate label "${label}" in snapshot mode; jets stack on the same band. Use unique labels or trend mode.`,
            label,
          });
        }
      }
      const crowdLimit = processed.mode === "trend" ? 15 : 10;
      if (processed.items.length > crowdLimit) {
        warnings.push({
          type: "layout-overflow",
          message: `FountainChart: ${processed.items.length} jets exceed the readable ${crowdLimit} for ${processed.mode} mode; widen the chart, disable items, or aggregate.`,
        });
      }
      if (model.clippedLabels.length > 0) {
        warnings.push({
          type: "layout-overflow",
          message: `FountainChart: spread clipped to the column width for ${model.clippedLabels.join(", ")}; widen the chart or reduce spread.`,
        });
      }
      if (warnings.length > 0) baseProps.onDataWarning(warnings);
    }
  }

  render();
  const teardowns = setupPlugins(pluginList, pc);

  const instance = {
    update(next: FountainChartProps) {
      baseProps = next;
      render();
    },
    getContext() {
      return context;
    },
    use(plugin: MichiVzPlugin<FountainChartProps>) {
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
      host.classList.remove("michi-vz", "michi-vz-fountain-chart");
    },
  };

  return attachDevtools(instance, host, "fountain-chart", () => baseProps);
}
