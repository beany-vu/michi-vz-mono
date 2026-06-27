// RadarChart engine: mount/update/getContext/destroy. Polar grid + one polygon
// per series. LIGHT DOM (SVG) or canvas. No cartesian axes.
import DOMPurify from "dompurify";
import { ensureStyles } from "../styles";
import { svgEl, htmlEl, clear } from "../dom";
import { renderTitle } from "../render/svg";
import { processRadarData } from "../radarChart/data";
import { buildRadarColors } from "../radarChart/colors";
import { buildRadarRenderModel } from "../radarChart/renderModel";
import type { RadarSeriesModel } from "../radarChart/renderModel";
import { renderRadarSvg } from "../radarChart/renderSvg";
import { drawRadarCanvas } from "../radarChart/renderCanvas";
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
  renderer: "svg" | "canvas";
  enableTransitions: boolean;
}

function resolve(p: RadarChartProps): Resolved {
  return {
    width: p.width ?? 600,
    height: p.height ?? 600,
    margin: p.margin ?? DEFAULT_MARGIN,
    rings: p.rings ?? 4,
    fillOpacity: p.fillOpacity ?? 0.2,
    renderer: p.renderer ?? "svg",
    enableTransitions: p.enableTransitions ?? true,
  };
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
  let model: ReturnType<typeof buildRadarRenderModel> | null = null;

  const showTooltip = (s: RadarSeriesModel, ev: MouseEvent): void => {
    const r = host.getBoundingClientRect();
    tooltip.style.left = `${ev.clientX - r.left + 10}px`;
    tooltip.style.top = `${ev.clientY - r.top - 10}px`;
    const item = baseProps.series.find((it) => it.label === s.label);
    const htmlStr =
      baseProps.tooltipFormatter && item
        ? baseProps.tooltipFormatter(item)
        : `<strong>${s.label}</strong>` + (item ? `<br/>${baseProps.axes.map((a, i) => `${a}: ${item.values[i] ?? 0}`).join("<br/>")}` : "");
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

    const { items, maxValue } = processRadarData(props.series, props.disabledItems, props.maxValue);
    const colors = buildRadarColors(
      props.series,
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
      axes: props.axes,
      maxValue,
      rings: r.rings,
      width: r.width,
      height: r.height,
      margin: r.margin,
      highlightItems: props.highlightItems ?? [],
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
            showTooltip(s, ev);
            props.onHighlightItem?.([s.label]);
          },
          onLeave: () => {
            hideTooltip();
            if (!sticky) props.onHighlightItem?.([]);
          },
          onClick: (s, ev) => {
            sticky = true;
            tooltip.classList.add("sticky");
            showTooltip(s, ev);
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
      drawRadarCanvas(canvas, svg, model, { width: r.width, height: r.height, fillOpacity: r.fillOpacity });
    } else if (canvas) {
      canvas.remove();
      canvas = null;
    }

    context = buildRadarContext({
      title: props.title,
      renderer: r.renderer,
      axes: props.axes,
      maxValue,
      items,
      colorsMapping: colors.generatedColorsMapping,
    });
    // Plugin hook #3 — enrichContext: rewrite summary BEFORE the a11y mirror + the
    // dataprocessed event, so narration flows to both for free.
    context = applyEnrichContext(pluginList, context, pc);
    renderA11yMirror(a11y, context);
    props.onChartDataProcessed?.(context);

    // Plugin hook #2 — validate: merge core checks with plugin warnings. Validate the
    // USER's data (baseProps), not the plugin-synthesised series.
    if (baseProps.onDataWarning) {
      const warnings = [
        ...checkData(baseProps.series, baseProps.axes),
        ...collectValidate(pluginList, baseProps, pc),
      ];
      if (warnings.length > 0) baseProps.onDataWarning(warnings);
    }
  }

  render();
  const teardowns = setupPlugins(pluginList, pc);

  return {
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
      clear(host);
      host.classList.remove("michi-vz", "michi-vz-radar-chart");
    },
  };
}
