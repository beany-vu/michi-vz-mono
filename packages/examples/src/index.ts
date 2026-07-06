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
  BubbleChartProps,
  SankeyChartProps,
  FountainChartProps,
  ChoroplethMapChartProps,
  SymbolMapChartProps,
  RadialTreeChartProps,
} from "@michi-vz/core";
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
    "id": "gap-basic",
    "title": "CO2 emissions per capita: 2010 vs 2023",
    "description": "Per-capita CO2 emissions (tonnes) for seven economies, with a connecting bar reading directly as the change between 2010 and 2023.",
    "element": "michi-vz-gap-chart",
    "props": {
      "title": "CO2 emissions per capita: 2010 vs 2023 (tonnes)",
      "xAxisDataType": "number",
      "shapeValue1": "circle",
      "shapeValue2": "triangle",
      // The chart's own shape legend (circle = 2010, triangle = 2023, bar = change)
      // renders under the plot; extra bottom margin gives it air.
      "showLegend": true,
      "interactiveRowLabels": true,
      "margin": { "top": 50, "right": 50, "bottom": 70, "left": 100 },
      "shapesLabelsMapping": {
        "value1": "2010",
        "value2": "2023",
        "gap": "Change"
      },
      "dataSet": [
        {
          "label": "United States",
          "code": "USA",
          "value1": 17.4,
          "value2": 14.3,
          "difference": 3.1,
          "date": "2023"
        },
        {
          "label": "Russia",
          "code": "RUS",
          "value1": 11.3,
          "value2": 11.4,
          "difference": -0.1,
          "date": "2023"
        },
        {
          "label": "Germany",
          "code": "DEU",
          "value1": 9.6,
          "value2": 7.8,
          "difference": 1.8,
          "date": "2023"
        },
        {
          "label": "China",
          "code": "CHN",
          "value1": 6.8,
          "value2": 8.9,
          "difference": -2.1,
          "date": "2023"
        },
        {
          "label": "United Kingdom",
          "code": "GBR",
          "value1": 7.6,
          "value2": 4.7,
          "difference": 2.9,
          "date": "2023"
        },
        {
          "label": "Indonesia",
          "code": "IDN",
          "value1": 1.8,
          "value2": 2.6,
          "difference": -0.8,
          "date": "2023"
        },
        {
          "label": "India",
          "code": "IND",
          "value1": 1.4,
          "value2": 2,
          "difference": -0.6,
          "date": "2023"
        }
      ]
    }
  }
];

const line: Example<LineChartProps>[] = [
  {
    "id": "line-renewable-share",
    "title": "Renewable electricity share, % of total",
    "description": "Renewable share of electricity generation for four economies, 2012-2024, with markers and hover.",
    "element": "michi-vz-line-chart",
    "props": {
      "title": "Renewable electricity share, % of total",
      "xAxisDataType": "date_annual",
      "showDataPoints": true,
      "dataSet": [
        {
          "label": "Germany",
          "color": "#1f9e57",
          "series": [
            {
              "date": 2012,
              "value": 23.5,
              "certainty": true
            },
            {
              "date": 2014,
              "value": 27.4,
              "certainty": true
            },
            {
              "date": 2016,
              "value": 31.6,
              "certainty": true
            },
            {
              "date": 2018,
              "value": 37,
              "certainty": true
            },
            {
              "date": 2020,
              "value": 43.6,
              "certainty": true
            },
            {
              "date": 2022,
              "value": 46.2,
              "certainty": true
            },
            {
              "date": 2024,
              "value": 52.5,
              "certainty": true
            }
          ]
        },
        {
          "label": "United Kingdom",
          "color": "#2c6fbb",
          "series": [
            {
              "date": 2012,
              "value": 11.3,
              "certainty": true
            },
            {
              "date": 2014,
              "value": 19.1,
              "certainty": true
            },
            {
              "date": 2016,
              "value": 24.5,
              "certainty": true
            },
            {
              "date": 2018,
              "value": 33,
              "certainty": true
            },
            {
              "date": 2020,
              "value": 43.1,
              "certainty": true
            },
            {
              "date": 2022,
              "value": 41.5,
              "certainty": true
            },
            {
              "date": 2024,
              "value": 46.8,
              "certainty": true
            }
          ]
        },
        {
          "label": "United States",
          "color": "#e4572e",
          "series": [
            {
              "date": 2012,
              "value": 12.2,
              "certainty": true
            },
            {
              "date": 2014,
              "value": 13,
              "certainty": true
            },
            {
              "date": 2016,
              "value": 14.8,
              "certainty": true
            },
            {
              "date": 2018,
              "value": 17,
              "certainty": true
            },
            {
              "date": 2020,
              "value": 19.8,
              "certainty": true
            },
            {
              "date": 2022,
              "value": 21.5,
              "certainty": true
            },
            {
              "date": 2024,
              "value": 23.4,
              "certainty": true
            }
          ]
        },
        {
          "label": "India",
          "color": "#f2a900",
          "series": [
            {
              "date": 2012,
              "value": 15.6,
              "certainty": true
            },
            {
              "date": 2014,
              "value": 16.4,
              "certainty": true
            },
            {
              "date": 2016,
              "value": 17.5,
              "certainty": true
            },
            {
              "date": 2018,
              "value": 19,
              "certainty": true
            },
            {
              "date": 2020,
              "value": 20.1,
              "certainty": true
            },
            {
              "date": 2022,
              "value": 21.6,
              "certainty": true
            },
            {
              "date": 2024,
              "value": 23.9,
              "certainty": true
            }
          ]
        }
      ]
    }
  },
  {
    "id": "line-gaps",
    "title": "Solar generation, TWh (with a reporting gap)",
    "description": "Brazil skips its 2021-2022 reporting; detectGaps auto-dashes the unreported span while Spain stays solid.",
    "element": "michi-vz-line-chart",
    "props": {
      "title": "Solar generation, TWh (with a reporting gap)",
      "xAxisDataType": "date_annual",
      "showDataPoints": true,
      "detectGaps": true,
      "dataSet": [
        {
          "label": "Spain",
          "color": "#e4572e",
          "series": [
            { "date": 2018, "value": 14, "certainty": true },
            { "date": 2019, "value": 16, "certainty": true },
            { "date": 2020, "value": 18, "certainty": true },
            { "date": 2021, "value": 21, "certainty": true },
            { "date": 2022, "value": 28, "certainty": true },
            { "date": 2023, "value": 36, "certainty": true },
            { "date": 2024, "value": 45, "certainty": true }
          ]
        },
        {
          "label": "Brazil",
          "color": "#1f9e57",
          "series": [
            { "date": 2018, "value": 5, "certainty": true },
            { "date": 2019, "value": 8, "certainty": true },
            { "date": 2020, "value": 11, "certainty": true },
            { "date": 2023, "value": 30, "certainty": true },
            { "date": 2024, "value": 42, "certainty": true }
          ]
        }
      ]
    }
  }
];

const area: Example<AreaChartProps>[] = [
  {
    "id": "area-stacked",
    "title": "Electricity generation by source",
    "description": "Stacked annual generation (TWh) by source, 2014-2023: coal declines as wind and solar rise.",
    "element": "michi-vz-area-chart",
    "props": {
      "title": "Electricity generation by source, TWh",
      "xAxisDataType": "date_annual",
      "keys": [
        "Coal",
        "Natural gas",
        "Nuclear",
        "Wind",
        "Solar"
      ],
      "series": [
        {
          "date": 2014,
          "Coal": 1582,
          "Natural gas": 1126,
          "Nuclear": 797,
          "Wind": 182,
          "Solar": 28
        },
        {
          "date": 2015,
          "Coal": 1471,
          "Natural gas": 1335,
          "Nuclear": 797,
          "Wind": 191,
          "Solar": 39
        },
        {
          "date": 2016,
          "Coal": 1240,
          "Natural gas": 1380,
          "Nuclear": 805,
          "Wind": 227,
          "Solar": 54
        },
        {
          "date": 2017,
          "Coal": 1206,
          "Natural gas": 1297,
          "Nuclear": 805,
          "Wind": 254,
          "Solar": 78
        },
        {
          "date": 2018,
          "Coal": 1146,
          "Natural gas": 1468,
          "Nuclear": 807,
          "Wind": 275,
          "Solar": 96
        },
        {
          "date": 2019,
          "Coal": 966,
          "Natural gas": 1582,
          "Nuclear": 809,
          "Wind": 295,
          "Solar": 108
        },
        {
          "date": 2020,
          "Coal": 774,
          "Natural gas": 1617,
          "Nuclear": 790,
          "Wind": 338,
          "Solar": 134
        },
        {
          "date": 2021,
          "Coal": 898,
          "Natural gas": 1580,
          "Nuclear": 778,
          "Wind": 380,
          "Solar": 164
        },
        {
          "date": 2022,
          "Coal": 828,
          "Natural gas": 1689,
          "Nuclear": 772,
          "Wind": 435,
          "Solar": 205
        },
        {
          "date": 2023,
          "Coal": 675,
          "Natural gas": 1802,
          "Nuclear": 775,
          "Wind": 425,
          "Solar": 238
        }
      ]
    }
  }
];

const scatter: Example<ScatterChartProps>[] = [
  {
    "id": "scatter-gapminder",
    "title": "GDP per capita vs life expectancy, 2021",
    "description": "Gapminder bubble scatter: x = GDP per capita (USD), y = life expectancy (years), bubble size = population. Strong positive correlation surfaced in getContext().",
    "element": "michi-vz-scatter-chart",
    "props": {
      "title": "GDP per capita vs life expectancy, 2021",
      "xAxisDataType": "number",
      "xAxisDomain": [
        0,
        75000
      ],
      "yAxisDomain": [
        60,
        86
      ],
      "sizeRange": [
        5,
        22
      ],
      "dataSet": [
        {
          "label": "Ethiopia",
          "x": 925,
          "y": 65,
          "d": 120,
          "color": "#7F3C8D"
        },
        {
          "label": "Nigeria",
          "x": 2065,
          "y": 62.6,
          "d": 213,
          "color": "#11A579"
        },
        {
          "label": "India",
          "x": 2257,
          "y": 67.2,
          "d": 1408,
          "color": "#3969AC"
        },
        {
          "label": "Indonesia",
          "x": 4333,
          "y": 67.6,
          "d": 274,
          "color": "#F2B701"
        },
        {
          "label": "Brazil",
          "x": 7507,
          "y": 72.8,
          "d": 214,
          "color": "#E73F74"
        },
        {
          "label": "China",
          "x": 12556,
          "y": 78.2,
          "d": 1412,
          "color": "#80BA5A"
        },
        {
          "label": "Germany",
          "x": 51204,
          "y": 80.6,
          "d": 83,
          "color": "#E68310"
        },
        {
          "label": "United States",
          "x": 70249,
          "y": 76.3,
          "d": 332,
          "color": "#008695"
        },
        {
          "label": "Japan",
          "x": 39813,
          "y": 84.5,
          "d": 125,
          "color": "#CF1C90"
        }
      ]
    }
  }
];

const verticalStackBar: Example<VerticalStackBarChartProps>[] = [
  {
    "id": "vsb-employment-sector",
    "title": "Employment by sector, % of total (World)",
    "description": "One bar per year, each split into the three economic sectors that sum to 100% - the share of the workforce in agriculture falls as services rises.",
    "element": "michi-vz-vertical-stack-bar-chart",
    "props": {
      "title": "Employment by sector, % of total (World)",
      "keys": [
        "Agriculture",
        "Industry",
        "Services"
      ],
      "keysOrder": "bottomToTop",
      "yAxisDomain": [
        0,
        100
      ],
      "dataSet": [
        {
          "seriesKey": "World",
          "seriesKeyAbbreviation": "",
          "series": [
            {
              "date": "2000",
              "Agriculture": 40,
              "Industry": 21,
              "Services": 39
            },
            {
              "date": "2005",
              "Agriculture": 37,
              "Industry": 22,
              "Services": 41
            },
            {
              "date": "2010",
              "Agriculture": 33,
              "Industry": 23,
              "Services": 44
            },
            {
              "date": "2015",
              "Agriculture": 29,
              "Industry": 23,
              "Services": 48
            },
            {
              "date": "2020",
              "Agriculture": 27,
              "Industry": 23,
              "Services": 50
            },
            {
              "date": "2023",
              "Agriculture": 25,
              "Industry": 23,
              "Services": 52
            }
          ]
        }
      ]
    }
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
    "id": "comparable-basic",
    "title": "Merchandise exports: 2019 vs 2024",
    "description": "Per-country export value with two overlaid sub-bars (2019 baseline vs 2024), showing which economies grew and which slipped.",
    "element": "michi-vz-comparable-horizontal-bar-chart",
    "props": {
      "title": "Merchandise exports: 2019 vs 2024, US$ bn",
      // Name the two sub-bars what they ARE (2019/2024) so the tooltip matches the
      // page legend instead of the generic Based/Compared wording.
      "tooltipFormatter": (d) =>
        `<strong>${d.label}</strong><br/>2019: ${d.valueBased.toLocaleString()} bn<br/>2024: ${d.valueCompared.toLocaleString()} bn`,
      "interactiveRowLabels": true,
      "valueBasedOpacity": 1,
      "valueComparedOpacity": 1,
      "colorsBasedMapping": {
        "China": "#e9bab5",
        "United States": "#b5cde7",
        "Germany": "#c6c9cd",
        "Japan": "#f4d1ba",
        "India": "#b6d6c4",
        "Russia": "#d7bee2",
        "Vietnam": "#addfd4"
      },
      "dataSet": [
        {
          "label": "China",
          "valueBased": 2499,
          "valueCompared": 3380,
          "color": "#c0392b"
        },
        {
          "label": "United States",
          "valueBased": 1645,
          "valueCompared": 2065,
          "color": "#2c6fbb"
        },
        {
          "label": "Germany",
          "valueBased": 1489,
          "valueCompared": 1697,
          "color": "#5b6470"
        },
        {
          "label": "Japan",
          "valueBased": 706,
          "valueCompared": 707,
          "color": "#e07b39"
        },
        {
          "label": "India",
          "valueBased": 324,
          "valueCompared": 437,
          "color": "#2e8b57"
        },
        {
          "label": "Russia",
          "valueBased": 419,
          "valueCompared": 425,
          "color": "#8e44ad"
        },
        {
          "label": "Vietnam",
          "valueBased": 264,
          "valueCompared": 405,
          "color": "#16a085"
        }
      ]
    }
  }
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
];

const dual: Example<DualBarChartProps>[] = [
  {
    "id": "dual-population-pyramid",
    "title": "Population by age band: male vs female, Japan 2023",
    "description": "Diverging tornado / population pyramid: male population grows right (value1), female grows left (value2) from a shared centre line, one 10-year age band per row.",
    "element": "michi-vz-dual-horizontal-bar-chart",
    "props": {
      "title": "Population by age band: male vs female, Japan 2023 (millions)",
      // Age-band labels in the left margin, clear of the left-extending bars.
      "yAxisPosition": "left",
      // Hover or focus a label: leader line + row tooltip; click pins.
      "interactiveRowLabels": true,
      "dataSet": [
        {
          "label": "0-9 years",
          "value1": 4.8,
          "value2": 4.6,
          "color": "#3F7CAC"
        },
        {
          "label": "10-19 years",
          "value1": 5.5,
          "value2": 5.2,
          "color": "#3F7CAC"
        },
        {
          "label": "20-34 years",
          "value1": 9.7,
          "value2": 9.3,
          "color": "#3F7CAC"
        },
        {
          "label": "35-49 years",
          "value1": 12.4,
          "value2": 12,
          "color": "#3F7CAC"
        },
        {
          "label": "50-64 years",
          "value1": 11.9,
          "value2": 12.1,
          "color": "#3F7CAC"
        },
        {
          "label": "65-79 years",
          "value1": 9.6,
          "value2": 11.2,
          "color": "#3F7CAC"
        },
        {
          "label": "80+ years",
          "value1": 3.7,
          "value2": 6.5,
          "color": "#3F7CAC"
        }
      ]
    }
  }
];

const barBell: Example<BarBellChartProps>[] = [
  {
    "id": "barbell-basic",
    "title": "Cumulative installed solar PV capacity by region, GW",
    "description": "Per-year cumulative horizontal segments (one region per colour) with end-cap circles, showing how global solar capacity stacked up region-by-region.",
    "element": "michi-vz-bar-bell-chart",
    "props": {
      "title": "Cumulative installed solar PV capacity by region, GW",
      "xAxisPosition": "bottom",
      "keys": [
        "Asia-Pacific",
        "Europe",
        "North America"
      ],
      "colorsMapping": {
        "Asia-Pacific": "#d62728",
        "Europe": "#2ca02c",
        "North America": "#1f77b4"
      },
      "dataSet": [
        {
          "date": "2018",
          "Asia-Pacific": 295,
          "Europe": 122,
          "North America": 58
        },
        {
          "date": "2020",
          "Asia-Pacific": 430,
          "Europe": 165,
          "North America": 84
        },
        {
          "date": "2022",
          "Asia-Pacific": 615,
          "Europe": 210,
          "North America": 118
        },
        {
          "date": "2024",
          "Asia-Pacific": 870,
          "Europe": 268,
          "North America": 162
        }
      ]
    }
  }
];

const range: Example<RangeChartProps>[] = [
  {
    "id": "range-gdp-forecast",
    "title": "GDP growth forecast range, %",
    "description": "Per-economy GDP growth forecast bands (low-high), 2024-2028, with the central projection down the middle.",
    "element": "michi-vz-range-chart",
    "props": {
      "title": "GDP growth forecast range by economy, % per year",
      "xAxisDataType": "date_annual",
      "fillOpacity": 0.55,
      "dataSet": [
        {
          "label": "India",
          "color": "#2563eb",
          "series": [
            {
              "date": 2024,
              "valueMin": 6.2,
              "valueMax": 7,
              "valueMedium": 6.6,
              "certainty": true
            },
            {
              "date": 2025,
              "valueMin": 5.8,
              "valueMax": 7.2,
              "valueMedium": 6.5,
              "certainty": true
            },
            {
              "date": 2026,
              "valueMin": 5.3,
              "valueMax": 7.5,
              "valueMedium": 6.4,
              "certainty": true
            },
            {
              "date": 2027,
              "valueMin": 4.9,
              "valueMax": 7.7,
              "valueMedium": 6.3,
              "certainty": true
            },
            {
              "date": 2028,
              "valueMin": 4.5,
              "valueMax": 7.9,
              "valueMedium": 6.2,
              "certainty": true
            }
          ]
        },
        {
          "label": "United States",
          "color": "#16a34a",
          "series": [
            {
              "date": 2024,
              "valueMin": 2.3,
              "valueMax": 2.9,
              "valueMedium": 2.6,
              "certainty": true
            },
            {
              "date": 2025,
              "valueMin": 1.5,
              "valueMax": 2.9,
              "valueMedium": 2.2,
              "certainty": true
            },
            {
              "date": 2026,
              "valueMin": 1,
              "valueMax": 3,
              "valueMedium": 2,
              "certainty": true
            },
            {
              "date": 2027,
              "valueMin": 0.6,
              "valueMax": 3.2,
              "valueMedium": 1.9,
              "certainty": true
            },
            {
              "date": 2028,
              "valueMin": 0.3,
              "valueMax": 3.3,
              "valueMedium": 1.8,
              "certainty": true
            }
          ]
        },
        {
          "label": "Germany",
          "color": "#dc2626",
          "series": [
            {
              "date": 2024,
              "valueMin": -0.2,
              "valueMax": 0.8,
              "valueMedium": 0.3,
              "certainty": true
            },
            {
              "date": 2025,
              "valueMin": 0.2,
              "valueMax": 1.6,
              "valueMedium": 0.9,
              "certainty": true
            },
            {
              "date": 2026,
              "valueMin": 0.4,
              "valueMax": 2.2,
              "valueMedium": 1.3,
              "certainty": true
            },
            {
              "date": 2027,
              "valueMin": 0.5,
              "valueMax": 2.5,
              "valueMedium": 1.5,
              "certainty": true
            },
            {
              "date": 2028,
              "valueMin": 0.5,
              "valueMax": 2.7,
              "valueMedium": 1.6,
              "certainty": true
            }
          ]
        }
      ]
    }
  },
  {
    "id": "range-temperature-cities",
    "title": "Daily temperature range by city, °C",
    "description": "Monthly record-low to record-high temperature bands for two cities, with the long-run average down the middle.",
    "element": "michi-vz-range-chart",
    "props": {
      "title": "Daily temperature range by city, °C",
      "xAxisDataType": "date_annual",
      "fillOpacity": 0.5,
      "yAxisDomain": [
        -10,
        45
      ],
      "dataSet": [
        {
          "label": "Cairo",
          "color": "#ea580c",
          "series": [
            {
              "date": 1,
              "valueMin": 9,
              "valueMax": 19,
              "valueMedium": 14,
              "certainty": true
            },
            {
              "date": 4,
              "valueMin": 14,
              "valueMax": 28,
              "valueMedium": 21,
              "certainty": true
            },
            {
              "date": 7,
              "valueMin": 22,
              "valueMax": 36,
              "valueMedium": 29,
              "certainty": true
            },
            {
              "date": 10,
              "valueMin": 18,
              "valueMax": 30,
              "valueMedium": 24,
              "certainty": true
            }
          ]
        },
        {
          "label": "Oslo",
          "color": "#0891b2",
          "series": [
            {
              "date": 1,
              "valueMin": -7,
              "valueMax": 0,
              "valueMedium": -3.5,
              "certainty": true
            },
            {
              "date": 4,
              "valueMin": 0,
              "valueMax": 10,
              "valueMedium": 5,
              "certainty": true
            },
            {
              "date": 7,
              "valueMin": 13,
              "valueMax": 23,
              "valueMedium": 18,
              "certainty": true
            },
            {
              "date": 10,
              "valueMin": 3,
              "valueMax": 11,
              "valueMedium": 7,
              "certainty": true
            }
          ]
        }
      ]
    }
  }
];

const ribbon: Example<RibbonChartProps>[] = [
  {
    "id": "ribbon-basic",
    "title": "US recorded music revenue by format, % of total",
    "description": "Stacked columns per year re-ranked by value and linked by crossing ribbons: downloads overtake the CD, streaming overtakes everything, and vinyl climbs back past the CD.",
    "element": "michi-vz-ribbon-chart",
    "props": {
      "title": "US recorded music revenue by format, % of total (2008-2023)",
      "keys": [
        "CD",
        "Downloads",
        "Streaming",
        "Vinyl"
      ],
      "series": [
        {
          "date": "2008",
          "CD": 62,
          "Downloads": 30,
          "Streaming": 4,
          "Vinyl": 1
        },
        {
          "date": "2012",
          "CD": 37,
          "Downloads": 41,
          "Streaming": 15,
          "Vinyl": 2
        },
        {
          "date": "2016",
          "CD": 17,
          "Downloads": 24,
          "Streaming": 51,
          "Vinyl": 5
        },
        {
          "date": "2020",
          "CD": 4,
          "Downloads": 6,
          "Streaming": 83,
          "Vinyl": 5.5
        },
        {
          "date": "2023",
          "CD": 6,
          "Downloads": 3,
          "Streaming": 84,
          "Vinyl": 8
        }
      ],
      "colorsMapping": {
        "CD": "#5D5D5D",
        "Downloads": "#2A6F97",
        "Streaming": "#4CB944",
        "Vinyl": "#D7263D"
      }
    }
  },
  {
    "id": "ribbon-smartphone-share",
    "title": "Global smartphone shipments share, %",
    "description": "Four brands' share of worldwide smartphone shipments across five years, with ribbons flowing as Samsung and Apple stay near the top while Chinese brands re-rank.",
    "element": "michi-vz-ribbon-chart",
    "props": {
      "title": "Global smartphone shipments share, % (2019-2023)",
      "keys": [
        "Samsung",
        "Apple",
        "Xiaomi",
        "Others"
      ],
      "series": [
        {
          "date": "2019",
          "Samsung": 21.6,
          "Apple": 13.9,
          "Xiaomi": 9.2,
          "Others": 55.3
        },
        {
          "date": "2020",
          "Samsung": 19.5,
          "Apple": 15.9,
          "Xiaomi": 11.4,
          "Others": 53.2
        },
        {
          "date": "2021",
          "Samsung": 20.1,
          "Apple": 17.4,
          "Xiaomi": 14.1,
          "Others": 48.4
        },
        {
          "date": "2022",
          "Samsung": 21.7,
          "Apple": 18.8,
          "Xiaomi": 12.7,
          "Others": 46.8
        },
        {
          "date": "2023",
          "Samsung": 19.4,
          "Apple": 20.1,
          "Xiaomi": 12.5,
          "Others": 48
        }
      ],
      "colorsMapping": {
        "Samsung": "#1B6CA8",
        "Apple": "#5D5D5D",
        "Xiaomi": "#D7263D",
        "Others": "#B0B0B0"
      }
    }
  }
];

const radar: Example<RadarChartProps>[] = [
  {
    "id": "radar-basic",
    "title": "City liveability profile (0-100)",
    "description": "Three cities compared across six liveability dimensions; one polygon per city.",
    "element": "michi-vz-radar-chart",
    "props": {
      "title": "City liveability profile, index 0-100",
      "axes": [
        "Healthcare",
        "Education",
        "Cost of living",
        "Safety",
        "Environment",
        "Culture"
      ],
      "maxValue": 100,
      "fillOpacity": 0.2,
      "series": [
        {
          "label": "Vienna",
          "color": "#1f77b4",
          "values": [
            90,
            85,
            58,
            88,
            80,
            92
          ]
        },
        {
          "label": "Singapore",
          "color": "#d62728",
          "values": [
            88,
            90,
            42,
            95,
            66,
            74
          ]
        },
        {
          "label": "Lisbon",
          "color": "#2ca02c",
          "values": [
            72,
            70,
            78,
            79,
            84,
            86
          ]
        }
      ]
    }
  }
];

const fan: Example<FanChartProps>[] = [
  {
    "id": "fan-revenue-forecast",
    "title": "Revenue forecast with an 80/95% confidence fan",
    "description": "Seven years of revenue (solid) continued by a dashed forecast median, wrapped in nested 80% and 95% confidence bands that widen with the horizon - the canonical forecast 'fan', composed from the Line + Range primitives.",
    "element": "michi-vz-fan-chart",
    "props": {
      "title": "Revenue forecast, US$ m (Holt-Winters, 80/95% fan)",
      "xAxisDataType": "date_annual",
      "fillOpacity": 0.22,
      "dataSet": [
        {
          "label": "Revenue",
          "color": "#2563eb",
          "series": [
            { "date": 2017, "value": 42, "certainty": true },
            { "date": 2018, "value": 55, "certainty": true },
            { "date": 2019, "value": 63, "certainty": true },
            { "date": 2020, "value": 71, "certainty": true },
            { "date": 2021, "value": 88, "certainty": true },
            { "date": 2022, "value": 104, "certainty": true },
            { "date": 2023, "value": 121, "certainty": true },
            { "date": 2024, "value": 138, "certainty": false },
            { "date": 2025, "value": 155, "certainty": false },
            { "date": 2026, "value": 172, "certainty": false },
            { "date": 2027, "value": 189, "certainty": false }
          ],
          "bands": [
            {
              "level": 0.95,
              "series": [
                { "date": 2023, "valueMin": 121, "valueMax": 121, "valueMedium": 121 },
                { "date": 2024, "valueMin": 126, "valueMax": 150, "valueMedium": 138 },
                { "date": 2025, "valueMin": 135, "valueMax": 175, "valueMedium": 155 },
                { "date": 2026, "valueMin": 142, "valueMax": 202, "valueMedium": 172 },
                { "date": 2027, "valueMin": 148, "valueMax": 230, "valueMedium": 189 }
              ]
            },
            {
              "level": 0.8,
              "series": [
                { "date": 2023, "valueMin": 121, "valueMax": 121, "valueMedium": 121 },
                { "date": 2024, "valueMin": 131, "valueMax": 145, "valueMedium": 138 },
                { "date": 2025, "valueMin": 143, "valueMax": 167, "valueMedium": 155 },
                { "date": 2026, "valueMin": 154, "valueMax": 190, "valueMedium": 172 },
                { "date": 2027, "valueMin": 165, "valueMax": 213, "valueMedium": 189 }
              ]
            }
          ]
        }
      ]
    }
  }
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
      "A flat list: one tile per product, each sized by its total export potential and coloured individually, with the realized/untapped split inside. On a narrow screen, layout:\"auto\" falls back to a single-column stack.",
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
      "The same shares as a donut: set innerRadiusRatio to carve out the hole. The mode flips to \"donut\" in the chart context, but the data and slices are identical.",
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
];

const fountain: Example<FountainChartProps>[] = [
  {
    id: "fountain-saas",
    title: "SaaS: revenue booked vs revenue leaking",
    description:
      "Read the spike to know how big the book of business is; read the spray as a flag for how much is quietly bleeding out to churn, downgrades and refunds (the gross-to-net retention gap). The exact leak is on the tooltip - the plume is the attention-getter, not the ruler. SMB books less and leaks more.",
    element: "michi-vz-fountain-chart",
    props: {
      title: "Recurring revenue booked ($M), spray = at-risk / leaking (gross-to-net gap)",
      xAxisDataType: "band",
      dataSet: [
        { label: "Enterprise", value: 118, spread: 4, density: 0.2 },
        { label: "Mid-market", value: 106, spread: 11, density: 0.5 },
        { label: "SMB", value: 97, spread: 21, density: 0.9, color: "#D4AF37" },
      ],
    },
  },
  {
    id: "fountain-retail",
    title: "Retail: sales secured vs shrink eroding margin",
    description:
      "Three stores post near-identical sales (near-identical spikes), but the fat, dense plume on Store C flags where to send loss-prevention first. Shrink (theft + spoilage) norm is ~1.6% of sales; over 2% is an alert. The plume flags it; the % lives on the label.",
    element: "michi-vz-fountain-chart",
    props: {
      title: "Net sales ($M), spray = shrink as a share of sales (theft + spoilage)",
      xAxisDataType: "band",
      dataSet: [
        { label: "Store A", value: 4.2, spread: 0.06, density: 0.2 },
        { label: "Store B", value: 4.0, spread: 0.07, density: 0.3 },
        { label: "Store C", value: 4.1, spread: 0.13, density: 0.9, color: "#D4AF37" },
      ],
    },
  },
  {
    id: "fountain-water",
    title: "Water utility: delivered vs non-revenue water",
    description:
      "Volume delivered keeps climbing (rising spikes), but the widening plume warns that more of it never gets billed - leaks and unmetered use outpacing growth. Under 10% is good, 10-20% normal, over 20% act (US average ~19.5%). Trend mode, a few periods so each plume can breathe.",
    element: "michi-vz-fountain-chart",
    props: {
      title: "Treated water delivered (million m3), spray = non-revenue water (losses)",
      xAxisDataType: "date_annual",
      dataSet: [
        { label: "NRW", date: "2021", value: 52, spread: 5, density: 0.4 },
        { label: "NRW", date: "2022", value: 55, spread: 7, density: 0.5 },
        { label: "NRW", date: "2023", value: 58, spread: 10, density: 0.7 },
        { label: "NRW", date: "2024", value: 61, spread: 13, density: 0.9, color: "#D4AF37" },
      ],
    },
  },
  {
    id: "fountain-forecast",
    title: "Forecast: a number that is high but shaky",
    description:
      "The trend rises, but the forecast spikes fray into froth: the same apex with a far wider, dashed plume says growth is projected, but the confidence behind it is thinning fast. A deliberate don't-trust-this-to-the-decimal signal - for precise bands, the Fan chart is the right tool.",
    element: "michi-vz-fountain-chart",
    props: {
      title: "Projected MRR ($K), spray = forecast spread (P10-P90); dashed = forecast",
      xAxisDataType: "date_annual",
      dataSet: [
        { label: "MRR", date: "2023", value: 63, spread: 6, density: 0.3 },
        { label: "MRR", date: "2024", value: 70, spread: 8, density: 0.4 },
        { label: "MRR", date: "2025", value: 78, spread: 16, density: 0.8, predicted: true },
        { label: "MRR", date: "2026", value: 85, spread: 26, density: 1, predicted: true },
      ],
    },
  },
  {
    id: "fountain-story",
    title: "Open source: the stars you see, the maintainers you don't",
    description:
      "The hook the chart was built for. The spike is what everyone sees and stars; the spray is the invisible contributors and unpaid maintainers the project actually rests on. Similar fame (spikes), very different foundations (sprays). Storytelling, not measurement.",
    element: "michi-vz-fountain-chart",
    props: {
      title: "GitHub stars (k) - spray = the contributors & maintainers holding it up",
      xAxisDataType: "band",
      dataSet: [
        { label: "React", value: 230, spread: 85, density: 0.9 },
        { label: "Vue", value: 208, spread: 55, density: 0.6 },
        { label: "Svelte", value: 82, spread: 40, density: 0.7, color: "#D4AF37" },
      ],
    },
  },
  {
    id: "fountain-plume",
    title: "Alternative symmetric 'plume' silhouette",
    description:
      "The same idea in the optional symmetric style (style: \"plume\"): a column blooming into a feathery crown instead of the asymmetric Jet d'Eau blade. Cleaner for a single KPI hero where the spread reads as a confidence halo.",
    element: "michi-vz-fountain-chart",
    props: {
      title: "Quarterly revenue ($M) with confidence halo - plume style",
      xAxisDataType: "band",
      style: "plume",
      dataSet: [
        { label: "Q1", value: 42, spread: 6, density: 6 },
        { label: "Q2", value: 55, spread: 9, density: 7 },
        { label: "Q3", value: 61, spread: 12, density: 8 },
        { label: "Q4", value: 78, spread: 20, density: 9, color: "#D4AF37" },
      ],
    },
  },
  {
    id: "fountain-certainty",
    title: "Same number, three certainties",
    description:
      "Three teams estimate the same launch date: 72 days. Identical apexes, so a bar chart would show three identical bars. The plume is what separates them: Team A has measured every task (tight crown), Team C is guessing (wide froth). The plume is a flag that the 72 is soft; the exact range (say 72 plus or minus 20) belongs on the tooltip. For real confidence intervals, use the Fan chart.",
    element: "michi-vz-fountain-chart",
    props: {
      title: "Estimated days to launch, spray = how sure each team is",
      xAxisDataType: "band",
      style: "plume",
      showDroplets: false,
      showMist: false,
      bloomExponent: 1.8,
      dataSet: [
        { label: "Team A", value: 72, spread: 3, density: 0.2 },
        { label: "Team B", value: 72, spread: 9, density: 0.5 },
        { label: "Team C", value: 72, spread: 20, density: 0.9, color: "#D4AF37" },
      ],
    },
  },
  {
    id: "fountain-latency",
    title: "Stable or shaky: the 2x2 a bar chart cannot show",
    description:
      "Four services, two latency levels, and the plume splits each pair: Checkout and Search both average 120 ms, but Search swings wildly under load; Auth and Cart both average 60 ms, but Cart spikes. Lower apex is better here, and the tight crown is the one you can put an SLO on. The p95 figure lives on the tooltip; the froth just tells you where to look first. The same read works for profit vs volatility, or any level-times-stability pair.",
    element: "michi-vz-fountain-chart",
    props: {
      title: "Median latency (ms), spray = variability under load (p95 gap)",
      xAxisDataType: "band",
      style: "plume",
      showDroplets: false,
      showMist: false,
      bloomExponent: 1.8,
      dataSet: [
        { label: "Checkout", value: 120, spread: 6, density: 0.2 },
        { label: "Search", value: 120, spread: 45, density: 0.9, color: "#D4AF37" },
        { label: "Auth", value: 60, spread: 4, density: 0.2 },
        { label: "Cart", value: 60, spread: 30, density: 0.8 },
      ],
    },
  },
  {
    id: "fountain-risk",
    title: "Expected loss vs the worst case",
    description:
      "Each apex is the expected loss on a position; the crown reaches toward the stress-test worst case (value plus spread, the upperBound in getContext()). Positions B and D expect the same loss, but D's plume flags a far heavier tail. Read the exact worst-case number off the tooltip, never off the plume width; the froth only tells you which position deserves the second look.",
    element: "michi-vz-fountain-chart",
    props: {
      title: "Expected loss ($M), spray reaches toward the stress-case loss",
      xAxisDataType: "band",
      style: "plume",
      showDroplets: false,
      showMist: false,
      bloomExponent: 1.8,
      dataSet: [
        { label: "Position A", value: 4, spread: 1.5, density: 0.3 },
        { label: "Position B", value: 10, spread: 2, density: 0.3 },
        { label: "Position C", value: 5, spread: 6, density: 0.7 },
        { label: "Position D", value: 10, spread: 9, density: 0.9, color: "#D4AF37" },
      ],
    },
  },
  {
    id: "fountain-ai",
    title: "AI answers: confident or guessing",
    description:
      "Three model answers with their scores. The apex is the score; the plume is the model's own uncertainty, normalised into score units so both share the y-axis. The 0.92 with a tight crown is safe to automate; the 0.28 fraying into froth is a hand-off to a human. Pairs naturally with the insights layer, which reads the same spreadRatio out of getContext() to narrate which answers to trust.",
    element: "michi-vz-fountain-chart",
    props: {
      title: "Answer score (0 to 1), spray = model uncertainty in score units",
      xAxisDataType: "band",
      style: "plume",
      showDroplets: false,
      showMist: false,
      bloomExponent: 1.8,
      yAxisDomain: [0, 1.2],
      dataSet: [
        { label: "Answer 1", value: 0.92, spread: 0.04, density: 0.2 },
        { label: "Answer 2", value: 0.62, spread: 0.15, density: 0.5 },
        { label: "Answer 3", value: 0.28, spread: 0.3, density: 0.9, color: "#D4AF37" },
      ],
    },
  },
  {
    id: "fountain-attention",
    title: "Same average, divided audience",
    description:
      "Two articles average the same 5.5 minutes of engagement. Article A holds everyone for about that long (tight crown); Article B splits its readers between skimmers who bounce and devourers who finish (wide froth). The average hides that division; the plume flags it. The per-decile numbers belong on the tooltip, and the flag is the cue to segment before drawing conclusions.",
    element: "michi-vz-fountain-chart",
    props: {
      title: "Average engagement (minutes), spray = variation across readers",
      xAxisDataType: "band",
      style: "plume",
      showDroplets: false,
      showMist: false,
      bloomExponent: 1.8,
      dataSet: [
        { label: "Article A", value: 5.5, spread: 0.5, density: 0.2 },
        { label: "Article B", value: 5.5, spread: 3, density: 0.9, color: "#D4AF37" },
        { label: "Video A", value: 2.2, spread: 0.4, density: 0.3 },
        { label: "Video B", value: 2.2, spread: 1.6, density: 0.8 },
      ],
    },
  },
  {
    id: "fountain-skew",
    title: "Which side does the risk hang on",
    description:
      "Symmetry is the signal here. Three delivery routes share the same median time and the same spread, but Harbour's crown leans right: its surprises are one-sided, a late tail (lean: 0.8). An upright crown (lean: 0) says the number can swing either way; a leaning crown says the hidden mass hangs on one side. Read only the direction, never the angle; the skew figure itself lives on the tooltip and in getContext().",
    element: "michi-vz-fountain-chart",
    props: {
      title: "Median delivery time (min); a leaning crown = one-sided (late) risk",
      xAxisDataType: "band",
      dataSet: [
        { label: "City", value: 32, spread: 6, density: 0.3, lean: 0 },
        { label: "Suburb", value: 41, spread: 7, density: 0.3, lean: 0 },
        { label: "Harbour", value: 38, spread: 7, density: 0.8, lean: 0.8, color: "#D4AF37" },
      ],
    },
  },
  {
    id: "fountain-storm",
    title: "Typhoons over the Philippines",
    description:
      "Each jet is a typhoon (approximate figures). The apex is peak sustained wind; the spray reaches toward the gusts above it, in the same km/h. The crowns lean the way each storm travelled: Pacific typhoons cross the Philippines east to west, so they lean left; Hagibis recurved northeast toward Japan and leans the other way. Thicker froth = a wider wind field. Direction and thickness are flags; the exact gust and size figures live on the tooltip.",
    element: "michi-vz-fountain-chart",
    props: {
      title: "Peak sustained winds (km/h); spray = gusts, lean = track direction",
      xAxisDataType: "band",
      dataSet: [
        { label: "Haiyan 2013", value: 230, spread: 85, density: 0.8, lean: -0.7, color: "#D4AF37" },
        { label: "Hagibis 2019", value: 195, spread: 75, density: 1, lean: 0.6 },
        { label: "Goni 2020", value: 225, spread: 85, density: 0.5, lean: -0.7 },
        { label: "Rai 2021", value: 195, spread: 75, density: 0.6, lean: -0.6 },
        { label: "Noru 2022", value: 195, spread: 45, density: 0.4, lean: -0.7 },
      ],
    },
  },
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
      dataSet: [
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
        // Every other country in `geography` is intentionally left unmatched
        // to show noDataColor across the rest of the world atlas.
      ],
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
        "label" in d ? `<strong>${d.label}</strong>` : `<strong>${d.name ?? d.id}</strong><br/>No data`,
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
];

// SymbolMapChart's `dataSet` items each supply their own lng/lat (core bundles no
// coordinate table, unlike the legacy sdg-trade MapSymbolForce's CSV) - ~10
// hand-written real-world capitals/cities, not a comprehensive gazetteer.
const symbolMap: Example<SymbolMapChartProps>[] = [
  {
    id: "symbol-map-trade-hubs",
    title: "Merchandise trade value by hub, 2024 (US$ bn)",
    description:
      "Dot-only look (no `geography` - the legacy MapSymbolForce parity default): each item projects through an untuned geoMercator(), then a one-shot force simulation de-overlaps the circles. Germany and India also carry a concentric `valueSecond` ring (a sub-metric, e.g. \"of which intra-regional\").",
    element: "michi-vz-symbol-map-chart",
    props: {
      title: "Merchandise trade value by hub, 2024 (US$ bn)",
      tooltipFormatter: (d) =>
        `<strong>${d.label}</strong><br/>${d.value.toLocaleString()} bn${
          d.valueSecond !== undefined ? `<br/>of which: ${d.valueSecond.toLocaleString()} bn` : ""
        }`,
      dataSet: [
        { id: "usa", label: "United States", lng: -95.7, lat: 38.9, value: 100 },
        { id: "deu", label: "Germany", lng: 13.4, lat: 52.5, value: 60, valueSecond: 30 },
        { id: "vnm", label: "Vietnam", lng: 105.8, lat: 21.0, value: 20 },
        { id: "bra", label: "Brazil", lng: -47.9, lat: -15.8, value: 45 },
        { id: "zaf", label: "South Africa", lng: 28.2, lat: -25.7, value: 15 },
        { id: "ind", label: "India", lng: 77.2, lat: 28.6, value: 70, valueSecond: 50 },
        { id: "chn", label: "China", lng: 116.4, lat: 39.9, value: 90 },
        { id: "aus", label: "Australia", lng: 149.1, lat: -35.3, value: 25 },
        { id: "gbr", label: "United Kingdom", lng: -0.1, lat: 51.5, value: 55 },
        { id: "ken", label: "Kenya", lng: 36.8, lat: -1.3, value: 10 },
      ],
    },
  },
  {
    id: "symbol-map-with-backdrop",
    title: "Regional trade value with a muted backdrop",
    description:
      "The OPTIONAL `geography` backdrop (a new capability - the legacy chart never drew landmass): reuses the real world atlas (176 countries, ISO-A3) so the symbol coordinates and the muted landmass share one consistent geographic framing.",
    element: "michi-vz-symbol-map-chart",
    props: {
      title: "Regional trade value with a muted backdrop",
      geography: world,
      dataSet: [
        { id: "usa", label: "North America", lng: -100, lat: 40, value: 80 },
        { id: "deu", label: "Europe", lng: 15, lat: 50, value: 65 },
        { id: "chn", label: "East Asia", lng: 115, lat: 35, value: 90 },
        { id: "zaf", label: "Africa", lng: 20, lat: -10, value: 30 },
        { id: "aus", label: "Australia", lng: 135, lat: -25, value: 20 },
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
      tooltipFormatter: (d) => `<strong>${d.label}</strong><br/>${(d.value ?? 0).toLocaleString()} bn`,
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
