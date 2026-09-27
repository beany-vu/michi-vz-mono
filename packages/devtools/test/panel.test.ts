import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  mountLineChart,
  mountScatterChart,
  mountPieChart,
  mountRadarChart,
  mountGaugeChart,
  mountChoroplethMapChart,
  mountSymbolMapChart,
  mountAreaChart,
  mountSankeyChart,
  getDevtoolsHook,
  type AreaChartProps,
  type LineChartProps,
  type ChartContext,
  type GeoFeatureItem,
} from "@michi-vz/core";
import { mountDevtools, panelStateSizes, type DevtoolsHandle } from "../src/panel";

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
    (b) => b.textContent === label,
  );
  if (!tab) throw new Error(`tab not found: ${label}`);
  tab.click();
}

function clearDevtoolsStorage(): void {
  localStorage.removeItem("michi-vz-devtools-open");
  localStorage.removeItem("michi-vz-devtools-btn");
}

describe("mountDevtools panel", () => {
  beforeEach(() => {
    g.__MICHI_VZ_DEVTOOLS__ = undefined;
    g.__MICHI_VZ_DEVTOOLS_HOOK__ = undefined;
    document.body.innerHTML = "";
    clearDevtoolsStorage();
  });
  afterEach(() => {
    document.body.innerHTML = "";
    clearDevtoolsStorage();
  });

  it("renders inside a shadow root and discovers a chart mounted after it", () => {
    const dt = mountDevtools({ open: true });
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
    const dt = mountDevtools({ open: true });
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
    const dt = mountDevtools({ open: true });
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
    const dt = mountDevtools({ open: true });
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
      (b) => b.textContent === "Apply",
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

  it("Reset chart restores the initial dataSet and clears highlight/disable edits", () => {
    const dt = mountDevtools({ open: true });
    const r = root(dt);
    const host = document.createElement("div");
    document.body.appendChild(host);
    const chart = mountLineChart(host, props);

    // drive the chart from the panel: highlight + a destructive dataSet edit
    const cb = r.querySelector<HTMLInputElement>(".row input[type=checkbox]")!;
    cb.checked = true;
    cb.dispatchEvent(new Event("change"));
    const ta = r.querySelector<HTMLTextAreaElement>("textarea")!;
    ta.value = JSON.stringify([
      { label: "Revenue", series: [{ date: 2020, value: 1, certainty: true }] },
    ]);
    Array.from(r.querySelectorAll<HTMLButtonElement>(".mv-devtools-btn"))
      .find((b) => b.textContent === "Apply")!
      .click();
    let ctx = chart.getContext() as { series: Array<{ pointCount: number }> };
    expect(ctx.series[0].pointCount).toBe(1);

    // reset -> back to the 3-point original, edits gone
    const resetBtn = Array.from(r.querySelectorAll<HTMLButtonElement>(".mv-devtools-btn")).find(
      (b) => b.textContent === "Reset chart",
    );
    expect(resetBtn).not.toBeNull();
    resetBtn!.click();
    ctx = chart.getContext() as { series: Array<{ pointCount: number; max?: number }> };
    expect(ctx.series[0].pointCount).toBe(3);
    expect((ctx.series[0] as { max?: number }).max).toBe(140);

    chart.destroy();
    dt.destroy();
  });

  it("captures a ChartContext history and steps back into a read-only snapshot", () => {
    const dt = mountDevtools({ open: true });
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

    const older = Array.from(
      r.querySelectorAll<HTMLButtonElement>(".mv-devtools-history .mv-devtools-btn"),
    ).find((b) => b.textContent === "◀");
    expect(older).not.toBeNull();
    older!.click();

    expect(q(r, ".mv-devtools-histbanner")?.textContent).toContain("viewing snapshot");
    expect(q(r, ".mv-devtools-summary")?.textContent).toContain("140");
    expect(q(r, ".mv-devtools-summary")?.textContent).not.toContain("555");
    expect(r.querySelector("textarea")).toBeNull();

    const liveBtn = Array.from(
      r.querySelectorAll<HTMLButtonElement>(".mv-devtools-history .mv-devtools-btn"),
    ).find((b) => b.textContent?.includes("live"));
    liveBtn!.click();
    expect(q(r, ".mv-devtools-histbanner")).toBeNull();
    expect(r.querySelector("textarea")).not.toBeNull();

    chart.destroy();
    dt.destroy();
  });

  it("shows which renderer draws the marks (and that chrome stays SVG)", () => {
    const dt = mountDevtools({ open: true });
    const r = root(dt);
    const host = document.createElement("div");
    document.body.appendChild(host);
    const chart = mountScatterChart(host, {
      dataSet: [{ label: "P", x: 1, y: 2, d: 3 }],
      width: 300,
      height: 200,
      xAxisDataType: "number",
      renderer: "canvas",
    });
    // list badge
    expect(q(r, ".mv-devtools-item .rend")?.textContent).toBe("canvas");
    // overview explanation: marks on canvas, chrome stays SVG
    const text = q(r, ".mv-devtools-detail")?.textContent ?? "";
    expect(text).toContain("Renderer");
    expect(text).toContain("canvas");
    expect(text.toLowerCase()).toContain("svg");
    chart.destroy();
    dt.destroy();
  });

  it("filters the chart list from the filter box", () => {
    const dt = mountDevtools({ open: true });
    const r = root(dt);
    const lineHost = document.createElement("div");
    const scatterHost = document.createElement("div");
    document.body.append(lineHost, scatterHost);
    const line = mountLineChart(lineHost, props);
    const scatter = mountScatterChart(scatterHost, {
      dataSet: [{ label: "P", x: 1, y: 2, d: 3 }],
      width: 300,
      height: 200,
      xAxisDataType: "number",
    });

    expect(r.querySelectorAll(".mv-devtools-item").length).toBe(2);
    const filter = r.querySelector<HTMLInputElement>(".mv-devtools-filter");
    expect(filter).not.toBeNull();
    filter!.value = "scatter";
    filter!.dispatchEvent(new Event("input"));
    const items = Array.from(r.querySelectorAll(".mv-devtools-item"));
    expect(items.length).toBe(1);
    expect(items[0].textContent).toContain("scatter-plot-chart");

    filter!.value = "nope-nothing";
    filter!.dispatchEvent(new Event("input"));
    expect(r.querySelectorAll(".mv-devtools-item").length).toBe(0);
    expect(q(r, ".mv-devtools-list")?.textContent?.toLowerCase()).toContain("match");

    line.destroy();
    scatter.destroy();
    dt.destroy();
  });

  it("the locate button scrolls the chart host into view and flashes an outline", () => {
    const dt = mountDevtools({ open: true });
    const r = root(dt);
    const host = document.createElement("div");
    document.body.appendChild(host);
    const chart = mountLineChart(host, props);
    let scrolled = 0;
    (host as HTMLElement & { scrollIntoView: () => void }).scrollIntoView = () => {
      scrolled++;
    };
    const locate = r.querySelector<HTMLButtonElement>(".mv-devtools-item .locate");
    expect(locate).not.toBeNull();
    locate!.click();
    expect(scrolled).toBe(1);
    expect(host.style.outline).not.toBe("");
    chart.destroy();
    dt.destroy();
  });

  it("maximize button toggles a full-viewport panel and back", () => {
    const dt = mountDevtools({ open: true });
    const r = root(dt);
    const panel = q(r, ".mv-devtools")!;
    const maxBtn = Array.from(r.querySelectorAll<HTMLButtonElement>(".mv-devtools-btn")).find((b) =>
      b.title.toLowerCase().includes("maximize"),
    );
    expect(maxBtn).not.toBeNull();
    maxBtn!.click();
    expect(panel.classList.contains("is-max")).toBe(true);
    maxBtn!.click();
    expect(panel.classList.contains("is-max")).toBe(false);
    dt.destroy();
  });

  it("dragging the resize handle grows the panel and persists the size", () => {
    localStorage.removeItem("michi-vz-devtools-size");
    const dt = mountDevtools({ open: true });
    const r = root(dt);
    const panel = q(r, ".mv-devtools")!;
    const handle = q(r, ".mv-devtools-resize");
    expect(handle).not.toBeNull();

    handle!.dispatchEvent(
      new MouseEvent("mousedown", { clientX: 500, clientY: 500, bubbles: true }),
    );
    window.dispatchEvent(new MouseEvent("mousemove", { clientX: 300, clientY: 400 }));
    window.dispatchEvent(new MouseEvent("mouseup", {}));

    // dragging 200px left and 100px up grows the (right/bottom-anchored) panel
    expect(panel.style.getPropertyValue("--mvdt-w")).toContain("px");
    const w = parseFloat(panel.style.getPropertyValue("--mvdt-w"));
    const h = parseFloat(panel.style.getPropertyValue("--mvdt-h"));
    expect(w).toBeGreaterThan(560);
    expect(h).toBeGreaterThan(0);

    const saved = JSON.parse(localStorage.getItem("michi-vz-devtools-size") ?? "{}");
    expect(saved.w).toBe(w);
    dt.destroy();

    // a fresh mount restores the saved size
    const dt2 = mountDevtools({ open: true });
    const panel2 = q(root(dt2), ".mv-devtools")!;
    expect(parseFloat(panel2.style.getPropertyValue("--mvdt-w"))).toBe(w);
    dt2.destroy();
    localStorage.removeItem("michi-vz-devtools-size");
  });

  it("the left edge grip resizes width only, leaving height untouched", () => {
    localStorage.removeItem("michi-vz-devtools-size");
    const dt = mountDevtools({ open: true });
    const r = root(dt);
    const panel = q(r, ".mv-devtools")!;
    const handle = q(r, ".mv-devtools-resize-l");
    expect(handle).not.toBeNull();

    handle!.dispatchEvent(
      new MouseEvent("mousedown", { clientX: 500, clientY: 500, bubbles: true }),
    );
    window.dispatchEvent(new MouseEvent("mousemove", { clientX: 300, clientY: 200 }));
    window.dispatchEvent(new MouseEvent("mouseup", {}));

    expect(parseFloat(panel.style.getPropertyValue("--mvdt-w"))).toBeGreaterThan(560);
    // height stays auto - the vertical move must not touch --mvdt-h
    expect(panel.style.getPropertyValue("--mvdt-h")).toBe("");
    expect(panel.classList.contains("is-resizing")).toBe(false);
    dt.destroy();
    localStorage.removeItem("michi-vz-devtools-size");
  });

  it("the top edge grip resizes height only, leaving width untouched", () => {
    localStorage.removeItem("michi-vz-devtools-size");
    const dt = mountDevtools({ open: true });
    const r = root(dt);
    const panel = q(r, ".mv-devtools")!;
    const handle = q(r, ".mv-devtools-resize-t");
    expect(handle).not.toBeNull();

    handle!.dispatchEvent(
      new MouseEvent("mousedown", { clientX: 500, clientY: 500, bubbles: true }),
    );
    window.dispatchEvent(new MouseEvent("mousemove", { clientX: 200, clientY: 300 }));
    window.dispatchEvent(new MouseEvent("mouseup", {}));

    expect(parseFloat(panel.style.getPropertyValue("--mvdt-h"))).toBeGreaterThan(0);
    // width stays at its default - the horizontal move must not touch --mvdt-w
    expect(panel.style.getPropertyValue("--mvdt-w")).toBe("");
    dt.destroy();
    localStorage.removeItem("michi-vz-devtools-size");
  });

  it("destroy removes the shadow host and unsubscribes", () => {
    const dt = mountDevtools({ open: true });
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
    clearDevtoolsStorage();
  });
  afterEach(() => {
    document.body.innerHTML = "";
    clearDevtoolsStorage();
  });

  function mountWithChart(): {
    dt: DevtoolsHandle;
    r: ShadowRoot;
    host: HTMLDivElement;
    chart: ReturnType<typeof mountLineChart>;
  } {
    const dt = mountDevtools({ open: true });
    const r = root(dt);
    const host = document.createElement("div");
    document.body.appendChild(host);
    const chart = mountLineChart(host, props);
    return { dt, r, host, chart };
  }

  it("shows the full tab bar", () => {
    const { dt, r, chart } = mountWithChart();
    const labels = Array.from(r.querySelectorAll(".mv-devtools-tab")).map((t) => t.textContent);
    expect(labels).toEqual([
      "Overview",
      "Props",
      "Sizing",
      "Scales",
      "Diff",
      "Hit-test",
      "Profiler",
      "Insights",
      "A11y",
    ]);
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
    const dt = mountDevtools({ open: true });
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
      value: () => ({
        width: 0,
        height: 0,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }),
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
      value: () => ({
        width: 300,
        height: 300,
        top: 0,
        left: 0,
        right: 300,
        bottom: 300,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }),
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
    const dt = mountDevtools({ open: true });
    const r = root(dt);
    const host = document.createElement("div");
    document.body.appendChild(host);
    const chart = mountPieChart(host, {
      dataSet: [
        { label: "A", value: 3 },
        { label: "B", value: 5 },
      ],
      width: 300,
      height: 300,
    });
    clickTab(r, "Scales");
    const text = q(r, ".mv-devtools-detail")?.textContent ?? "";
    expect(text.toLowerCase()).toContain("no axis scales");
    chart.destroy();
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
    // series are matched by label, so the path names the series, not its index
    expect(text).toContain('series["Revenue"].max');
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
    const dt = mountDevtools({ open: true });
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
    // no mystery: every action explains what actually runs (no LLM by default)
    for (const b of buttons) expect(b.title.toLowerCase()).toContain("no language model");
    expect(q(r, ".mv-devtools-ai-caption")?.textContent?.toLowerCase()).toContain(
      "no language model",
    );

    buttons.find((b) => b.textContent?.includes("Narrate"))!.click();
    await new Promise((res) => setTimeout(res, 0));
    const result = q(r, ".mv-devtools-ai-result");
    expect(result?.textContent).toContain("AI narration of the chart");

    chart.destroy();
    dt.destroy();
  });
});

describe("devtools toggle button", () => {
  beforeEach(() => {
    g.__MICHI_VZ_DEVTOOLS__ = undefined;
    g.__MICHI_VZ_DEVTOOLS_HOOK__ = undefined;
    document.body.innerHTML = "";
    clearDevtoolsStorage();
  });
  afterEach(() => {
    document.body.innerHTML = "";
    clearDevtoolsStorage();
  });

  it("mounts closed by default: only the floating branded button shows", () => {
    const dt = mountDevtools();
    const r = root(dt);
    expect(dt.isOpen()).toBe(false);
    expect(q(r, ".mv-devtools")!.hidden).toBe(true);
    const btn = q(r, ".mv-devtools-toggle")!;
    expect(btn.hidden).toBe(false);
    // branded: the inlined Michi shield plus an accessible name and a hotkey hint
    expect(btn.querySelector("img")?.getAttribute("src") ?? "").toContain("data:image/png");
    expect(btn.getAttribute("aria-label")?.toLowerCase()).toContain("devtools");
    expect(btn.title).toContain("Ctrl/Cmd+Shift+M");
    dt.destroy();
  });

  it("clicking the button opens the panel; isOpen() tracks open/close/toggle", () => {
    const dt = mountDevtools();
    const r = root(dt);
    const btn = q(r, ".mv-devtools-toggle")!;
    btn.click();
    expect(dt.isOpen()).toBe(true);
    expect(q(r, ".mv-devtools")!.hidden).toBe(false);
    expect(btn.hidden).toBe(true);
    dt.close();
    expect(dt.isOpen()).toBe(false);
    dt.toggle();
    expect(dt.isOpen()).toBe(true);
    dt.destroy();
  });

  it("remembers the last open/closed state across mounts", () => {
    const dt = mountDevtools();
    dt.open();
    dt.destroy();
    const dt2 = mountDevtools();
    expect(dt2.isOpen()).toBe(true);
    dt2.close();
    dt2.destroy();
    const dt3 = mountDevtools();
    expect(dt3.isOpen()).toBe(false);
    dt3.destroy();
  });

  it("an explicit open option beats the remembered state", () => {
    localStorage.setItem("michi-vz-devtools-open", "1");
    const dt = mountDevtools({ open: false });
    expect(dt.isOpen()).toBe(false);
    dt.destroy();
    localStorage.setItem("michi-vz-devtools-open", "0");
    const dt2 = mountDevtools({ open: true });
    expect(dt2.isOpen()).toBe(true);
    dt2.destroy();
  });

  it("buttonPosition picks the starting corner (default bottom-right)", () => {
    const dt = mountDevtools({ buttonPosition: "top-left" });
    expect(q(root(dt), ".mv-devtools-toggle")!.classList.contains("is-top-left")).toBe(true);
    dt.destroy();
    const dt2 = mountDevtools();
    expect(q(root(dt2), ".mv-devtools-toggle")!.classList.contains("is-bottom-right")).toBe(true);
    dt2.destroy();
  });

  it("dragging the button moves it, persists the spot, and swallows the trailing click", () => {
    const dt = mountDevtools();
    const r = root(dt);
    const btn = q(r, ".mv-devtools-toggle")!;

    btn.dispatchEvent(new MouseEvent("mousedown", { clientX: 700, clientY: 500, bubbles: true }));
    window.dispatchEvent(new MouseEvent("mousemove", { clientX: 100, clientY: 80 }));
    window.dispatchEvent(new MouseEvent("mouseup", {}));
    // the click a real browser fires after a drag-release must not toggle the panel
    btn.click();
    expect(dt.isOpen()).toBe(false);

    expect(btn.style.left).toContain("px");
    expect(btn.style.top).toContain("px");
    const saved = JSON.parse(localStorage.getItem("michi-vz-devtools-btn") ?? "{}");
    expect(typeof saved.left).toBe("number");
    expect(typeof saved.top).toBe("number");
    const left = btn.style.left;
    dt.destroy();

    // a fresh mount restores the dragged position
    const dt2 = mountDevtools();
    const btn2 = q(root(dt2), ".mv-devtools-toggle")!;
    expect(btn2.style.left).toBe(left);
    dt2.destroy();
  });

  it("a sub-threshold press still counts as a click and opens the panel", () => {
    const dt = mountDevtools();
    const r = root(dt);
    const btn = q(r, ".mv-devtools-toggle")!;
    btn.dispatchEvent(new MouseEvent("mousedown", { clientX: 700, clientY: 500, bubbles: true }));
    window.dispatchEvent(new MouseEvent("mousemove", { clientX: 701, clientY: 501 }));
    window.dispatchEvent(new MouseEvent("mouseup", {}));
    btn.click();
    expect(dt.isOpen()).toBe(true);
    // a jitter-press must not persist a position
    expect(localStorage.getItem("michi-vz-devtools-btn")).toBeNull();
    dt.destroy();
  });
});

// Two plain squares for the choropleth scale / ramp tests.
const squares: GeoFeatureItem[] = [
  {
    id: "A",
    name: "Alpha",
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [-10, 0],
          [-5, 0],
          [-5, 5],
          [-10, 5],
          [-10, 0],
        ],
      ],
    },
  },
  {
    id: "B",
    name: "Beta",
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [10, 0],
          [15, 0],
          [15, 5],
          [10, 5],
          [10, 0],
        ],
      ],
    },
  },
];

describe("devtools discovery, refresh, scales, diff and a11y fixes", () => {
  beforeEach(() => {
    g.__MICHI_VZ_DEVTOOLS__ = undefined;
    g.__MICHI_VZ_DEVTOOLS_HOOK__ = undefined;
    document.body.innerHTML = "";
    clearDevtoolsStorage();
  });
  afterEach(() => {
    document.body.innerHTML = "";
    clearDevtoolsStorage();
  });

  type WcLike = HTMLElement & { getContext?: () => ChartContext | null };

  // A real <michi-vz-*> element: no class of its own; the engine's host is the inner
  // div.mv-host that carries the michi-vz classes (and has no getContext).
  function wcElement(
    tag: string,
    getContext: () => ChartContext | null,
  ): { node: WcLike; inner: HTMLDivElement } {
    const node = document.createElement(tag) as WcLike;
    node.getContext = getContext;
    const inner = document.createElement("div");
    inner.className = `mv-host michi-vz michi-vz-${tag.replace(/^michi-vz-/, "")}`;
    node.append(inner);
    document.body.append(node);
    return { node, inner };
  }

  const pieCtx = (summary: string) =>
    ({ chartType: "pie-chart", renderer: "svg", summary }) as unknown as ChartContext;

  it("finds a <michi-vz-*> element that mounted before devtools, through its inner .michi-vz host", () => {
    wcElement("michi-vz-pie-chart", () => pieCtx("Pie chart."));
    const dt = mountDevtools({ open: true });
    const r = root(dt);
    expect(q(r, ".mv-devtools-count")?.textContent).toContain("1 chart");
    expect(q(r, ".mv-devtools-list")?.textContent).toContain("pie-chart");
    dt.destroy();
  });

  it("lists a hooked web component once, not twice", () => {
    const dt = mountDevtools({ open: true });
    const r = root(dt);
    const { node, inner } = wcElement("michi-vz-line-chart", () => null);
    const chart = mountLineChart(inner, props);
    node.getContext = () => chart.getContext();
    dt.refresh();
    expect(q(r, ".mv-devtools-count")?.textContent).toContain("1 chart");
    chart.destroy();
    dt.destroy();
  });

  it("keeps a DOM-found chart's id when an earlier sibling is removed", () => {
    const lineCtx = (label: string) =>
      ({
        chartType: "line-chart",
        renderer: "svg",
        summary: `${label} chart.`,
        legendData: [{ label, color: "#123456" }],
      }) as unknown as ChartContext;
    const a = wcElement("michi-vz-line-chart", () => lineCtx("A-series"));
    wcElement("michi-vz-line-chart", () => lineCtx("B-series"));
    const dt = mountDevtools({ open: true });
    const r = root(dt);
    const ids = () =>
      Array.from(r.querySelectorAll(".mv-devtools-item")).map(
        (i) => i.lastElementChild?.textContent ?? "",
      );
    const [idA, idB] = ids();
    expect(idA).not.toBe(idB);
    a.node.remove();
    dt.refresh();
    expect(ids()).toEqual([idB]);
    // B's own History (one snapshot), not A's snapshot followed by B's.
    expect(q(r, ".mv-devtools-history")).toBeNull();
    // The controls were rebuilt for B, not left wired to the removed A.
    const h = Array.from(r.querySelectorAll("h4")).find((x) => x.textContent === "Highlight");
    const labels = Array.from(h?.nextElementSibling?.querySelectorAll("label.chk") ?? []).map(
      (l) => l.textContent,
    );
    expect(labels).toEqual(["B-series"]);
    dt.destroy();
  });

  it("gives a DOM-found chart its element id, and a later element with the same id its own", () => {
    const first = wcElement("michi-vz-pie-chart", () => pieCtx("First."));
    first.node.id = "sales";
    const dt = mountDevtools({ open: true });
    const r = root(dt);
    const ids = () =>
      Array.from(r.querySelectorAll(".mv-devtools-item")).map(
        (i) => i.lastElementChild?.textContent ?? "",
      );
    expect(ids()).toEqual(["michi-vz-pie-chart#sales"]);
    first.node.remove();
    const second = wcElement("michi-vz-pie-chart", () => pieCtx("Second."));
    second.node.id = "sales";
    dt.refresh();
    expect(ids()).toHaveLength(1);
    expect(ids()[0]).not.toBe("michi-vz-pie-chart#sales");
    expect(ids()[0]).toContain("#sales");
    dt.destroy();
  });

  it("gives every DOM-found chart its own id when an element id matches a generated one", () => {
    // A duplicate "sales" must not be numbered into "sales-1", another element's own
    // id, whichever of the two the panel meets first.
    for (const order of [
      ["sales", "sales", "sales-1"],
      ["sales-1", "sales", "sales"],
    ]) {
      document.body.innerHTML = "";
      for (const own of order) {
        wcElement("michi-vz-pie-chart", () => pieCtx(`${own}.`)).node.id = own;
      }
      const dt = mountDevtools({ open: true });
      const r = root(dt);
      const ids = () =>
        Array.from(r.querySelectorAll(".mv-devtools-item")).map(
          (i) => i.lastElementChild?.textContent ?? "",
        );
      const first = ids();
      expect(first).toHaveLength(3);
      expect(new Set(first).size).toBe(3);
      // The first element with each id is listed under it.
      order.forEach((own, k) => {
        if (order.indexOf(own) === k) expect(first[k]).toBe(`michi-vz-pie-chart#${own}`);
      });
      dt.refresh();
      expect(ids()).toEqual(first);
      dt.destroy();
    }
  });

  it("handle.refresh() records a History snapshot", () => {
    let summary = "Pie chart v1.";
    wcElement("michi-vz-pie-chart", () => pieCtx(summary));
    const dt = mountDevtools({ open: true });
    const r = root(dt);
    summary = "Pie chart v2.";
    dt.refresh();
    expect(q(r, ".mv-devtools-history")?.textContent).toContain("2/2");
    dt.destroy();
  });

  function mountHost(): HTMLDivElement {
    const host = document.createElement("div");
    document.body.appendChild(host);
    return host;
  }

  it("Scales tab shows the radar's radial domain [0, maxValue]", () => {
    const dt = mountDevtools({ open: true });
    const r = root(dt);
    const chart = mountRadarChart(mountHost(), {
      series: [
        { label: "Model A", values: [8, 6, 7] },
        { label: "Model B", values: [5, 9, 6] },
      ],
      axes: ["Speed", "Power", "Range"],
      width: 400,
      height: 400,
    });
    clickTab(r, "Scales");
    const text = q(r, ".mv-devtools-detail")?.textContent ?? "";
    expect(text.toLowerCase()).not.toContain("no axis scales");
    expect(text).toContain("[0,9]");
    chart.destroy();
    dt.destroy();
  });

  it("Scales tab shows the gauge's [min, max]", () => {
    const dt = mountDevtools({ open: true });
    const r = root(dt);
    const chart = mountGaugeChart(mountHost(), {
      dataSet: [{ label: "World", value: 40 }],
      min: 10,
      max: 200,
      width: 200,
      height: 200,
    });
    clickTab(r, "Scales");
    const text = q(r, ".mv-devtools-detail")?.textContent ?? "";
    expect(text.toLowerCase()).not.toContain("no axis scales");
    expect(text).toContain("[10,200]");
    chart.destroy();
    dt.destroy();
  });

  it("Scales tab shows a choropleth's value domain", () => {
    const dt = mountDevtools({ open: true });
    const r = root(dt);
    const chart = mountChoroplethMapChart(mountHost(), {
      geography: squares,
      dataSet: [
        { id: "A", label: "Alpha", value: 3 },
        { id: "B", label: "Beta", value: 9 },
      ],
      width: 400,
      height: 300,
    });
    clickTab(r, "Scales");
    const text = q(r, ".mv-devtools-detail")?.textContent ?? "";
    expect(text.toLowerCase()).not.toContain("no axis scales");
    expect(text).toContain("[3,9]");
    chart.destroy();
    dt.destroy();
  });

  it("Scales tab shows a symbol map's colorScale thresholds", () => {
    const dt = mountDevtools({ open: true });
    const r = root(dt);
    const chart = mountSymbolMapChart(mountHost(), {
      dataSet: [
        { id: "usa", label: "United States", lng: -95, lat: 37, value: 100 },
        { id: "vnm", label: "Vietnam", lng: 106, lat: 16, value: 20 },
      ],
      colorScale: { domain: [30, 70], range: ["#f2f0f7", "#9e9ac8", "#54278f"] },
      width: 600,
      height: 400,
    });
    clickTab(r, "Scales");
    const text = q(r, ".mv-devtools-detail")?.textContent ?? "";
    expect(text.toLowerCase()).not.toContain("no axis scales");
    expect(text).toContain("[30,70]");
    chart.destroy();
    dt.destroy();
  });

  it("Diff tab reads a re-rank as one reorder, matching series by label", () => {
    const dt = mountDevtools({ open: true });
    const r = root(dt);
    const two: LineChartProps = {
      ...props,
      dataSet: [
        { label: "A", series: [{ date: 2020, value: 1, certainty: true }] },
        { label: "B", series: [{ date: 2020, value: 2, certainty: true }] },
      ],
      colorsMapping: { A: "#1f77b4", B: "#d62728" },
    };
    const chart = mountLineChart(mountHost(), two);
    chart.update({ ...two, dataSet: [two.dataSet[1], two.dataSet[0]] });
    clickTab(r, "Diff");
    const text = q(r, ".mv-devtools-detail")?.textContent ?? "";
    expect(text).toContain("reordered");
    expect(text).not.toContain("series[0]");
    chart.destroy();
    dt.destroy();
  });

  it("A11y tab audits a choropleth's colour ramp and reads noDataColor from props", () => {
    const dt = mountDevtools({ open: true });
    const r = root(dt);
    const chart = mountChoroplethMapChart(mountHost(), {
      geography: squares,
      dataSet: [
        { id: "A", label: "Alpha", value: 3 },
        { id: "B", label: "Beta", value: 3 },
      ],
      colorScale: { domain: [5], range: ["#f2f0f7", "#54278f"] },
      noDataColor: "#f2f0f7",
      width: 400,
      height: 300,
    });
    clickTab(r, "A11y");
    const text = q(r, ".mv-devtools-detail")?.textContent ?? "";
    expect(text).not.toContain("same color");
    expect(text).toContain("noDataColor");
    chart.destroy();
    dt.destroy();
  });
});

describe("devtools Items table and context-driven controls", () => {
  beforeEach(() => {
    g.__MICHI_VZ_DEVTOOLS__ = undefined;
    g.__MICHI_VZ_DEVTOOLS_HOOK__ = undefined;
    document.body.innerHTML = "";
    clearDevtoolsStorage();
  });
  afterEach(() => {
    document.body.innerHTML = "";
    clearDevtoolsStorage();
  });

  function mountHost(): HTMLDivElement {
    const host = document.createElement("div");
    document.body.appendChild(host);
    return host;
  }
  const items = (r: ShadowRoot): HTMLTableElement | null =>
    r.querySelector<HTMLTableElement>(".mv-devtools-items table");
  const columnValues = (r: ShadowRoot, col: string): string[] => {
    const t = items(r)!;
    const heads = Array.from(t.querySelectorAll("th")).map((th) => th.dataset.col);
    const i = heads.indexOf(col);
    return Array.from(t.querySelectorAll("tbody tr")).map(
      (tr) => (tr.children[i] as HTMLElement).textContent ?? "",
    );
  };
  const checkboxLabels = (r: ShadowRoot, heading: string): string[] => {
    const h = Array.from(r.querySelectorAll("h4")).find((x) => x.textContent === heading);
    const row = h?.nextElementSibling;
    return Array.from(row?.querySelectorAll("label.chk") ?? []).map((l) => l.textContent ?? "");
  };
  const entry = () => [...getDevtoolsHook()!.charts.values()][0];

  const area: AreaChartProps = {
    series: [
      { date: 2020, a: 1, b: 2 },
      { date: 2021, a: 2, b: 3 },
    ],
    keys: ["a", "b"],
    width: 400,
    height: 200,
    xAxisDataType: "number",
  };

  it("fills the Items rows and the controls for a chart whose series use `key`", () => {
    const dt = mountDevtools({ open: true });
    const r = root(dt);
    const chart = mountAreaChart(mountHost(), area);
    expect(columnValues(r, "key")).toEqual(["a", "b"]);
    expect(columnValues(r, "total")).toEqual(["3", "5"]);
    expect(checkboxLabels(r, "Highlight")).toEqual(["a", "b"]);
    expect(checkboxLabels(r, "Disable")).toEqual(["a", "b"]);
    chart.destroy();
    dt.destroy();
  });

  it("Disable keeps the series it disabled after the controls rebuild", () => {
    const dt = mountDevtools({ open: true });
    const r = root(dt);
    const chart = mountLineChart(mountHost(), {
      ...props,
      dataSet: [
        { label: "A", series: [{ date: 2020, value: 1, certainty: true }] },
        { label: "B", series: [{ date: 2020, value: 2, certainty: true }] },
      ],
    });
    const h = Array.from(r.querySelectorAll("h4")).find((x) => x.textContent === "Disable")!;
    const cb = h.nextElementSibling!.querySelector<HTMLInputElement>("input")!;
    cb.checked = true;
    cb.dispatchEvent(new Event("change"));
    clickTab(r, "Scales");
    clickTab(r, "Overview");
    expect(checkboxLabels(r, "Disable")).toEqual(["A", "B"]);
    const boxes = Array.from(
      Array.from(r.querySelectorAll("h4"))
        .find((x) => x.textContent === "Disable")!
        .nextElementSibling!.querySelectorAll<HTMLInputElement>("input"),
    );
    expect(boxes.map((b) => b.checked)).toEqual([true, false]);
    chart.destroy();
    dt.destroy();
  });

  // A fountain-shaped context in trend mode: a `jets` array, no `series`, no legendData.
  const jetsCtx = {
    chartType: "fountain-chart",
    renderer: "svg",
    summary: "Fountain chart.",
    colorsMapping: { Car: "#3f7fb8", Bus: "#d62728", Train: "#2ca02c" },
    jets: [
      {
        label: "Car",
        code: "car",
        color: "#3f7fb8",
        value: 30,
        low: 22,
        high: 55,
        range: 33,
        sampleCount: 20,
        predicted: false,
      },
      {
        label: "Bus",
        code: "bus",
        color: "#d62728",
        value: 40,
        low: 32,
        high: 65,
        range: 33.5,
        sampleCount: 20,
        predicted: false,
      },
      {
        label: "Train",
        code: "train",
        color: "#2ca02c",
        value: 35,
        low: 32,
        high: 42,
        range: 10,
        sampleCount: 20,
        predicted: true,
      },
    ],
    stats: { jetCount: 3 },
  } as unknown as ChartContext;

  function jetsElement(): void {
    const node = document.createElement("michi-vz-fountain-chart") as HTMLElement & {
      getContext?: () => ChartContext;
    };
    node.getContext = () => jetsCtx;
    const inner = document.createElement("div");
    inner.className = "mv-host michi-vz michi-vz-fountain-chart";
    node.append(inner);
    document.body.append(node);
  }

  it("builds the Items table from any per-item array (a fountain's jets)", () => {
    jetsElement();
    const dt = mountDevtools({ open: true });
    const r = root(dt);
    expect(columnValues(r, "label")).toEqual(["Car", "Bus", "Train"]);
    const heads = Array.from(items(r)!.querySelectorAll("th")).map((th) => th.dataset.col);
    for (const col of ["code", "value", "low", "high", "range", "sampleCount", "predicted"]) {
      expect(heads).toContain(col);
    }
    // no legendData: labels come from colorsMapping
    expect(checkboxLabels(r, "Highlight")).toEqual(["Car", "Bus", "Train"]);
    dt.destroy();
  });

  it("sorts the Items table by a column, ascending then descending", () => {
    jetsElement();
    const dt = mountDevtools({ open: true });
    const r = root(dt);
    const th = () =>
      Array.from(items(r)!.querySelectorAll<HTMLElement>("th")).find(
        (x) => x.dataset.col === "range",
      )!;
    th().click();
    expect(columnValues(r, "label")).toEqual(["Train", "Car", "Bus"]);
    th().click();
    expect(columnValues(r, "label")).toEqual(["Bus", "Car", "Train"]);
    dt.destroy();
  });

  it("offers every per-item array in a dropdown (sankey nodes and links)", () => {
    const dt = mountDevtools({ open: true });
    const r = root(dt);
    const chart = mountSankeyChart(mountHost(), {
      nodes: [{ id: "x" }, { id: "y" }],
      links: [{ source: "x", target: "y", value: 3 }],
      width: 400,
      height: 200,
    });
    const select = r.querySelector<HTMLSelectElement>(".mv-devtools-items select")!;
    expect(Array.from(select.options).map((o) => o.value)).toEqual(["nodes", "links"]);
    expect(columnValues(r, "id")).toEqual(["x", "y"]);
    select.value = "links";
    select.dispatchEvent(new Event("change"));
    expect(columnValues(r, "source")).toEqual(["x"]);
    chart.destroy();
    dt.destroy();
  });

  it("hovering an Items row highlights it on the chart, leaving restores", () => {
    const dt = mountDevtools({ open: true });
    const r = root(dt);
    const chart = mountLineChart(mountHost(), {
      ...props,
      dataSet: [
        { label: "A", series: [{ date: 2020, value: 1, certainty: true }] },
        { label: "B", series: [{ date: 2020, value: 2, certainty: true }] },
      ],
    });
    const rowB = Array.from(items(r)!.querySelectorAll("tbody tr"))[1];
    rowB.dispatchEvent(new MouseEvent("mouseenter"));
    expect((entry().getProps() as LineChartProps).highlightItems).toEqual(["B"]);
    items(r)!.dispatchEvent(new MouseEvent("mouseleave"));
    // Back to exactly what the app passed: it never set highlightItems.
    expect((entry().getProps() as LineChartProps).highlightItems).toBeUndefined();
    chart.destroy();
    dt.destroy();
  });

  it("leaving the Items table restores the app's own highlight", () => {
    const dt = mountDevtools({ open: true });
    const r = root(dt);
    const chart = mountLineChart(mountHost(), {
      ...props,
      highlightItems: ["A"],
      dataSet: [
        { label: "A", series: [{ date: 2020, value: 1, certainty: true }] },
        { label: "B", series: [{ date: 2020, value: 2, certainty: true }] },
      ],
    });
    Array.from(items(r)!.querySelectorAll("tbody tr"))[1].dispatchEvent(
      new MouseEvent("mouseenter"),
    );
    expect((entry().getProps() as LineChartProps).highlightItems).toEqual(["B"]);
    items(r)!.dispatchEvent(new MouseEvent("mouseleave"));
    expect((entry().getProps() as LineChartProps).highlightItems).toEqual(["A"]);
    chart.destroy();
    dt.destroy();
  });

  const manySeries = (n: number, bump = 0): LineChartProps["dataSet"] =>
    Array.from({ length: n }, (_, i) => ({
      label: `S${i}`,
      series: [{ date: 2020, value: i + bump, certainty: true }],
    }));
  const historyPos = (r: ShadowRoot): string =>
    r.querySelector(".mv-devtools-history")?.textContent ?? "";

  it("does not record the panel's own Items-row hovers in History", () => {
    const dt = mountDevtools({ open: true });
    const r = root(dt);
    const chart = mountLineChart(mountHost(), { ...props, dataSet: manySeries(40) });
    chart.update({ ...props, dataSet: manySeries(40, 100) });
    expect(historyPos(r)).toContain("2/2");
    const rows = () => Array.from(items(r)!.querySelectorAll("tbody tr"));
    for (let i = 0; i < 40; i++) rows()[i].dispatchEvent(new MouseEvent("mouseenter"));
    expect(historyPos(r)).toContain("2/2");
    items(r)!.dispatchEvent(new MouseEvent("mouseleave"));
    expect(historyPos(r)).toContain("2/2");
    clickTab(r, "Diff");
    const diff = r.querySelector(".mv-devtools-detail")?.textContent ?? "";
    expect(diff).toContain("Snapshot 1 → 2");
    expect(diff).not.toContain("props.highlightItems");
    chart.destroy();
    dt.destroy();
    // 40 hovers each re-render a 40-series line chart: slow under a parallel suite.
  }, 20_000);

  it("does not record a hover when another chart's update refreshes the panel mid-hover", () => {
    const dt = mountDevtools({ open: true });
    const r = root(dt);
    const chart = mountLineChart(mountHost(), { ...props, dataSet: manySeries(3) });
    const other = mountLineChart(mountHost(), props);
    expect(historyPos(r)).toBe("");
    Array.from(items(r)!.querySelectorAll("tbody tr"))[1].dispatchEvent(
      new MouseEvent("mouseenter"),
    );
    other.update({ ...props, title: "Other" });
    expect(historyPos(r)).toBe("");
    items(r)!.dispatchEvent(new MouseEvent("mouseleave"));
    other.update({ ...props, title: "Other again" });
    expect(historyPos(r)).toBe("");
    chart.destroy();
    other.destroy();
    dt.destroy();
  });

  it("still records an explicit Highlight toggle in History", () => {
    const dt = mountDevtools({ open: true });
    const r = root(dt);
    const chart = mountLineChart(mountHost(), { ...props, dataSet: manySeries(3) });
    const h = Array.from(r.querySelectorAll("h4")).find((x) => x.textContent === "Highlight")!;
    const cb = h.nextElementSibling!.querySelector<HTMLInputElement>("input[type=checkbox]")!;
    cb.checked = true;
    cb.dispatchEvent(new Event("change"));
    expect(historyPos(r)).toContain("2/2");
    chart.destroy();
    dt.destroy();
  });

  it("edits whichever data prop the chart has (area: series) and Reset restores it", () => {
    const dt = mountDevtools({ open: true });
    const r = root(dt);
    const chart = mountAreaChart(mountHost(), area);
    const heading = Array.from(r.querySelectorAll("h4")).find(
      (x) => x.textContent === "Edit series",
    );
    expect(heading).toBeDefined();
    const ta = r.querySelector<HTMLTextAreaElement>("textarea")!;
    ta.value = JSON.stringify([{ date: 2020, a: 10, b: 2 }]);
    Array.from(r.querySelectorAll<HTMLButtonElement>(".mv-devtools-btn"))
      .find((b) => b.textContent === "Apply")!
      .click();
    let ctx = chart.getContext() as unknown as { series: Array<{ key: string; total: number }> };
    expect(ctx.series.find((s) => s.key === "a")?.total).toBe(10);
    Array.from(r.querySelectorAll<HTMLButtonElement>(".mv-devtools-btn"))
      .find((b) => b.textContent === "Reset chart")!
      .click();
    ctx = chart.getContext() as unknown as { series: Array<{ key: string; total: number }> };
    expect(ctx.series.find((s) => s.key === "a")?.total).toBe(3);
    chart.destroy();
    dt.destroy();
  });

  it("edits a sankey's nodes and links together", () => {
    const dt = mountDevtools({ open: true });
    const r = root(dt);
    const chart = mountSankeyChart(mountHost(), {
      nodes: [{ id: "x" }, { id: "y" }],
      links: [{ source: "x", target: "y", value: 3 }],
      width: 400,
      height: 200,
    });
    const heading = Array.from(r.querySelectorAll("h4")).find(
      (x) => x.textContent === "Edit nodes + links",
    );
    expect(heading).toBeDefined();
    const ta = r.querySelector<HTMLTextAreaElement>("textarea")!;
    ta.value = JSON.stringify({
      nodes: [{ id: "x" }, { id: "y" }, { id: "z" }],
      links: [
        { source: "x", target: "y", value: 3 },
        { source: "x", target: "z", value: 2 },
      ],
    });
    Array.from(r.querySelectorAll<HTMLButtonElement>(".mv-devtools-btn"))
      .find((b) => b.textContent === "Apply")!
      .click();
    const ctx = chart.getContext() as unknown as { nodes: unknown[]; links: unknown[] };
    expect(ctx.nodes).toHaveLength(3);
    expect(ctx.links).toHaveLength(2);
    chart.destroy();
    dt.destroy();
  });
});

describe("devtools Props tab and prop-aware History", () => {
  beforeEach(() => {
    g.__MICHI_VZ_DEVTOOLS__ = undefined;
    g.__MICHI_VZ_DEVTOOLS_HOOK__ = undefined;
    document.body.innerHTML = "";
    clearDevtoolsStorage();
  });
  afterEach(() => {
    document.body.innerHTML = "";
    clearDevtoolsStorage();
  });

  function mountWith(extra: Partial<LineChartProps> = {}) {
    const dt = mountDevtools({ open: true });
    const r = root(dt);
    const host = document.createElement("div");
    document.body.appendChild(host);
    const chart = mountLineChart(host, { ...props, ...extra });
    return { dt, r, chart };
  }
  const detail = (r: ShadowRoot): string => q(r, ".mv-devtools-detail")?.textContent ?? "";

  it("shows the getProps() tree with data arrays collapsed and functions named", () => {
    const { dt, r, chart } = mountWith({
      onHighlightItem: function onHover() {},
      yAxisFormat: (n: number) => String(n),
      margin: { top: 10, right: 20, bottom: 30, left: 40 },
    });
    clickTab(r, "Props");
    const text = detail(r);
    expect(text).toContain("width");
    expect(text).toContain("400");
    expect(text).toContain("Array(1)");
    expect(text).not.toContain("Revenue"); // the data stays collapsed
    expect(text).toContain("ƒ onHover");
    expect(text).toContain("ƒ yAxisFormat");
    expect(text).toContain('"left":40');
    chart.destroy();
    dt.destroy();
  });

  it("says that a wrapper's next render overwrites panel edits", () => {
    const { dt, r, chart } = mountWith();
    clickTab(r, "Props");
    expect(detail(r).toLowerCase()).toContain("overwrite");
    chart.destroy();
    dt.destroy();
  });

  it("records a prop-only update in History and shows it in Diff", () => {
    const { dt, r, chart } = mountWith();
    chart.update({ ...props, highlightItems: ["Revenue"] });
    expect(q(r, ".mv-devtools-history")?.textContent).toContain("2/2");
    clickTab(r, "Diff");
    expect(detail(r)).toContain("props.highlightItems");
    chart.destroy();
    dt.destroy();
  });

  it("warns when highlightItems churns more than 10 times a second, naming it", () => {
    const { dt, r, chart } = mountWith();
    clickTab(r, "Props");
    expect(q(r, ".mv-devtools-flag.warn")).toBeNull();
    for (let i = 0; i < 12; i++) {
      chart.update({ ...props, highlightItems: i % 2 ? ["Revenue"] : [] });
    }
    clickTab(r, "Props");
    const warn = q(r, ".mv-devtools-flag.warn");
    expect(warn).not.toBeNull();
    expect(warn!.textContent).toContain("highlightItems changed");
    expect(warn!.textContent).toContain("hoverHighlight");
    chart.destroy();
    dt.destroy();
  });

  // Updates spread one frame apart (Date.now stepped 16 ms), as a resize or a drag
  // produces them. The steps start from the real clock, so a burst they record is
  // still inside the warning's quiet period when the test reads the Props tab.
  function perFrame(count: number, update: (i: number) => void): void {
    let now = Date.now();
    const spy = vi.spyOn(Date, "now").mockImplementation(() => now);
    try {
      for (let i = 0; i < count; i++) {
        now += 16;
        update(i);
      }
    } finally {
      spy.mockRestore();
    }
  }

  it("does not warn about churn when a resize changes width on every frame", () => {
    const { dt, r, chart } = mountWith();
    perFrame(20, (i) => chart.update({ ...props, width: 400 + 5 * i }));
    clickTab(r, "Props");
    expect(q(r, ".mv-devtools-flag.warn")).toBeNull();
    chart.destroy();
    dt.destroy();
  });

  it("does not warn about churn when a slider drags another prop", () => {
    const { dt, r, chart } = mountWith();
    perFrame(20, (i) =>
      chart.update({ ...props, margin: { top: 10, right: 10, bottom: 30, left: 20 + i } }),
    );
    clickTab(r, "Props");
    expect(q(r, ".mv-devtools-flag.warn")).toBeNull();
    chart.destroy();
    dt.destroy();
  });

  // Two series whose values move on every frame at the same length, as a timeline
  // or play animation passes them.
  const frameData = (i: number): LineChartProps["dataSet"] => [
    {
      label: "A",
      series: [
        { date: 2020, value: 100 + i, certainty: true },
        { date: 2021, value: 110 + (i % 2 ? 20 : -20), certainty: true },
      ],
    },
    {
      label: "B",
      series: [
        { date: 2020, value: 105 - i, certainty: true },
        { date: 2021, value: 110 + (i % 2 ? -20 : 20), certainty: true },
      ],
    },
  ];

  it("does not warn about churn when an animation moves dataSet values and highlights the leader", () => {
    const { dt, r, chart } = mountWith({ dataSet: frameData(0) });
    perFrame(20, (i) =>
      chart.update({ ...props, dataSet: frameData(i + 1), highlightItems: [i % 2 ? "A" : "B"] }),
    );
    clickTab(r, "Props");
    expect(q(r, ".mv-devtools-flag.warn")).toBeNull();
    chart.destroy();
    dt.destroy();
  });

  it("does not warn about churn when a slider changes a prop object in place", () => {
    const margin = { top: 10, right: 10, bottom: 30, left: 20 };
    const { dt, r, chart } = mountWith({ margin });
    perFrame(20, (i) => {
      margin.left = 21 + i;
      chart.update({ ...props, margin, highlightItems: [i % 2 ? "Revenue" : "Cost"] });
    });
    clickTab(r, "Props");
    expect(q(r, ".mv-devtools-flag.warn")).toBeNull();
    chart.destroy();
    dt.destroy();
  });

  it("still warns when each echo passes equal but new data and a fresh callback, as a render does", () => {
    const { dt, r, chart } = mountWith({ dataSet: frameData(0) });
    perFrame(20, (i) =>
      chart.update({
        ...props,
        dataSet: frameData(0),
        margin: { top: 10, right: 10, bottom: 30, left: 20 },
        onHighlightItem: (labels: string[]) => void labels,
        highlightItems: [i % 2 ? "A" : "B"],
      }),
    );
    clickTab(r, "Props");
    expect(q(r, ".mv-devtools-flag.warn")?.textContent).toContain("highlightItems changed");
    chart.destroy();
    dt.destroy();
  });

  it("names the prop that churned: disabledItems", () => {
    const { dt, r, chart } = mountWith();
    for (let i = 0; i < 12; i++) {
      chart.update({ ...props, disabledItems: i % 2 ? ["Revenue"] : [] });
    }
    clickTab(r, "Props");
    const warn = q(r, ".mv-devtools-flag.warn");
    expect(warn).not.toBeNull();
    expect(warn!.textContent).toContain("disabledItems changed");
    expect(warn!.textContent).not.toContain("highlightItems changed");
    chart.destroy();
    dt.destroy();
  });

  it("clears the churn warning after a quiet spell", () => {
    const { dt, r, chart } = mountWith();
    let now = 5_000_000;
    const spy = vi.spyOn(Date, "now").mockImplementation(() => now);
    try {
      for (let i = 0; i < 12; i++) {
        now += 16;
        chart.update({ ...props, highlightItems: i % 2 ? ["Revenue"] : [] });
      }
      clickTab(r, "Props");
      expect(q(r, ".mv-devtools-flag.warn")?.textContent).toContain("highlightItems changed");
      now += 60_000;
      clickTab(r, "Props");
      expect(q(r, ".mv-devtools-flag.warn")).toBeNull();
      // A few later changes start a new count instead of reviving the old burst.
      for (let i = 0; i < 3; i++) {
        now += 16;
        chart.update({ ...props, highlightItems: i % 2 ? [] : ["Revenue"] });
      }
      clickTab(r, "Props");
      expect(q(r, ".mv-devtools-flag.warn")).toBeNull();
    } finally {
      spy.mockRestore();
    }
    chart.destroy();
    dt.destroy();
  });

  it("does not count the panel's own Items-row hover as churn", () => {
    const { dt, r, chart } = mountWith({
      dataSet: [
        { label: "A", series: [{ date: 2020, value: 1, certainty: true }] },
        { label: "B", series: [{ date: 2020, value: 2, certainty: true }] },
      ],
    });
    const rows = () => Array.from(r.querySelectorAll(".mv-devtools-items tbody tr"));
    for (let i = 0; i < 12; i++) {
      rows()[i % 2].dispatchEvent(new MouseEvent("mouseenter"));
    }
    clickTab(r, "Props");
    expect(q(r, ".mv-devtools-flag.warn")).toBeNull();
    chart.destroy();
    dt.destroy();
  });
});

describe("devtools Hit-test tab: SVG inspector and honest empty states", () => {
  beforeEach(() => {
    g.__MICHI_VZ_DEVTOOLS__ = undefined;
    g.__MICHI_VZ_DEVTOOLS_HOOK__ = undefined;
    document.body.innerHTML = "";
    clearDevtoolsStorage();
  });
  afterEach(() => {
    document.body.innerHTML = "";
    clearDevtoolsStorage();
    delete (document as unknown as { elementsFromPoint?: unknown }).elementsFromPoint;
  });

  const pieData = [
    { label: "Apples", value: 3 },
    { label: "Pears", value: 5 },
  ];
  function mountPie(renderer: "svg" | "canvas") {
    const dt = mountDevtools({ open: true });
    const r = root(dt);
    const host = document.createElement("div");
    document.body.appendChild(host);
    const chart = mountPieChart(host, { dataSet: pieData, width: 300, height: 300, renderer });
    clickTab(r, "Hit-test");
    return { dt, r, host, chart };
  }
  const detail = (r: ShadowRoot): string => q(r, ".mv-devtools-detail")?.textContent ?? "";
  const settle = () => new Promise((res) => setTimeout(res, 150));

  it("says a canvas chart without a hit channel does not report hits (no dead-listener claim)", () => {
    const { dt, r, chart } = mountPie("canvas");
    const text = detail(r);
    expect(text).toContain("does not report canvas hits");
    expect(text).not.toContain("dead");
    chart.destroy();
    dt.destroy();
  });

  it("offers the SVG inspector on an svg chart, with its caveats", () => {
    const { dt, r, chart } = mountPie("svg");
    const text = detail(r);
    expect(text).toContain("SVG inspector");
    expect(text).toContain("colour key");
    expect(text).toContain("pointer-events");
    chart.destroy();
    dt.destroy();
  });

  it("logs the element under the pointer and its colour key", async () => {
    const { dt, r, host, chart } = mountPie("svg");
    const slice = host.querySelector<SVGElement>("[data-label-safe]")!;
    expect(slice).not.toBeNull();
    const key = slice.closest("[data-label-safe]")!.getAttribute("data-label-safe")!;
    slice.dispatchEvent(new MouseEvent("pointermove", { clientX: 20, clientY: 30, bubbles: true }));
    await settle();
    const log = q(r, ".mv-devtools-svglog");
    expect(log).not.toBeNull();
    expect(log!.textContent).toContain(slice.tagName.toLowerCase());
    expect(log!.textContent).toContain(key);
    chart.destroy();
    dt.destroy();
  });

  it("reads the topmost element from elementsFromPoint when the browser has it", async () => {
    const { dt, r, host, chart } = mountPie("svg");
    const slices = Array.from(host.querySelectorAll<SVGElement>("[data-label-safe]"));
    const top = slices[slices.length - 1];
    (document as unknown as { elementsFromPoint: () => Element[] }).elementsFromPoint = () => [
      top,
      host,
      document.body,
    ];
    host.dispatchEvent(new MouseEvent("pointermove", { clientX: 5, clientY: 5, bubbles: true }));
    await settle();
    expect(q(r, ".mv-devtools-svglog")?.textContent).toContain(
      top.closest("[data-label-safe]")!.getAttribute("data-label-safe")!,
    );
    chart.destroy();
    dt.destroy();
  });

  it("reads the colour key from the mark under a transparent hit target, naming both", async () => {
    const dt = mountDevtools({ open: true });
    const r = root(dt);
    const host = document.createElement("div");
    document.body.appendChild(host);
    const chart = mountSymbolMapChart(host, {
      dataSet: [
        { id: "usa", label: "United States", lng: -95, lat: 37, value: 100 },
        { id: "vnm", label: "Vietnam", lng: 106, lat: 16, value: 20 },
      ],
      width: 600,
      height: 400,
      renderer: "svg",
    });
    clickTab(r, "Hit-test");
    const hit = host.querySelector<SVGElement>("circle.symbol-hit")!;
    const mark = hit.parentElement!.querySelector<SVGElement>("circle.symbol")!;
    expect(hit.closest("[data-label-safe],[data-label]")).toBeNull();
    const key = mark.closest("[data-label-safe]")!.getAttribute("data-label-safe")!;
    (document as unknown as { elementsFromPoint: () => Element[] }).elementsFromPoint = () => [
      hit,
      mark,
      host,
      document.body,
    ];
    hit.dispatchEvent(new MouseEvent("pointermove", { clientX: 5, clientY: 5, bubbles: true }));
    await settle();
    const row = q(r, ".mv-devtools-svglog .row")?.textContent ?? "";
    expect(row).toContain("circle.symbol-hit");
    expect(row).toContain(" over circle.symbol");
    expect(row).toContain(`data-label-safe="${key}"`);
    expect(row).not.toContain("no colour key");
    chart.destroy();
    dt.destroy();
  });

  it("stops listening when the tab closes", async () => {
    const { dt, r, host, chart } = mountPie("svg");
    clickTab(r, "Overview");
    const slice = host.querySelector<SVGElement>("[data-label-safe]")!;
    slice.dispatchEvent(new MouseEvent("pointermove", { clientX: 1, clientY: 1, bubbles: true }));
    clickTab(r, "Hit-test");
    await settle();
    expect(q(r, ".mv-devtools-svglog")).toBeNull();
    chart.destroy();
    dt.destroy();
  });
});

describe("devtools panel follow-ups", () => {
  beforeEach(() => {
    g.__MICHI_VZ_DEVTOOLS__ = undefined;
    g.__MICHI_VZ_DEVTOOLS_HOOK__ = undefined;
    document.body.innerHTML = "";
    clearDevtoolsStorage();
  });
  afterEach(() => {
    document.body.innerHTML = "";
    clearDevtoolsStorage();
  });

  it("clears the Items table when the selected chart has no context yet", () => {
    const dt = mountDevtools({ open: true });
    const r = root(dt);
    const host = document.createElement("div");
    document.body.appendChild(host);
    const chart = mountLineChart(host, props);
    expect(r.querySelector(".mv-devtools-items table")).not.toBeNull();
    const node = document.createElement("michi-vz-pie-chart") as HTMLElement & {
      getContext?: () => ChartContext | null;
    };
    node.getContext = () => null;
    const inner = document.createElement("div");
    inner.className = "mv-host michi-vz michi-vz-pie-chart";
    node.append(inner);
    document.body.append(node);
    dt.refresh();
    const items = Array.from(r.querySelectorAll<HTMLElement>(".mv-devtools-item"));
    items.find((i) => i.textContent?.includes("pie-chart"))!.click();
    expect(r.querySelector(".mv-devtools-items table")).toBeNull();
    expect(q(r, ".mv-devtools-detail")?.textContent).not.toContain("ChartContext (raw)");
    chart.destroy();
    dt.destroy();
  });

  it("Props shows an object used by two props twice, not as circular", () => {
    const dt = mountDevtools({ open: true });
    const r = root(dt);
    const host = document.createElement("div");
    document.body.appendChild(host);
    const same = ["Revenue"];
    const chart = mountLineChart(host, { ...props, highlightItems: same, disabledItems: same });
    clickTab(r, "Props");
    expect(q(r, ".mv-devtools-detail")?.textContent).not.toContain("[circular]");
    chart.destroy();
    dt.destroy();
  });

  it("does not count the panel's own row hovers as churn on a page with many charts", () => {
    const dt = mountDevtools({ open: true });
    const r = root(dt);
    const charts = Array.from({ length: 9 }, () => {
      const host = document.createElement("div");
      document.body.appendChild(host);
      return mountLineChart(host, {
        ...props,
        dataSet: [
          { label: "A", series: [{ date: 2020, value: 1, certainty: true }] },
          { label: "B", series: [{ date: 2020, value: 2, certainty: true }] },
        ],
      });
    });
    dt.refresh();
    const rows = () => Array.from(r.querySelectorAll(".mv-devtools-items tbody tr"));
    for (let i = 0; i < 12; i++) rows()[i % 2].dispatchEvent(new MouseEvent("mouseenter"));
    clickTab(r, "Props");
    expect(q(r, ".mv-devtools-flag.warn")).toBeNull();
    for (const c of charts) c.destroy();
    dt.destroy();
  });

  it("warns about prop churn on a page with many charts, where refreshes are coalesced", () => {
    const dt = mountDevtools({ open: true });
    const r = root(dt);
    const charts = Array.from({ length: 9 }, () => {
      const host = document.createElement("div");
      document.body.appendChild(host);
      return mountLineChart(host, props);
    });
    dt.refresh();
    // The first chart in the list is the one the panel selects.
    const echo = charts[0];
    for (let i = 0; i < 12; i++) {
      echo.update({ ...props, highlightItems: i % 2 ? ["Revenue"] : [] });
    }
    clickTab(r, "Props");
    const warn = q(r, ".mv-devtools-flag.warn");
    expect(warn).not.toBeNull();
    expect(warn!.textContent).toContain("hoverHighlight");
    for (const c of charts) c.destroy();
    dt.destroy();
  });
});

describe("devtools per-chart state lifetime", () => {
  beforeEach(() => {
    g.__MICHI_VZ_DEVTOOLS__ = undefined;
    g.__MICHI_VZ_DEVTOOLS_HOOK__ = undefined;
    document.body.innerHTML = "";
    clearDevtoolsStorage();
  });
  afterEach(() => {
    document.body.innerHTML = "";
    clearDevtoolsStorage();
    delete (document as unknown as { elementsFromPoint?: unknown }).elementsFromPoint;
  });

  function mountHost(): HTMLDivElement {
    const host = document.createElement("div");
    document.body.appendChild(host);
    return host;
  }
  const sizes = (dt: DevtoolsHandle): Record<string, number> => panelStateSizes(dt)!;

  it("frees a destroyed chart's state: 40 mount/destroy cycles do not grow it", () => {
    const dt = mountDevtools({ open: true });
    const hook = getDevtoolsHook()!;
    const keep = mountLineChart(mountHost(), props);
    keep.update({ ...props, highlightItems: ["Revenue"] });
    const baseline = sizes(dt);
    expect(baseline.history).toBe(1);
    for (let i = 0; i < 40; i++) {
      const host = mountHost();
      const chart = mountLineChart(host, props);
      chart.update({ ...props, highlightItems: ["Revenue"] });
      hook.reportHit({ host, x: 1, y: 1, label: null, t: 0 });
      chart.destroy();
      host.remove();
    }
    dt.refresh();
    expect(sizes(dt)).toEqual(baseline);
    keep.destroy();
    dt.refresh();
    expect(Object.values(sizes(dt)).every((n) => n === 0)).toBe(true);
    dt.destroy();
  });

  it("frees the state of a DOM-found chart that left the page", () => {
    const node = document.createElement("michi-vz-pie-chart") as HTMLElement & {
      getContext?: () => ChartContext | null;
    };
    node.getContext = () =>
      ({ chartType: "pie-chart", renderer: "svg", summary: "Pie." }) as unknown as ChartContext;
    const inner = document.createElement("div");
    inner.className = "mv-host michi-vz michi-vz-pie-chart";
    node.append(inner);
    document.body.append(node);
    const dt = mountDevtools({ open: true });
    expect(sizes(dt).history).toBe(1);
    node.remove();
    dt.refresh();
    expect(Object.values(sizes(dt)).every((n) => n === 0)).toBe(true);
    dt.destroy();
  });

  it("drops SVG inspector events of a chart whose host left the page", async () => {
    const dt = mountDevtools({ open: true });
    const r = root(dt);
    const host = mountHost();
    const chart = mountPieChart(host, {
      dataSet: [
        { label: "Apples", value: 3 },
        { label: "Pears", value: 5 },
      ],
      width: 300,
      height: 300,
      renderer: "svg",
    });
    clickTab(r, "Hit-test");
    const slice = host.querySelector<SVGElement>("[data-label-safe]")!;
    slice.dispatchEvent(new MouseEvent("pointermove", { clientX: 5, clientY: 5, bubbles: true }));
    expect(sizes(dt).svgLog).toBe(1);
    chart.destroy();
    host.remove();
    dt.refresh();
    expect(sizes(dt).svgLog).toBe(0);
    dt.destroy();
  });
});
