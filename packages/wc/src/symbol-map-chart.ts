// <michi-vz-symbol-map-chart> - Lit, LIGHT DOM, over the @michi-vz/core
// SymbolMap engine. `dataSet` items each supply their own lng/lat (no bundled
// coordinate table); `geography` is OPTIONAL (`{attribute: false}` - consumers
// set it as a JS property, same convention as ChoroplethMap's `geography`).
import { LitElement, html, type PropertyValues } from "lit";
import { mountSymbolMapChart } from "@michi-vz/core";
import type {
  AgentTool,
  SymbolMapDataItem,
  SymbolMapChartProps,
  ChartContext,
  ChartInstance,
  GeoFeatureItem,
  Margin,
  MichiVzPlugin,
} from "@michi-vz/core";

export class SymbolMapChartElement extends LitElement {
  static properties = {
    dataSet: { attribute: false },
    geography: { attribute: false },
    chartTitle: { type: String, attribute: "chart-title" },
    width: { type: Number },
    height: { type: Number },
    renderer: { type: String },
    projection: { type: String },
    projectionConfig: { attribute: false },
    radiusRange: { attribute: false },
    radiusVisibleMin: { type: Number, attribute: "radius-visible-min" },
    positionMode: { type: String, attribute: "position-mode" },
    geographyColor: { type: String, attribute: "geography-color" },
    strokeColor: { type: String, attribute: "stroke-color" },
    strokeWidth: { type: Number, attribute: "stroke-width" },
    colorsMapping: { attribute: false },
    colors: { attribute: false },
    showLabels: { type: Boolean, attribute: "show-labels" },
    highlightItems: { attribute: false },
    disabledItems: { attribute: false },
    skipColorMappingDispatch: { type: Boolean, attribute: "skip-color-mapping-dispatch" },
    tooltipFormatter: { attribute: false },
    plugins: { attribute: false },
    locale: { type: String },
    margin: { attribute: false },
    isLoading: { type: Boolean, attribute: "is-loading" },
    isNodata: { attribute: false },
    noDataLabel: { type: String, attribute: "no-data-label" },
    enableTransitions: { type: Boolean, attribute: "enable-transitions" },
  };

  dataSet: SymbolMapDataItem[] = [];
  geography?: GeoJSON.FeatureCollection | GeoFeatureItem[];
  chartTitle = "";
  width = 900;
  height = 520;
  renderer: "svg" | "canvas" | "webgpu" = "svg";
  projection?: SymbolMapChartProps["projection"];
  projectionConfig?: SymbolMapChartProps["projectionConfig"];
  radiusRange?: [number, number];
  radiusVisibleMin?: number;
  positionMode?: "force" | "precise";
  geographyColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  colorsMapping?: Record<string, string>;
  colors?: string[];
  showLabels?: boolean;
  highlightItems?: string[];
  disabledItems?: string[];
  skipColorMappingDispatch = false;
  tooltipFormatter?: (d: SymbolMapDataItem) => string;
  plugins?: MichiVzPlugin<SymbolMapChartProps>[];
  locale?: string;
  margin?: Margin;
  isLoading?: boolean;
  isNodata?: boolean | ((dataSet: SymbolMapDataItem[] | null | undefined) => boolean);
  noDataLabel?: string;
  enableTransitions?: boolean;

  private chart?: ChartInstance<SymbolMapChartProps>;

  protected createRenderRoot(): HTMLElement {
    return this;
  }

  protected render() {
    return html`<div class="mv-host"></div>`;
  }

  private emit(name: string, detail: unknown): void {
    this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
  }

  private get chartProps(): SymbolMapChartProps {
    return {
      dataSet: this.dataSet,
      geography: this.geography,
      title: this.chartTitle || undefined,
      width: this.width,
      height: this.height,
      renderer: this.renderer,
      projection: this.projection,
      projectionConfig: this.projectionConfig,
      radiusRange: this.radiusRange,
      radiusVisibleMin: this.radiusVisibleMin,
      positionMode: this.positionMode,
      geographyColor: this.geographyColor,
      strokeColor: this.strokeColor,
      strokeWidth: this.strokeWidth,
      colorsMapping: this.colorsMapping,
      colors: this.colors,
      showLabels: this.showLabels,
      highlightItems: this.highlightItems,
      disabledItems: this.disabledItems,
      skipColorMappingDispatch: this.skipColorMappingDispatch,
      tooltipFormatter: this.tooltipFormatter,
      locale: this.locale,
      margin: this.margin,
      isLoading: this.isLoading,
      isNodata: this.isNodata,
      noDataLabel: this.noDataLabel,
      enableTransitions: this.enableTransitions,
      onHighlightItem: (labels) => this.emit("michi-vz:highlight", labels),
      onColorMappingGenerated: (m) => this.emit("michi-vz:colormapping", m),
      onChartDataProcessed: (c) => this.emit("michi-vz:dataprocessed", c),
      onDataWarning: (w) => this.emit("michi-vz:datawarning", w),
    };
  }

  protected firstUpdated(): void {
    const host = this.querySelector<HTMLElement>(".mv-host");
    if (host)
      this.chart = mountSymbolMapChart(host, this.chartProps, {
        plugins: this.plugins,
      });
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

if (typeof customElements !== "undefined" && !customElements.get("michi-vz-symbol-map-chart")) {
  customElements.define("michi-vz-symbol-map-chart", SymbolMapChartElement);
}
