import type { Meta, StoryObj } from "@storybook/web-components";
import { examples } from "@michi-vz/examples";
import "@michi-vz/wc/treemap-chart";
import { renderElement } from "./render";

// The canonical export-potential dataset (nested sectors -> products, each leaf
// carrying realized vs untapped) - the same data the docs demo uses.
const reg = examples as unknown as Record<string, Array<{ props: Record<string, unknown> }>>;
const grouped = reg["treemap-chart"][0].props; // nested under sectors (primary)
const flat = reg["treemap-chart"][1].props; // dense flat product set (flattened data)

const meta: Meta = {
  title: "Charts/Treemap",
  render: (args) => renderElement("michi-vz-treemap-chart", args),
  argTypes: {
    renderer: { control: "inline-radio", options: ["svg", "canvas"] },
    layout: { control: "inline-radio", options: ["squarify", "stack", "auto"] },
    showLegend: { control: "boolean" },
    showSplit: { control: "boolean" },
    splitOpacity: { control: { type: "range", min: 0.1, max: 1, step: 0.05 } },
    width: { control: { type: "range", min: 280, max: 1100, step: 20 } },
    height: { control: { type: "range", min: 280, max: 800, step: 20 } },
  },
};
export default meta;

type Story = StoryObj;

/** Desktop / big screen: squarified treemap, realized vs untapped split. */
/** Nested: products grouped under their sector (parent header tiles). The primary demo. */
export const GroupedBySector: Story = {
  args: { ...grouped, width: 900, height: 540, layout: "squarify", renderer: "svg" },
};

/** Flat: one tile per product, each its own colour (flattened data, no nesting). */
export const FlatList: Story = {
  args: { ...flat, width: 900, height: 540, layout: "squarify", renderer: "svg" },
};

/** Small screen: the flat data folded into a single-column stack. */
export const MobileStack: Story = {
  args: { ...flat, width: 360, height: 680, layout: "stack", renderer: "svg" },
};

/** Responsive: "auto" picks squarify or stack from the width breakpoint. */
export const AutoResponsive: Story = {
  args: { ...flat, layout: "auto", stackBreakpoint: 480, renderer: "canvas" },
};

/** No split: a plain treemap sized by a single value. */
export const SingleValue: Story = {
  args: {
    title: "Market size by region",
    width: 900,
    height: 480,
    showSplit: false,
    dataSet: [
      { label: "Asia", value: 120 },
      { label: "Europe", value: 90 },
      { label: "Americas", value: 80 },
      { label: "Africa", value: 40 },
      { label: "Oceania", value: 15 },
    ],
  },
};
