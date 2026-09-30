// @michi-vz/examples - the single source of truth for chart examples.
//
// Each Example is plain, typed data (no rendering). VitePress live demos,
// Storybook stories/args, code snippets, and future "Open in CodePen / StackBlitz"
// buttons all DERIVE from these - so they can never drift. `props` are the engine
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
  ComparableVerticalBarChartProps,
  DualBarChartProps,
  BarBellChartProps,
  RangeChartProps,
  RibbonChartProps,
  RadarChartProps,
  FanChartProps,
  TreemapChartProps,
  PieChartProps,
  GaugeChartProps,
  BubbleChartProps,
  SankeyChartProps,
  FountainChartProps,
  ChoroplethMapChartProps,
  SymbolMapChartProps,
  RadialTreeChartProps,
} from "@michi-vz/core";
import { sequentialScheme } from "@michi-vz/core";
// Real-world geography for the geo charts (ChoroplethMapChart, SymbolMapChart's
// optional backdrop): the SAME 110m-resolution world atlas the sdg-trade
// production consumer uses (176 countries, id = ISO-A3, properties.name),
// Antarctica (ATA) dropped for a nicer default framing. This lives ONLY in the
// examples/docs layer - @michi-vz/core stays geography-free (see each chart's
// `geography` prop docs).
import worldJson from "./data/world.json";

const world = worldJson as unknown as GeoJSON.FeatureCollection;

export interface Example<P = Record<string, unknown>> {
  id: string;
  title: string;
  description: string;
  /** custom-element tag, e.g. "michi-vz-line-chart". */
  element: string;
  /** engine props for this example. */
  props: P;
  /** optional sandbox links - the docs button is hidden when absent. */
  codepen?: string;
  sandbox?: string;
}

const gap: Example<GapChartProps>[] = [
  {
    id: "gap-basic",
    title: "CO2 emissions per capita: 2010 vs 2023",
    description:
      "Per-capita CO2 emissions (tonnes) for seven economies, with a connecting bar reading directly as the change between 2010 and 2023.",
    element: "michi-vz-gap-chart",
    props: {
      title: "CO2 emissions per capita: 2010 vs 2023 (tonnes)",
      xAxisDataType: "number",
      shapeValue1: "circle",
      shapeValue2: "triangle",
      // The chart's own shape legend (circle = 2010, triangle = 2023, bar = change)
      // renders under the plot; extra bottom margin gives it air.
      showLegend: true,
      interactiveRowLabels: true,
      margin: { top: 50, right: 50, bottom: 70, left: 100 },
      shapesLabelsMapping: {
        value1: "2010",
        value2: "2023",
        gap: "Change",
      },
      dataSet: [
        {
          label: "United States",
          code: "USA",
          value1: 17.4,
          value2: 14.3,
          difference: 3.1,
          date: "2023",
        },
        {
          label: "Russia",
          code: "RUS",
          value1: 11.3,
          value2: 11.4,
          difference: -0.1,
          date: "2023",
        },
        {
          label: "Germany",
          code: "DEU",
          value1: 9.6,
          value2: 7.8,
          difference: 1.8,
          date: "2023",
        },
        {
          label: "China",
          code: "CHN",
          value1: 6.8,
          value2: 8.9,
          difference: -2.1,
          date: "2023",
        },
        {
          label: "United Kingdom",
          code: "GBR",
          value1: 7.6,
          value2: 4.7,
          difference: 2.9,
          date: "2023",
        },
        {
          label: "Indonesia",
          code: "IDN",
          value1: 1.8,
          value2: 2.6,
          difference: -0.8,
          date: "2023",
        },
        {
          label: "India",
          code: "IND",
          value1: 1.4,
          value2: 2,
          difference: -0.6,
          date: "2023",
        },
      ],
    },
  },
];

const line: Example<LineChartProps>[] = [
  {
    id: "line-renewable-share",
    title: "Renewable electricity share, % of total",
    description:
      "Renewable share of electricity generation for four economies, 2012-2024, with markers and hover.",
    element: "michi-vz-line-chart",
    props: {
      title: "Renewable electricity share, % of total",
      xAxisDataType: "date_annual",
      showDataPoints: true,
      dataSet: [
        {
          label: "Germany",
          color: "#1f9e57",
          series: [
            {
              date: 2012,
              value: 23.5,
              certainty: true,
            },
            {
              date: 2014,
              value: 27.4,
              certainty: true,
            },
            {
              date: 2016,
              value: 31.6,
              certainty: true,
            },
            {
              date: 2018,
              value: 37,
              certainty: true,
            },
            {
              date: 2020,
              value: 43.6,
              certainty: true,
            },
            {
              date: 2022,
              value: 46.2,
              certainty: true,
            },
            {
              date: 2024,
              value: 52.5,
              certainty: true,
            },
          ],
        },
        {
          label: "United Kingdom",
          color: "#2c6fbb",
          series: [
            {
              date: 2012,
              value: 11.3,
              certainty: true,
            },
            {
              date: 2014,
              value: 19.1,
              certainty: true,
            },
            {
              date: 2016,
              value: 24.5,
              certainty: true,
            },
            {
              date: 2018,
              value: 33,
              certainty: true,
            },
            {
              date: 2020,
              value: 43.1,
              certainty: true,
            },
            {
              date: 2022,
              value: 41.5,
              certainty: true,
            },
            {
              date: 2024,
              value: 46.8,
              certainty: true,
            },
          ],
        },
        {
          label: "United States",
          color: "#e4572e",
          series: [
            {
              date: 2012,
              value: 12.2,
              certainty: true,
            },
            {
              date: 2014,
              value: 13,
              certainty: true,
            },
            {
              date: 2016,
              value: 14.8,
              certainty: true,
            },
            {
              date: 2018,
              value: 17,
              certainty: true,
            },
            {
              date: 2020,
              value: 19.8,
              certainty: true,
            },
            {
              date: 2022,
              value: 21.5,
              certainty: true,
            },
            {
              date: 2024,
              value: 23.4,
              certainty: true,
            },
          ],
        },
        {
          label: "India",
          color: "#f2a900",
          series: [
            {
              date: 2012,
              value: 15.6,
              certainty: true,
            },
            {
              date: 2014,
              value: 16.4,
              certainty: true,
            },
            {
              date: 2016,
              value: 17.5,
              certainty: true,
            },
            {
              date: 2018,
              value: 19,
              certainty: true,
            },
            {
              date: 2020,
              value: 20.1,
              certainty: true,
            },
            {
              date: 2022,
              value: 21.6,
              certainty: true,
            },
            {
              date: 2024,
              value: 23.9,
              certainty: true,
            },
          ],
        },
      ],
    },
  },
  {
    id: "line-gaps",
    title: "Solar generation, TWh (with a reporting gap)",
    description:
      "Brazil skips its 2021-2022 reporting; detectGaps auto-dashes the unreported span while Spain stays solid.",
    element: "michi-vz-line-chart",
    props: {
      title: "Solar generation, TWh (with a reporting gap)",
      xAxisDataType: "date_annual",
      showDataPoints: true,
      detectGaps: true,
      dataSet: [
        {
          label: "Spain",
          color: "#e4572e",
          series: [
            { date: 2018, value: 14, certainty: true },
            { date: 2019, value: 16, certainty: true },
            { date: 2020, value: 18, certainty: true },
            { date: 2021, value: 21, certainty: true },
            { date: 2022, value: 28, certainty: true },
            { date: 2023, value: 36, certainty: true },
            { date: 2024, value: 45, certainty: true },
          ],
        },
        {
          label: "Brazil",
          color: "#1f9e57",
          series: [
            { date: 2018, value: 5, certainty: true },
            { date: 2019, value: 8, certainty: true },
            { date: 2020, value: 11, certainty: true },
            { date: 2023, value: 30, certainty: true },
            { date: 2024, value: 42, certainty: true },
          ],
        },
      ],
    },
  },
  {
    id: "line-area-fill",
    title: "Library book loans, thousands (area fill + last-point label)",
    description:
      "One series filled with a fading gradient (areaFill) and its latest value printed above the last point (lastPointLabel). Illustrative numbers for a city library network.",
    element: "michi-vz-line-chart",
    props: {
      title: "Library book loans, thousands",
      xAxisDataType: "date_annual",
      showDataPoints: true,
      yAxisDomain: [0, null],
      yTicks: 4,
      areaFill: true,
      lastPointLabel: true,
      dataSet: [
        {
          label: "Book loans",
          color: "#175873",
          series: [
            { date: 2016, value: 1390, certainty: true },
            { date: 2017, value: 1270, certainty: true },
            { date: 2018, value: 1150, certainty: true },
            { date: 2019, value: 690, certainty: true },
            { date: 2020, value: 750, certainty: true },
            { date: 2021, value: 900, certainty: true },
            { date: 2022, value: 915, certainty: true },
            { date: 2023, value: 862, certainty: true },
            { date: 2024, value: 855, certainty: true },
            { date: 2025, value: 887, certainty: true },
          ],
        },
      ],
    },
  },
];

const area: Example<AreaChartProps>[] = [
  {
    id: "area-stacked",
    title: "Electricity generation by source",
    description:
      "Stacked annual generation (TWh) by source, 2014-2023: coal declines as wind and solar rise.",
    element: "michi-vz-area-chart",
    props: {
      title: "Electricity generation by source, TWh",
      xAxisDataType: "date_annual",
      keys: ["Coal", "Natural gas", "Nuclear", "Wind", "Solar"],
      series: [
        {
          date: 2014,
          Coal: 1582,
          "Natural gas": 1126,
          Nuclear: 797,
          Wind: 182,
          Solar: 28,
        },
        {
          date: 2015,
          Coal: 1471,
          "Natural gas": 1335,
          Nuclear: 797,
          Wind: 191,
          Solar: 39,
        },
        {
          date: 2016,
          Coal: 1240,
          "Natural gas": 1380,
          Nuclear: 805,
          Wind: 227,
          Solar: 54,
        },
        {
          date: 2017,
          Coal: 1206,
          "Natural gas": 1297,
          Nuclear: 805,
          Wind: 254,
          Solar: 78,
        },
        {
          date: 2018,
          Coal: 1146,
          "Natural gas": 1468,
          Nuclear: 807,
          Wind: 275,
          Solar: 96,
        },
        {
          date: 2019,
          Coal: 966,
          "Natural gas": 1582,
          Nuclear: 809,
          Wind: 295,
          Solar: 108,
        },
        {
          date: 2020,
          Coal: 774,
          "Natural gas": 1617,
          Nuclear: 790,
          Wind: 338,
          Solar: 134,
        },
        {
          date: 2021,
          Coal: 898,
          "Natural gas": 1580,
          Nuclear: 778,
          Wind: 380,
          Solar: 164,
        },
        {
          date: 2022,
          Coal: 828,
          "Natural gas": 1689,
          Nuclear: 772,
          Wind: 435,
          Solar: 205,
        },
        {
          date: 2023,
          Coal: 675,
          "Natural gas": 1802,
          Nuclear: 775,
          Wind: 425,
          Solar: 238,
        },
      ],
    },
  },
  // [1] Overlapping areas: shares that do NOT add up (a household can own several
  // devices), so a stacked total would be meaningless. Illustrative figures.
  {
    id: "area-overlap",
    title: "Households owning each device, %",
    description:
      "Illustrative device-ownership shares, 2012-2023. A household can own several devices, so the shares overlap instead of adding up (they sum past 200%). `stacked: false` draws each area from zero to its own value, larger areas first, with a line along each top edge.",
    element: "michi-vz-area-chart",
    props: {
      title: "Households owning each device, %",
      xAxisDataType: "date_annual",
      stacked: false,
      keys: ["Laptop", "Smartphone", "Tablet", "Smart speaker"],
      yAxisFormat: (d) => `${d}%`,
      tooltipFormatter: (row, _series, key) =>
        `<strong>${key}</strong><br/>${row.date}: ${row[key]}%`,
      series: [
        { date: 2012, Laptop: 58, Smartphone: 35, Tablet: 8, "Smart speaker": 0 },
        { date: 2013, Laptop: 60, Smartphone: 44, Tablet: 15, "Smart speaker": 0 },
        { date: 2014, Laptop: 62, Smartphone: 52, Tablet: 22, "Smart speaker": 1 },
        { date: 2015, Laptop: 63, Smartphone: 60, Tablet: 28, "Smart speaker": 2 },
        { date: 2016, Laptop: 64, Smartphone: 66, Tablet: 32, "Smart speaker": 5 },
        { date: 2017, Laptop: 65, Smartphone: 71, Tablet: 35, "Smart speaker": 9 },
        { date: 2018, Laptop: 66, Smartphone: 76, Tablet: 37, "Smart speaker": 14 },
        { date: 2019, Laptop: 67, Smartphone: 80, Tablet: 39, "Smart speaker": 18 },
        { date: 2020, Laptop: 70, Smartphone: 84, Tablet: 43, "Smart speaker": 21 },
        { date: 2021, Laptop: 71, Smartphone: 86, Tablet: 44, "Smart speaker": 23 },
        { date: 2022, Laptop: 71, Smartphone: 88, Tablet: 44, "Smart speaker": 24 },
        { date: 2023, Laptop: 72, Smartphone: 90, Tablet: 45, "Smart speaker": 25 },
      ],
    },
  },
];

const scatter: Example<ScatterChartProps>[] = [
  {
    id: "scatter-gapminder",
    title: "GDP per capita vs life expectancy, 2021",
    description:
      "Gapminder bubble scatter: x = GDP per capita (USD), y = life expectancy (years), bubble size = population. Strong positive correlation surfaced in getContext().",
    element: "michi-vz-scatter-chart",
    props: {
      title: "GDP per capita vs life expectancy, 2021",
      xAxisDataType: "number",
      xAxisDomain: [0, 75000],
      yAxisDomain: [60, 86],
      sizeRange: [5, 22],
      dataSet: [
        {
          label: "Ethiopia",
          x: 925,
          y: 65,
          d: 120,
          color: "#7F3C8D",
        },
        {
          label: "Nigeria",
          x: 2065,
          y: 62.6,
          d: 213,
          color: "#11A579",
        },
        {
          label: "India",
          x: 2257,
          y: 67.2,
          d: 1408,
          color: "#3969AC",
        },
        {
          label: "Indonesia",
          x: 4333,
          y: 67.6,
          d: 274,
          color: "#F2B701",
        },
        {
          label: "Brazil",
          x: 7507,
          y: 72.8,
          d: 214,
          color: "#E73F74",
        },
        {
          label: "China",
          x: 12556,
          y: 78.2,
          d: 1412,
          color: "#80BA5A",
        },
        {
          label: "Germany",
          x: 51204,
          y: 80.6,
          d: 83,
          color: "#E68310",
        },
        {
          label: "United States",
          x: 70249,
          y: 76.3,
          d: 332,
          color: "#008695",
        },
        {
          label: "Japan",
          x: 39813,
          y: 84.5,
          d: 125,
          color: "#CF1C90",
        },
      ],
    },
  },
];

const verticalStackBar: Example<VerticalStackBarChartProps>[] = [
  {
    id: "vsb-employment-sector",
    title: "Employment by sector, % of total (World)",
    description:
      "One bar per year, each split into the three economic sectors that sum to 100% - the share of the workforce in agriculture falls as services rises.",
    element: "michi-vz-vertical-stack-bar-chart",
    props: {
      title: "Employment by sector, % of total (World)",
      keys: ["Agriculture", "Industry", "Services"],
      keysOrder: "bottomToTop",
      yAxisDomain: [0, 100],
      dataSet: [
        {
          seriesKey: "World",
          seriesKeyAbbreviation: "",
          series: [
            {
              date: "2000",
              Agriculture: 40,
              Industry: 21,
              Services: 39,
            },
            {
              date: "2005",
              Agriculture: 37,
              Industry: 22,
              Services: 41,
            },
            {
              date: "2010",
              Agriculture: 33,
              Industry: 23,
              Services: 44,
            },
            {
              date: "2015",
              Agriculture: 29,
              Industry: 23,
              Services: 48,
            },
            {
              date: "2020",
              Agriculture: 27,
              Industry: 23,
              Services: 50,
            },
            {
              date: "2023",
              Agriculture: 25,
              Industry: 23,
              Services: 52,
            },
          ],
        },
      ],
    },
  },
  {
    id: "vsb-revenue-region-grouped",
    title: "Revenue by product line: EMEA vs Americas",
    description:
      "Grouped + stacked: two bars per year (EMEA and Americas) sit side by side, each split into five product lines. One view answers two questions at once - which region is bigger overall, and how the product mix differs between them (Cloud is the growth engine in both, but a larger share of the Americas total).",
    element: "michi-vz-vertical-stack-bar-chart",
    props: {
      title: "Revenue by product line: EMEA vs Americas (US$ M)",
      keys: ["Cloud", "Hardware", "Licenses", "Services", "Support"],
      keysOrder: "bottomToTop",
      dataSet: [
        {
          seriesKey: "EMEA",
          seriesKeyAbbreviation: "EMEA",
          series: [
            { date: "2021", Cloud: 210, Hardware: 180, Licenses: 140, Services: 95, Support: 70 },
            { date: "2022", Cloud: 265, Hardware: 172, Licenses: 128, Services: 108, Support: 76 },
            { date: "2023", Cloud: 324, Hardware: 161, Licenses: 112, Services: 121, Support: 82 },
          ],
        },
        {
          seriesKey: "Americas",
          seriesKeyAbbreviation: "AMER",
          series: [
            { date: "2021", Cloud: 298, Hardware: 205, Licenses: 176, Services: 132, Support: 88 },
            { date: "2022", Cloud: 371, Hardware: 198, Licenses: 159, Services: 147, Support: 94 },
            { date: "2023", Cloud: 452, Hardware: 189, Licenses: 141, Services: 168, Support: 101 },
          ],
        },
      ],
    },
  },
];

const comparable: Example<ComparableBarChartProps>[] = [
  {
    id: "comparable-basic",
    title: "Merchandise exports: 2019 vs 2024",
    description:
      "Per-country export value with two overlaid sub-bars (2019 baseline vs 2024), showing which economies grew and which slipped.",
    element: "michi-vz-comparable-horizontal-bar-chart",
    props: {
      title: "Merchandise exports: 2019 vs 2024, US$ bn",
      // Name the two sub-bars what they ARE (2019/2024) so the tooltip matches the
      // page legend instead of the generic Based/Compared wording.
      tooltipFormatter: (d) =>
        `<strong>${d.label}</strong><br/>2019: ${d.valueBased.toLocaleString()} bn<br/>2024: ${d.valueCompared.toLocaleString()} bn`,
      interactiveRowLabels: true,
      valueBasedOpacity: 1,
      valueComparedOpacity: 1,
      colorsBasedMapping: {
        China: "#e9bab5",
        "United States": "#b5cde7",
        Germany: "#c6c9cd",
        Japan: "#f4d1ba",
        India: "#b6d6c4",
        Russia: "#d7bee2",
        Vietnam: "#addfd4",
      },
      dataSet: [
        {
          label: "China",
          valueBased: 2499,
          valueCompared: 3380,
          color: "#c0392b",
        },
        {
          label: "United States",
          valueBased: 1645,
          valueCompared: 2065,
          color: "#2c6fbb",
        },
        {
          label: "Germany",
          valueBased: 1489,
          valueCompared: 1697,
          color: "#5b6470",
        },
        {
          label: "Japan",
          valueBased: 706,
          valueCompared: 707,
          color: "#e07b39",
        },
        {
          label: "India",
          valueBased: 324,
          valueCompared: 437,
          color: "#2e8b57",
        },
        {
          label: "Russia",
          valueBased: 419,
          valueCompared: 425,
          color: "#8e44ad",
        },
        {
          label: "Vietnam",
          valueBased: 264,
          valueCompared: 405,
          color: "#16a085",
        },
      ],
    },
  },
  {
    id: "comparable-grouped-bar-radius",
    title: "Services exports by sector: grouped, 2px corners",
    description:
      "Grouped layout (before on the top half-band, after on the bottom) with barRadius: 2. Half-bands are thin on a small screen, and the default 5px radius would round each one into a pill; a 2px radius keeps them crisp. barRadius: 0 gives square corners.",
    element: "michi-vz-comparable-horizontal-bar-chart",
    props: {
      title: "Services exports by sector: 2019 vs 2024, US$ bn (illustrative)",
      layout: "grouped",
      barRadius: 2,
      valueBasedOpacity: 1,
      valueComparedOpacity: 1,
      tooltipFormatter: (d) =>
        `<strong>${d.label}</strong><br/>2019: ${d.valueBased.toLocaleString()} bn<br/>2024: ${d.valueCompared.toLocaleString()} bn`,
      colorsBasedMapping: {
        Transport: "#b5cde7",
        Travel: "#f4d1ba",
        "ICT services": "#d7bee2",
        "Financial services": "#b6d6c4",
        "Other business services": "#c6c9cd",
      },
      dataSet: [
        { label: "Transport", valueBased: 1030, valueCompared: 1240, color: "#2c6fbb" },
        { label: "Travel", valueBased: 1440, valueCompared: 1510, color: "#e07b39" },
        { label: "ICT services", valueBased: 680, valueCompared: 1090, color: "#8e44ad" },
        { label: "Financial services", valueBased: 560, valueCompared: 710, color: "#2e8b57" },
        {
          label: "Other business services",
          valueBased: 1510,
          valueCompared: 1920,
          color: "#5b6470",
        },
      ],
    },
  },
];

const comparableVertical: Example<ComparableVerticalBarChartProps>[] = [
  {
    id: "comparable-vertical-basic",
    title: "Sector export value: 2019 vs 2024",
    description:
      "Per-sector export value as two full-bandwidth overlapping columns (2019 baseline behind, 2024 in front), with a change arrow + label above each pair - the vertical migration target for legacy sdg-trade BarchartVertical.",
    element: "michi-vz-comparable-vertical-bar-chart",
    props: {
      title: "Merchandise exports by sector: 2019 vs 2024, US$ bn",
      tooltipFormatter: (d) =>
        `<strong>${d.label}</strong><br/>2019: ${d.valueBased.toLocaleString()} bn<br/>2024: ${d.valueCompared.toLocaleString()} bn`,
      valueBasedOpacity: 1,
      valueComparedOpacity: 1,
      colorsBasedMapping: {
        Agriculture: "#c8e6c9",
        Textiles: "#f8bbd0",
        Machinery: "#bbdefb",
        Chemicals: "#ffe0b2",
        Electronics: "#d1c4e9",
      },
      deltaIndicator: { show: true },
      dataSet: [
        { label: "Agriculture", valueBased: 420, valueCompared: 468, color: "#2e8b57" },
        { label: "Textiles", valueBased: 310, valueCompared: 275, color: "#c0392b" },
        { label: "Machinery", valueBased: 540, valueCompared: 612, color: "#2c6fbb" },
        { label: "Chemicals", valueBased: 265, valueCompared: 251, color: "#e07b39" },
        { label: "Electronics", valueBased: 690, valueCompared: 845, color: "#8e44ad" },
      ],
    },
  },
  {
    id: "comparable-vertical-bar-radius",
    title: "Monthly output index: square corners",
    description:
      "Twelve categories make narrow columns on a small screen, where the default 5px radius rounds each one into a pill. barRadius: 0 draws square corners; any value in between (2-4) gives square-ish ones.",
    element: "michi-vz-comparable-vertical-bar-chart",
    props: {
      title: "Monthly output index: 2023 vs 2024 (illustrative)",
      barRadius: 0,
      valueBasedOpacity: 1,
      valueComparedOpacity: 1,
      colorsMapping: Object.fromEntries(
        ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map(
          (m) => [m, "#2c6fbb"],
        ),
      ),
      colorsBasedMapping: Object.fromEntries(
        ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map(
          (m) => [m, "#b5cde7"],
        ),
      ),
      tooltipFormatter: (d) =>
        `<strong>${d.label}</strong><br/>2023: ${d.valueBased}<br/>2024: ${d.valueCompared}`,
      dataSet: [
        { label: "Jan", valueBased: 98, valueCompared: 101 },
        { label: "Feb", valueBased: 97, valueCompared: 103 },
        { label: "Mar", valueBased: 101, valueCompared: 104 },
        { label: "Apr", valueBased: 100, valueCompared: 99 },
        { label: "May", valueBased: 102, valueCompared: 106 },
        { label: "Jun", valueBased: 104, valueCompared: 105 },
        { label: "Jul", valueBased: 103, valueCompared: 108 },
        { label: "Aug", valueBased: 99, valueCompared: 102 },
        { label: "Sep", valueBased: 101, valueCompared: 100 },
        { label: "Oct", valueBased: 105, valueCompared: 109 },
        { label: "Nov", valueBased: 106, valueCompared: 110 },
        { label: "Dec", valueBased: 108, valueCompared: 113 },
      ],
    },
  },
];

const dual: Example<DualBarChartProps>[] = [
  {
    id: "dual-population-pyramid",
    title: "Population by age band: male vs female, Japan 2023",
    description:
      "Diverging tornado / population pyramid: male population grows right (value1), female grows left (value2) from a shared centre line, one 10-year age band per row.",
    element: "michi-vz-dual-horizontal-bar-chart",
    props: {
      title: "Population by age band: male vs female, Japan 2023 (millions)",
      // Age-band labels in the left margin, clear of the left-extending bars.
      yAxisPosition: "left",
      // Hover or focus a label: leader line + row tooltip; click pins.
      interactiveRowLabels: true,
      dataSet: [
        {
          label: "0-9 years",
          value1: 4.8,
          value2: 4.6,
          color: "#3F7CAC",
        },
        {
          label: "10-19 years",
          value1: 5.5,
          value2: 5.2,
          color: "#3F7CAC",
        },
        {
          label: "20-34 years",
          value1: 9.7,
          value2: 9.3,
          color: "#3F7CAC",
        },
        {
          label: "35-49 years",
          value1: 12.4,
          value2: 12,
          color: "#3F7CAC",
        },
        {
          label: "50-64 years",
          value1: 11.9,
          value2: 12.1,
          color: "#3F7CAC",
        },
        {
          label: "65-79 years",
          value1: 9.6,
          value2: 11.2,
          color: "#3F7CAC",
        },
        {
          label: "80+ years",
          value1: 3.7,
          value2: 6.5,
          color: "#3F7CAC",
        },
      ],
    },
  },
];

const barBell: Example<BarBellChartProps>[] = [
  {
    id: "barbell-basic",
    title: "Cumulative installed solar PV capacity by region, GW",
    description:
      "Per-year cumulative horizontal segments (one region per colour) with end-cap circles, showing how global solar capacity stacked up region-by-region.",
    element: "michi-vz-bar-bell-chart",
    props: {
      title: "Cumulative installed solar PV capacity by region, GW",
      xAxisPosition: "bottom",
      keys: ["Asia-Pacific", "Europe", "North America"],
      colorsMapping: {
        "Asia-Pacific": "#d62728",
        Europe: "#2ca02c",
        "North America": "#1f77b4",
      },
      dataSet: [
        {
          date: "2018",
          "Asia-Pacific": 295,
          Europe: 122,
          "North America": 58,
        },
        {
          date: "2020",
          "Asia-Pacific": 430,
          Europe: 165,
          "North America": 84,
        },
        {
          date: "2022",
          "Asia-Pacific": 615,
          Europe: 210,
          "North America": 118,
        },
        {
          date: "2024",
          "Asia-Pacific": 870,
          Europe: 268,
          "North America": 162,
        },
      ],
    },
  },
];

const range: Example<RangeChartProps>[] = [
  {
    id: "range-gdp-forecast",
    title: "GDP growth forecast range, %",
    description:
      "Per-economy GDP growth forecast bands (low-high), 2024-2028, with the central projection down the middle.",
    element: "michi-vz-range-chart",
    props: {
      title: "GDP growth forecast range by economy, % per year",
      xAxisDataType: "date_annual",
      fillOpacity: 0.55,
      dataSet: [
        {
          label: "India",
          color: "#2563eb",
          series: [
            {
              date: 2024,
              valueMin: 6.2,
              valueMax: 7,
              valueMedium: 6.6,
              certainty: true,
            },
            {
              date: 2025,
              valueMin: 5.8,
              valueMax: 7.2,
              valueMedium: 6.5,
              certainty: true,
            },
            {
              date: 2026,
              valueMin: 5.3,
              valueMax: 7.5,
              valueMedium: 6.4,
              certainty: true,
            },
            {
              date: 2027,
              valueMin: 4.9,
              valueMax: 7.7,
              valueMedium: 6.3,
              certainty: true,
            },
            {
              date: 2028,
              valueMin: 4.5,
              valueMax: 7.9,
              valueMedium: 6.2,
              certainty: true,
            },
          ],
        },
        {
          label: "United States",
          color: "#16a34a",
          series: [
            {
              date: 2024,
              valueMin: 2.3,
              valueMax: 2.9,
              valueMedium: 2.6,
              certainty: true,
            },
            {
              date: 2025,
              valueMin: 1.5,
              valueMax: 2.9,
              valueMedium: 2.2,
              certainty: true,
            },
            {
              date: 2026,
              valueMin: 1,
              valueMax: 3,
              valueMedium: 2,
              certainty: true,
            },
            {
              date: 2027,
              valueMin: 0.6,
              valueMax: 3.2,
              valueMedium: 1.9,
              certainty: true,
            },
            {
              date: 2028,
              valueMin: 0.3,
              valueMax: 3.3,
              valueMedium: 1.8,
              certainty: true,
            },
          ],
        },
        {
          label: "Germany",
          color: "#dc2626",
          series: [
            {
              date: 2024,
              valueMin: -0.2,
              valueMax: 0.8,
              valueMedium: 0.3,
              certainty: true,
            },
            {
              date: 2025,
              valueMin: 0.2,
              valueMax: 1.6,
              valueMedium: 0.9,
              certainty: true,
            },
            {
              date: 2026,
              valueMin: 0.4,
              valueMax: 2.2,
              valueMedium: 1.3,
              certainty: true,
            },
            {
              date: 2027,
              valueMin: 0.5,
              valueMax: 2.5,
              valueMedium: 1.5,
              certainty: true,
            },
            {
              date: 2028,
              valueMin: 0.5,
              valueMax: 2.7,
              valueMedium: 1.6,
              certainty: true,
            },
          ],
        },
      ],
    },
  },
  {
    id: "range-temperature-cities",
    title: "Daily temperature range by city, °C",
    description:
      "Monthly record-low to record-high temperature bands for two cities, with the long-run average down the middle.",
    element: "michi-vz-range-chart",
    props: {
      title: "Daily temperature range by city, °C",
      xAxisDataType: "date_annual",
      fillOpacity: 0.5,
      yAxisDomain: [-10, 45],
      dataSet: [
        {
          label: "Cairo",
          color: "#ea580c",
          series: [
            {
              date: 1,
              valueMin: 9,
              valueMax: 19,
              valueMedium: 14,
              certainty: true,
            },
            {
              date: 4,
              valueMin: 14,
              valueMax: 28,
              valueMedium: 21,
              certainty: true,
            },
            {
              date: 7,
              valueMin: 22,
              valueMax: 36,
              valueMedium: 29,
              certainty: true,
            },
            {
              date: 10,
              valueMin: 18,
              valueMax: 30,
              valueMedium: 24,
              certainty: true,
            },
          ],
        },
        {
          label: "Oslo",
          color: "#0891b2",
          series: [
            {
              date: 1,
              valueMin: -7,
              valueMax: 0,
              valueMedium: -3.5,
              certainty: true,
            },
            {
              date: 4,
              valueMin: 0,
              valueMax: 10,
              valueMedium: 5,
              certainty: true,
            },
            {
              date: 7,
              valueMin: 13,
              valueMax: 23,
              valueMedium: 18,
              certainty: true,
            },
            {
              date: 10,
              valueMin: 3,
              valueMax: 11,
              valueMedium: 7,
              certainty: true,
            },
          ],
        },
      ],
    },
  },
];

const ribbon: Example<RibbonChartProps>[] = [
  {
    id: "ribbon-basic",
    title: "US recorded music revenue by format, % of total",
    description:
      "Stacked columns per year re-ranked by value and linked by crossing ribbons: downloads overtake the CD, streaming overtakes everything, and vinyl climbs back past the CD.",
    element: "michi-vz-ribbon-chart",
    props: {
      title: "US recorded music revenue by format, % of total (2008-2023)",
      keys: ["CD", "Downloads", "Streaming", "Vinyl"],
      series: [
        {
          date: "2008",
          CD: 62,
          Downloads: 30,
          Streaming: 4,
          Vinyl: 1,
        },
        {
          date: "2012",
          CD: 37,
          Downloads: 41,
          Streaming: 15,
          Vinyl: 2,
        },
        {
          date: "2016",
          CD: 17,
          Downloads: 24,
          Streaming: 51,
          Vinyl: 5,
        },
        {
          date: "2020",
          CD: 4,
          Downloads: 6,
          Streaming: 83,
          Vinyl: 5.5,
        },
        {
          date: "2023",
          CD: 6,
          Downloads: 3,
          Streaming: 84,
          Vinyl: 8,
        },
      ],
      colorsMapping: {
        CD: "#5D5D5D",
        Downloads: "#2A6F97",
        Streaming: "#4CB944",
        Vinyl: "#D7263D",
      },
    },
  },
  {
    id: "ribbon-smartphone-share",
    title: "Global smartphone shipments share, %",
    description:
      "Four brands' share of worldwide smartphone shipments across five years, with ribbons flowing as Samsung and Apple stay near the top while Chinese brands re-rank.",
    element: "michi-vz-ribbon-chart",
    props: {
      title: "Global smartphone shipments share, % (2019-2023)",
      keys: ["Samsung", "Apple", "Xiaomi", "Others"],
      series: [
        {
          date: "2019",
          Samsung: 21.6,
          Apple: 13.9,
          Xiaomi: 9.2,
          Others: 55.3,
        },
        {
          date: "2020",
          Samsung: 19.5,
          Apple: 15.9,
          Xiaomi: 11.4,
          Others: 53.2,
        },
        {
          date: "2021",
          Samsung: 20.1,
          Apple: 17.4,
          Xiaomi: 14.1,
          Others: 48.4,
        },
        {
          date: "2022",
          Samsung: 21.7,
          Apple: 18.8,
          Xiaomi: 12.7,
          Others: 46.8,
        },
        {
          date: "2023",
          Samsung: 19.4,
          Apple: 20.1,
          Xiaomi: 12.5,
          Others: 48,
        },
      ],
      colorsMapping: {
        Samsung: "#1B6CA8",
        Apple: "#5D5D5D",
        Xiaomi: "#D7263D",
        Others: "#B0B0B0",
      },
    },
  },
];

const radar: Example<RadarChartProps>[] = [
  {
    id: "radar-basic",
    title: "City liveability profile (0-100)",
    description: "Three cities compared across six liveability dimensions; one polygon per city.",
    element: "michi-vz-radar-chart",
    props: {
      title: "City liveability profile, index 0-100",
      axes: ["Healthcare", "Education", "Cost of living", "Safety", "Environment", "Culture"],
      maxValue: 100,
      fillOpacity: 0.2,
      series: [
        {
          label: "Vienna",
          color: "#1f77b4",
          values: [90, 85, 58, 88, 80, 92],
        },
        {
          label: "Singapore",
          color: "#d62728",
          values: [88, 90, 42, 95, 66, 74],
        },
        {
          label: "Lisbon",
          color: "#2ca02c",
          values: [72, 70, 78, 79, 84, 86],
        },
      ],
    },
  },
  {
    id: "radar-nice-max",
    title: "Weekly practice minutes by skill (nice outer ring)",
    description:
      "No maxValue: niceMaxValue rounds the outer ring up from the data max (73) to the next nice tick (80), so the ring labels read 20, 40, 60, 80 instead of 18, 37, 55, 73.",
    element: "michi-vz-radar-chart",
    props: {
      title: "Weekly practice, minutes",
      axes: ["Scales", "Sight-reading", "Repertoire", "Ear training", "Theory", "Improvisation"],
      niceMaxValue: true,
      fillOpacity: 0.2,
      series: [
        {
          label: "Week 1",
          color: "#1f77b4",
          values: [28, 45, 73, 20, 35, 15],
        },
        {
          label: "Week 2",
          color: "#ff7f0e",
          values: [33, 52, 64, 28, 30, 24],
        },
      ],
    },
  },
];

const fan: Example<FanChartProps>[] = [
  {
    id: "fan-revenue-forecast",
    title: "Revenue forecast with an 80/95% confidence fan",
    description:
      "Seven years of revenue (solid) continued by a dashed forecast median, wrapped in nested 80% and 95% confidence bands that widen with the horizon - the canonical forecast 'fan', composed from the Line + Range primitives.",
    element: "michi-vz-fan-chart",
    props: {
      title: "Revenue forecast, US$ m (Holt-Winters, 80/95% fan)",
      xAxisDataType: "date_annual",
      fillOpacity: 0.22,
      dataSet: [
        {
          label: "Revenue",
          color: "#2563eb",
          series: [
            { date: 2017, value: 42, certainty: true },
            { date: 2018, value: 55, certainty: true },
            { date: 2019, value: 63, certainty: true },
            { date: 2020, value: 71, certainty: true },
            { date: 2021, value: 88, certainty: true },
            { date: 2022, value: 104, certainty: true },
            { date: 2023, value: 121, certainty: true },
            { date: 2024, value: 138, certainty: false },
            { date: 2025, value: 155, certainty: false },
            { date: 2026, value: 172, certainty: false },
            { date: 2027, value: 189, certainty: false },
          ],
          bands: [
            {
              level: 0.95,
              series: [
                { date: 2023, valueMin: 121, valueMax: 121, valueMedium: 121 },
                { date: 2024, valueMin: 126, valueMax: 150, valueMedium: 138 },
                { date: 2025, valueMin: 135, valueMax: 175, valueMedium: 155 },
                { date: 2026, valueMin: 142, valueMax: 202, valueMedium: 172 },
                { date: 2027, valueMin: 148, valueMax: 230, valueMedium: 189 },
              ],
            },
            {
              level: 0.8,
              series: [
                { date: 2023, valueMin: 121, valueMax: 121, valueMedium: 121 },
                { date: 2024, valueMin: 131, valueMax: 145, valueMedium: 138 },
                { date: 2025, valueMin: 143, valueMax: 167, valueMedium: 155 },
                { date: 2026, valueMin: 154, valueMax: 190, valueMedium: 172 },
                { date: 2027, valueMin: 165, valueMax: 213, valueMedium: 189 },
              ],
            },
          ],
        },
      ],
    },
  },
];

// Flat-treemap palette: products reuse a small set of hues (blue / gold / red / teal /
// coral), each tile split into realized (solid) + untapped (lighter veil).
const TM_BLUE = "#005aba";
const TM_BLUE2 = "#1f78c8";
const TM_GOLD = "#f0a500";
const TM_RED = "#e8312a";
const TM_TEAL = "#2aa39a";
const TM_CORAL = "#ef8a6a";

const treemap: Example<TreemapChartProps>[] = [
  // [0] Nested: products grouped under their sector (the primary demo).
  {
    id: "treemap-export-potential-grouped",
    title: "Export potential - grouped by sector",
    description:
      "Products nested under their sector: parent tiles get a header label and the colour groups by sector. Each leaf splits into the realized share (solid) + the untapped opportunity (lighter).",
    element: "michi-vz-treemap-chart",
    props: {
      title: "Export potential by sector (by 2030)",
      width: 900,
      height: 540,
      splitLabels: ["Realized", "Untapped"],
      showLegend: true,
      layout: "squarify",
      paddingTop: 20,
      dataSet: [
        {
          label: "Industry",
          color: TM_BLUE,
          children: [
            { label: "Machinery & electricity", value: 120, partial: 64 },
            { label: "Ferrous metals", value: 80, partial: 54 },
            { label: "Fertilisers", value: 48, partial: 25 },
            { label: "Plastics & rubber", value: 33, partial: 19 },
          ],
        },
        {
          label: "Agri-food",
          color: TM_GOLD,
          children: [
            { label: "Fruits", value: 95, partial: 32 },
            { label: "Oil seeds", value: 88, partial: 29 },
            { label: "Meat (poultry)", value: 58, partial: 37 },
            { label: "Beverages", value: 78, partial: 55 },
            { label: "Wheat", value: 62, partial: 1 },
          ],
        },
        {
          label: "Materials",
          color: TM_TEAL,
          children: [
            { label: "Vegetable oils & fats", value: 52, partial: 28 },
            { label: "Textiles", value: 42, partial: 8 },
            { label: "Dairy products", value: 38, partial: 16 },
          ],
        },
      ],
    },
  },
  // [1] Flat: one tile per product, each its own colour (flattened data, no nesting).
  {
    id: "treemap-export-potential-flat",
    title: "Export potential - flattened data",
    description:
      'A flat list: one tile per product, each sized by its total export potential and coloured individually, with the realized/untapped split inside. On a narrow screen, layout:"auto" falls back to a single-column stack.',
    element: "michi-vz-treemap-chart",
    props: {
      title: "Export potential (by 2030)",
      width: 900,
      height: 540,
      splitLabels: ["Realized", "Untapped"],
      showLegend: true,
      layout: "auto",
      dataSet: [
        { label: "Machinery, electricity", value: 120, partial: 64, color: TM_BLUE },
        { label: "Fruits", value: 95, partial: 32, color: TM_GOLD },
        { label: "Oil seeds", value: 88, partial: 29, color: TM_RED },
        { label: "Beverages (alcoholic)", value: 78, partial: 55, color: TM_BLUE2 },
        { label: "Ferrous metals", value: 80, partial: 54, color: TM_RED },
        { label: "Wheat", value: 62, partial: 1, color: TM_CORAL },
        { label: "Meat (poultry)", value: 58, partial: 37, color: TM_BLUE },
        { label: "Fertilisers", value: 48, partial: 25, color: TM_TEAL },
        { label: "Vegetable oils & fats", value: 52, partial: 28, color: TM_GOLD },
        { label: "Textiles", value: 42, partial: 8, color: TM_RED },
        { label: "Dairy products", value: 38, partial: 16, color: TM_TEAL },
        { label: "Plastics & rubber", value: 33, partial: 19, color: TM_BLUE2 },
        { label: "Pharmaceuticals", value: 28, partial: 13, color: TM_GOLD },
      ],
    },
  },
];

const gauge: Example<GaugeChartProps>[] = [
  // [0] Market-share rings: one product's share of three nested markets.
  {
    id: "gauge-market-share",
    title: "Market share by scope",
    description:
      "Three concentric rings, outer to inner: a product's import share of the world, the region, and the destination market. Hover a ring to read it in the centre; the inner ring is active at rest.",
    element: "michi-vz-gauge-chart",
    props: {
      width: 300,
      height: 300,
      dataSet: [
        { label: "World", value: 38.16, color: TM_BLUE },
        { label: "Africa", value: 58.4, color: TM_GOLD },
        { label: "Egypt", value: 96.14, color: TM_TEAL },
      ],
    },
  },
  // [1] Config-friendly variant: one palette with per-ring opacities, rounded
  // caps, a rotated start, and a custom centre readout.
  {
    id: "gauge-progress-rings",
    title: "Progress rings (single hue)",
    description:
      "The same gauge configured like an activity tracker: one colour with per-ring opacity steps, rounded caps, a 180-degree start, thicker rings, and a custom centre formatter.",
    element: "michi-vz-gauge-chart",
    props: {
      width: 300,
      height: 300,
      dataSet: [
        { label: "Move", value: 82, color: TM_RED },
        { label: "Exercise", value: 55, color: TM_RED },
        { label: "Stand", value: null, color: TM_RED },
      ],
      ringOpacity: [1, 0.7, 0.45],
      ringThickness: 24,
      ringGap: 4,
      roundedCaps: true,
      startAngle: 180,
      defaultActive: "outer",
      noValueLabel: "no data",
    },
  },
  // [2] Half gauge with a gradient: sweepAngle halves both the track and the
  // value arc, and the gradient ramp is anchored to the full sweep (not the
  // drawn portion), so a given colour always sits at the same value.
  {
    id: "gauge-half-gradient",
    title: "Half gauge with gradient",
    description:
      "A single ring over half a circle (`startAngle: -90, sweepAngle: 180`), coloured with a multi-stop gradient. The track spans the same half as the arc, and the ramp is anchored to the full sweep rather than the drawn portion.",
    element: "michi-vz-gauge-chart",
    props: {
      width: 300,
      height: 180,
      dataSet: [{ label: "Progress", value: 62 }],
      startAngle: -90,
      sweepAngle: 180,
      gradient: [TM_BLUE, TM_TEAL, TM_GOLD],
    },
  },
  // [3] Positioning within a range: min/max set the scale, valueMarker pins the
  // value on the arc, ticks add the average, endLabels name the ends and
  // sweepFit sizes the half gauge to its box. The consumer formats every label.
  {
    id: "gauge-range-position",
    title: "Price position within a supplier range",
    description:
      "One supplier's unit price against the min, average and max of its market: `min` and `max` set the scale, `valueMarker` pins the value on the arc, `ticks` adds the average, `endLabels` names the ends, and `sweepFit` sizes the half gauge to its box.",
    element: "michi-vz-gauge-chart",
    props: {
      width: 360,
      height: 220,
      dataSet: [{ label: "Supplier price", value: 7837, color: TM_BLUE }],
      min: 5377,
      max: 16758,
      startAngle: -90,
      sweepAngle: 180,
      sweepFit: true,
      ringThickness: 10,
      trackColor: "#cfe3f5",
      valueMarker: true,
      ticks: [{ value: 8377, label: "AVG", valueLabel: "8.4 k" }],
      endLabels: {
        min: { label: "MIN", valueLabel: "5.4 k" },
        max: { label: "MAX", valueLabel: "16.8 k" },
      },
      showCenterLabel: false,
    },
  },
  // [4] Per-annotation hover: annotationTooltipFormatter gives each marker, tick and
  // end label its own readout. The annotations are drawn pointer-events:none, so the
  // engine resolves this from geometry and it behaves the same in every renderer -
  // and hovering one does NOT change which ring is active.
  {
    id: "gauge-annotation-hover",
    title: "Reference values on hover",
    description:
      "The same positioning gauge with `annotationTooltipFormatter`: hover the marker, the AVG tick or either end label for its own readout. Hovering an annotation leaves the active ring untouched, so the centre stays put while a reference value is inspected.",
    element: "michi-vz-gauge-chart",
    props: {
      width: 360,
      height: 220,
      dataSet: [{ label: "Supplier price", value: 7837, color: TM_BLUE }],
      min: 5377,
      max: 16758,
      startAngle: -90,
      sweepAngle: 180,
      sweepFit: true,
      ringThickness: 10,
      trackColor: "#cfe3f5",
      valueMarker: true,
      ticks: [{ value: 8377, label: "AVG", valueLabel: "8.4 k" }],
      endLabels: {
        min: { label: "MIN", valueLabel: "5.4 k" },
        max: { label: "MAX", valueLabel: "16.8 k" },
      },
      showCenterLabel: false,
      annotationTooltipFormatter: (a) =>
        a.kind === "marker"
          ? `<b>${a.ring?.label ?? ""}</b> ${a.value.toFixed(0)}`
          : `<b>${a.label ?? a.kind}</b> ${a.value.toFixed(0)}`,
    },
  },
];

const pie: Example<PieChartProps>[] = [
  // [0] Solid pie: export value share by sector.
  {
    id: "pie-export-share",
    title: "Export value share by sector",
    description:
      "A classic pie: each slice is a sector's share of total export value, sized by value and labelled with its percentage. Slices sort by value so the biggest reads first.",
    element: "michi-vz-pie-chart",
    props: {
      title: "Export value by sector",
      width: 460,
      height: 420,
      showLabels: true,
      showLegend: true,
      dataSet: [
        { label: "Industry", value: 281, color: TM_BLUE },
        { label: "Agri-food", value: 381, color: TM_GOLD },
        { label: "Materials", value: 132, color: TM_TEAL },
        { label: "Textiles", value: 64, color: TM_RED },
        { label: "Pharmaceuticals", value: 41, color: TM_BLUE2 },
      ],
    },
  },
  // [1] Donut: same data with an inner radius (innerRadiusRatio > 0).
  {
    id: "pie-export-share-donut",
    title: "Export value share - donut",
    description:
      'The same shares as a donut: set innerRadiusRatio to carve out the hole. The mode flips to "donut" in the chart context, but the data and slices are identical.',
    element: "michi-vz-pie-chart",
    props: {
      title: "Export value by sector",
      width: 460,
      height: 420,
      innerRadiusRatio: 0.6,
      padAngle: 0.01,
      cornerRadius: 2,
      showLabels: true,
      showLegend: true,
      dataSet: [
        { label: "Industry", value: 281, color: TM_BLUE },
        { label: "Agri-food", value: 381, color: TM_GOLD },
        { label: "Materials", value: 132, color: TM_TEAL },
        { label: "Textiles", value: 64, color: TM_RED },
        { label: "Pharmaceuticals", value: 41, color: TM_BLUE2 },
      ],
    },
  },
];

const bubble: Example<BubbleChartProps>[] = [
  // [0] The split as a story everyone knows: gross salary bubble, net take-home core.
  {
    id: "bubble-eu-salary",
    title: "Average salary in the EU: gross vs net",
    description:
      "One bubble per country sized by the average GROSS annual salary; the solid core is the net take-home pay and the pale ring is taxes and contributions. Belgium's thin core vs Ireland's thick one is the whole tax-wedge story at a glance.",
    element: "michi-vz-bubble-chart",
    props: {
      title: "Average salary: gross bubble, net take-home core (k EUR/year)",
      width: 720,
      height: 520,
      splitLabels: ["Net (take-home)", "Taxes & contributions"],
      showLegend: true,
      dataSet: [
        { label: "Luxembourg", value: 78, partial: 51, color: TM_BLUE },
        { label: "Denmark", value: 68, partial: 44, color: TM_GOLD },
        { label: "Germany", value: 62, partial: 38, color: TM_RED },
        { label: "Netherlands", value: 60, partial: 40, color: TM_BLUE2 },
        { label: "Belgium", value: 58, partial: 33, color: TM_TEAL },
        { label: "Ireland", value: 55, partial: 40, color: TM_CORAL },
        { label: "France", value: 52, partial: 36, color: TM_GOLD },
        { label: "Spain", value: 33, partial: 25, color: TM_BLUE },
        { label: "Portugal", value: 24, partial: 18, color: TM_RED },
        { label: "Poland", value: 21, partial: 15, color: TM_TEAL },
      ],
    },
  },
  // [1] Plain bubbles (no split): one colour per category, sized by value.
  {
    id: "bubble-market-size",
    title: "Market size cloud",
    description:
      "Single-fill bubbles sized by value, clustered by gravity. With no `partial`, there's no split veil - just a clean proportional bubble cloud.",
    element: "michi-vz-bubble-chart",
    props: {
      title: "Addressable market by category",
      width: 720,
      height: 520,
      dataSet: [
        { label: "Machinery", value: 120, color: TM_BLUE },
        { label: "Fruits", value: 95, color: TM_GOLD },
        { label: "Oil seeds", value: 88, color: TM_RED },
        { label: "Beverages", value: 78, color: TM_BLUE2 },
        { label: "Ferrous metals", value: 80, color: TM_TEAL },
        { label: "Textiles", value: 42, color: TM_CORAL },
        { label: "Dairy", value: 38, color: TM_GOLD },
      ],
    },
  },
  // [2] Gravity-clustered bubbles with a realized/untapped split per market.
  {
    id: "bubble-export-potential",
    title: "Export potential by market (realized vs untapped)",
    description:
      "Each market is a bubble sized by its total export potential; gravity pulls them into a cluster so size comparisons read at a glance. The solid core is the realized share, the lighter ring the untapped opportunity.",
    element: "michi-vz-bubble-chart",
    props: {
      title: "Export potential by market (by 2030)",
      width: 720,
      height: 520,
      splitLabels: ["Realized", "Untapped"],
      showLegend: true,
      dataSet: [
        { label: "Germany", value: 120, partial: 64, color: TM_BLUE },
        { label: "France", value: 95, partial: 32, color: TM_GOLD },
        { label: "United States", value: 152, partial: 88, color: TM_RED },
        { label: "China", value: 168, partial: 51, color: TM_BLUE2 },
        { label: "Italy", value: 72, partial: 40, color: TM_TEAL },
        { label: "Spain", value: 58, partial: 22, color: TM_CORAL },
        { label: "Netherlands", value: 64, partial: 47, color: TM_GOLD },
        { label: "Poland", value: 44, partial: 12, color: TM_BLUE },
        { label: "Türkiye", value: 51, partial: 18, color: TM_RED },
      ],
    },
  },
];

const sankey: Example<SankeyChartProps>[] = [
  // [0] Exporter -> destination-market trade flows.
  {
    id: "sankey-trade-flows",
    title: "Trade flows: exporters → markets",
    description:
      "A flow diagram of who exports to where: left nodes are exporters, right nodes destination markets, and each band's thickness is the bilateral trade value. Hover a node or a flow for the figures.",
    element: "michi-vz-sankey-chart",
    props: {
      title: "Bilateral trade flows (US$ bn)",
      width: 820,
      height: 500,
      linkColorMode: "source",
      nodeRadius: 3,
      linkRadius: 2,
      nodes: [
        { id: "France", color: TM_BLUE },
        { id: "Germany", color: TM_GOLD },
        { id: "Italy", color: TM_TEAL },
        { id: "EU", color: TM_BLUE2 },
        { id: "United States", color: TM_RED },
        { id: "Asia", color: TM_CORAL },
      ],
      links: [
        { source: "France", target: "EU", value: 40 },
        { source: "France", target: "United States", value: 18 },
        { source: "France", target: "Asia", value: 22 },
        { source: "Germany", target: "EU", value: 55 },
        { source: "Germany", target: "United States", value: 30 },
        { source: "Germany", target: "Asia", value: 35 },
        { source: "Italy", target: "EU", value: 28 },
        { source: "Italy", target: "United States", value: 12 },
        { source: "Italy", target: "Asia", value: 9 },
      ],
    },
  },
  // [1] hoverHighlight: built-in hover emphasis on a three-column funnel.
  {
    id: "sankey-hover-highlight",
    title: "Hover emphasis: visits → pages → outcomes",
    description:
      "Website visits flowing from traffic channels through landing pages to an outcome. With hoverHighlight on, hovering a page lights every flow into and out of it and the channels and outcomes it connects to, while the rest fades; hovering a single flow lights just that flow and its two ends.",
    element: "michi-vz-sankey-chart",
    props: {
      title: "Weekly visits by channel, landing page and outcome",
      width: 820,
      height: 460,
      hoverHighlight: true,
      linkColorMode: "source",
      nodeRadius: 3,
      linkRadius: 2,
      nodes: [
        { id: "Search", color: TM_BLUE },
        { id: "Social", color: TM_CORAL },
        { id: "Email", color: TM_GOLD },
        { id: "Direct", color: TM_TEAL },
        { id: "Home", color: TM_BLUE2 },
        { id: "Pricing", color: TM_RED },
        { id: "Blog", color: TM_TEAL },
        { id: "Sign-up", color: TM_BLUE },
        { id: "Left", label: "Left the site", color: "#9aa3ad" },
      ],
      links: [
        { source: "Search", target: "Home", value: 420 },
        { source: "Search", target: "Blog", value: 310 },
        { source: "Search", target: "Pricing", value: 160 },
        { source: "Social", target: "Blog", value: 260 },
        { source: "Social", target: "Home", value: 90 },
        { source: "Email", target: "Pricing", value: 210 },
        { source: "Email", target: "Home", value: 70 },
        { source: "Direct", target: "Home", value: 240 },
        { source: "Direct", target: "Pricing", value: 110 },
        { source: "Home", target: "Sign-up", value: 180 },
        { source: "Home", target: "Left", value: 640 },
        { source: "Pricing", target: "Sign-up", value: 290 },
        { source: "Pricing", target: "Left", value: 190 },
        { source: "Blog", target: "Sign-up", value: 60 },
        { source: "Blog", target: "Left", value: 510 },
      ],
    },
  },
];

// ---- Fountain (Jet d'Eau) ----
// The 16 approved examples, then the reading key (one fountain with its parts, and
// six patterns to look for), then two switches. Every number is illustrative (made up
// to look real) and each description says so. One colour per chart: a colour per
// column would be decoration that looks like data. Trend examples over named periods
// (hours, terms, seasons) sit at x = 1..n on a number axis, and xAxisFormat prints
// the period's name.

const FOUNTAIN_BLUE = "#3F7FB8";

/** The one-line reading guide for a chart whose small dots are `one` each. */
const fountainGuide = (one: string): string =>
  `Small dot = ${one} · Big dot = the usual one · Dots close together = steady · Tall fountain = changes a lot · Few dots = just a guess`;

/** Trend mode over named periods: period i sits at x = i + 1 and the axis prints its name. */
function fountainPeriods(
  names: string[],
): Pick<FountainChartProps, "xAxisDataType" | "xAxisFormat"> {
  return {
    xAxisDataType: "number",
    xAxisFormat: (d) => names[Number(d) - 1] ?? String(d),
  };
}

const fountainCommute: FountainChartProps = {
  title: "How long is my commute, really?",
  xAxisDataType: "band",
  colors: [FOUNTAIN_BLUE],
  yAxisTitle: "minutes (higher = slower)",
  endLabels: ["best", "worst"],
  sampleWord: "days",
  referenceLines: [
    { value: 45, label: "Time I allow: 45 min", goodSide: "below", countLabel: "within 45 min" },
  ],
  readingGuide: fountainGuide("one day"),
  dataSet: [
    {
      label: "Car",
      value: 30,
      low: 22,
      high: 55,
      samples: [29, 31, 27, 30, 55, 28, 33, 30, 26, 35, 22, 30, 34, 46, 27, 29, 32, 35, 25, 48],
    },
    {
      label: "Train",
      value: 35,
      low: 32,
      high: 42,
      samples: [34, 35, 33, 36, 42, 35, 34, 37, 35, 32, 36, 34, 38, 35, 33, 40, 36, 34, 37, 35],
    },
    {
      label: "Bus",
      value: 40,
      low: 32,
      high: 65,
      samples: [38, 44, 36, 40, 65, 52, 39, 58, 35, 40, 32, 61, 37, 47, 40, 54, 34, 51, 38, 57],
    },
    {
      label: "E-bike",
      value: 38,
      low: 35,
      high: 42,
      samples: [37, 38, 36, 39, 42, 38, 39, 38, 35, 40, 37, 38, 39, 41, 36, 38, 40, 37, 39, 38],
    },
  ],
};

/** Props for one of the reading key's six patterns: one trip, on one shared minutes axis. */
function fountainPatternProps(
  title: string,
  jet: { label: string; value: number; low: number; high: number; samples: number[] },
): FountainChartProps {
  return {
    title,
    xAxisDataType: "band",
    colors: [FOUNTAIN_BLUE],
    yAxisDomain: [0, 70],
    yAxisTitle: "minutes (higher = slower)",
    endLabels: ["best", "worst"],
    sampleWord: "days",
    dataSet: [jet],
  };
}

const fountain: Example<FountainChartProps>[] = [
  {
    id: "fountain-commute-by-mode",
    title: "How long is my commute, really?",
    description:
      "Big dot = a normal day, fountain = best day to worst day, small dot = one working day (minutes door to door). Illustrative numbers for a typical 15 km city commute, as if each way of travelling had been timed on 20 working days; they are not from a published source.",
    element: "michi-vz-fountain-chart",
    props: fountainCommute,
  },
  {
    id: "fountain-home-internet-promised-vs-real",
    title: "I pay for 100 Mbps. What do I really get?",
    description:
      "Big dot = the usual speed at that hour, fountain = slowest to fastest, small dot = one day's speed test (20 days). Illustrative numbers that do not come from any provider: one speed test at each hour on each of 20 days, rounded to whole Mbps. The shape is how home broadband is widely known to behave: fast at night, slow at the evening peak when the whole street is streaming.",
    element: "michi-vz-fountain-chart",
    props: {
      title: "I pay for 100 Mbps. What do I really get?",
      ...fountainPeriods(["7 am", "Noon", "5 pm", "9 pm", "1 am"]),
      colors: [FOUNTAIN_BLUE],
      yAxisTitle: "Mbps (higher = faster)",
      endLabels: ["slowest", "fastest"],
      sampleWord: "tests",
      referenceLines: [
        { value: 100, label: "Paid for: 100 Mbps", goodSide: "above", countLabel: "got 100" },
      ],
      readingGuide: fountainGuide("one test"),
      dataSet: [
        {
          label: "Download speed",
          date: 1,
          value: 94,
          low: 88,
          high: 98,
          samples: [95, 93, 97, 94, 91, 96, 94, 98, 93, 95, 88, 94, 96, 92, 97, 94, 93, 95, 96, 94],
        },
        {
          label: "Download speed",
          date: 2,
          value: 88,
          low: 75,
          high: 96,
          samples: [90, 87, 93, 88, 85, 91, 75, 89, 94, 86, 88, 92, 84, 96, 87, 90, 88, 82, 95, 86],
        },
        {
          label: "Download speed",
          date: 3,
          value: 78,
          low: 55,
          high: 92,
          samples: [81, 74, 86, 78, 90, 71, 77, 55, 84, 75, 92, 68, 76, 83, 78, 87, 61, 80, 73, 89],
        },
        {
          label: "Download speed",
          date: 4,
          value: 62,
          low: 22,
          high: 80,
          samples: [66, 38, 71, 58, 22, 75, 62, 45, 80, 34, 68, 63, 27, 73, 52, 62, 77, 31, 64, 60],
        },
        {
          label: "Download speed",
          date: 5,
          value: 95,
          low: 90,
          high: 99,
          samples: [96, 94, 98, 95, 93, 97, 90, 95, 99, 94, 96, 92, 97, 95, 98, 93, 96, 95, 97, 94],
        },
      ],
    },
  },
  {
    id: "fountain-food-delivery-real-time",
    title: "How long does food delivery really take?",
    description:
      "Big dot = the usual wait, fountain = fastest to slowest delivery, small dot = one real order. Illustrative numbers for a city delivery app that do not come from any provider: each small dot is one made-up order from recent weeks at that time of day.",
    element: "michi-vz-fountain-chart",
    props: {
      title: "How long does food delivery really take?",
      xAxisDataType: "band",
      colors: [FOUNTAIN_BLUE],
      yAxisTitle: "minutes (higher = slower)",
      endLabels: ["fastest", "slowest"],
      sampleWord: "orders",
      referenceLines: [
        { value: 30, label: "App promise: 30 min", goodSide: "below", countLabel: "on time" },
      ],
      readingGuide: fountainGuide("one order"),
      dataSet: [
        {
          label: "Weekday lunch",
          value: 30,
          low: 20,
          high: 40,
          samples: [
            28, 33, 37, 32, 29, 31, 40, 35, 28, 34, 31, 32, 29, 20, 30, 30, 26, 26, 25, 30, 27, 30,
          ],
        },
        {
          label: "Weekday dinner",
          value: 35,
          low: 25,
          high: 50,
          samples: [38, 33, 38, 50, 35, 41, 35, 40, 36, 33, 32, 30, 35, 25, 31, 44, 37, 28, 47, 34],
        },
        {
          label: "Friday night",
          value: 45,
          low: 30,
          high: 80,
          samples: [62, 80, 30, 55, 66, 52, 40, 49, 41, 42, 44, 45, 43, 75, 45, 34, 37, 71, 38, 47],
        },
        {
          label: "Rainy Sunday",
          value: 50,
          low: 35,
          high: 90,
          samples: [54, 48, 35, 86, 51, 45, 59, 58, 41, 46, 56, 53, 47, 90, 50, 50, 43, 49],
        },
        {
          label: "Late night",
          value: 25,
          low: 20,
          high: 35,
          samples: [31, 27, 24, 23, 35, 26, 22, 25, 26, 22, 29, 20, 25],
        },
      ],
    },
  },
  {
    id: "fountain-black-friday-tv",
    title: "Is the Black Friday deal really cheaper?",
    description:
      "Big dot = the usual price across 15 shops, fountain = cheapest shop to dearest shop, small dot = one shop. Illustrative prices for an unnamed TV model at the same 15 shops, rounded to the nearest 5 €, not from a public source. Consumer groups often report this pattern: shops raise prices in the weeks before Black Friday and then 'cut' them back.",
    element: "michi-vz-fountain-chart",
    props: {
      title: "Is the Black Friday deal really cheaper?",
      ...fountainPeriods(["Early Oct", "Late Oct", "Early Nov", "Black Friday week", "Early Dec"]),
      colors: [FOUNTAIN_BLUE],
      yAxisTitle: "€ (higher = dearer)",
      endLabels: ["cheapest", "dearest"],
      sampleWord: "shops",
      referenceLines: [
        {
          value: 800,
          label: "Usual price in early October",
          goodSide: "below",
          countLabel: "at or under 800",
        },
      ],
      readingGuide: fountainGuide("one shop"),
      dataSet: [
        {
          label: "TV price",
          date: 1,
          value: 800,
          low: 740,
          high: 860,
          samples: [800, 740, 790, 800, 860, 770, 815, 800, 830, 780, 850, 795, 800, 840, 790],
        },
        {
          label: "TV price",
          date: 2,
          value: 820,
          low: 760,
          high: 880,
          samples: [820, 760, 820, 845, 880, 790, 840, 830, 850, 800, 875, 805, 820, 870, 815],
        },
        {
          label: "TV price",
          date: 3,
          value: 830,
          low: 770,
          high: 890,
          samples: [830, 770, 840, 850, 890, 795, 850, 825, 860, 810, 880, 815, 820, 870, 830],
        },
        {
          label: "TV price",
          date: 4,
          value: 780,
          low: 600,
          high: 860,
          samples: [600, 780, 745, 780, 860, 770, 795, 790, 800, 760, 840, 775, 780, 820, 800],
        },
        {
          label: "TV price",
          date: 5,
          value: 790,
          low: 700,
          high: 870,
          samples: [700, 790, 760, 800, 870, 720, 785, 790, 810, 770, 850, 780, 800, 835, 790],
        },
      ],
    },
  },
  {
    id: "fountain-parcel-delivery-by-origin",
    title: "Will my online order arrive in time?",
    description:
      "Big dot = the usual days to arrive, fountain = fastest to slowest delivery, small dot = one parcel. Illustrative numbers for the last 20 parcels from each country delivered to France; they are not from a postal or courier source.",
    element: "michi-vz-fountain-chart",
    props: {
      title: "Will my online order arrive in time?",
      xAxisDataType: "band",
      colors: [FOUNTAIN_BLUE],
      yAxisTitle: "days (higher = slower)",
      endLabels: ["fastest", "slowest"],
      sampleWord: "parcels",
      readingGuide: fountainGuide("one parcel"),
      dataSet: [
        {
          label: "From Germany",
          value: 3,
          low: 2,
          high: 5,
          samples: [3, 2, 3, 4, 3, 3, 2, 5, 3, 4, 3, 2, 3, 3, 4, 3, 2, 4, 3, 4],
        },
        {
          label: "From the UK",
          value: 6,
          low: 4,
          high: 14,
          samples: [6, 5, 7, 4, 6, 14, 6, 5, 8, 6, 7, 11, 5, 6, 9, 4, 7, 6, 12, 5],
        },
        {
          label: "From the USA",
          value: 8,
          low: 5,
          high: 15,
          samples: [8, 7, 10, 6, 8, 9, 13, 7, 8, 5, 12, 8, 7, 9, 15, 6, 8, 11, 7, 10],
        },
        {
          label: "From China",
          value: 12,
          low: 7,
          high: 30,
          samples: [12, 11, 25, 10, 14, 9, 12, 16, 30, 12, 8, 13, 22, 11, 14, 10, 27, 12, 7, 19],
        },
      ],
    },
  },
  {
    id: "fountain-weather-forecast-week",
    title: "Can I trust the forecast for Saturday's barbecue?",
    description:
      "Big dot = the forecast afternoon temperature, fountain = how much cooler or warmer it could turn out; dashed = a forecast. Illustrative numbers for a late-spring week in a mild European city, not from a weather service. Today is drawn solid because it is nearly known, and the days after it are dashed forecasts. The 20° line is a rough comfort mark for eating outdoors, not an official figure.",
    element: "michi-vz-fountain-chart",
    props: {
      title: "Can I trust the forecast for Saturday's barbecue?",
      ...fountainPeriods(["Today", "Fri", "Sat", "Sun", "Mon", "Tue"]),
      colors: [FOUNTAIN_BLUE],
      yAxisTitle: "°C in the afternoon",
      endLabels: ["coolest", "warmest"],
      referenceLines: [{ value: 20, label: "warm enough to eat outside" }],
      readingGuide:
        "Big dot = the forecast · Fountain = how much cooler or warmer it could turn out · Dashed = not known yet · Tall fountain = closer to a guess",
      dataSet: [
        { label: "Afternoon temperature", date: 1, value: 22, low: 21, high: 23 },
        { label: "Afternoon temperature", date: 2, value: 24, low: 22, high: 26, forecast: true },
        { label: "Afternoon temperature", date: 3, value: 25, low: 22, high: 28, forecast: true },
        { label: "Afternoon temperature", date: 4, value: 23, low: 20, high: 26, forecast: true },
        { label: "Afternoon temperature", date: 5, value: 21, low: 18, high: 25, forecast: true },
        { label: "Afternoon temperature", date: 6, value: 22, low: 17, high: 27, forecast: true },
      ],
    },
  },
  {
    id: "fountain-rent-by-city",
    title: "Where can I afford a two-bedroom flat?",
    description:
      "Big dot = the usual monthly rent, fountain = cheapest flat to the dearest, small dot = one flat for rent. Illustrative but believable rents: between 17 and 23 two-bedroom flats advertised in each of five European cities, not taken from a rental-market source.",
    element: "michi-vz-fountain-chart",
    props: {
      title: "Where can I afford a two-bedroom flat?",
      xAxisDataType: "band",
      colors: [FOUNTAIN_BLUE],
      yAxisTitle: "€ a month (higher = dearer)",
      endLabels: ["cheapest", "dearest"],
      sampleWord: "flats",
      referenceLines: [
        {
          value: 1000,
          label: "My budget: 1,000 €",
          goodSide: "below",
          countLabel: "within budget",
        },
      ],
      readingGuide: fountainGuide("one flat"),
      dataSet: [
        {
          label: "Paris",
          value: 2000,
          low: 1500,
          high: 3200,
          samples: [
            1950, 2890, 2300, 2180, 2050, 2100, 3200, 1900, 2450, 2600, 2250, 1980, 1500, 1990,
            1890, 1780, 1750, 1690, 2100, 1850, 2000,
          ],
        },
        {
          label: "Amsterdam",
          value: 2200,
          low: 1700,
          high: 3200,
          samples: [
            2080, 2000, 2375, 2400, 2650, 2240, 2750, 1900, 2195, 2300, 2980, 1700, 2100, 2490,
            2200, 3200, 2150, 1975, 1825,
          ],
        },
        {
          label: "Lisbon",
          value: 1400,
          low: 1000,
          high: 2300,
          samples: [
            1390, 2300, 1400, 1200, 1480, 1250, 1800, 1325, 1500, 1450, 1000, 1375, 1180, 1550,
            1350, 1700, 1400, 1300, 1650, 1250, 1290, 1950, 1600,
          ],
        },
        {
          label: "Berlin",
          value: 1300,
          low: 950,
          high: 2100,
          samples: [
            980, 1500, 1150, 1000, 1450, 950, 2100, 1390, 1300, 1650, 1580, 1240, 1000, 1900, 965,
            1790, 1080, 1190, 1300, 1350,
          ],
        },
        {
          label: "Madrid",
          value: 1300,
          low: 1000,
          high: 1900,
          samples: [
            1500, 1400, 1600, 1150, 1900, 1100, 1290, 1450, 1200, 1325, 1300, 1000, 1350, 1000,
            1250, 1750, 1180,
          ],
        },
      ],
    },
  },
  {
    id: "fountain-border-basket",
    title: "Is it cheaper to shop across the border from Switzerland?",
    description:
      "Big dot = the usual cost of the same basket, fountain = cheapest shop to dearest shop. Illustrative prices for the same bag of everyday groceries, converted to CHF. The order (Switzerland by far the dearest, Germany the cheapest) matches what is widely reported, but the figures are not from a specific source.",
    element: "michi-vz-fountain-chart",
    props: {
      title: "Is it cheaper to shop across the border from Switzerland?",
      xAxisDataType: "band",
      colors: [FOUNTAIN_BLUE],
      yAxisTitle: "CHF (higher = dearer)",
      endLabels: ["cheapest", "dearest"],
      readingGuide:
        "Big dot = the usual cost · Top of the fountain = the dearest shop · Base = the cheapest shop",
      dataSet: [
        { label: "Switzerland", value: 100, low: 86, high: 116 },
        { label: "France", value: 64, low: 54, high: 76 },
        { label: "Germany", value: 56, low: 48, high: 66 },
        { label: "Italy", value: 62, low: 52, high: 74 },
        { label: "Austria", value: 66, low: 56, high: 78 },
      ],
    },
  },
  {
    id: "fountain-sleep-by-night",
    title: "Why am I so tired on Mondays?",
    description:
      "Big dot = a usual night's sleep, fountain = worst night to best night, small dot = one night. Illustrative numbers for one adult over 16 weeks, not from a public source: each small dot is one night as a sleep tracker logged it, to the nearest 6 minutes. Weeknights show only the last 16, so every column has the same number of dots to count. The 7-hour line is the least sleep that health bodies such as the US CDC advise for adults.",
    element: "michi-vz-fountain-chart",
    props: {
      title: "Why am I so tired on Mondays?",
      xAxisDataType: "band",
      colors: [FOUNTAIN_BLUE],
      yAxisTitle: "hours (higher = more sleep)",
      endLabels: ["least", "most"],
      sampleWord: "nights",
      referenceLines: [
        {
          value: 7,
          label: "Advised minimum: 7 hours",
          goodSide: "above",
          countLabel: "7 h or more",
        },
      ],
      readingGuide: fountainGuide("one night"),
      dataSet: [
        {
          label: "Sunday night",
          value: 6,
          low: 3.5,
          high: 7.5,
          samples: [6.3, 4.4, 7.1, 6, 5.8, 3.5, 6.8, 7.5, 4.9, 6, 7, 4.2, 6.6, 5.6, 7.3, 4.7],
        },
        {
          label: "Weeknights (Mon-Thu)",
          value: 6.5,
          low: 5,
          high: 7.5,
          samples: [6.4, 6.8, 6.1, 7, 6.5, 5, 6.3, 6.7, 6.4, 7.5, 6.2, 6.5, 6.8, 6, 7.2, 6.6],
        },
        {
          label: "Friday night",
          value: 7,
          low: 5.5,
          high: 8.5,
          samples: [7.2, 6.4, 7.9, 5.5, 7, 6.9, 8.5, 6.7, 7.4, 6.2, 7, 8.2, 6.6, 7.7, 6.9, 7.5],
        },
        {
          label: "Saturday night",
          value: 8.5,
          low: 7,
          high: 10,
          samples: [8.7, 9.3, 7.8, 8.5, 10, 8.1, 9, 7, 8.4, 9.6, 8.5, 8, 9.2, 7.6, 8.8, 8.3],
        },
      ],
    },
  },
  {
    id: "fountain-phone-battery-year-by-year",
    title: "Will my phone still last the day?",
    description:
      "Big dot = a normal day, fountain = busy day to quiet day, small dot = one day (hours on one charge). The hours are made up to look realistic; they are not real measurements. Each small dot is one day: 21 days (three weeks) noted in each year, the way the phone's battery screen shows them. Year 4 is a guess, so it is drawn dashed and has no small dots.",
    element: "michi-vz-fountain-chart",
    props: {
      title: "Will my phone still last the day?",
      ...fountainPeriods(["Year 1 (new)", "Year 2", "Year 3", "Year 4"]),
      colors: [FOUNTAIN_BLUE],
      yAxisTitle: "hours (higher = longer)",
      endLabels: ["shortest", "longest"],
      sampleWord: "days",
      referenceLines: [
        {
          value: 15,
          label: "a full day (7 am to 10 pm)",
          goodSide: "above",
          countLabel: "lasted the day",
        },
      ],
      readingGuide: fountainGuide("one day"),
      dataSet: [
        {
          label: "Battery",
          date: 1,
          value: 18,
          low: 15,
          high: 20,
          samples: [
            18.5, 19, 17.5, 18, 20, 19.5, 17, 18, 18.5, 15, 17.5, 19, 18, 19.5, 16.5, 18, 17.5, 19,
            18.5, 17, 19.5,
          ],
        },
        {
          label: "Battery",
          date: 2,
          value: 17,
          low: 13,
          high: 19,
          samples: [
            17, 18, 16.5, 19, 14, 17.5, 18.5, 16, 17, 13, 18, 17, 15.5, 19, 16.5, 17.5, 18, 14.5,
            16, 17, 18.5,
          ],
        },
        {
          label: "Battery",
          date: 3,
          value: 15,
          low: 10,
          high: 17,
          samples: [
            15.5, 13, 16, 11, 14.5, 16.5, 12, 15, 17, 10, 16, 13, 14.5, 16.5, 11, 15.5, 12.5, 16,
            14, 15, 16.5,
          ],
        },
        { label: "Battery", date: 4, value: 12, low: 7, high: 14, forecast: true },
      ],
    },
  },
  {
    id: "fountain-train-really-late",
    title: "How often is my train really late?",
    description:
      "Big dot = a usual trip, fountain = best trip to worst trip, small dot = one of the last 20 weekday trips of each train. These numbers are made up to show how the chart works; they are not real railway data. 0 means the train arrived on time.",
    element: "michi-vz-fountain-chart",
    props: {
      title: "How often is my train really late?",
      xAxisDataType: "band",
      colors: [FOUNTAIN_BLUE],
      yAxisTitle: "minutes late (higher = later)",
      endLabels: ["best", "worst"],
      sampleWord: "trips",
      referenceLines: [
        {
          value: 5,
          label: "Late: over 5 min (the railway's own rule)",
          goodSide: "below",
          countLabel: "on time",
        },
      ],
      readingGuide: fountainGuide("one trip"),
      dataSet: [
        {
          label: "7:12 train",
          value: 1,
          low: 0,
          high: 9,
          samples: [0, 1, 0, 2, 1, 0, 1, 3, 0, 1, 1, 0, 2, 1, 0, 4, 1, 0, 2, 9],
        },
        {
          label: "7:42 train",
          value: 3,
          low: 0,
          high: 25,
          samples: [2, 4, 3, 1, 6, 3, 0, 12, 3, 5, 2, 3, 25, 4, 2, 8, 3, 1, 18, 5],
        },
        {
          label: "8:12 train",
          value: 2,
          low: 0,
          high: 14,
          samples: [1, 2, 0, 3, 2, 5, 1, 2, 14, 0, 2, 4, 1, 3, 2, 7, 1, 2, 0, 3],
        },
        {
          label: "17:48 home",
          value: 5,
          low: 2,
          high: 32,
          samples: [4, 7, 5, 11, 3, 4, 22, 3, 2, 5, 9, 4, 32, 6, 8, 6, 3, 15, 5, 4],
        },
      ],
    },
  },
  {
    id: "fountain-tips-per-shift",
    title: "Which shifts are worth it for the tips?",
    description:
      "Big dot = the usual tips for that shift, fountain = worst shift to best, small dot = one shift worked this summer. Illustrative numbers for one made-up waiter's summer, not real pay data: each small dot is one shift's tips, cash and card together, in whole euros.",
    element: "michi-vz-fountain-chart",
    props: {
      title: "Which shifts are worth it for the tips?",
      xAxisDataType: "band",
      colors: [FOUNTAIN_BLUE],
      yAxisTitle: "€ in tips (higher = better)",
      endLabels: ["worst", "best"],
      sampleWord: "shifts",
      referenceLines: [
        { value: 60, label: "My target: €60 a shift", goodSide: "above", countLabel: "hit €60" },
      ],
      readingGuide: fountainGuide("one shift"),
      dataSet: [
        {
          label: "Weekday lunch",
          value: 22,
          low: 9,
          high: 41,
          samples: [18, 31, 41, 22, 28, 19, 35, 25, 24, 13, 9, 27, 22, 16, 21],
        },
        {
          label: "Weekday dinner",
          value: 46,
          low: 24,
          high: 83,
          samples: [45, 54, 33, 48, 38, 51, 41, 71, 57, 24, 43, 46, 66, 35, 29, 83, 62],
        },
        {
          label: "Friday night",
          value: 84,
          low: 37,
          high: 139,
          samples: [84, 81, 102, 110, 88, 52, 124, 78, 66, 95, 139, 71, 37],
        },
        {
          label: "Saturday night",
          value: 97,
          low: 64,
          high: 168,
          samples: [117, 168, 141, 103, 97, 90, 64, 94, 85, 72, 79, 126, 108],
        },
        {
          label: "Sunday brunch",
          value: 55,
          low: 31,
          high: 74,
          samples: [74, 31, 38, 44, 66, 52, 47, 55, 55, 63, 69, 58],
        },
      ],
    },
  },
  {
    id: "fountain-board-game-before-bedtime",
    title: "Which board game can we finish before bedtime?",
    description:
      "Big dot = how long a game usually takes, fountain = quickest game to longest, small dot = one game played on family game night. Illustrative numbers: made-up start-to-finish times for 12 to 20 games of each, not real play records.",
    element: "michi-vz-fountain-chart",
    props: {
      title: "Which board game can we finish before bedtime?",
      xAxisDataType: "band",
      colors: [FOUNTAIN_BLUE],
      yAxisTitle: "minutes (higher = longer)",
      endLabels: ["quickest", "longest"],
      sampleWord: "games",
      referenceLines: [
        { value: 60, label: "One hour to bedtime", goodSide: "below", countLabel: "done in time" },
      ],
      readingGuide: fountainGuide("one game"),
      dataSet: [
        {
          label: "Uno",
          value: 20,
          low: 8,
          high: 41,
          samples: [21, 25, 14, 41, 20, 22, 11, 30, 18, 12, 8, 34, 15, 25, 20, 17, 28, 19, 15, 24],
        },
        {
          label: "Scrabble",
          value: 48,
          low: 35,
          high: 66,
          samples: [50, 52, 57, 48, 61, 66, 35, 54, 45, 47, 48, 43, 38, 41],
        },
        {
          label: "Ticket to Ride",
          value: 55,
          low: 42,
          high: 78,
          samples: [62, 42, 54, 78, 48, 70, 53, 60, 55, 51, 57, 58, 65, 50, 45],
        },
        {
          label: "Catan",
          value: 75,
          low: 55,
          high: 120,
          samples: [70, 55, 60, 72, 68, 63, 66, 78, 85, 95, 90, 120, 104, 82, 75, 75],
        },
        {
          label: "Monopoly",
          value: 105,
          low: 65,
          high: 190,
          samples: [88, 190, 65, 95, 130, 80, 105, 160, 105, 115, 145, 100],
        },
      ],
    },
  },
  {
    id: "fountain-weekly-shop-trend",
    title: "Is the weekly food shop going over €100 more often?",
    description:
      "Big dot = a usual week's shop, fountain = cheapest week to dearest, small dot = one weekly shop in those three months; the last one is a guess for this autumn. Illustrative receipts for one made-up household of four, not real price data (the €186 one is the Christmas shop). Sep–Nov 2026 is a forecast with no receipts yet, so it has no small dots.",
    element: "michi-vz-fountain-chart",
    props: {
      title: "Is the weekly food shop going over €100 more often?",
      ...fountainPeriods(["Sep–Nov 2025", "Dec–Feb", "Mar–May", "Jun–Aug", "Sep–Nov 2026"]),
      colors: [FOUNTAIN_BLUE],
      yAxisTitle: "€ a week (higher = dearer)",
      endLabels: ["cheapest", "dearest"],
      sampleWord: "weeks",
      referenceLines: [
        {
          value: 100,
          label: "My budget: €100 a week",
          goodSide: "below",
          countLabel: "within budget",
        },
      ],
      readingGuide: fountainGuide("one week"),
      dataSet: [
        {
          label: "Weekly shop",
          date: 1,
          value: 88.4,
          low: 71.35,
          high: 112.84,
          samples: [
            92.88, 94.51, 71.35, 85.06, 112.84, 103.62, 90.15, 76.9, 79.12, 83.47, 88.4, 97.3,
            86.73,
          ],
        },
        {
          label: "Weekly shop",
          date: 2,
          value: 92.65,
          low: 74.18,
          high: 186.47,
          samples: [
            79.55, 92.65, 98.1, 91.2, 95.43, 186.47, 86.9, 118.9, 74.18, 106.25, 89.37, 84.02,
            99.76,
          ],
        },
        {
          label: "Weekly shop",
          date: 3,
          value: 94.2,
          low: 78.64,
          high: 121.35,
          samples: [
            83.15, 86.92, 93.05, 91.77, 121.35, 78.64, 89.4, 109.66, 102.47, 94.2, 99.12, 104.9,
            96.38,
          ],
        },
        {
          label: "Weekly shop",
          date: 4,
          value: 97.85,
          low: 80.27,
          high: 131.08,
          samples: [
            101.37, 112.6, 103.92, 97.85, 107.15, 80.27, 94.68, 96.25, 131.08, 89.93, 100.4, 92.1,
            86.44,
          ],
        },
        { label: "Weekly shop", date: 5, value: 99.5, low: 86, high: 118, forecast: true },
      ],
    },
  },
  {
    id: "fountain-swim-gala-time",
    title: "How often does my daughter swim 50 m fast enough for the swim meet?",
    description:
      "Big dot = her usual time that term, fountain = fastest swim to slowest, small dot = one timed swim at training. Made-up numbers: one invented swimmer's stopwatch times, 13 or 14 per school term. 'Next autumn term' is the coach's guess, so it is dashed and has no small dots.",
    element: "michi-vz-fountain-chart",
    props: {
      title: "How often does my daughter swim 50 m fast enough for the swim meet?",
      ...fountainPeriods(["Autumn term", "Spring term", "Summer term", "Next autumn term"]),
      colors: [FOUNTAIN_BLUE],
      yAxisTitle: "seconds (higher = slower)",
      endLabels: ["fastest", "slowest"],
      sampleWord: "swims",
      referenceLines: [
        {
          value: 40,
          label: "Qualifying time: 40 s (below = fast enough)",
          goodSide: "below",
          countLabel: "fast enough",
        },
      ],
      readingGuide: fountainGuide("one swim"),
      dataSet: [
        {
          label: "50 m time",
          date: 1,
          value: 43.8,
          low: 41.9,
          high: 47.2,
          samples: [43.6, 44, 43.1, 42.8, 43.5, 42.4, 44.9, 46.1, 44.3, 47.2, 45.2, 41.9, 43.8],
        },
        {
          label: "50 m time",
          date: 2,
          value: 41.3,
          low: 39.6,
          high: 45.3,
          samples: [40.5, 45.3, 41, 43, 40.2, 40.8, 41.3, 42.1, 41.3, 43.9, 39.6, 42.4, 41.7, 39.9],
        },
        {
          label: "50 m time",
          date: 3,
          value: 40.4,
          low: 38.7,
          high: 44.1,
          samples: [39.8, 38.7, 41.3, 40.6, 39.2, 40.4, 41.8, 42.5, 44.1, 40.9, 39.9, 39.5, 40.1],
        },
        { label: "50 m time", date: 4, value: 39.8, low: 38.5, high: 41.5, forecast: true },
      ],
    },
  },
  {
    id: "fountain-class-test-pass-mark",
    title: "How many in the class fail each test?",
    description:
      "Big dot = a typical pupil's score, fountain = lowest to highest score in the class, small dot = one pupil. Illustrative numbers: one made-up class of 23 to 25 pupils (some were absent), not real results.",
    element: "michi-vz-fountain-chart",
    props: {
      title: "How many in the class fail each test?",
      xAxisDataType: "band",
      colors: [FOUNTAIN_BLUE],
      yAxisTitle: "points (higher = better)",
      endLabels: ["lowest", "highest"],
      sampleWord: "pupils",
      referenceLines: [{ value: 50, label: "Pass mark", goodSide: "above", countLabel: "passed" }],
      readingGuide: fountainGuide("one pupil"),
      dataSet: [
        {
          label: "Maths",
          value: 64,
          low: 28,
          high: 93,
          samples: [
            53, 39, 61, 47, 72, 63, 70, 93, 74, 58, 81, 44, 67, 78, 75, 59, 64, 66, 88, 62, 69, 51,
            55, 85, 28,
          ],
        },
        {
          label: "Reading",
          value: 71,
          low: 52,
          high: 90,
          samples: [
            70, 68, 83, 90, 58, 52, 80, 69, 71, 70, 81, 76, 63, 61, 65, 72, 66, 67, 77, 78, 71, 74,
            75, 86,
          ],
        },
        {
          label: "Science",
          value: 58,
          low: 22,
          high: 86,
          samples: [
            22, 61, 77, 80, 68, 56, 57, 71, 64, 63, 58, 43, 70, 48, 86, 49, 41, 55, 66, 60, 52, 54,
            35, 74, 46,
          ],
        },
        {
          label: "Geography",
          value: 67,
          low: 41,
          high: 84,
          samples: [
            75, 79, 65, 60, 65, 76, 73, 68, 61, 41, 66, 57, 69, 67, 84, 72, 64, 67, 63, 70, 66, 78,
            71,
          ],
        },
        {
          label: "French",
          value: 55,
          low: 18,
          high: 91,
          samples: [
            91, 55, 53, 50, 47, 51, 72, 45, 62, 54, 36, 49, 60, 30, 83, 18, 44, 57, 79, 65, 67, 69,
            76, 40, 59,
          ],
        },
      ],
    },
  },
  // ---- The reading key ----
  {
    id: "fountain-key-anatomy",
    title: "Reading key: the parts of a fountain",
    description:
      "One fountain with every part in view: the stem, the big dot, the fountain, the small dots, and the red line with its count. Illustrative numbers: one car commute timed on 20 working days, made up for the reading key.",
    element: "michi-vz-fountain-chart",
    props: {
      title: "One car commute, timed on 20 working days",
      xAxisDataType: "band",
      colors: [FOUNTAIN_BLUE],
      yAxisDomain: [0, 70],
      yAxisTitle: "minutes (higher = slower)",
      endLabels: ["best", "worst"],
      sampleWord: "days",
      referenceLines: [
        {
          value: 45,
          label: "Time I allow: 45 min",
          goodSide: "below",
          countLabel: "within 45 min",
        },
      ],
      dataSet: [
        {
          label: "Car",
          value: 30,
          low: 22,
          high: 55,
          samples: [22, 24, 25, 26, 27, 27, 28, 28, 29, 30, 30, 30, 31, 31, 32, 33, 34, 36, 48, 55],
        },
      ],
    },
  },
  {
    id: "fountain-key-steady",
    title: "Pattern: steady",
    description:
      "Short fountain, small dots close together: the same time almost every day. Illustrative numbers: one trip timed on different days, made up for the reading key.",
    element: "michi-vz-fountain-chart",
    props: fountainPatternProps("Steady: the same time almost every day", {
      label: "Steady",
      value: 38,
      low: 35,
      high: 42,
      samples: [35, 36, 36, 37, 37, 37, 38, 38, 38, 38, 38, 38, 39, 39, 39, 40, 40, 41, 41, 42],
    }),
  },
  {
    id: "fountain-key-changes-a-lot",
    title: "Pattern: changes a lot",
    description:
      "Tall fountain, small dots all the way up: slow days are common, so plan extra time. Illustrative numbers: one trip timed on different days, made up for the reading key.",
    element: "michi-vz-fountain-chart",
    props: fountainPatternProps("Changes a lot: slow days are common, so plan extra time", {
      label: "Changes a lot",
      value: 40,
      low: 32,
      high: 65,
      samples: [32, 34, 35, 36, 37, 38, 38, 39, 40, 40, 40, 41, 42, 43, 45, 47, 50, 55, 60, 65],
    }),
  },
  {
    id: "fountain-key-rare-bad-days",
    title: "Pattern: rare bad days",
    description:
      "Small dots low, an empty gap, then one or two high: usually fine, and bad days are rare. Illustrative numbers: one trip timed on different days, made up for the reading key.",
    element: "michi-vz-fountain-chart",
    props: fountainPatternProps("Rare bad days: usually fine, and bad days are rare", {
      label: "Rare bad days",
      value: 30,
      low: 22,
      high: 58,
      samples: [22, 24, 25, 26, 27, 27, 28, 28, 29, 30, 30, 30, 31, 31, 32, 33, 34, 36, 55, 58],
    }),
  },
  {
    id: "fountain-key-often-bad",
    title: "Pattern: often bad",
    description:
      "Most small dots high, the big dot near the top: slow is the normal day here. Illustrative numbers: one trip timed on different days, made up for the reading key.",
    element: "michi-vz-fountain-chart",
    props: fountainPatternProps("Often bad: slow is the normal day here", {
      label: "Often bad",
      value: 55,
      low: 30,
      high: 62,
      samples: [30, 36, 42, 48, 50, 52, 53, 54, 55, 55, 55, 56, 57, 58, 58, 59, 60, 60, 61, 62],
    }),
  },
  {
    id: "fountain-key-just-a-guess",
    title: "Pattern: just a guess",
    description:
      "Only 5 small dots: too few days counted, so do not trust it yet. Illustrative numbers: one trip timed on different days, made up for the reading key.",
    element: "michi-vz-fountain-chart",
    props: fountainPatternProps("Just a guess: too few days counted, so do not trust it yet", {
      label: "Just a guess",
      value: 40,
      low: 33,
      high: 52,
      samples: [33, 37, 40, 45, 52],
    }),
  },
  {
    id: "fountain-key-enough-days",
    title: "Pattern: enough days",
    description:
      "The same shape with 20 small dots: more days counted, so it is safer to trust. Illustrative numbers: one trip timed on different days, made up for the reading key.",
    element: "michi-vz-fountain-chart",
    props: fountainPatternProps("Enough days: more days counted, so it is safer to trust", {
      label: "Enough days",
      value: 40,
      low: 33,
      high: 52,
      samples: [33, 34, 35, 36, 37, 38, 39, 39, 40, 40, 40, 41, 42, 43, 44, 45, 47, 48, 50, 52],
    }),
  },
  // ---- Switches (the commute example with one switch flipped) ----
  {
    id: "fountain-switch-drift",
    title: "The Geneva look: drift",
    description:
      "The commute example with `drift: true`: the top of every fountain bends to the right by the same amount, like the real Jet d'Eau on a breezy day. The bend carries no data, so it is off by default. Illustrative numbers.",
    element: "michi-vz-fountain-chart",
    props: { ...fountainCommute, title: "Commute times, with drift: true", drift: true },
  },
  {
    id: "fountain-switch-no-range",
    title: "Stem and big dot only: showRange off",
    description:
      "The commute example with `showRange: false`: no fountain and no small dots, just a bar up to each big dot, so it reads like a lollipop chart. The reading guide is off too, since it explains fountains and small dots. Illustrative numbers.",
    element: "michi-vz-fountain-chart",
    props: {
      ...fountainCommute,
      title: "Commute times, with showRange: false",
      showRange: false,
      readingGuide: false,
    },
  },
];

// Illustrative merchandise export values (US$ bn), shared by the continuous
// choropleth examples below.
const exportValue2024: ChoroplethMapChartProps["dataSet"] = [
  { id: "USA", label: "United States", value: 2064 },
  { id: "CHN", label: "China", value: 3380 },
  { id: "DEU", label: "Germany", value: 1690 },
  { id: "JPN", label: "Japan", value: 717 },
  { id: "GBR", label: "United Kingdom", value: 460 },
  { id: "FRA", label: "France", value: 617 },
  { id: "KOR", label: "South Korea", value: 683 },
  { id: "NLD", label: "Netherlands", value: 870 },
  { id: "ITA", label: "Italy", value: 620 },
  { id: "BRA", label: "Brazil", value: 340 },
  { id: "IND", label: "India", value: 450 },
  { id: "RUS", label: "Russia", value: 425 },
  { id: "MEX", label: "Mexico", value: 593 },
  { id: "CAN", label: "Canada", value: 594 },
  { id: "AUS", label: "Australia", value: 344 },
  { id: "ZAF", label: "South Africa", value: 123 },
  { id: "NGA", label: "Nigeria", value: 62 },
  { id: "EGY", label: "Egypt", value: 43 },
  { id: "SAU", label: "Saudi Arabia", value: 340 },
  { id: "ARE", label: "United Arab Emirates", value: 599 },
  { id: "IDN", label: "Indonesia", value: 292 },
  { id: "VNM", label: "Vietnam", value: 371 },
  { id: "MYS", label: "Malaysia", value: 351 },
  { id: "CHE", label: "Switzerland", value: 420 },
  { id: "ESP", label: "Spain", value: 425 },
  { id: "TUR", label: "Turkey", value: 262 },
  { id: "POL", label: "Poland", value: 351 },
  { id: "SWE", label: "Sweden", value: 195 },
  { id: "KEN", label: "Kenya", value: 8 },
];

// ChoroplethMapChart's `geography` is ALWAYS a consumer-supplied prop (core
// bundles no topology data); `world` above is the real geography, imported
// from the examples/docs layer only (see this chart's docs page for the
// `import worldJson from "./world.json"` real-world consumer pattern).
const choroplethMap: Example<ChoroplethMapChartProps>[] = [
  {
    id: "choropleth-map-export-value",
    title: "Merchandise export value by region, 2024 (US$ bn)",
    description:
      "Continuous encoding: colorScale (a resolved hex range + numeric domain, built into a d3 scaleThreshold) shades each country by export value. A country with no matching dataSet row (most of the 176-country world atlas here) renders noDataColor.",
    element: "michi-vz-choropleth-map-chart",
    props: {
      title: "Merchandise export value by region, 2024 (US$ bn)",
      geography: world,
      colorScale: {
        domain: [200, 500, 1000, 2000],
        range: ["#eaf3fb", "#a9d0ea", "#5b9bd5", "#2c6fbb", "#123a63"],
      },
      tooltipFormatter: (d) =>
        "value" in d && d.value !== undefined
          ? `<strong>${d.label}</strong><br/>${d.value.toLocaleString()} bn`
          : `<strong>${"name" in d ? (d.name ?? d.id) : d.id}</strong><br/>No data`,
      // Every other country in `geography` is intentionally left unmatched to show
      // noDataColor across the rest of the world atlas.
      dataSet: exportValue2024,
    },
  },
  {
    id: "choropleth-map-data-availability",
    title: "Latest available survey year by region",
    description:
      "Categorical encoding via colorsMapping (wins over colorScale) - the sdg-trade Data Availability use case: a handful of fixed label -> colour buckets, not a numeric gradient.",
    element: "michi-vz-choropleth-map-chart",
    props: {
      title: "Latest available survey year by region",
      geography: world,
      joinBy: "id",
      noDataColor: "#eeeeee",
      colorsMapping: {
        "2024": "#425a85",
        "2023": "#be0000",
        "2022": "#d3a029",
        "2021 or earlier": "#e11484",
      },
      tooltipFormatter: (d) =>
        "label" in d
          ? `<strong>${d.label}</strong>`
          : `<strong>${d.name ?? d.id}</strong><br/>No data`,
      dataSet: [
        { id: "USA", label: "2024" },
        { id: "CAN", label: "2024" },
        { id: "GBR", label: "2024" },
        { id: "DEU", label: "2024" },
        { id: "FRA", label: "2024" },
        { id: "JPN", label: "2024" },
        { id: "AUS", label: "2024" },
        { id: "KOR", label: "2024" },
        { id: "NLD", label: "2024" },
        { id: "SWE", label: "2024" },
        { id: "CHN", label: "2023" },
        { id: "IND", label: "2023" },
        { id: "BRA", label: "2023" },
        { id: "MEX", label: "2023" },
        { id: "IDN", label: "2023" },
        { id: "ZAF", label: "2023" },
        { id: "RUS", label: "2023" },
        { id: "TUR", label: "2023" },
        { id: "ESP", label: "2023" },
        { id: "ITA", label: "2023" },
        { id: "EGY", label: "2022" },
        { id: "NGA", label: "2022" },
        { id: "KEN", label: "2022" },
        { id: "SAU", label: "2022" },
        { id: "ARE", label: "2022" },
        { id: "VNM", label: "2022" },
        { id: "THA", label: "2022" },
        { id: "PHL", label: "2022" },
        { id: "PAK", label: "2022" },
        { id: "BGD", label: "2022" },
        { id: "ARG", label: "2021 or earlier" },
        { id: "COL", label: "2021 or earlier" },
        { id: "PER", label: "2021 or earlier" },
        { id: "CHL", label: "2021 or earlier" },
        { id: "MAR", label: "2021 or earlier" },
        { id: "DZA", label: "2021 or earlier" },
        { id: "ETH", label: "2021 or earlier" },
        { id: "GHA", label: "2021 or earlier" },
        { id: "TZA", label: "2021 or earlier" },
        { id: "UGA", label: "2021 or earlier" },
      ],
    },
  },
  {
    id: "choropleth-map-purples-scheme",
    title: "Merchandise export value by region, 2024 (US$ bn), ColorBrewer Purples",
    description:
      'The same continuous encoding with a named palette: sequentialScheme("purples", 5) from @michi-vz/core returns the 5-colour ColorBrewer Purples ramp (d3-scale-chromatic\'s schemePurples[5]) for colorScale.range - 4 thresholds, 5 colours, no d3 dependency.',
    element: "michi-vz-choropleth-map-chart",
    props: {
      title: "Merchandise export value by region, 2024 (US$ bn)",
      geography: world,
      colorScale: {
        domain: [200, 500, 1000, 2000],
        range: sequentialScheme("purples", 5),
      },
      tooltipFormatter: (d) =>
        "value" in d && d.value !== undefined
          ? `<strong>${d.label}</strong><br/>${d.value.toLocaleString()} bn`
          : `<strong>${"name" in d ? (d.name ?? d.id) : d.id}</strong><br/>No data`,
      dataSet: exportValue2024,
    },
  },
];

// SymbolMapChart's `dataSet` items each supply their own lng/lat (core bundles no
// coordinate table, unlike the legacy sdg-trade MapSymbolForce's CSV) - ~50
// hand-written real-world capitals/cities, not a comprehensive gazetteer.
const symbolMap: Example<SymbolMapChartProps>[] = [
  {
    id: "symbol-map-trade-hubs",
    title: "Merchandise trade value by hub, 2024 (US$ bn)",
    description:
      'Dot-only look (no `geography` - the legacy MapSymbolForce parity default): each item projects through an untuned geoMercator(), then a one-shot force simulation de-overlaps the circles. Germany and India also carry a concentric `valueSecond` ring (a sub-metric, e.g. "of which intra-regional").',
    element: "michi-vz-symbol-map-chart",
    props: {
      title: "Merchandise trade value by hub, 2024 (US$ bn)",
      tooltipFormatter: (d) =>
        `<strong>${d.label}</strong><br/>${(d.value ?? 0).toLocaleString()} bn${
          d.valueSecond !== undefined ? `<br/>of which: ${d.valueSecond.toLocaleString()} bn` : ""
        }`,
      // ~50 hubs spanning every continent: enough dot density that the cloud
      // itself sketches the world map (too few points reads as a scatter plot).
      dataSet: [
        // Americas
        { id: "usa", label: "United States", lng: -95.7, lat: 38.9, value: 100 },
        { id: "can", label: "Canada", lng: -75.7, lat: 45.4, value: 38 },
        { id: "mex", label: "Mexico", lng: -99.1, lat: 19.4, value: 34 },
        { id: "gtm", label: "Guatemala", lng: -90.5, lat: 14.6, value: 6 },
        { id: "col", label: "Colombia", lng: -74.1, lat: 4.7, value: 12 },
        { id: "ven", label: "Venezuela", lng: -66.9, lat: 10.5, value: 7 },
        { id: "per", label: "Peru", lng: -77.0, lat: -12.0, value: 10 },
        { id: "bra", label: "Brazil", lng: -47.9, lat: -15.8, value: 45 },
        { id: "arg", label: "Argentina", lng: -58.4, lat: -34.6, value: 17 },
        { id: "chl", label: "Chile", lng: -70.7, lat: -33.4, value: 14 },
        // Europe
        { id: "gbr", label: "United Kingdom", lng: -0.1, lat: 51.5, value: 55 },
        { id: "irl", label: "Ireland", lng: -6.3, lat: 53.3, value: 12 },
        { id: "prt", label: "Portugal", lng: -9.1, lat: 38.7, value: 8 },
        { id: "esp", label: "Spain", lng: -3.7, lat: 40.4, value: 30 },
        { id: "fra", label: "France", lng: 2.3, lat: 48.9, value: 50 },
        { id: "bel", label: "Belgium", lng: 4.4, lat: 50.8, value: 27 },
        { id: "nld", label: "Netherlands", lng: 4.9, lat: 52.4, value: 44 },
        { id: "che", label: "Switzerland", lng: 7.4, lat: 46.9, value: 24 },
        { id: "deu", label: "Germany", lng: 13.4, lat: 52.5, value: 60, valueSecond: 30 },
        { id: "ita", label: "Italy", lng: 12.5, lat: 41.9, value: 38 },
        { id: "nor", label: "Norway", lng: 10.7, lat: 59.9, value: 11 },
        { id: "swe", label: "Sweden", lng: 18.1, lat: 59.3, value: 15 },
        { id: "pol", label: "Poland", lng: 21.0, lat: 52.2, value: 21 },
        { id: "grc", label: "Greece", lng: 23.7, lat: 38.0, value: 6 },
        { id: "tur", label: "Turkey", lng: 32.9, lat: 39.9, value: 19 },
        // Africa
        { id: "mar", label: "Morocco", lng: -6.8, lat: 34.0, value: 8 },
        { id: "dza", label: "Algeria", lng: 3.0, lat: 36.8, value: 6 },
        { id: "egy", label: "Egypt", lng: 31.2, lat: 30.0, value: 9 },
        { id: "nga", label: "Nigeria", lng: 7.5, lat: 9.1, value: 10 },
        { id: "gha", label: "Ghana", lng: -0.2, lat: 5.6, value: 5 },
        { id: "civ", label: "Côte d'Ivoire", lng: -4.0, lat: 5.3, value: 4 },
        { id: "eth", label: "Ethiopia", lng: 38.7, lat: 9.0, value: 4 },
        { id: "ken", label: "Kenya", lng: 36.8, lat: -1.3, value: 10 },
        { id: "tza", label: "Tanzania", lng: 39.3, lat: -6.8, value: 4 },
        { id: "zaf", label: "South Africa", lng: 28.2, lat: -25.7, value: 15 },
        // Middle East + Central/South Asia
        { id: "sau", label: "Saudi Arabia", lng: 46.7, lat: 24.7, value: 22 },
        { id: "are", label: "United Arab Emirates", lng: 54.4, lat: 24.5, value: 29 },
        { id: "rus", label: "Russia", lng: 37.6, lat: 55.8, value: 24 },
        { id: "kaz", label: "Kazakhstan", lng: 71.4, lat: 51.2, value: 6 },
        { id: "pak", label: "Pakistan", lng: 73.0, lat: 33.7, value: 6 },
        { id: "ind", label: "India", lng: 77.2, lat: 28.6, value: 70, valueSecond: 50 },
        { id: "bgd", label: "Bangladesh", lng: 90.4, lat: 23.8, value: 9 },
        // East + Southeast Asia
        { id: "tha", label: "Thailand", lng: 100.5, lat: 13.8, value: 18 },
        { id: "vnm", label: "Vietnam", lng: 105.8, lat: 21.0, value: 20 },
        { id: "mys", label: "Malaysia", lng: 101.7, lat: 3.1, value: 21 },
        { id: "sgp", label: "Singapore", lng: 103.8, lat: 1.4, value: 33 },
        { id: "idn", label: "Indonesia", lng: 106.8, lat: -6.2, value: 19 },
        { id: "phl", label: "Philippines", lng: 121.0, lat: 14.6, value: 9 },
        { id: "chn", label: "China", lng: 116.4, lat: 39.9, value: 90 },
        { id: "kor", label: "South Korea", lng: 127.0, lat: 37.6, value: 40 },
        { id: "jpn", label: "Japan", lng: 139.7, lat: 35.7, value: 44 },
        // Oceania
        { id: "aus", label: "Australia", lng: 149.1, lat: -35.3, value: 25 },
        { id: "nzl", label: "New Zealand", lng: 174.8, lat: -41.3, value: 7 },
      ],
    },
  },
  {
    id: "symbol-map-with-backdrop",
    title: "Trade value by country with a muted backdrop",
    description:
      'The OPTIONAL `geography` backdrop (a new capability - the legacy chart never drew landmass) with `positionMode: "precise"`: every bubble sits at its exact projected lng/lat (overlaps allowed). When a landmass is visible, readers take positions literally, so the default force de-overlap - which drifts symbols off their true coordinates - is the wrong choice here. The atlas is a simplified public-domain demo file; review boundaries and names against your own cartographic policy before production use.',
    element: "michi-vz-symbol-map-chart",
    props: {
      title: "Trade value by country with a muted backdrop",
      geography: world,
      // Explicit overrides: the engine defaults (geographyColor #eef1f5, strokeColor
      // #d7dce3) read as near-invisible against this docs theme's stage background
      // (VitePress --vp-c-bg-soft ~ #f6f6f7) - a few steps darker than the default
      // keeps continents clearly visible behind the bubbles without competing with them.
      geographyColor: "#d2d7dd",
      strokeColor: "#aab3bf",
      positionMode: "precise",
      dataSet: [
        { id: "usa", label: "United States", lng: -95.7, lat: 38.9, value: 80 },
        { id: "can", label: "Canada", lng: -75.7, lat: 45.4, value: 25 },
        { id: "mex", label: "Mexico", lng: -99.1, lat: 19.4, value: 22 },
        { id: "bra", label: "Brazil", lng: -47.9, lat: -15.8, value: 35 },
        { id: "arg", label: "Argentina", lng: -58.4, lat: -34.6, value: 12 },
        { id: "gbr", label: "United Kingdom", lng: -0.1, lat: 51.5, value: 40 },
        { id: "deu", label: "Germany", lng: 13.4, lat: 52.5, value: 65 },
        { id: "esp", label: "Spain", lng: -3.7, lat: 40.4, value: 20 },
        { id: "tur", label: "Turkey", lng: 32.9, lat: 39.9, value: 14 },
        { id: "nga", label: "Nigeria", lng: 7.5, lat: 9.1, value: 9 },
        { id: "ken", label: "Kenya", lng: 36.8, lat: -1.3, value: 8 },
        { id: "zaf", label: "South Africa", lng: 28.2, lat: -25.7, value: 18 },
        { id: "sau", label: "Saudi Arabia", lng: 46.7, lat: 24.7, value: 16 },
        { id: "ind", label: "India", lng: 77.2, lat: 28.6, value: 50 },
        { id: "sgp", label: "Singapore", lng: 103.8, lat: 1.4, value: 24 },
        { id: "chn", label: "China", lng: 116.4, lat: 39.9, value: 90 },
        { id: "kor", label: "South Korea", lng: 127.0, lat: 37.6, value: 28 },
        { id: "jpn", label: "Japan", lng: 139.7, lat: 35.7, value: 32 },
        { id: "aus", label: "Australia", lng: 149.1, lat: -35.3, value: 15 },
      ],
    },
  },
  {
    id: "symbol-map-hex-tiles",
    title: "Regional index by country (hexagon tiles)",
    description:
      'Hexagon tiles on a honeycomb: `shape: "hexagon"` + `positionMode: "honeycomb"` gives every country an EQUAL tile snapped to a hex lattice (no overlaps, no size encoding), and `colorScale` carries the value as a classed colour. Items without a `value` paint `noDataColor` and never push a valued tile off its cell. `markers` adds a pin at a lng/lat above the tiles. Demo geography and demo numbers only.',
    element: "michi-vz-symbol-map-chart",
    props: {
      title: "Regional index by country (hexagon tiles)",
      geography: world,
      geographyColor: "#e9ecef",
      strokeColor: "#dfe3e8",
      projection: "geoNaturalEarth1",
      shape: "hexagon",
      positionMode: "honeycomb",
      honeycomb: { radius: 11, gap: 2 },
      showLabels: false,
      colorScale: {
        domain: [20, 40, 60, 80],
        range: ["#dbe9f6", "#9ecae1", "#4292c6", "#2171b5", "#08306b"],
      },
      noDataColor: "#e6e6e6",
      markers: [{ lng: 2.35, lat: 48.86, label: "Headquarters", color: "#b8860b" }],
      tooltipFormatter: (d) =>
        `<strong>${d.label}</strong><br/>${d.value === undefined ? "no data" : `index ${d.value}`}`,
      dataSet: [
        { id: "usa", label: "United States", lng: -95.7, lat: 38.9, value: 72 },
        { id: "can", label: "Canada", lng: -75.7, lat: 45.4, value: 64 },
        { id: "mex", label: "Mexico", lng: -99.1, lat: 19.4, value: 41 },
        { id: "gtm", label: "Guatemala", lng: -90.5, lat: 14.6, value: 18 },
        { id: "col", label: "Colombia", lng: -74.1, lat: 4.7, value: 33 },
        { id: "per", label: "Peru", lng: -77.0, lat: -12.0, value: 29 },
        { id: "bra", label: "Brazil", lng: -47.9, lat: -15.8, value: 55 },
        { id: "arg", label: "Argentina", lng: -58.4, lat: -34.6, value: 37 },
        { id: "chl", label: "Chile", lng: -70.7, lat: -33.4, value: 48 },
        { id: "gbr", label: "United Kingdom", lng: -0.1, lat: 51.5, value: 81 },
        { id: "irl", label: "Ireland", lng: -6.3, lat: 53.3, value: 77 },
        { id: "prt", label: "Portugal", lng: -9.1, lat: 38.7, value: 52 },
        { id: "esp", label: "Spain", lng: -3.7, lat: 40.4, value: 61 },
        { id: "fra", label: "France", lng: 2.4, lat: 48.9, value: 79 },
        { id: "bel", label: "Belgium", lng: 4.4, lat: 50.8, value: 74 },
        { id: "nld", label: "Netherlands", lng: 4.9, lat: 52.4, value: 88 },
        { id: "deu", label: "Germany", lng: 13.4, lat: 52.5, value: 85 },
        { id: "che", label: "Switzerland", lng: 7.4, lat: 46.9, value: 91 },
        { id: "ita", label: "Italy", lng: 12.5, lat: 41.9, value: 58 },
        { id: "pol", label: "Poland", lng: 21.0, lat: 52.2, value: 49 },
        { id: "swe", label: "Sweden", lng: 18.1, lat: 59.3, value: 83 },
        { id: "nor", label: "Norway", lng: 10.8, lat: 59.9, value: 86 },
        { id: "fin", label: "Finland", lng: 24.9, lat: 60.2, value: 80 },
        { id: "tur", label: "Turkey", lng: 32.9, lat: 39.9, value: 36 },
        { id: "mar", label: "Morocco", lng: -6.8, lat: 34.0, value: 27 },
        { id: "nga", label: "Nigeria", lng: 7.5, lat: 9.1, value: 22 },
        { id: "gha", label: "Ghana", lng: -0.2, lat: 5.6, value: 31 },
        { id: "eth", label: "Ethiopia", lng: 38.7, lat: 9.0 },
        { id: "ken", label: "Kenya", lng: 36.8, lat: -1.3, value: 34 },
        { id: "zaf", label: "South Africa", lng: 28.2, lat: -25.7, value: 44 },
        { id: "egy", label: "Egypt", lng: 31.2, lat: 30.0, value: 30 },
        { id: "sau", label: "Saudi Arabia", lng: 46.7, lat: 24.7, value: 57 },
        { id: "are", label: "United Arab Emirates", lng: 54.4, lat: 24.5, value: 76 },
        { id: "ind", label: "India", lng: 77.2, lat: 28.6, value: 39 },
        { id: "pak", label: "Pakistan", lng: 73.1, lat: 33.7 },
        { id: "bgd", label: "Bangladesh", lng: 90.4, lat: 23.8, value: 21 },
        { id: "tha", label: "Thailand", lng: 100.5, lat: 13.8, value: 46 },
        { id: "vnm", label: "Vietnam", lng: 105.8, lat: 21.0, value: 43 },
        { id: "sgp", label: "Singapore", lng: 103.8, lat: 1.4, value: 93 },
        { id: "idn", label: "Indonesia", lng: 106.8, lat: -6.2, value: 38 },
        { id: "chn", label: "China", lng: 116.4, lat: 39.9, value: 66 },
        { id: "kor", label: "South Korea", lng: 127.0, lat: 37.6, value: 84 },
        { id: "jpn", label: "Japan", lng: 139.7, lat: 35.7, value: 82 },
        { id: "aus", label: "Australia", lng: 149.1, lat: -35.3, value: 71 },
        { id: "nzl", label: "New Zealand", lng: 174.8, lat: -41.3, value: 69 },
        { id: "png", label: "Papua New Guinea", lng: 147.2, lat: -9.4 },
      ],
    },
  },
];

// RadialTreeChart's migration target is the legacy sdg-trade TreeRadial: a d3
// cluster() dendrogram, 2-level (4 sectors x 5 products) - group circles sized
// by the sector's total, leaf circles sized by each product's own value.
const radialTree: Example<RadialTreeChartProps>[] = [
  {
    id: "radial-tree-trade-by-sector",
    title: "Merchandise trade value by sector and product, 2024 (US$ bn)",
    description:
      "A radial cluster()/dendrogram (leaves equidistant from the centre, not a tree() layout): 4 sectors, 5 products each. Circles are sized at BOTH the sector level (the group's total) and the product level (its own value).",
    element: "michi-vz-radial-tree-chart",
    props: {
      title: "Merchandise trade value by sector and product, 2024 (US$ bn)",
      centerLabel: "Total Merchandise Trade",
      tooltipFormatter: (d) =>
        `<strong>${d.label}</strong><br/>${(d.value ?? 0).toLocaleString()} bn`,
      dataSet: [
        {
          label: "Agriculture",
          children: [
            { label: "Coffee", value: 8 },
            { label: "Tea", value: 5 },
            { label: "Cocoa", value: 6 },
            { label: "Cotton", value: 4 },
            { label: "Sugar", value: 7 },
          ],
        },
        {
          label: "Manufacturing",
          children: [
            { label: "Textiles", value: 22 },
            { label: "Machinery", value: 35 },
            { label: "Electronics", value: 48 },
            { label: "Vehicles", value: 30 },
            { label: "Furniture", value: 9 },
          ],
        },
        {
          label: "Minerals",
          children: [
            { label: "Crude oil", value: 60 },
            { label: "Natural gas", value: 25 },
            { label: "Copper", value: 14 },
            { label: "Gold", value: 18 },
            { label: "Coal", value: 10 },
          ],
        },
        {
          label: "Services",
          children: [
            { label: "Tourism", value: 27 },
            { label: "Transport", value: 16 },
            { label: "Finance", value: 20 },
            { label: "ICT", value: 24 },
            { label: "Logistics", value: 12 },
          ],
        },
      ],
    },
  },
  {
    id: "radial-tree-dense",
    title: "A denser tree - adaptive label density kicking in",
    description:
      "More leaves push the total past the rotateAbove threshold (default 20): labels abbreviate to 3 letters and rotate radially instead of staying horizontal.",
    element: "michi-vz-radial-tree-chart",
    props: {
      title: "A denser tree (adaptive label density)",
      dataSet: Array.from({ length: 5 }, (_, g) => ({
        label: `Group ${g + 1}`,
        children: Array.from({ length: 6 }, (_, l) => ({
          label: `Item ${g + 1}.${l + 1}`,
          value: (g + 1) * (l + 1),
        })),
      })),
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
  "comparable-vertical-bar-chart": comparableVertical,
  "dual-horizontal-bar-chart": dual,
  "bar-bell-chart": barBell,
  "range-chart": range,
  "ribbon-chart": ribbon,
  "radar-chart": radar,
  "fan-chart": fan,
  "treemap-chart": treemap,
  "pie-chart": pie,
  "gauge-chart": gauge,
  "bubble-chart": bubble,
  "sankey-chart": sankey,
  "fountain-chart": fountain,
  "choropleth-map-chart": choroplethMap,
  "symbol-map-chart": symbolMap,
  "radial-tree-chart": radialTree,
};

/** Ordered chart ids (for nav / iteration). */
export const chartIds = Object.keys(examples) as Array<keyof typeof examples>;

/** Flat list of every example (id is globally unique). */
export const allExamples: Example[] = Object.values(examples).flat() as unknown as Example[];
