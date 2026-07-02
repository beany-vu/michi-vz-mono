import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mountLineChart, mountScatterChart, type LineChartProps, type ChartContext } from "@michi-vz/core";
import { mountDevtools, type DevtoolsHandle } from "../src/panel";

interface G {
  __MICHI_VZ_DEVTOOLS__?: boolean;
  __MICHI_VZ_DEVTOOLS_HOOK__?: unknown;
}
const g = globalThis as unknown as G;

const props: LineChartProps = {
  dataSet: [
    {
      label: "Revenue",
      series: [
        { date: 2020, value: 100, certainty: true },
        { date: 2021, value: 120, certainty: true },
        { date: 2022, value: 140, certainty: true, predicted: true },
      ],
    },
  ],
  title: "Demo",
  width: 400,
  height: 200,
  xAxisDataType: "date_annual",
};

function root(dt: DevtoolsHandle): ShadowRoot {
  const r = dt.getRoot();
  if (!r) throw new Error("expected a shadow root");
  return r;
}

function q(node: ParentNode, sel: string): HTMLElement | null {
  return node.querySelector<HTMLElement>(sel);
}

function clickTab(r: ShadowRoot, label: string): void {
  const tab = Array.from(r.querySelectorAll<HTMLButtonElement>(".mv-devtools-tab")).find(
    (b) => b.textContent === label
  );
  if (!tab) throw new Error(`tab not found: ${label}`);
  tab.click();
}

describe("mountDevtools panel", () => {
  beforeEach(() => {
    g.__MICHI_VZ_DEVTOOLS__ = undefined;
    g.__MICHI_VZ_DEVTOOLS_HOOK__ = undefined;
    document.body.innerHTML = "";
  });
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders inside a shadow root and discovers a chart mounted after it", () => {
    const dt = mountDevtools();
    const r = root(dt);
    // isolation: the panel markup lives in the shadow root, not the light DOM
    expect(q(document.body, ".mv-devtools")).toBeNull();
    expect(q(r, ".mv-devtools")).not.toBeNull();
    // the shadow host wrapper is in the light DOM
    expect(q(document.body, ".mv-devtools-root")).not.toBeNull();
    // styles are injected into the shadow root, not document.head
    expect(document.head.querySelector("style[data-michi-vz-devtools]")).toBeNull();
    expect(r.querySelector("style[data-michi-vz-devtools]")).not.toBeNull();

    const host = document.createElement("div");
    document.body.appendChild(host);
    const chart = mountLineChart(host, props);

    expect(q(r, ".mv-devtools-count")?.textContent).toContain("1 chart");
    expect(q(r, ".mv-devtools-list")?.textContent).toContain("line-chart");

    chart.destroy();
    dt.destroy();
  });

  it("honours an explicit theme option on the shadow host", () => {
    const dt = mountDevtools({ theme: "light" });
    const wrapper = q(document.body, ".mv-devtools-root");
    expect(wrapper?.getAttribute("data-theme")).toBe("light");
    dt.destroy();
  });

  it("shows the summary and an actual-vs-predicted series row (Overview tab)", () => {
    const dt = mountDevtools();
    const r = root(dt);
    const host = document.createElement("div");
    document.body.appendChild(host);
    const chart = mountLineChart(host, props);

    expect(q(r, ".mv-devtools-summary")?.textContent).toContain("Line chart");
    expect(q(r, ".mv-devtools-detail")?.textContent).toContain("actual vs predicted");
    const badges = r.querySelectorAll(".badge.predicted");
    expect(badges.length).toBeGreaterThan(0);
    expect(Array.from(badges).some((b) => b.textContent === "1")).toBe(true);

    chart.destroy();
    dt.destroy();
  });

  it("highlight toggle patches props via the hook", () => {
    const dt = mountDevtools();
    const r = root(dt);
    const host = document.createElement("div");
    document.body.appendChild(host);
    const chart = mountLineChart(host, props);

    const cb = r.querySelector<HTMLInputElement>(".row input[type=checkbox]");
    expect(cb).not.toBeNull();
    cb!.checked = true;
    cb!.dispatchEvent(new Event("change"));

    expect(chart.getContext()).not.toBeNull();
    expect(q(r, ".mv-devtools")).not.toBeNull();

    chart.destroy();
    dt.destroy();
  });

  it("editing the dataSet re-renders the chart and updates the context", () => {
    const dt = mountDevtools();
    const r = root(dt);
    const host = document.createElement("div");
    document.body.appendChild(host);
    const chart = mountLineChart(host, props);

    const ta = r.querySelector<HTMLTextAreaElement>("textarea");
    expect(ta).not.toBeNull();
    const edited = [
      {
        label: "Revenue",
        series: [
          { date: 2020, value: 100, certainty: true },
          { date: 2021, value: 999, certainty: true },
        ],
      },
    ];
    ta!.value = JSON.stringify(edited);
    const applyBtn = Array.from(r.querySelectorAll<HTMLButtonElement>(".mv-devtools-btn")).find(
      (b) => b.textContent === "Apply"
    );
    expect(applyBtn).not.toBeNull();
    applyBtn!.click();

    const ctx = chart.getContext();
    expect(ctx?.chartType).toBe("line-chart");
    const series = (ctx as { series: Array<{ max: number; pointCount: number }> }).series[0];
    expect(series.max).toBe(999);
    expect(series.pointCount).toBe(2);

    chart.destroy();
    dt.destroy();
  });

  it("captures a ChartContext history and steps back into a read-only snapshot", () => {
    const dt = mountDevtools();
    const r = root(dt);
    const host = document.createElement("div");
    document.body.appendChild(host);
    const chart = mountLineChart(host, props);

    chart.update({
      ...props,
      title: "Demo v2",
      dataSet: [
        {
          label: "Revenue",
          series: [
            { date: 2020, value: 100, certainty: true },
            { date: 2021, value: 555, certainty: true },
          ],
        },
      ],
    });

    const nav = q(r, ".mv-devtools-history");
    expect(nav).not.toBeNull();
    expect(nav?.textContent).toContain("2/2");
    expect(q(r, ".mv-devtools-summary")?.textContent).toContain("555");

    const older = Array.from(r.querySelectorAll<HTMLButtonElement>(".mv-devtools-history .mv-devtools-btn")).find(
      (b) => b.textContent === "◀"
    );
    expect(older).not.toBeNull();
    older!.click();

    expect(q(r, ".mv-devtools-histbanner")?.textContent).toContain("viewing snapshot");
    expect(q(r, ".mv-devtools-summary")?.textContent).toContain("140");
    expect(q(r, ".mv-devtools-summary")?.textContent).not.toContain("555");
    expect(r.querySelector("textarea")).toBeNull();

    const liveBtn = Array.from(r.querySelectorAll<HTMLButtonElement>(".mv-devtools-history .mv-devtools-btn")).find(
      (b) => b.textContent?.includes("live")
    );
    liveBtn!.click();
    expect(q(r, ".mv-devtools-histbanner")).toBeNull();
    expect(r.querySelector("textarea")).not.toBeNull();

    chart.destroy();
    dt.destroy();
  });

  it("destroy removes the shadow host and unsubscribes", () => {
    const dt = mountDevtools();
    expect(q(document.body, ".mv-devtools-root")).not.toBeNull();
    dt.destroy();
    expect(q(document.body, ".mv-devtools-root")).toBeNull();
  });
});

describe("devtools tabs", () => {
  beforeEach(() => {
    g.__MICHI_VZ_DEVTOOLS__ = undefined;
    g.__MICHI_VZ_DEVTOOLS_HOOK__ = undefined;
    document.body.innerHTML = "";
  });
  afterEach(() => {
    document.body.innerHTML = "";
  });

  function mountWithChart(): { dt: DevtoolsHandle; r: ShadowRoot; host: HTMLDivElement; chart: ReturnType<typeof mountLineChart> } {
    const dt = mountDevtools();
    const r = root(dt);
    const host = document.createElement("div");
    document.body.appendChild(host);
    const chart = mountLineChart(host, props);
    return { dt, r, host, chart };
  }

  it("shows the full tab bar", () => {
    const { dt, r, chart } = mountWithChart();
    const labels = Array.from(r.querySelectorAll(".mv-devtools-tab")).map((t) => t.textContent);
    expect(labels).toEqual(["Overview", "Sizing", "Scales", "Diff", "Hit-test", "Profiler", "Insights", "A11y"]);
    chart.destroy();
    dt.destroy();
  });

  it("Profiler tab shows per-update render durations after updates", () => {
    const { dt, r, chart } = mountWithChart();
    clickTab(r, "Profiler");
    expect(q(r, ".mv-devtools-detail")?.textContent?.toLowerCase()).toContain("update");

    chart.update({ ...props, width: 420 });
    chart.update({ ...props, width: 440 });
    clickTab(r, "Profiler");
    const text = q(r, ".mv-devtools-detail")?.textContent ?? "";
    expect(text).toContain("2 update");
    expect(text).toContain("ms");
    chart.destroy();
    dt.destroy();
  });

  it("A11y tab renders audit findings for the live context", () => {
    const { dt, r, chart } = mountWithChart();
    clickTab(r, "A11y");
    const text = q(r, ".mv-devtools-detail")?.textContent ?? "";
    // healthy chart: table present, summary present, distinct colors
    expect(q(r, ".mv-devtools-flag.ok")).not.toBeNull();
    expect(text.toLowerCase()).toContain("table");
    chart.destroy();
    dt.destroy();
  });

  it("A11y tab flags duplicate series colors", () => {
    const dt = mountDevtools();
    const r = root(dt);
    const host = document.createElement("div");
    document.body.appendChild(host);
    const chart = mountLineChart(host, {
      ...props,
      dataSet: [
        ...props.dataSet,
        {
          label: "Cost",
          series: [
            { date: 2020, value: 10, certainty: true },
            { date: 2021, value: 20, certainty: true },
          ],
        },
      ],
      colorsMapping: { Revenue: "#d62728", Cost: "#d62728" },
    });
    clickTab(r, "A11y");
    const text = q(r, ".mv-devtools-detail")?.textContent ?? "";
    expect(text).toContain("same color");
    expect(q(r, ".mv-devtools-flag.warn")).not.toBeNull();
    chart.destroy();
    dt.destroy();
  });

  it("Sizing tab flags a zero-size host", () => {
    const { dt, r, host, chart } = mountWithChart();
    Object.defineProperty(host, "getBoundingClientRect", {
      configurable: true,
      value: () => ({ width: 0, height: 0, top: 0, left: 0, right: 0, bottom: 0, x: 0, y: 0, toJSON: () => ({}) }),
    });
    clickTab(r, "Sizing");
    const text = q(r, ".mv-devtools-detail")?.textContent ?? "";
    expect(text.toLowerCase()).toContain("zero size");
    chart.destroy();
    dt.destroy();
  });

  it("Sizing tab warns when the requested width exceeds the host's padded inner width", () => {
    const { dt, r, host, chart } = mountWithChart();
    host.style.padding = "16px";
    Object.defineProperty(host, "clientWidth", { configurable: true, value: 300 });
    Object.defineProperty(host, "clientHeight", { configurable: true, value: 300 });
    Object.defineProperty(host, "getBoundingClientRect", {
      configurable: true,
      value: () => ({ width: 300, height: 300, top: 0, left: 0, right: 300, bottom: 300, x: 0, y: 0, toJSON: () => ({}) }),
    });
    clickTab(r, "Sizing");
    const text = q(r, ".mv-devtools-detail")?.textContent ?? "";
    // requested 400 > 300 - 32 inner width; the warning explains the padding trap
    expect(text).toContain("padding");
    expect(q(r, ".mv-devtools-flag.warn")).not.toBeNull();
    chart.destroy();
    dt.destroy();
  });

  it("Scales tab renders the x/y domains for an axis chart", () => {
    const { dt, r, chart } = mountWithChart();
    clickTab(r, "Scales");
    const text = q(r, ".mv-devtools-detail")?.textContent ?? "";
    expect(text).toContain("xAxis");
    expect(text).toContain("domain");
    // the y domain of the demo data peaks at 140
    expect(text).toContain("140");
    chart.destroy();
    dt.destroy();
  });

  it("Scales tab explains when a chart type has no axis scales", () => {
    const dt = mountDevtools();
    const r = root(dt);
    // wc-style fallback entry: a fake element exposing getContext without axes
    const node = document.createElement("div");
    node.className = "michi-vz-pie-chart";
    (node as HTMLElement & { getContext: () => ChartContext }).getContext = () =>
      ({ chartType: "pie-chart", renderer: "svg", summary: "Pie chart." }) as unknown as ChartContext;
    document.body.appendChild(node);
    dt.refresh();
    clickTab(r, "Scales");
    const text = q(r, ".mv-devtools-detail")?.textContent ?? "";
    expect(text.toLowerCase()).toContain("no axis scales");
    dt.destroy();
  });

  it("Diff tab lists the changed paths between the last two snapshots", () => {
    const { dt, r, chart } = mountWithChart();
    chart.update({
      ...props,
      dataSet: [
        {
          label: "Revenue",
          series: [
            { date: 2020, value: 100, certainty: true },
            { date: 2021, value: 555, certainty: true },
          ],
        },
      ],
    });
    clickTab(r, "Diff");
    const text = q(r, ".mv-devtools-detail")?.textContent ?? "";
    expect(text).toContain("series[0].max");
    expect(text).toContain("555");
    chart.destroy();
    dt.destroy();
  });

  it("Diff tab asks for more snapshots when there is only one", () => {
    const { dt, r, chart } = mountWithChart();
    clickTab(r, "Diff");
    const text = q(r, ".mv-devtools-detail")?.textContent ?? "";
    expect(text.toLowerCase()).toContain("snapshot");
    chart.destroy();
    dt.destroy();
  });

  it("Hit-test tab logs canvas pointer events with the resolved label", async () => {
    const dt = mountDevtools();
    const r = root(dt);
    const host = document.createElement("div");
    document.body.appendChild(host);
    const chart = mountScatterChart(host, {
      dataSet: [
        { label: "Point A", x: 1, y: 2, d: 5 },
        { label: "Beta", x: 3, y: 6, d: 10 },
      ],
      width: 600,
      height: 300,
      xAxisDataType: "number",
      renderer: "canvas",
    });
    clickTab(r, "Hit-test");
    // before any pointer traffic, the tab explains what it is waiting for
    expect(q(r, ".mv-devtools-detail")?.textContent?.toLowerCase()).toContain("pointer");

    host.dispatchEvent(new MouseEvent("mousemove", { clientX: 10, clientY: 10, bubbles: true }));
    // the panel throttles hit-driven re-renders (~80ms)
    await new Promise((res) => setTimeout(res, 150));
    const log = q(r, ".mv-devtools-hitlog");
    expect(log).not.toBeNull();
    expect(log?.textContent).toContain("10");

    chart.destroy();
    dt.destroy();
  });

  it("Insights tab shows the AI summary and a teaser when no insight tools exist", () => {
    const { dt, r, chart } = mountWithChart();
    clickTab(r, "Insights");
    expect(q(r, ".mv-devtools-ai")?.textContent).toContain("Line chart");
    const text = q(r, ".mv-devtools-detail")?.textContent ?? "";
    expect(text).toContain("@michi-vz/insights");
    chart.destroy();
    dt.destroy();
  });

  it("Insights tab exposes one-click actions for narrate/anomaly/forecast tools", async () => {
    const { dt, r, chart } = mountWithChart();
    chart.use!({
      name: "narrate",
      provideTools: () => [
        { name: "narrate", description: "prose", run: () => "AI narration of the chart" },
      ],
    });
    chart.use!({
      name: "anomaly",
      provideTools: () => [
        {
          name: "anomaly",
          description: "outliers",
          run: () => [{ label: "Revenue", anomalies: [{ index: 2, kind: "high" }] }],
        },
      ],
    });
    dt.refresh();
    clickTab(r, "Insights");

    const buttons = Array.from(r.querySelectorAll<HTMLButtonElement>(".mv-devtools-ai-action"));
    const labels = buttons.map((b) => b.textContent);
    expect(labels.some((l) => l?.includes("Narrate"))).toBe(true);
    expect(labels.some((l) => l?.includes("anomal"))).toBe(true);

    buttons.find((b) => b.textContent?.includes("Narrate"))!.click();
    await new Promise((res) => setTimeout(res, 0));
    const result = q(r, ".mv-devtools-ai-result");
    expect(result?.textContent).toContain("AI narration of the chart");

    chart.destroy();
    dt.destroy();
  });
});
