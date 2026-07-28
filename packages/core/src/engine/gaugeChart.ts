// Gauge engine: mount/update/getContext/destroy. Concentric rings (outer to
// inner), each sweeping value/max of a full circle clockwise from `startAngle`
// over a background track. LIGHT DOM (SVG), canvas, or webgpu. Hovering a ring
// activates it (emphasis + the optional built-in centre label); `defaultActive`
// picks the resting ring. Mirrors the pie engine's plugin wiring + colour
// contract; geometry lives in the pure layer.
import DOMPurify from "dompurify";
import { wireStickyDismiss } from "../render/stickyDismiss";
import { attachDevtools } from "../devtools/hook";
import { ensureStyles } from "../styles";
import { svgEl, htmlEl, clear } from "../dom";
import { renderTitle } from "../render/svg";
import { applyChartChrome, createChromeRefs } from "../render/chrome";
import { processGaugeData } from "../gaugeChart/data";
import { buildGaugeColors } from "../gaugeChart/colors";
import {
  buildGaugeRenderModel,
  type GaugeRingMark,
  type GaugeRenderModel,
} from "../gaugeChart/renderModel";
import { renderGaugeSvg } from "../gaugeChart/renderSvg";
import { drawGaugeCanvas } from "../gaugeChart/renderCanvas";
import { drawGaugeWebgpu } from "../gaugeChart/renderWebgpu";
import { resolveRenderer } from "../webgpu/capability";
import { buildGaugeContext } from "../context/buildGaugeContext";
import { renderA11yMirror } from "../context/a11yMirror";
import { contextSignature } from "../context/signature";
import { checkGaugeData } from "../validate/gaugeWarnings";
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
  GaugeActiveStyle,
  GaugeChartProps,
  GaugeRingContext,
  Margin,
  MountOptions,
  Renderer,
} from "../types";

// canvas + webgpu both paint into a <canvas> layer (no DOM marks), so they share
// the host-level hit-test / interaction path. svg does not.
const isPainted = (rr: Renderer): boolean => rr === "canvas" || rr === "webgpu";

interface Resolved {
  width: number;
  height: number;
  margin: Margin;
  renderer: Renderer;
  max: number;
  ringThickness: number;
  ringGap: number;
  outerRadius: number | null;
  startAngle: number;
  roundedCaps: boolean;
  ringOpacity: number | number[];
  trackColor: string | string[];
  trackOpacity: number | number[];
  defaultActive: number | "inner" | "outer" | null;
  activeStyle: GaugeActiveStyle;
  showCenterLabel: boolean;
  enableTransitions: boolean;
}

function resolve(p: GaugeChartProps): Resolved {
  return {
    width: p.width ?? 300,
    height: p.height ?? 300,
    margin: p.margin ?? { top: p.title ? 36 : 8, right: 8, bottom: 8, left: 8 },
    // EFFECTIVE renderer: an opt-in "webgpu" request downgrades to "canvas" when
    // WebGPU is unavailable, so everything downstream (incl. getContext().renderer)
    // reflects what actually painted.
    renderer: resolveRenderer(p.renderer),
    max: p.max ?? 100,
    ringThickness: p.ringThickness ?? 18,
    ringGap: p.ringGap ?? 2,
    outerRadius: p.outerRadius ?? null,
    startAngle: p.startAngle ?? 0,
    roundedCaps: p.roundedCaps ?? false,
    ringOpacity: p.ringOpacity ?? 1,
    trackColor: p.trackColor ?? "#00000014",
    trackOpacity: p.trackOpacity ?? 1,
    defaultActive: p.defaultActive === undefined ? "inner" : p.defaultActive,
    activeStyle: p.activeStyle ?? {},
    showCenterLabel: p.showCenterLabel ?? true,
    enableTransitions: p.enableTransitions ?? true,
  };
}

export function mountGaugeChart(
  host: HTMLElement,
  initial: GaugeChartProps,
  opts?: MountOptions<GaugeChartProps>,
): ChartInstance<GaugeChartProps> {
  ensureStyles();
  host.classList.add("michi-vz", "michi-vz-gauge-chart");

  const svg = svgEl("svg");
  const tooltip = htmlEl("div", { class: "tooltip" });
  tooltip.style.visibility = "hidden";
  const centerLabel = htmlEl("div", { class: "mv-gauge-center" });
  centerLabel.style.display = "none";
  const a11y = htmlEl("div", { class: "mv-a11y" });
  a11y.setAttribute("role", "img");
  const chrome = createChromeRefs();
  let canvas: HTMLCanvasElement | null = null;
  let webgpuCanvas: HTMLCanvasElement | null = null;

  host.appendChild(svg);
  host.appendChild(centerLabel);
  host.appendChild(tooltip);
  host.appendChild(a11y);

  let baseProps: GaugeChartProps = initial;
  let context: ChartContext | null = null;
  const pluginList: MichiVzPlugin<GaugeChartProps>[] = [...(opts?.plugins ?? [])];
  const pc: PluginContext<GaugeChartProps> = {
    chartType: "gauge-chart",
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
  let model: GaugeRenderModel | null = null;
  // Hovered ring index (dataSet order) - wins over highlightItems/defaultActive.
  let hoverIndex: number | null = null;

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

  const ringToContext = (m: GaugeRingMark): GaugeRingContext => ({
    label: m.label,
    code: m.code,
    color: m.stroke,
    value: m.value,
    fraction: m.fraction,
    index: m.index,
  });

  const showTooltip = (m: GaugeRingMark, ev: MouseEvent): void => {
    if (!baseProps.tooltipFormatter) return; // opt-in: the centre label is the readout
    const r = host.getBoundingClientRect();
    tooltip.style.left = `${ev.clientX - r.left + 10}px`;
    tooltip.style.top = `${ev.clientY - r.top - 10}px`;
    tooltip.innerHTML = DOMPurify.sanitize(baseProps.tooltipFormatter(ringToContext(m)));
    tooltip.style.visibility = "visible";
  };
  const hideTooltip = (): void => {
    if (sticky) return;
    tooltip.style.visibility = "hidden";
  };

  const setHover = (index: number | null, ev?: MouseEvent): void => {
    if (hoverIndex === index) {
      if (index !== null && ev && model) {
        const m = model.rings.find((x) => x.index === index);
        if (m) showTooltip(m, ev); // keep the tooltip tracking the cursor
      }
      return;
    }
    hoverIndex = index;
    render();
    if (index !== null && model) {
      const m = model.rings.find((x) => x.index === index);
      if (m) {
        if (ev) showTooltip(m, ev);
        baseProps.onHighlightItem?.([m.label]);
        return;
      }
    }
    hideTooltip();
    baseProps.onHighlightItem?.([]);
  };

  // Canvas/webgpu-mode hit-test: distance from centre against each ring's
  // annulus (centreline ± thickness/2, +2px forgiveness); nearest wins.
  const onHostMove = (ev: MouseEvent): void => {
    if (!isPainted(resolve(baseProps).renderer) || !model || sticky) return;
    const svgRect = svg.getBoundingClientRect();
    const dx = ev.clientX - svgRect.left - model.cx;
    const dy = ev.clientY - svgRect.top - model.cy;
    const dist = Math.hypot(dx, dy);
    let best: GaugeRingMark | null = null;
    let bestDelta = Infinity;
    for (const m of model.rings) {
      const delta = Math.abs(dist - m.radius);
      if (delta <= m.thickness / 2 + 2 && delta < bestDelta) {
        best = m;
        bestDelta = delta;
      }
    }
    setHover(best ? best.index : null, ev);
  };
  const onHostLeave = (): void => {
    if (!isPainted(resolve(baseProps).renderer)) return;
    setHover(null);
  };
  // Canvas-mode click-to-pin for the opt-in tooltip (mirrors the pie engine).
  const onHostClick = (): void => {
    if (!isPainted(resolve(baseProps).renderer) || !baseProps.tooltipFormatter) return;
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
  host.addEventListener("mouseleave", onHostLeave);
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

    // data-mv-state + font var + default loading/no-data overlays (shared chrome).
    // Rings with null values still RENDER (empty tracks); only an empty dataSet
    // (or an explicit isNodata) is "no data".
    const dataState = applyChartChrome(host, props, props.dataSet, chrome);

    svg.setAttribute("width", String(r.width));
    svg.setAttribute("height", String(r.height));
    svg.style.position = "relative";

    const processed = processGaugeData(props.dataSet ?? [], {
      disabledItems: props.disabledItems,
      max: r.max,
    });

    const seededMapping = { ...processed.groupColors, ...(props.colorsMapping ?? {}) };
    const colors = buildGaugeColors(
      processed.groupKeys,
      props.colors,
      seededMapping,
      props.skipColorMappingDispatch ?? false,
    );
    if (!props.skipColorMappingDispatch && props.onColorMappingGenerated) {
      const next = colors.generatedColorsMapping;
      if (JSON.stringify(next) !== JSON.stringify(lastColorMappingSent)) {
        lastColorMappingSent = { ...next };
        props.onColorMappingGenerated(next);
      }
    }

    const plotW = Math.max(0, r.width - r.margin.left - r.margin.right);
    const plotH = Math.max(0, r.height - r.margin.top - r.margin.bottom);
    const cx = r.margin.left + plotW / 2;
    const cy = r.margin.top + plotH / 2;
    const outerRadius = r.outerRadius ?? Math.min(plotW, plotH) / 2;

    // Resting active ring: hover > first highlightItems match > defaultActive.
    const highlightItems = props.highlightItems ?? [];
    let restingIndex: number | null = null;
    if (r.defaultActive === "inner") restingIndex = processed.rings.length - 1;
    else if (r.defaultActive === "outer") restingIndex = 0;
    else if (typeof r.defaultActive === "number") restingIndex = r.defaultActive;
    if (restingIndex !== null && (restingIndex < 0 || restingIndex >= processed.rings.length)) {
      restingIndex = null;
    }
    const highlightIdx = highlightItems.length
      ? processed.rings.findIndex((x) => highlightItems.includes(x.label))
      : -1;
    const activeIndex = hoverIndex ?? (highlightIdx >= 0 ? highlightIdx : restingIndex);

    model = buildGaugeRenderModel(processed.rings, colors, {
      cx,
      cy,
      outerRadius,
      ringThickness: r.ringThickness,
      ringGap: r.ringGap,
      startAngleDeg: r.startAngle,
      roundedCaps: r.roundedCaps,
      max: processed.max,
      ringOpacity: r.ringOpacity,
      trackColor: r.trackColor,
      trackOpacity: r.trackOpacity,
      activeStyle: r.activeStyle,
      activeIndex,
      highlightItems,
    });

    clear(svg);
    renderTitle(svg, { text: props.title, x: r.width / 2, y: r.margin.top / 2 });

    if (r.renderer === "svg" && dataState !== "nodata") {
      renderGaugeSvg(
        svg,
        model,
        { enableTransitions: r.enableTransitions },
        {
          onEnter: (ring, ev) => {
            if (sticky) return;
            setHover(ring.index, ev);
          },
          onLeave: () => {
            if (!sticky) setHover(null);
          },
          onClick: (ring, ev) => {
            if (!props.tooltipFormatter) return;
            sticky = true;
            tooltip.classList.add("sticky");
            showTooltip(ring, ev);
          },
        },
      );
    }

    if (r.renderer === "webgpu" && dataState !== "nodata") {
      if (!webgpuCanvas) webgpuCanvas = makeLayerCanvas("gaugeChart-webgpu-canvas");
      const ready = drawGaugeWebgpu(webgpuCanvas, svg, model, {
        width: r.width,
        height: r.height,
        // Re-render once the async GPU device resolves, upgrading canvas → GPU.
        onReady: render,
      });
      if (ready) {
        removeCanvas();
      } else {
        // Device not ready / unavailable (incl. jsdom): paint the canvas-2D stopgap
        // so the chart is never blank; the onReady re-render swaps in the GPU layer.
        if (!canvas) canvas = makeLayerCanvas("gauge-chart-canvas");
        drawGaugeCanvas(canvas, svg, model, { width: r.width, height: r.height });
      }
    } else if (r.renderer === "canvas" && dataState !== "nodata") {
      removeWebgpuCanvas();
      if (!canvas) canvas = makeLayerCanvas("gauge-chart-canvas");
      drawGaugeCanvas(canvas, svg, model, { width: r.width, height: r.height });
    } else {
      removeCanvas();
      removeWebgpuCanvas();
    }

    // ----- Built-in centre label (the active ring's readout) -----
    const activeMark =
      activeIndex === null ? null : (model.rings.find((m) => m.index === activeIndex) ?? null);
    if (r.showCenterLabel && dataState === "ready" && (activeMark || props.centerContent)) {
      const fmt = props.valueFormatter ?? ((v: number) => `${v}%`);
      const html = props.centerContent
        ? props.centerContent(activeMark ? ringToContext(activeMark) : null)
        : activeMark
          ? `<span class="mv-gauge-center-label">${activeMark.label}</span>` +
            `<b class="mv-gauge-center-value">${
              activeMark.value === null ? (props.noValueLabel ?? "n/a") : fmt(activeMark.value)
            }</b>`
          : "";
      centerLabel.innerHTML = DOMPurify.sanitize(html);
      centerLabel.style.left = `${cx}px`;
      centerLabel.style.top = `${cy}px`;
      centerLabel.style.display = html ? "" : "none";
    } else {
      centerLabel.style.display = "none";
    }

    // ----- Context (renderer-agnostic) + a11y + warnings -----
    context = buildGaugeContext({
      title: props.title,
      renderer: r.renderer,
      rings: processed.rings,
      max: processed.max,
      colorsMapping: colors.generatedColorsMapping,
      valueFormatter: props.valueFormatter,
    });
    // Plugin hook #3 - enrichContext before a11y + dataprocessed.
    context = applyEnrichContext(pluginList, context, pc);
    renderA11yMirror(a11y, context);
    // Idempotency guard (mirrors LineChart/VSB): only fire onChartDataProcessed
    // when the serialized context changes - hover re-renders would otherwise
    // re-fire an unchanged context into two-colour-writer consumers.
    const contextSig = contextSignature(context);
    if (contextSig !== lastContextSig) {
      lastContextSig = contextSig;
      props.onChartDataProcessed?.(context);
    }

    // Plugin hook #2 - validate the USER's data, merged with plugin warnings.
    if (baseProps.onDataWarning) {
      const warnings = [
        ...checkGaugeData(baseProps.dataSet, r.max),
        ...collectValidate(pluginList, baseProps, pc),
      ];
      if (warnings.length > 0) baseProps.onDataWarning(warnings);
    }
  }

  render();
  const teardowns = setupPlugins(pluginList, pc);

  const instance: ChartInstance<GaugeChartProps> = {
    update(next: GaugeChartProps) {
      baseProps = next;
      render();
    },
    getContext() {
      return context;
    },
    use(plugin: MichiVzPlugin<GaugeChartProps>) {
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
      host.classList.remove("michi-vz", "michi-vz-gauge-chart");
    },
  };

  return attachDevtools(instance, host, "gauge-chart", () => baseProps);
}
