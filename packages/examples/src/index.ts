// @michi-vz/examples — the single source of truth for chart examples.
//
// Each Example is plain, typed data (no rendering). VitePress live demos,
// Storybook stories/args, code snippets, and future "Open in CodePen / StackBlitz"
// buttons all DERIVE from these — so they can never drift. `props` are the engine
// props (the documented API); a wc adapter maps `title`→`chartTitle` etc.
//
// The optional `codepen` / `sandbox` fields are intentionally omitted for now;
// the docs hide the buttons when they're absent (adding them later is non-breaking).
import type {
  GapChartProps,
  LineChartProps,
  AreaChartProps,
  ScatterChartProps,
  VerticalStackBarChartProps,
  ComparableBarChartProps,
  DualBarChartProps,
  BarBellChartProps,
  RangeChartProps,
  RibbonChartProps,
  RadarChartProps,
} from "@michi-vz/core";

export interface Example<P = Record<string, unknown>> {
  id: string;
  title: string;
  description: string;
  /** custom-element tag, e.g. "michi-vz-line-chart". */
  element: string;
  /** engine props for this example. */
  props: P;
  /** optional sandbox links — the docs button is hidden when absent. */
  codepen?: string;
  sandbox?: string;
}

const gap: Example<GapChartProps>[] = [
  {
    id: "gap-basic",
    title: "Value gap",
    description: "Compares two values per label with a connecting gap bar.",
    element: "michi-vz-gap-chart",
    props: {
      title: "Value gap",
      dataSet: [
        { label: "Alpha", value1: 12, value2: 34 },
        { label: "Beta", value1: 55, value2: 20 },
        { label: "Gamma", value1: 30, value2: 31 },
        { label: "Delta", value1: 8, value2: 40 },
      ],
    },
  },
];

const line: Example<LineChartProps>[] = [
  {
    id: "line-basic",
    title: "Multi-series line",
    description: "Two annual series with markers and hover.",
    element: "michi-vz-line-chart",
    props: {
      title: "Trend",
      xAxisDataType: "date_annual",
      showDataPoints: true,
      dataSet: [
        { label: "North", color: "#1f77b4", series: [
          { date: 2016, value: 10, certainty: true }, { date: 2017, value: 22, certainty: true },
          { date: 2018, value: 18, certainty: true }, { date: 2019, value: 30, certainty: true }] },
        { label: "South", color: "#ff7f0e", series: [
          { date: 2016, value: 5, certainty: true }, { date: 2017, value: 9, certainty: true },
          { date: 2018, value: 14, certainty: true }, { date: 2019, value: 12, certainty: true }] },
      ],
    },
  },
  {
    id: "line-gaps",
    title: "Gap detection",
    description: "A skipped period (2019→2024) is auto-dashed via detectGaps.",
    element: "michi-vz-line-chart",
    props: {
      title: "With a gap",
      xAxisDataType: "date_annual",
      detectGaps: true,
      dataSet: [
        { label: "Region", color: "#2ca02c", series: [
          { date: 2016, value: 10, certainty: true }, { date: 2017, value: 22, certainty: true },
          { date: 2019, value: 18, certainty: true }, { date: 2024, value: 26, certainty: true }] },
      ],
    },
  },
];

const area: Example<AreaChartProps>[] = [
  {
    id: "area-stacked",
    title: "Stacked area",
    description: "Categories stacked over time.",
    element: "michi-vz-area-chart",
    props: {
      title: "Stack",
      xAxisDataType: "number",
      keys: ["Fruit", "Veg", "Dairy"],
      series: [
        { date: 2018, Fruit: 10, Veg: 6, Dairy: 4 },
        { date: 2019, Fruit: 14, Veg: 8, Dairy: 5 },
        { date: 2020, Fruit: 9, Veg: 12, Dairy: 7 },
        { date: 2021, Fruit: 16, Veg: 10, Dairy: 9 },
      ],
    },
  },
];

const scatter: Example<ScatterChartProps>[] = [
  {
    id: "scatter-basic",
    title: "Bubble scatter",
    description: "x/y points sized by `d`; correlation surfaced in getContext().",
    element: "michi-vz-scatter-chart",
    props: {
      title: "Cloud",
      xAxisDataType: "number",
      dataSet: [
        { label: "Alpha", x: 1, y: 3, d: 6 },
        { label: "Beta", x: 3, y: 7, d: 12 },
        { label: "Gamma", x: 5, y: 6, d: 4 },
        { label: "Delta", x: 7, y: 12, d: 9 },
        { label: "Epsilon", x: 9, y: 15, d: 7 },
      ],
    },
  },
];

const verticalStackBar: Example<VerticalStackBarChartProps>[] = [
  {
    id: "vsb-basic",
    title: "Vertical stacked bars",
    description: "Each DataSet owns its own key (the hasOwnProperty marker guard).",
    element: "michi-vz-vertical-stack-bar-chart",
    props: {
      title: "Stacked",
      keys: ["Africa", "Non-LDC"],
      dataSet: [
        { seriesKey: "Africa", seriesKeyAbbreviation: "AF", series: [
          { date: "2001", Africa: "10" }, { date: "2002", Africa: "14" }, { date: "2003", Africa: "9" }] },
        { seriesKey: "Non-LDC", seriesKeyAbbreviation: "NL", series: [
          { date: "2001", "Non-LDC": "20" }, { date: "2002", "Non-LDC": "16" }, { date: "2003", "Non-LDC": "22" }] },
      ],
    },
  },
];

const comparable: Example<ComparableBarChartProps>[] = [
  {
    id: "comparable-basic",
    title: "Based vs compared",
    description: "Two overlaid horizontal sub-bars per label.",
    element: "michi-vz-comparable-horizontal-bar-chart",
    props: {
      title: "Based vs Compared",
      dataSet: [
        { label: "Alpha", valueBased: 10, valueCompared: 18 },
        { label: "Beta", valueBased: 30, valueCompared: 22 },
        { label: "Gamma", valueBased: 16, valueCompared: 24 },
      ],
    },
  },
];

const dual: Example<DualBarChartProps>[] = [
  {
    id: "dual-tornado",
    title: "Diverging (tornado)",
    description: "value1 grows right, value2 left from the centre.",
    element: "michi-vz-dual-horizontal-bar-chart",
    props: {
      title: "Tornado",
      dataSet: [
        { label: "Alpha", value1: 20, value2: 14 },
        { label: "Beta", value1: 35, value2: 28 },
        { label: "Gamma", value1: 10, value2: 22 },
      ],
    },
  },
];

const barBell: Example<BarBellChartProps>[] = [
  {
    id: "barbell-basic",
    title: "Cumulative bar-bell",
    description: "Cumulative segments per date with end-cap circles.",
    element: "michi-vz-bar-bell-chart",
    props: {
      title: "Cumulative",
      keys: ["Fruit", "Veg"],
      dataSet: [
        { date: "2001", Fruit: 10, Veg: 6 },
        { date: "2002", Fruit: 14, Veg: 9 },
        { date: "2003", Fruit: 8, Veg: 13 },
      ],
    },
  },
];

const range: Example<RangeChartProps>[] = [
  {
    id: "range-bands",
    title: "Min/max bands",
    description: "Per-series valueMin..valueMax bands over time.",
    element: "michi-vz-range-chart",
    props: {
      title: "Bands",
      xAxisDataType: "date_annual",
      dataSet: [
        { label: "Region A", color: "#1f77b4", series: [
          { date: 2016, valueMin: 5, valueMax: 12, certainty: true },
          { date: 2017, valueMin: 8, valueMax: 16, certainty: true },
          { date: 2018, valueMin: 6, valueMax: 14, certainty: true }] },
        { label: "Region B", color: "#ff7f0e", series: [
          { date: 2016, valueMin: 2, valueMax: 6, certainty: true },
          { date: 2017, valueMin: 3, valueMax: 7, certainty: true },
          { date: 2018, valueMin: 4, valueMax: 9, certainty: true }] },
      ],
    },
  },
];

const ribbon: Example<RibbonChartProps>[] = [
  {
    id: "ribbon-basic",
    title: "Stacked columns + ribbons",
    description: "Stacked columns per date linked by connector ribbons.",
    element: "michi-vz-ribbon-chart",
    props: {
      title: "Stream",
      keys: ["Fruit", "Veg"],
      series: [
        { date: "2001", Fruit: 10, Veg: 6 },
        { date: "2002", Fruit: 14, Veg: 9 },
        { date: "2003", Fruit: 8, Veg: 13 },
      ],
    },
  },
];

const radar: Example<RadarChartProps>[] = [
  {
    id: "radar-basic",
    title: "Polar radar",
    description: "One polygon per series over N spoke axes.",
    element: "michi-vz-radar-chart",
    props: {
      title: "Radar",
      axes: ["Speed", "Power", "Range", "Agility", "Cost"],
      series: [
        { label: "Model A", color: "#1f77b4", values: [8, 6, 7, 9, 5] },
        { label: "Model B", color: "#ff7f0e", values: [5, 9, 6, 4, 8] },
      ],
    },
  },
];

/** Canonical examples, keyed by chart id. Consumers index by key. */
export const examples = {
  "gap-chart": gap,
  "line-chart": line,
  "area-chart": area,
  "scatter-chart": scatter,
  "vertical-stack-bar-chart": verticalStackBar,
  "comparable-horizontal-bar-chart": comparable,
  "dual-horizontal-bar-chart": dual,
  "bar-bell-chart": barBell,
  "range-chart": range,
  "ribbon-chart": ribbon,
  "radar-chart": radar,
};

/** Ordered chart ids (for nav / iteration). */
export const chartIds = Object.keys(examples) as Array<keyof typeof examples>;

/** Flat list of every example (id is globally unique). */
export const allExamples: Example[] = Object.values(examples).flat() as unknown as Example[];
