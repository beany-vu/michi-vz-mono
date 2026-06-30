// RadarChart engine: mount/update/getContext/destroy. Polar grid + one polygon
// per series. LIGHT DOM (SVG) or canvas. No cartesian axes.
import DOMPurify from "dompurify";
import { attachDevtools } from "../devtools/hook";
import { ensureStyles } from "../styles";
import { svgEl, htmlEl, clear } from "../dom";
import { renderTitle } from "../render/svg";
import { processRadarData } from "../radarChart/data";
import { buildRadarColors } from "../radarChart/colors";
import { buildRadarRenderModel } from "../radarChart/renderModel";
import type { RadarSeriesModel } from "../radarChart/renderModel";
import { renderRadarSvg } from "../radarChart/renderSvg";
import { drawRadarCanvas, setupRadarCanvasHover } from "../radarChart/renderCanvas";
import { buildRadarContext } from "../context/buildRadarContext";
import { renderA11yMirror } from "../context/a11yMirror";
import {
  applyTransformData,
  applyEnrichContext,
  collectValidate,
  collectTools,
  setupPlugins,
} from "../plugins/runner";
import type { AgentTool, MichiVzPlugin, PluginContext } from "../plugins/types";
import type { ChartContext, ChartInstance, DataWarning, Margin, MountOptions, RadarChartProps, RadarDataItem } from "../types";

const DEFAULT_MARGIN: Margin = { top: 60, right: 80, bottom: 60, left: 80 };

interface Resolved {
  width: number;
  height: number;
  margin: Margin;
  rings: number;
  fillOpacity: number;
  dimmedFill: boolean;
  renderer: "svg" | "canvas";
  enableTransitions: boolean;
}

function resolve(p: RadarChartProps): Resolved {
  return {
    width: p.width ?? 600,
    height: p.height ?? 600,
    margin: p.margin ?? DEFAULT_MARGIN,
    rings: p.rings ?? 4,
    // showFilled=false → stroke-only (fill opacity 0).
    fillOpacity: p.showFilled === false ? 0 : (p.fillOpacity ?? 0.2),
    dimmedFill: p.showDimmedFill ?? true,
    renderer: p.renderer ?? "svg",
    enableTransitions: p.enableTransitions ?? true,
  };
}

/** Resolve the axes (prefer `axes`, fall back to the legacy `poles.labels`). */
function resolveAxes(p: RadarChartProps): string[] {
  return p.axes ?? p.poles?.labels ?? [];
}

/** Fill `values` from the legacy `data:[{date,value}]` shape when absent, aligning
 *  each axis label to a `data[].date`. Items that already have `values` pass through. */
function normalizeSeries(series: RadarDataItem[], axes: string[]): RadarDataItem[] {
  return series.map((s) => {
    if (s.values && s.values.length) return s;
    const data = s.data ?? [];
    const values = axes.map((a) => {
      const pt = data.find((d) => d.date === a);
      if (!pt) return null; // month ABSENT from the data → null → pole skipped (legacy parity)
      const n = Number(pt.value);
      return Number.isFinite(n) ? n : 0; // present (null/NaN → 0, plotted at the centre)
    });
    return { ...s, values };
  });
}

function checkData(series: RadarDataItem[], axes: string[]): DataWarning[] {
  const warnings: DataWarning[] = [];
  if (!series || series.length === 0) warnings.push({ type: "empty-dataset", message: "RadarChart received an empty series." });
  if (!axes || axes.length < 3) warnings.push({ type: "empty-dataset", message: "RadarChart needs at least 3 axes." });
  for (const it of series) {
    if (it.values.length !== axes.length) {
      warnings.push({ type: "non-finite-value", message: `Series "${it.label}" has ${it.values.length} values but ${axes.length} axes.`, label: it.label });
    }
  }
  return warnings;
}

export function mountRadarChart(
  host: HTMLElement,
  initial: RadarChartProps,
  opts?: MountOptions<RadarChartProps>
): ChartInstance<RadarChartProps> {
  ensureStyles();
  host.classList.add("michi-vz", "michi-vz-radar-chart");

  const svg = svgEl("svg");
  const tooltip = htmlEl("div", { class: "tooltip" });
  tooltip.style.visibility = "hidden";
  const a11y = htmlEl("div", { class: "mv-a11y" });
  a11y.setAttribute("role", "img");
  let canvas: HTMLCanvasElement | null = null;

  host.appendChild(svg);
  host.appendChild(tooltip);
  host.appendChild(a11y);

  let baseProps: RadarChartProps = initial;
  let context: ChartContext | null = null;
  const pluginList: MichiVzPlugin<RadarChartProps>[] = [...(opts?.plugins ?? [])];
  const pc: PluginContext<RadarChartProps> = {
    chartType: "radar-chart",
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
  // changes — an unconditional re-fire loops "Maximum update depth" in any consumer
  // that dispatches on each call (two-colour-writer indicators). Mirrors VSB.
  let lastContextSig = "";
  let model: ReturnType<typeof buildRadarRenderModel> | null = null;
  // Canvas hover teardown (rebound each render) + the resolved axes/series the hover
  // tooltip reads outside render().
  let canvasHoverTeardown: (() => void) | null = null;
  let normalizedSeries: RadarDataItem[] = [];
  let resolvedAxes: string[] = [];

  const showTooltip = (label: string, ev: MouseEvent, axisIndex?: number): void => {
    const r = host.getBoundingClientRect();
    tooltip.style.left = `${ev.clientX - r.left + 10}px`;
    tooltip.style.top = `${ev.clientY - r.top - 10}px`;
    const item = normalizedSeries.find((it) => it.label === label);
    // Canvas hover resolves a specific pole → pass its axis label as `date` so a
    // per-pole consumer tooltip (e.g. Seasonality by month) can read item.date.
    const datum =
      item && axisIndex !== undefined && axisIndex >= 0
        ? { ...item, date: resolvedAxes[axisIndex] }
        : item;
    const htmlStr =
      baseProps.tooltipFormatter && datum
        ? baseProps.tooltipFormatter(datum)
        : `<strong>${label}</strong>` +
          (item ? `<br/>${resolvedAxes.map((a, i) => `${a}: ${item.values[i] ?? 0}`).join("<br/>")}` : "");
    tooltip.innerHTML = DOMPurify.sanitize(htmlStr);
    tooltip.style.visibility = "visible";
  };
  const hideTooltip = (): void => {
    if (sticky) return;
    tooltip.style.visibility = "hidden";
  };
  tooltip.addEventListener("click", () => {
    sticky = false;
    tooltip.classList.remove("sticky");
    tooltip.style.visibility = "hidden";
  });

  function render(): void {
    // Plugin hook #1 — transformData: forecast/etc. append predicted series/values.
    // With no plugins this is an identity fold, so behaviour is unchanged.
    const props = applyTransformData(pluginList, baseProps, pc);
    const r = resolve(props);
    svg.setAttribute("width", String(r.width));
    svg.setAttribute("height", String(r.height));
    svg.style.position = "relative";
    // Let axis labels sit at / spill past the plot edge without clipping (legacy parity)
    // — this is what lets the radar use a larger radius with labels right up to the edge.
    svg.style.overflow = "visible";

    // Resolve axes (axes prop or legacy poles.labels) + normalise the series shape
    // (derive `values` from a legacy data:[{date,value}] array). Stored on module vars
    // so the hover tooltip can read them outside render().
    resolvedAxes = resolveAxes(props);
    normalizedSeries = normalizeSeries(props.series, resolvedAxes);

    if (props.isLoading) host.classList.add("mv-loading");
    else host.classList.remove("mv-loading");
    if (props.tooltipContainerStyle) Object.assign(tooltip.style, props.tooltipContainerStyle);

    const { items, maxValue } = processRadarData(normalizedSeries, props.disabledItems, props.maxValue);
    const colors = buildRadarColors(
      normalizedSeries,
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

    model = buildRadarRenderModel(items, colors, {
      axes: resolvedAxes,
      maxValue,
      rings: r.rings,
      width: r.width,
      height: r.height,
      margin: r.margin,
      highlightItems: props.highlightItems ?? [],
      poleLabelFormatter: props.poleLabelFormatter,
      radialLabelFormatter: props.radialLabelFormatter,
    });

    clear(svg);
    renderTitle(svg, { text: props.title, x: r.width / 2, y: r.margin.top / 2 });

    if (r.renderer !== "canvas") {
      renderRadarSvg(
        svg,
        model,
        { fillOpacity: r.fillOpacity, enableTransitions: r.enableTransitions },
        {
          onEnter: (s, ev) => {
            if (sticky) return;
            showTooltip(s.label, ev);
            props.onHighlightItem?.([s.label]);
          },
          onLeave: () => {
            hideTooltip();
            if (!sticky) props.onHighlightItem?.([]);
          },
          onClick: (s, ev) => {
            sticky = true;
            tooltip.classList.add("sticky");
            showTooltip(s.label, ev);
          },
        }
      );
    } else {
      // canvas mode still renders the grid + axis labels in SVG for crisp text +
      // to provide the colour-probe template; the series polygons go to canvas.
      renderRadarSvg(
        svg,
        { grid: model.grid, series: [] },
        { fillOpacity: r.fillOpacity, enableTransitions: r.enableTransitions },
        { onEnter: () => {}, onLeave: () => {}, onClick: () => {} }
      );
    }

    if (r.renderer === "canvas") {
      if (!canvas) {
        canvas = htmlEl("canvas", { class: "radar-chart-canvas" });
        canvas.style.position = "absolute";
        canvas.style.top = getComputedStyle(host).paddingTop;
        canvas.style.left = getComputedStyle(host).paddingLeft;
        canvas.style.pointerEvents = "none";
        host.insertBefore(canvas, tooltip);
      }
      drawRadarCanvas(canvas, svg, model, {
        width: r.width,
        height: r.height,
        fillOpacity: r.fillOpacity,
        dimmedFill: r.dimmedFill,
      });
      // Forgiving hover lives on the SVG above the canvas; rebind every render since
      // the model (and its vertex geometry) changes (canvas listener-rebind pattern).
      if (canvasHoverTeardown) canvasHoverTeardown();
      canvasHoverTeardown = setupRadarCanvasHover(svg, model, {
        onEnter: (label, axisIndex, ev) => {
          if (sticky) return;
          showTooltip(label, ev, axisIndex);
          props.onHighlightItem?.([label]);
        },
        onLeave: () => {
          hideTooltip();
          if (!sticky) props.onHighlightItem?.([]);
        },
        onClick: (label, axisIndex, ev) => {
          sticky = true;
          tooltip.classList.add("sticky");
          showTooltip(label, ev, axisIndex);
        },
      });
    } else if (canvas) {
      canvas.remove();
      canvas = null;
      if (canvasHoverTeardown) {
        canvasHoverTeardown();
        canvasHoverTeardown = null;
      }
    }

    context = buildRadarContext({
      title: props.title,
      renderer: r.renderer,
      axes: resolvedAxes,
      maxValue,
      items,
      colorsMapping: colors.generatedColorsMapping,
    });
    // Plugin hook #3 — enrichContext: rewrite summary BEFORE the a11y mirror + the
    // dataprocessed event, so narration flows to both for free.
    context = applyEnrichContext(pluginList, context, pc);
    renderA11yMirror(a11y, context);
    const contextSig = JSON.stringify(context);
    if (contextSig !== lastContextSig) {
      lastContextSig = contextSig;
      props.onChartDataProcessed?.(context);
    }

    // Plugin hook #2 — validate: merge core checks with plugin warnings. Validate the
    // USER's data (baseProps), not the plugin-synthesised series.
    if (baseProps.onDataWarning) {
      const warnings = [
        ...checkData(normalizedSeries, resolvedAxes),
        ...collectValidate(pluginList, baseProps, pc),
      ];
      if (warnings.length > 0) baseProps.onDataWarning(warnings);
    }
  }

  render();
  const teardowns = setupPlugins(pluginList, pc);

  const instance = {
    update(next: RadarChartProps) {
      baseProps = next;
      render();
    },
    getContext() {
      return context;
    },
    use(plugin: MichiVzPlugin<RadarChartProps>) {
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
      if (canvasHoverTeardown) {
        canvasHoverTeardown();
        canvasHoverTeardown = null;
      }
      clear(host);
      host.classList.remove("michi-vz", "michi-vz-radar-chart");
    },
  };

  return attachDevtools(instance, host, "radar-chart", () => baseProps);
}
