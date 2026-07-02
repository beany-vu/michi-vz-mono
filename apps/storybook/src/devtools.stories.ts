import type { Meta, StoryObj } from "@storybook/web-components";
import { mountDevtools, type DevtoolsHandle, type DevtoolsTheme } from "@michi-vz/devtools";
import "@michi-vz/wc/line-chart";
import { renderElement } from "./render";

// One panel per canvas: re-rendering a story must not stack floating panels.
let handle: DevtoolsHandle | null = null;

// Revenue: observed 2018-2022, forecast 2023-2025 - so the panel's Overview tab
// shows the actual-vs-predicted split and the Diff tab has state to compare after
// you edit the dataSet from the panel itself.
const DATASET = [
  {
    label: "Revenue",
    series: [
      { date: 2018, value: 42, certainty: true },
      { date: 2019, value: 55, certainty: true },
      { date: 2020, value: 63, certainty: true },
      { date: 2021, value: 88, certainty: true },
      { date: 2022, value: 104, certainty: true },
      { date: 2023, value: 121, certainty: false, predicted: true },
      { date: 2024, value: 140, certainty: false, predicted: true },
      { date: 2025, value: 162, certainty: false, predicted: true },
    ],
  },
];

interface DevtoolsArgs extends Record<string, unknown> {
  theme: DevtoolsTheme;
  open: boolean;
}

const meta: Meta<DevtoolsArgs> = {
  title: "DevTools/Panel",
  render: (args) => {
    handle?.destroy();
    // Mount the panel BEFORE the chart so the chart registers with the hook (the
    // DOM-sweep fallback would still find it, but this is the documented order).
    handle = mountDevtools({ theme: args.theme, open: args.open });
    const chart = renderElement("michi-vz-line-chart", {
      dataSet: DATASET,
      title: "Revenue (actual + forecast)",
      width: 760,
      height: 380,
      xAxisDataType: "number",
      showDataPoints: true,
    });
    const wrap = document.createElement("div");
    const hint = document.createElement("p");
    hint.textContent =
      "The floating michi-vz devtools panel is bottom-right (hotkey Ctrl/Cmd+Shift+M). Walk the tabs: Overview, Sizing, Scales, Diff, Hit-test, Profiler, Insights, A11y. Toggle the Storybook background to verify both panel themes.";
    hint.style.cssText = "font: 13px/1.5 sans-serif; max-width: 720px;";
    wrap.append(hint, chart);
    return wrap;
  },
  argTypes: {
    theme: { control: "inline-radio", options: ["auto", "dark", "light"] },
    open: { control: "boolean" },
  },
};
export default meta;

type Story = StoryObj<DevtoolsArgs>;

/** The in-page devtools panel inspecting a live line chart. */
export const Default: Story = {
  args: { theme: "auto", open: true },
};

/** Forced light panel (verify against a dark Storybook background too). */
export const LightTheme: Story = {
  args: { theme: "light", open: true },
};

/** Forced dark panel. */
export const DarkTheme: Story = {
  args: { theme: "dark", open: true },
};
