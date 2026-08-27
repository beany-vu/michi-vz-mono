---
title: Charts
description: "The michi-vz chart catalog: 22 chart types for trends, composition, comparison, correlation, and flow, each with live demos in React, Vue, Svelte, Angular, and web components."
---
# Chart catalog

Twenty-two framework-agnostic charts. Each page has an example, usage across every framework, and an LLM-context panel.

- [**Line Chart**](/charts/line) - _Trends_ · Trends over time across one or many series - with optional gap detection, an opt-in canvas renderer (LTTB-decimated for big data), and single-point guide lines.
- [**Fan Chart**](/charts/fan) - _Trends · Forecast_ · A forecast fan: history, a dashed forecast median, and nested confidence bands that widen with the horizon (composed from Line + Range).
- [**Area Chart**](/charts/area) - _Composition_ · Part-to-whole over time: how each component’s share of a stacked total shifts.
- [**Scatter Plot**](/charts/scatter) - _Correlation_ · Relationship between two numeric variables; bubble size encodes a third.
- [**Range Chart**](/charts/range) - _Trends_ · Min-max bands per series - forecasts, confidence intervals, or observed ranges over time.
- [**Ribbon Chart**](/charts/ribbon) - _Composition_ · Stacked columns per period, linked by connector ribbons that trace each category across time.
- [**Radar Chart**](/charts/radar) - _Comparison_ · Compare several entities across a shared set of axes at a glance (a polygon per entity).
- [**Vertical Stack Bar**](/charts/vertical-stack-bar) - _Composition_ · Stacked vertical bars per category, with an explicit missing-data marker guard for sparse datasets.
- [**Comparable Horizontal Bar**](/charts/comparable) - _Comparison_ · Two overlaid horizontal sub-bars per label - a “based” vs “compared” value.
- [**Comparable Vertical Bar**](/charts/comparable-vertical-bar) - _Comparison_ · Two full-bandwidth overlapping columns per category - a based value behind, a compared value in front - with a change arrow above each pair.
- [**Dual Horizontal Bar (Tornado)**](/charts/dual) - _Comparison_ · Diverging bars from a centre line - value1 right, value2 left (population pyramids, tornado charts).
- [**Bar-Bell**](/charts/bar-bell) - _Composition_ · Cumulative horizontal segments per row with end-cap circles marking each step.
- [**Gap Chart**](/charts/gap) - _Comparison_ · Two values per label joined by a gap bar - emphasises the difference between them.
- [**Treemap**](/charts/treemap) - _Composition_ · Hierarchical tiles sized by value, each optionally split into two parts (e.g. realized vs untapped) - with a mobile-friendly stack layout.
- [**Pie / Donut**](/charts/pie) - _Composition_ · Slices sized by share of a whole, with per-slice % labels; set `innerRadiusRatio` for a donut.
- [**Gauge (Rings)**](/charts/gauge) - _Comparison_ · Concentric rings, one per item, each sweeping value/max of a full circle over a background track, with a hover-activated centre readout.
- [**Bubble**](/charts/bubble) - _Composition_ · Circles sized by value, pulled into a cluster by gravity, each optionally split into a realized core and an untapped ring.
- [**Sankey**](/charts/sankey) - _Flow_ · Flows between nodes laid out in columns, with band thickness proportional to the flow value (built on d3-sankey).
- [**Fountain (Jet d'Eau)**](/charts/fountain) - _Comparison_ · Apex height = value, the blooming plume = uncertainty. Categorical x = snapshot/comparison of KPIs; temporal or numeric x = trend with optional forecast jets (best for ~5-12 periods).
- [**Choropleth Map**](/charts/choropleth-map) - _Geography_ · Your own GeoJSON, shaded by a threshold colour scale or an explicit category map, with 13 d3-geo projections.
- [**Symbol Map**](/charts/symbol-map) - _Geography_ · Symbols placed by lng/lat, with a one-shot force simulation pulling overlapping circles apart.
- [**Radial Tree**](/charts/radial-tree) - _Composition_ · A radial dendrogram: leaves equidistant from the centre, circles sized at group and leaf level, and adaptive label density as the leaf count grows.
