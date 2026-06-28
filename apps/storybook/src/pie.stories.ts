import type { Meta, StoryObj } from "@storybook/web-components";
import { examples } from "@michi-vz/examples";
import "@michi-vz/wc/pie-chart";
import { renderElement } from "./render";

// Export value share by sector — the same data the docs demo uses.
const reg = examples as unknown as Record<string, Array<{ props: Record<string, unknown> }>>;
const pie = reg["pie-chart"][0].props; // solid pie
const donut = reg["pie-chart"][1].props; // donut (innerRadiusRatio > 0)

const meta: Meta = {
  title: "Charts/Pie",
  render: (args) => renderElement("michi-vz-pie-chart", args),
  argTypes: {
    renderer: { control: "inline-radio", options: ["svg", "canvas"] },
    innerRadiusRatio: { control: { type: "range", min: 0, max: 0.9, step: 0.05 } },
    padAngle: { control: { type: "range", min: 0, max: 0.1, step: 0.005 } },
    cornerRadius: { control: { type: "range", min: 0, max: 12, step: 1 } },
    showLabels: { control: "boolean" },
    showLegend: { control: "boolean" },
    sortByValue: { control: "boolean" },
    width: { control: { type: "range", min: 280, max: 800, step: 20 } },
    height: { control: { type: "range", min: 280, max: 600, step: 20 } },
  },
};
export default meta;

type Story = StoryObj;

/** A classic pie: slices sized by value, % labels inside. */
export const Pie: Story = {
  args: { ...pie, width: 460, height: 420, renderer: "svg" },
};

/** The same shares as a donut (innerRadiusRatio > 0). */
export const Donut: Story = {
  args: { ...donut, width: 460, height: 420, renderer: "svg" },
};

/** Canvas renderer — identical geometry, painted to a <canvas>. */
export const Canvas: Story = {
  args: { ...pie, width: 460, height: 420, renderer: "canvas" },
};
