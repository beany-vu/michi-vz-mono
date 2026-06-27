// VerticalStackBar engine: mount/update/getContext/destroy. Band x (dates) +
// linear y; stacked rects in LIGHT DOM (SVG) or canvas. The hasOwnProperty marker
// guard lives in the pure stack layer; this engine just orchestrates.
import DOMPurify from "dompurify";
import { ensureStyles } from "../styles";
import { svgEl, htmlEl, clear } from "../dom";
import { defaultNumberFormatter } from "../i18n/formatters";
import { renderTitle, renderXAxisBand, renderYAxisLinear } from "../render/svg";
import {
  extractDataKeys,
  resolveEffectiveKeys,
  collectDates,
  applyDateFilter,
  computeYDomain,
} from "../verticalStackBarChart/data";
import { buildStackColors } from "../verticalStackBarChart/colors";
import { createStackScales } from "../verticalStackBarChart/scales";
import { prepareStackedData } from "../verticalStackBarChart/stack";
import { buildStackRenderModel } from "../verticalStackBarChart/renderModel";
import { renderStackSvg } from "../verticalStackBarChart/renderSvg";
import { drawStackCanvas } from "../verticalStackBarChart/renderCanvas";
import { buildStackContext } from "../context/buildStackContext";
import { renderA11yMirror } from "../context/a11yMirror";
import { checkStackData } from "../validate/stackWarnings";
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
  StackLegendItem,
  StackRectData,
  VerticalStackBarChartProps,
} from "../types";

const DEFAULT_MARGIN: Margin = { top: 50, right: 50, bottom: 100, left: 60 };

interface Resolved {
  width: number;
  height: number;
  margin: Margin;
  renderer: "svg" | "canvas";
  keysOrder: "topToBottom" | "bottomToTop";
  minBarWidth: number;
  minBarHeight: number;
  minBarHeightZero: number;
  enableTransitions: boolean;
}

function resolve(p: VerticalStackBarChartProps): Resolved {
  return {
    width: p.width ?? 900,
    height: p.height ?? 480,
    margin: p.margin ?? DEFAULT_MARGIN,
    renderer: p.renderer ?? "svg",
    keysOrder: p.keysOrder ?? "topToBottom",
    minBarWidth: p.minBarWidth ?? 5,
    minBarHeight: p.minBarHeight ?? 15,
    minBarHeightZero: p.minBarHeightZero ?? 0,
    enableTransitions: p.enableTransitions ?? true,
  };
}

export function mountVerticalStackBarChart(
  host: HTMLElement,
  initial: VerticalStackBarChartProps,
  opts?: MountOptions<VerticalStackBarChartProps>
): ChartInstance<VerticalStackBarChartProps> {
  ensureStyles();
  host.classList.add("michi-vz", "michi-vz-vertical-stack-bar-chart");

  const svg = svgEl("svg");
  const tooltip = htmlEl("div", { class: "tooltip" });
  tooltip.style.visibility = "hidden";
  const a11y = htmlEl("div", { class: "mv-a11y" });
  a11y.setAttribute("role", "img");
  let canvas: HTMLCanvasElement | null = null;

  host.appendChild(svg);
  host.appendChild(tooltip);
  host.appendChild(a11y);

  let baseProps: VerticalStackBarChartProps = initial;
  let context: ChartContext | null = null;
  const pluginList: MichiVzPlugin<VerticalStackBarChartProps>[] = [...(opts?.plugins ?? [])];
  const pc: PluginContext<VerticalStackBarChartProps> = {
    chartType: "vertical-stack-bar-chart",
    getProps: () => baseProps,
    getContext: () => context,
    setProps: (patch) => {
      baseProps = { ...baseProps, ...patch };
      render();
    },
  };
  let sticky = false;
  let lastColorMappingSent: Record<string, string> = {};
  let lastLegendSent = "";
  let model: ReturnType<typeof buildStackRenderModel> | null = null;

  const showTooltip = (rect: StackRectData, ev: MouseEvent): void => {
    const r = host.getBoundingClientRect();
    tooltip.style.left = `${ev.clientX - r.left + 10}px`;
    tooltip.style.top = `${ev.clientY - r.top - 10}px`;
    const htmlStr = baseProps.tooltipFormatter
      ? baseProps.tooltipFormatter(rect)
      : `<strong>${rect.key}</strong> (${rect.seriesKeyAbbreviation})<br/>${String(rect.date)}: ${
          rect.value ?? "—"
        }`;
    tooltip.innerHTML = DOMPurify.sanitize(htmlStr);
    tooltip.style.visibility = "visible";
  };
  const hideTooltip = (): void => {
    if (sticky) return;
    tooltip.style.visibility = "hidden";
  };

  // Canvas-mode hit-test: topmost segment wins (scan keys last-to-first).
  const onHostMove = (ev: MouseEvent): void => {
    if (resolve(baseProps).renderer !== "canvas" || !model || sticky) return;
    const svgRect = svg.getBoundingClientRect();
    const x = ev.clientX - svgRect.left;
    const y = ev.clientY - svgRect.top;
    let hit: StackRectData | null = null;
    for (let i = model.keys.length - 1; i >= 0 && !hit; i--) {
      for (const d of model.stackedRectData[model.keys[i]] ?? []) {
        if (x >= d.x && x <= d.x + d.width && y >= d.y && y <= d.y + d.height) {
          hit = d;
          break;
        }
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
  host.addEventListener("mousemove", onHostMove);
  tooltip.addEventListener("click", () => {
    sticky = false;
    tooltip.classList.remove("sticky");
    tooltip.style.visibility = "hidden";
  });

  function render(): void {
    // Plugin hook #1 — transformData: forecast/etc. append predicted points/series.
    // With no plugins this is an identity fold, so behaviour is unchanged.
    const props = applyTransformData(pluginList, baseProps, pc);
    const r = resolve(props);
    svg.setAttribute("width", String(r.width));
    svg.setAttribute("height", String(r.height));
    svg.style.position = "relative";

    const dataKeys = extractDataKeys(props.dataSet);
    const effectiveKeys = resolveEffectiveKeys(dataKeys, props.keys, props.disabledItems);
    let dates = collectDates(props.dataSet, props.xAxisDomain);
    if (props.filter) dates = applyDateFilter(dates, props.dataSet, effectiveKeys, props.filter);
    const yDomain = computeYDomain(props.dataSet, effectiveKeys, props.yAxisDomain);

    const colors = buildStackColors(
      effectiveKeys,
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

    const scales = createStackScales(dates, yDomain, r.width, r.height, r.margin);
    const prepared = prepareStackedData(props.dataSet, effectiveKeys, scales, colors, {
      keysOrder: r.keysOrder,
      minBarWidth: r.minBarWidth,
      minBarHeight: r.minBarHeight,
      minBarHeightZero: r.minBarHeightZero,
      missingDataMarker: props.missingDataMarker,
    });
    model = buildStackRenderModel(prepared, effectiveKeys, dates, colors, {
      height: r.height,
      margin: r.margin,
      highlightItems: props.highlightItems ?? [],
    });

    if (props.onLegendDataChange) {
      const sig = JSON.stringify(model.legend);
      if (sig !== lastLegendSent) {
        lastLegendSent = sig;
        props.onLegendDataChange(model.legend as StackLegendItem[]);
      }
    }

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
      ticks: 5,
    });

    if (r.renderer !== "canvas") {
      renderStackSvg(
        svg,
        model,
        { enableTransitions: r.enableTransitions },
        {
          onEnter: (rect, ev) => {
            if (sticky) return;
            showTooltip(rect, ev);
            props.onHighlightItem?.([rect.key]);
          },
          onLeave: () => {
            hideTooltip();
            if (!sticky) props.onHighlightItem?.([]);
          },
          onClick: (rect, ev) => {
            sticky = true;
            tooltip.classList.add("sticky");
            showTooltip(rect, ev);
          },
        }
      );
    }

    if (r.renderer === "canvas") {
      if (!canvas) {
        canvas = htmlEl("canvas", { class: "stack-chart-canvas" });
        canvas.style.position = "absolute";
        canvas.style.top = getComputedStyle(host).paddingTop;
        canvas.style.left = getComputedStyle(host).paddingLeft;
        canvas.style.pointerEvents = "none";
        host.insertBefore(canvas, tooltip);
      }
      drawStackCanvas(canvas, svg, model, { width: r.width, height: r.height });
    } else if (canvas) {
      canvas.remove();
      canvas = null;
    }

    context = buildStackContext({
      title: props.title,
      renderer: r.renderer,
      dates,
      keys: effectiveKeys,
      stackedRectData: model.stackedRectData,
      visibleItems: model.visibleItems,
      legend: model.legend,
      colorsMapping: colors.generatedColorsMapping,
      yAxisDomain: yDomain,
    });
    // Plugin hook #3 — enrichContext: rewrite summary BEFORE the a11y mirror + the
    // dataprocessed event, so narration flows to both for free.
    context = applyEnrichContext(pluginList, context, pc);
    renderA11yMirror(a11y, context);
    props.onChartDataProcessed?.(context);

    // Plugin hook #2 — validate: merge core checks with plugin warnings. Validate the
    // USER's data (baseProps), not the plugin-synthesised points.
    if (baseProps.onDataWarning) {
      const warnings = [
        ...checkStackData(baseProps.dataSet),
        ...collectValidate(pluginList, baseProps, pc),
      ];
      if (warnings.length > 0) baseProps.onDataWarning(warnings);
    }
  }

  render();
  const teardowns = setupPlugins(pluginList, pc);

  return {
    update(next: VerticalStackBarChartProps) {
      baseProps = next;
      render();
    },
    getContext() {
      return context;
    },
    use(plugin: MichiVzPlugin<VerticalStackBarChartProps>) {
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
      host.removeEventListener("mousemove", onHostMove);
      clear(host);
      host.classList.remove("michi-vz", "michi-vz-vertical-stack-bar-chart");
    },
  };
}
