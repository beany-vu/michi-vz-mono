// <michi-vz-gauge-chart> - native web component (Lit, LIGHT DOM) over the
// @michi-vz/core Gauge engine. Concentric rings (outer to inner), each sweeping
// value/max of a full circle over a background track; hover activates a ring
// and drives the built-in centre label.
import { LitElement, html, type PropertyValues } from "lit";
import { mountGaugeChart } from "@michi-vz/core";
import type {
  AgentTool,
  GaugeActiveStyle,
  GaugeChartProps,
  GaugeAnnotationContext,
  GaugeRingContext,
  GaugeRingDatum,
  GaugeTick,
  GaugeEndLabel,
  GaugeValueMarker,
  ChartContext,
  ChartInstance,
  MichiVzPlugin,
  Margin,
} from "@michi-vz/core";

export class GaugeChartElement extends LitElement {
  static properties = {
    dataSet: { attribute: false },
    chartTitle: { type: String, attribute: "chart-title" },
    width: { type: Number },
    height: { type: Number },
    renderer: { type: String },
    max: { type: Number },
    ringThickness: { type: Number, attribute: "ring-thickness" },
    ringGap: { type: Number, attribute: "ring-gap" },
    outerRadius: { type: Number, attribute: "outer-radius" },
    startAngle: { type: Number, attribute: "start-angle" },
    sweepAngle: { type: Number, attribute: "sweep-angle" },
    min: { type: Number },
    sweepFit: { type: Boolean, attribute: "sweep-fit" },
    ticks: { attribute: false },
    endLabels: { attribute: false },
    valueMarker: { attribute: false },
    gradient: { attribute: false },
    roundedCaps: { type: Boolean, attribute: "rounded-caps" },
    ringOpacity: { attribute: false },
    trackColor: { attribute: false },
    trackOpacity: { attribute: false },
    defaultActive: { attribute: false },
    activeStyle: { attribute: false },
    showCenterLabel: { type: Boolean, attribute: "show-center-label" },
    centerContent: { attribute: false },
    valueFormatter: { attribute: false },
    noValueLabel: { type: String, attribute: "no-value-label" },
    colorsMapping: { attribute: false },
    highlightItems: { attribute: false },
    disabledItems: { attribute: false },
    margin: { attribute: false },
    colors: { attribute: false },
    locale: { type: String },
    skipColorMappingDispatch: { type: Boolean, attribute: "skip-color-mapping-dispatch" },
    enableTransitions: { type: Boolean, attribute: "enable-transitions" },
    fontFamily: { type: String, attribute: "font-family" },
    isLoading: { type: Boolean, attribute: "is-loading" },
    isNodata: { attribute: false },
    noDataLabel: { type: String, attribute: "no-data-label" },
    tooltipFormatter: { attribute: false },
    annotationTooltipFormatter: { attribute: false },
    plugins: { attribute: false },
  };

  dataSet: GaugeRingDatum[] = [];
  chartTitle = "";
  width = 300;
  height = 300;
  renderer: "svg" | "canvas" | "webgpu" = "svg";
  max?: number;
  ringThickness?: number;
  ringGap?: number;
  outerRadius?: number;
  startAngle?: number;
  sweepAngle?: number;
  min?: number;
  sweepFit?: boolean;
  ticks?: GaugeTick[];
  endLabels?: boolean | { min?: GaugeEndLabel; max?: GaugeEndLabel };
  valueMarker?: boolean | GaugeValueMarker;
  gradient?: string[];
  roundedCaps?: boolean;
  ringOpacity?: number | number[];
  trackColor?: string | string[];
  trackOpacity?: number | number[];
  defaultActive?: number | "inner" | "outer" | null;
  activeStyle?: GaugeActiveStyle;
  showCenterLabel?: boolean;
  centerContent?: (ring: GaugeRingContext | null) => string;
  valueFormatter?: (v: number) => string;
  noValueLabel?: string;
  colorsMapping?: Record<string, string>;
  highlightItems?: string[];
  disabledItems?: string[];
  margin?: Margin;
  colors?: string[];
  locale?: string;
  skipColorMappingDispatch = false;
  enableTransitions?: boolean;
  fontFamily?: string;
  isLoading?: boolean;
  isNodata?: boolean | ((dataSet: GaugeRingDatum[] | null | undefined) => boolean);
  noDataLabel?: string;
  tooltipFormatter?: (ring: GaugeRingContext) => string;
  annotationTooltipFormatter?: (annotation: GaugeAnnotationContext) => string | null;
  plugins?: MichiVzPlugin<GaugeChartProps>[];

  private chart?: ChartInstance<GaugeChartProps>;

  protected createRenderRoot(): HTMLElement {
    return this;
  }

  protected render() {
    return html`<div class="mv-host"></div>`;
  }

  private emit(name: string, detail: unknown): void {
    this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
  }

  private get chartProps(): GaugeChartProps {
    return {
      dataSet: this.dataSet,
      title: this.chartTitle || undefined,
      width: this.width,
      height: this.height,
      renderer: this.renderer,
      max: this.max,
      ringThickness: this.ringThickness,
      ringGap: this.ringGap,
      outerRadius: this.outerRadius,
      startAngle: this.startAngle,
      sweepAngle: this.sweepAngle,
      min: this.min,
      sweepFit: this.sweepFit,
      ticks: this.ticks,
      endLabels: this.endLabels,
      valueMarker: this.valueMarker,
      gradient: this.gradient,
      roundedCaps: this.roundedCaps,
      ringOpacity: this.ringOpacity,
      trackColor: this.trackColor,
      trackOpacity: this.trackOpacity,
      defaultActive: this.defaultActive,
      activeStyle: this.activeStyle,
      showCenterLabel: this.showCenterLabel,
      centerContent: this.centerContent,
      valueFormatter: this.valueFormatter,
      noValueLabel: this.noValueLabel,
      colorsMapping: this.colorsMapping,
      highlightItems: this.highlightItems,
      disabledItems: this.disabledItems,
      margin: this.margin,
      colors: this.colors,
      locale: this.locale,
      skipColorMappingDispatch: this.skipColorMappingDispatch,
      enableTransitions: this.enableTransitions,
      fontFamily: this.fontFamily,
      isLoading: this.isLoading,
      isNodata: this.isNodata,
      noDataLabel: this.noDataLabel,
      tooltipFormatter: this.tooltipFormatter,
      annotationTooltipFormatter: this.annotationTooltipFormatter,
      onHighlightItem: (labels) => this.emit("michi-vz:highlight", labels),
      onColorMappingGenerated: (m) => this.emit("michi-vz:colormapping", m),
      onChartDataProcessed: (c) => this.emit("michi-vz:dataprocessed", c),
      onDataWarning: (w) => this.emit("michi-vz:datawarning", w),
    };
  }

  protected firstUpdated(): void {
    const host = this.querySelector<HTMLElement>(".mv-host");
    if (host) this.chart = mountGaugeChart(host, this.chartProps, { plugins: this.plugins });
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
}

if (typeof customElements !== "undefined" && !customElements.get("michi-vz-gauge-chart")) {
  customElements.define("michi-vz-gauge-chart", GaugeChartElement);
}
