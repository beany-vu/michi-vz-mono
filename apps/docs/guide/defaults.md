# App-wide defaults

`setMichiVzDefaults` sets the look every chart starts from, once for the whole app: the colour palette, the font, bar and tile corners, and the tooltip. It is the michi-vz counterpart of `Highcharts.setOptions`, and it works the same in React, Vue, Svelte, Angular and the web components.

```ts
import { setMichiVzDefaults } from "@michi-vz/core"; // also exported by every framework package

setMichiVzDefaults({
  colors: ["#1A657D", "#3E75B0", "#21B6A8"],
  fontFamily: "Roboto",
  barRadius: 0,
  tileRadius: 0,
  tooltip: { borderRadius: 0, shadow: false },
});
```

Call it before the first chart mounts, for example next to your app's entry point. Each call merges into the previous one, and `resetMichiVzDefaults()` goes back to the built-in look.

## Which value wins

A prop on a chart always wins. The app-wide defaults come next, then the built-in look. So `<TreemapChart tileRadius={6} />` keeps its 6px corners even when the defaults say 0.

## Options

| Option | Applies to | Built-in |
|---|---|---|
| `colors` | every chart given no `colors` prop, and its legend | the 20-colour `DEFAULT_COLORS` |
| `fontFamily` | all chart text, in svg, canvas and webgpu | inherited from the page |
| `barRadius` | Comparable bar charts (horizontal and vertical) | 5 |
| `tileRadius` | Treemap tiles | 1 |
| `tooltip.borderRadius` | every tooltip, in px | 4 |
| `tooltip.shadow` | `false` (none), `true` (built-in) or a css `box-shadow` | a soft shadow |
| `tooltip.background`, `tooltip.borderColor`, `tooltip.color` | every tooltip | white, `#ccc`, inherited |
| `tooltip.fontSize` | every tooltip, in px | `--michi-vz-font-size` (12) |

## The same in every renderer

Each default is resolved before anything is drawn: the palette and the corner radii in the chart's data model, the font and the tooltip as css variables on the chart. So `renderer="svg"`, `"canvas"` and `"webgpu"` draw the same colours and corners, and the tooltip is the same element everywhere.

The tooltip values become css variables (`--michi-vz-tooltip-radius`, `--michi-vz-tooltip-shadow`, `--michi-vz-tooltip-bg`, `--michi-vz-tooltip-border`, `--michi-vz-tooltip-color`, `--michi-vz-tooltip-font-size`), so a stylesheet can still override them for one page.
