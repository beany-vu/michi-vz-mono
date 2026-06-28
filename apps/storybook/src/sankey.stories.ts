import type { Meta, StoryObj } from "@storybook/web-components";
import { examples } from "@michi-vz/examples";
import "@michi-vz/wc/sankey-chart";
import { renderElement } from "./render";

// Bilateral trade flows (exporters -> markets) — the docs demo data.
const reg = examples as unknown as Record<string, Array<{ props: Record<string, unknown> }>>;
const flows = reg["sankey-chart"][0].props;

const meta: Meta = {
  title: "Charts/Sankey",
  render: (args) => renderElement("michi-vz-sankey-chart", args),
  argTypes: {
    renderer: { control: "inline-radio", options: ["svg", "canvas"] },
    linkColorMode: { control: "inline-radio", options: ["source", "target"] },
    nodeWidth: { control: { type: "range", min: 6, max: 40, step: 2 } },
    nodePadding: { control: { type: "range", min: 2, max: 40, step: 2 } },
    nodeRadius: { control: { type: "range", min: 0, max: 16, step: 1 } },
    linkRadius: { control: { type: "range", min: 0, max: 16, step: 1 } },
    linkOpacity: { control: { type: "range", min: 0.1, max: 1, step: 0.05 } },
    showLabels: { control: "boolean" },
    width: { control: { type: "range", min: 360, max: 1100, step: 20 } },
    height: { control: { type: "range", min: 320, max: 760, step: 20 } },
  },
};
export default meta;

type Story = StoryObj;

/** Exporters -> markets, links coloured by their source. */
export const TradeFlows: Story = {
  args: { ...flows, width: 820, height: 500, renderer: "svg" },
};

/** Colour the flows by their target market instead. */
export const ColourByTarget: Story = {
  args: { ...flows, width: 820, height: 500, linkColorMode: "target", renderer: "svg" },
};

/** Canvas renderer — same layout, painted to a <canvas>. */
export const Canvas: Story = {
  args: { ...flows, width: 820, height: 500, renderer: "canvas" },
};

/** Square node corners + sharp flow corners (nodeRadius 0, linkRadius 0). */
export const SharpCorners: Story = {
  args: { ...flows, width: 820, height: 500, nodeRadius: 0, linkRadius: 0, renderer: "svg" },
};

/** Extra-rounded flows (linkRadius cranked up). */
export const RoundedFlows: Story = {
  args: { ...flows, width: 820, height: 500, nodeRadius: 4, linkRadius: 10, renderer: "svg" },
};
