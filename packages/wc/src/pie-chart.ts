// <michi-vz-pie-chart> - native web component (Lit, LIGHT DOM) over the
// @michi-vz/core Pie engine. Slices sized by value; set `inner-radius-ratio` > 0
// for a donut.
import { LitElement, html, type PropertyValues } from "lit";
import { mountPieChart } from "@michi-vz/core";
import type {
  AgentTool,
  PieChartProps,
  PieDataItem,
  PieSliceContext,
  ChartContext,
  ChartInstance,
  MichiVzPlugin,
  Margin,
  TimelinePeriodConfig,
  TimelineController,
} from "@michi-vz/core";

export class PieChartElement extends LitElement {
  static properties = {
    dataSet: { attribute: false },
    chartTitle: { type: String, attribute: "chart-title" },
    width: { type: Number },
    height: { type: Number },
    renderer: { type: String },
    innerRadiusRatio: { type: Number, attribute: "inner-radius-ratio" },
    padAngle: { type: Number, attribute: "pad-angle" },
    cornerRadius: { type: Number, attribute: "corner-radius" },
    sortByValue: { type: Boolean, attribute: "sort-by-value" },
    showLabels: { type: Boolean, attribute: "show-labels" },
    showLegend: { type: Boolean, attribute: "show-legend" },
    colorsMapping: { attribute: false },
    highlightItems: { attribute: false },
    disabledItems: { attribute: false },
    margin: { attribute: false },
    colors: { attribute: false },
    filter: { attribute: false },
    timeline: { attribute: false },
    enableTransitions: { type: Boolean, attribute: "enable-transitions" },
    skipColorMappingDispatch: { type: Boolean, attribute: "skip-color-mapping-dispatch" },
    tooltipFormatter: { attribute: false },
    valueFormatter: { attribute: false },
    plugins: { attribute: false },
    locale: { type: String },
  };

  dataSet: PieDataItem[] = [];
  chartTitle = "";
  width = 600;
  height = 420;
  renderer: "svg" | "canvas" | "webgpu" = "svg";
  innerRadiusRatio?: number;
  padAngle?: number;
  cornerRadius?: number;
  sortByValue?: boolean;
  showLabels?: boolean;
  showLegend = false;
  margin?: Margin;
  colors?: string[];
  filter?: { limit: number; sortingDir: "asc" | "desc" };
  timeline?: boolean | TimelinePeriodConfig;
  enableTransitions?: boolean;
  colorsMapping?: Record<string, string>;
  highlightItems?: string[];
  disabledItems?: string[];
  skipColorMappingDispatch = false;
  tooltipFormatter?: (slice: PieSliceContext) => string;
  valueFormatter?: (n: number) => string;
  plugins?: MichiVzPlugin<PieChartProps>[];
  locale?: string;

  private chart?: ChartInstance<PieChartProps>;

  protected createRenderRoot(): HTMLElement {
    return this;
  }

  protected render() {
    return html`<div class="mv-host"></div>`;
  }

  private emit(name: string, detail: unknown): void {
    this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
  }

  private get chartProps(): PieChartProps {
    return {
      dataSet: this.dataSet,
      title: this.chartTitle || undefined,
      width: this.width,
      height: this.height,
      renderer: this.renderer,
      innerRadiusRatio: this.innerRadiusRatio,
      padAngle: this.padAngle,
      cornerRadius: this.cornerRadius,
      sortByValue: this.sortByValue,
      showLabels: this.showLabels,
      showLegend: this.showLegend,
      margin: this.margin,
      colors: this.colors,
      filter: this.filter,
      timeline: this.timeline,
      enableTransitions: this.enableTransitions,
      colorsMapping: this.colorsMapping,
      highlightItems: this.highlightItems,
      disabledItems: this.disabledItems,
      skipColorMappingDispatch: this.skipColorMappingDispatch,
      tooltipFormatter: this.tooltipFormatter,
      valueFormatter: this.valueFormatter,
      locale: this.locale,
      onHighlightItem: (labels) => this.emit("michi-vz:highlight", labels),
      onColorMappingGenerated: (m) => this.emit("michi-vz:colormapping", m),
      onChartDataProcessed: (c) => this.emit("michi-vz:dataprocessed", c),
      onDataWarning: (w) => this.emit("michi-vz:datawarning", w),
    };
  }

  protected firstUpdated(): void {
    const host = this.querySelector<HTMLElement>(".mv-host");
    if (host) this.chart = mountPieChart(host, this.chartProps, { plugins: this.plugins });
  }

  protected updated(_changed: PropertyValues): void {
    this.chart?.update(this.chartProps);
  }

  disconnectedCallback(): void {
    this.chart?.destroy();
    this.chart = undefined;
    super.disconnectedCallback();
  }

  getContext(): ChartContext | null {
    return this.chart?.getContext() ?? null;
  }

  getTools(): AgentTool[] {
    return this.chart?.getTools?.() ?? [];
  }

  /** Headless playback controller (null unless the `timeline` prop is set). */
  getTimeline(): TimelineController | null {
    return this.chart?.timeline?.() ?? null;
  }
}

if (typeof customElements !== "undefined" && !customElements.get("michi-vz-pie-chart")) {
  customElements.define("michi-vz-pie-chart", PieChartElement);
}
