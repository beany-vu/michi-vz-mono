import type { Meta, StoryObj } from "@storybook/web-components";
import { examples } from "@michi-vz/examples";
import "@michi-vz/wc/vertical-stack-bar-chart";
import { renderElement } from "./render";

const reg = examples as unknown as Record<string, Array<{ props: Record<string, unknown> }>>;
const single = reg["vertical-stack-bar-chart"][0].props; // one stacked bar per year
const grouped = reg["vertical-stack-bar-chart"][1].props; // two grouped stacked bars per year

const meta: Meta = {
  title: "Charts/VerticalStackBar",
  render: (args) => renderElement("michi-vz-vertical-stack-bar-chart", args),
  argTypes: {
    renderer: { control: "inline-radio", options: ["svg", "canvas"] },
    keysOrder: { control: "inline-radio", options: ["bottomToTop", "topToBottom"] },
    xAxisLabelPadding: { control: { type: "range", min: 0, max: 60, step: 2 } },
    yTicks: { control: { type: "range", min: 2, max: 12, step: 1 } },
    showGridLines: { control: "boolean" },
    highlightZeroLine: { control: "boolean" },
    width: { control: { type: "range", min: 320, max: 1100, step: 20 } },
    height: { control: { type: "range", min: 280, max: 760, step: 20 } },
  },
};
export default meta;

type Story = StoryObj;

/** One stacked bar per year (single series): composition over time. */
export const Single: Story = {
  args: { ...single, width: 760, height: 460, renderer: "svg" },
};

/** Grouped + stacked: two series per year sit side by side, each stacked. */
export const GroupedStacked: Story = {
  args: { ...grouped, width: 820, height: 480, renderer: "svg" },
};

/** Canvas renderer - same grouped layout, painted to a <canvas>. */
export const Canvas: Story = {
  args: { ...grouped, width: 820, height: 480, renderer: "canvas" },
};

// Self-contained dense series so the auto axis layout has something to react to.
const dense = {
  title: "Dense monthly axis (auto-rotated)",
  keys: ["Land", "Air", "Sea"],
  dataSet: [
    {
      seriesKey: "trade",
      seriesKeyAbbreviation: "T",
      series: Array.from({ length: 18 }, (_, i) => {
        const m = (i % 12) + 1;
        const y = 2023 + Math.floor(i / 12);
        return { date: Number(`${y}${String(m).padStart(2, "0")}`), Land: 40 + i, Air: 12, Sea: 8 };
      }),
    },
  ],
};

/**
 * Dense x-axis: 18 monthly labels don't fit horizontally, so the band axis tilts
 * them −45° (all labels still shown) and reserves bottom margin so they don't clip.
 * Note `date` is a number here - the engine String()-coerces it.
 */
export const RotatedAxis: Story = {
  args: { ...dense, width: 760, height: 460, renderer: "canvas" },
};

/**
 * `filter` ranks the DataSets (groups) by grand total and keeps the top-N - here
 * the single largest of the two grouped series. The legend mirrors the kept bars.
 */
export const TopNGroups: Story = {
  args: { ...grouped, filter: { limit: 1, sortingDir: "desc" }, width: 820, height: 480, renderer: "svg" },
};

/**
 * `keysOrder: "bottomToTop"` anchors keys[0] at the bottom AND reverses the
 * legend / colour-slot order (a colour authority binds slot 0 to the top key).
 */
export const BottomToTop: Story = {
  args: { ...single, keysOrder: "bottomToTop", width: 760, height: 460, renderer: "svg" },
};

/**
 * `xAxisLabelPadding` raises the min-gap the band axis needs before it tilts labels
 * −45°. Horizontal label positions are geometric (gap = step − labelWidth), so
 * rotation/thinning is the only way to add breathing room - bumping this padding
 * makes crowded date labels tilt sooner than the default of 8.
 */
export const LabelPadding: Story = {
  args: { ...dense, xAxisLabelPadding: 40, width: 760, height: 460, renderer: "canvas" },
};
