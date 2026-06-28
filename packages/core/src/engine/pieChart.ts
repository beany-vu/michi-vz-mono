// Pie/donut engine: mount/update/getContext/destroy. Slices sized by value via
// d3-shape pie()+arc(); `innerRadiusRatio` > 0 makes it a donut. LIGHT DOM (SVG)
// or canvas. No axes — just a title, the slices, and an optional legend. Mirrors
// the other engines' plugin wiring + colour-mapping dispatch; the arc geometry
// lives in the pure layer.
import DOMPurify from "dompurify";
import { attachDevtools } from "../devtools/hook";
import { ensureStyles } from "../styles";
import { svgEl, htmlEl, clear } from "../dom";
import { defaultNumberFormatter } from "../i18n/formatters";
import { renderTitle } from "../render/svg";
import { processPieData } from "../pieChart/data";
import { buildPieColors } from "../pieChart/colors";
import { layoutPie } from "../pieChart/geometry";
import { buildPieRenderModel, type PieSliceMark, type PieRenderModel } from "../pieChart/renderModel";
import { renderPieSvg } from "../pieChart/renderSvg";
import { drawPieCanvas } from "../pieChart/renderCanvas";
import { buildPieContext } from "../context/buildPieContext";
import { renderA11yMirror } from "../context/a11yMirror";
import { checkPieData } from "../validate/pieWarnings";
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
  PieChartProps,
  PieSliceContext,
} from "../types";

const DEFAULT_MARGIN: Margin = { top: 36, right: 8, bottom: 8, left: 8 };
const TAU = Math.PI * 2;

interface Resolved {
  width: number;
  height: number;
  margin: Margin;
  renderer: "svg" | "canvas";
  innerRadiusRatio: number;
  padAngle: number;
  cornerRadius: number;
  sortByValue: boolean;
  showLabels: boolean;
  showLegend: boolean;
  enableTransitions: boolean;
}

function resolve(p: PieChartProps): Resolved {
  return {
    width: p.width ?? 600,
    height: p.height ?? 420,
    margin: p.margin ?? DEFAULT_MARGIN,
    renderer: p.renderer ?? "svg",
    innerRadiusRatio: p.innerRadiusRatio ?? 0,
    padAngle: p.padAngle ?? 0,
    cornerRadius: p.cornerRadius ?? 0,
    sortByValue: p.sortByValue ?? true,
    showLabels: p.showLabels ?? true,
    showLegend: p.showLegend ?? false,
    enableTransitions: p.enableTransitions ?? true,
  };
}

/** True when angle a (normalized to [0, TAU)) falls within [start, end). */
function angleInRange(a: number, start: number, end: number): boolean {
  return a >= start && a < end;
}

export function mountPieChart(
  host: HTMLElement,
  initial: PieChartProps,
  opts?: MountOptions<PieChartProps>
): ChartInstance<PieChartProps> {
  ensureStyles();
  host.classList.add("michi-vz", "michi-vz-pie-chart");

  const svg = svgEl("svg");
  const tooltip = htmlEl("div", { class: "tooltip" });
  tooltip.style.visibility = "hidden";
  const a11y = htmlEl("div", { class: "mv-a11y" });
  a11y.setAttribute("role", "img");
  let canvas: HTMLCanvasElement | null = null;

  host.appendChild(svg);
  host.appendChild(tooltip);
  host.appendChild(a11y);

  let baseProps: PieChartProps = initial;
  let context: ChartContext | null = null;
  const pluginList: MichiVzPlugin<PieChartProps>[] = [...(opts?.plugins ?? [])];
  const pc: PluginContext<PieChartProps> = {
    chartType: "pie-chart",
    getProps: () => baseProps,
    getContext: () => context,
    setProps: (patch) => {
      baseProps = { ...baseProps, ...patch };
      render();
    },
  };
  let sticky = false;
  let lastColorMappingSent: Record<string, string> = {};
  let model: PieRenderModel | null = null;

  const sliceToContext = (s: PieSliceMark): PieSliceContext => ({
    label: s.label,
    code: s.code,
    color: s.fill,
    value: s.value,
    share: s.share,
    startAngle: s.startAngle,
    endAngle: s.endAngle,
  });

  const showTooltip = (s: PieSliceMark, ev: MouseEvent): void => {
    const r = host.getBoundingClientRect();
    tooltip.style.left = `${ev.clientX - r.left + 10}px`;
    tooltip.style.top = `${ev.clientY - r.top - 10}px`;
    let htmlStr: string;
    if (baseProps.tooltipFormatter) {
      htmlStr = baseProps.tooltipFormatter(sliceToContext(s));
    } else {
      const fmt = baseProps.valueFormatter ?? defaultNumberFormatter(baseProps.locale);
      htmlStr = `<strong>${s.label}</strong><br/>${fmt(s.value)} (${Math.round(s.share * 100)}%)`;
    }
    tooltip.innerHTML = DOMPurify.sanitize(htmlStr);
    tooltip.style.visibility = "visible";
  };
  const hideTooltip = (): void => {
    if (sticky) return;
    tooltip.style.visibility = "hidden";
  };

  // Canvas-mode hit-test: convert to slice-local polar (angle clockwise from 12
  // o'clock) and find the wedge that contains the point. Slices don't overlap.
  const onHostMove = (ev: MouseEvent): void => {
    if (resolve(baseProps).renderer !== "canvas" || !model || sticky) return;
    const svgRect = svg.getBoundingClientRect();
    const dx = ev.clientX - svgRect.left - model.cx;
    const dy = ev.clientY - svgRect.top - model.cy;
    const r = Math.hypot(dx, dy);
    let hit: PieSliceMark | null = null;
    if (r >= model.innerRadius && r <= model.radius) {
      let a = Math.atan2(dx, -dy); // 0 = up, clockwise
      if (a < 0) a += TAU;
      for (const s of model.slices) {
        if (angleInRange(a, s.startAngle, s.endAngle)) {
          hit = s;
          break;
        }
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
  // Canvas-mode click-to-pin: SVG marks pin via their own onClick, but canvas
  // marks have no DOM, so a click on the host toggles the hovered tooltip's pin.
  const onHostClick = (): void => {
    if (resolve(baseProps).renderer !== "canvas") return;
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
  tooltip.addEventListener("click", () => {
    sticky = false;
    tooltip.classList.remove("sticky");
    tooltip.style.visibility = "hidden";
  });

  function renderLegend(parent: SVGElement, m: PieRenderModel, x: number, y: number): void {
    const g = svgEl("g", { class: "pie-legend" });
    let cx = x;
    for (const item of m.legend) {
      g.appendChild(
        svgEl("rect", {
          class: "pie-legend-swatch",
          x: cx,
          y: y - 10,
          width: 12,
          height: 12,
          rx: 2,
          fill: item.color,
        })
      );
      const text = svgEl("text", {
        class: "pie-legend-label",
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
    // Plugin hook #1 — transformData (identity with no plugins).
    const props = applyTransformData(pluginList, baseProps, pc);
    const r = resolve(props);
    svg.setAttribute("width", String(r.width));
    svg.setAttribute("height", String(r.height));
    svg.style.position = "relative";

    const processed = processPieData(props.dataSet ?? [], {
      disabledItems: props.disabledItems,
      filter: props.filter,
      sortByValue: r.sortByValue,
    });

    const seededMapping = { ...processed.groupColors, ...(props.colorsMapping ?? {}) };
    const colors = buildPieColors(
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

    const legendH = r.showLegend && processed.nodes.length > 0 ? 26 : 0;
    const plotW = Math.max(0, r.width - r.margin.left - r.margin.right);
    const plotH = Math.max(0, r.height - r.margin.top - r.margin.bottom - legendH);
    const cx = r.margin.left + plotW / 2;
    const cy = r.margin.top + plotH / 2;
    const radius = (Math.min(plotW, plotH) / 2) * 0.98;

    const arcs = layoutPie(processed.nodes, {
      radius,
      innerRadiusRatio: r.innerRadiusRatio,
      padAngle: r.padAngle,
      cornerRadius: r.cornerRadius,
    });

    model = buildPieRenderModel(arcs, colors, {
      cx,
      cy,
      radius,
      innerRadiusRatio: r.innerRadiusRatio,
      groupKeys: processed.groupKeys,
      total: processed.total,
      highlightItems: props.highlightItems ?? [],
      showLabels: r.showLabels,
      showLegend: r.showLegend,
    });

    clear(svg);
    renderTitle(svg, { text: props.title, x: r.width / 2, y: r.margin.top / 2 });

    if (r.renderer !== "canvas") {
      renderPieSvg(
        svg,
        model,
        { enableTransitions: r.enableTransitions },
        {
          onEnter: (slice, ev) => {
            if (sticky) return;
            showTooltip(slice, ev);
            props.onHighlightItem?.([slice.label]);
          },
          onLeave: () => {
            hideTooltip();
            if (!sticky) props.onHighlightItem?.([]);
          },
          onClick: (slice, ev) => {
            sticky = true;
            tooltip.classList.add("sticky");
            showTooltip(slice, ev);
          },
        }
      );
    }

    if (legendH > 0) renderLegend(svg, model, r.margin.left, r.height - r.margin.bottom - 6);

    if (r.renderer === "canvas") {
      if (!canvas) {
        canvas = htmlEl("canvas", { class: "pie-chart-canvas" });
        canvas.style.position = "absolute";
        canvas.style.top = getComputedStyle(host).paddingTop;
        canvas.style.left = getComputedStyle(host).paddingLeft;
        canvas.style.pointerEvents = "none";
        host.insertBefore(canvas, tooltip);
      }
      drawPieCanvas(canvas, svg, model, { width: r.width, height: r.height });
    } else if (canvas) {
      canvas.remove();
      canvas = null;
    }

    context = buildPieContext({
      title: props.title,
      renderer: r.renderer,
      mode: model.mode,
      innerRadiusRatio: r.innerRadiusRatio,
      arcs,
      total: processed.total,
      colorsMapping: colors.generatedColorsMapping,
    });
    // Plugin hook #3 — enrichContext before a11y + dataprocessed.
    context = applyEnrichContext(pluginList, context, pc);
    renderA11yMirror(a11y, context);
    props.onChartDataProcessed?.(context);

    // Plugin hook #2 — validate the USER's data, merged with plugin warnings.
    if (baseProps.onDataWarning) {
      const warnings = [
        ...checkPieData(baseProps.dataSet),
        ...collectValidate(pluginList, baseProps, pc),
      ];
      if (warnings.length > 0) baseProps.onDataWarning(warnings);
    }
  }

  render();
  const teardowns = setupPlugins(pluginList, pc);

  const instance = {
    update(next: PieChartProps) {
      baseProps = next;
      render();
    },
    getContext() {
      return context;
    },
    use(plugin: MichiVzPlugin<PieChartProps>) {
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
      host.removeEventListener("click", onHostClick);
      clear(host);
      host.classList.remove("michi-vz", "michi-vz-pie-chart");
    },
  };

  return attachDevtools(instance, host, "pie-chart", () => baseProps);
}
