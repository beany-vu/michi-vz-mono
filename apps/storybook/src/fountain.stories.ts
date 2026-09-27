import type { Meta, StoryObj } from "@storybook/web-components";
import { examples } from "@michi-vz/examples";
import "@michi-vz/wc/fountain-chart";
import { renderElement } from "./render";

// Stories derive from the docs examples, looked up by id so a reorder of the
// examples never points a story at the wrong chart.
const reg = examples as unknown as Record<
  string,
  Array<{ id: string; props: Record<string, unknown> }>
>;
const byId = (id: string): Record<string, unknown> => {
  const ex = reg["fountain-chart"].find((e) => e.id === id);
  if (!ex) throw new Error(`No fountain example "${id}" in @michi-vz/examples`);
  return ex.props;
};
const parcels = byId("fountain-parcel-delivery-by-origin"); // snapshot, 20 samples per column
const battery = byId("fountain-phone-battery-year-by-year"); // trend, a forecast year, a line
const commute = byId("fountain-commute-by-mode"); // snapshot, a 45-minute line with counts
const anatomy = byId("fountain-key-anatomy"); // one fountain, every part in view
const noRange = byId("fountain-switch-no-range"); // the commute, showRange and the guide off

const size = { width: 820, height: 520 };

const meta: Meta = {
  title: "Charts/Fountain",
  render: (args) => renderElement("michi-vz-fountain-chart", args),
  argTypes: {
    renderer: { control: "inline-radio", options: ["svg", "canvas", "webgpu"] },
    xAxisDataType: {
      control: "inline-radio",
      options: ["band", "date_annual", "date_monthly", "number"],
    },
    showRange: { control: "boolean" },
    showSamples: { control: "boolean" },
    showValueLabels: { control: "boolean" },
    drift: { control: "boolean" },
    showTrendLine: { control: "boolean" },
    yAxisTitle: { control: "text" },
    sampleWord: { control: "text" },
    readingGuide: { control: "text" },
    width: { control: { type: "range", min: 360, max: 1100, step: 20 } },
    height: { control: { type: "range", min: 320, max: 760, step: 20 } },
  },
};
export default meta;

type Story = StoryObj;

/** Snapshot mode with samples: one column per origin, one small dot per parcel. */
export const SnapshotWithSamples: Story = {
  args: { ...parcels, ...size, renderer: "svg" },
};

/** Trend mode over named periods; year 4 is a forecast (dashed, hollow big dot, no dots). */
export const TrendAndForecast: Story = {
  args: { ...battery, ...size, renderer: "svg" },
};

/** A reference line with goodSide: each column counts its small dots within 45 minutes. */
export const ReferenceLine: Story = {
  args: { ...commute, ...size, renderer: "svg" },
};

/** drift on: the Geneva look, every fountain top bends the same way (it carries no data). */
export const DriftOn: Story = {
  args: { ...commute, ...size, drift: true, renderer: "svg" },
};

/**
 * showRange off: stem and big dot only; the small dots and end words go, the counts stay.
 * The reading guide is off too: it explains fountains and small dots.
 */
export const ShowRangeOff: Story = {
  args: { ...noRange, ...size, renderer: "svg" },
};

/** Canvas renderer: the same model painted to a <canvas>. */
export const Canvas: Story = {
  args: { ...commute, ...size, renderer: "canvas" },
};

/** The reading key's single fountain: stem, big dot, fountain, small dots, the line and its count. */
export const ReadingKeyAnatomy: Story = {
  args: { ...anatomy, width: 520, height: 460, renderer: "svg" },
};
