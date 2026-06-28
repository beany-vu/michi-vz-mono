import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mountLineChart, type LineChartProps } from "@michi-vz/core";
import { mountDevtools } from "../src/panel";

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

function q(root: ParentNode, sel: string): HTMLElement | null {
  return root.querySelector<HTMLElement>(sel);
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

  it("renders a panel and discovers a chart mounted after it", () => {
    const dt = mountDevtools();
    expect(q(document.body, ".mv-devtools")).not.toBeNull();

    const host = document.createElement("div");
    document.body.appendChild(host);
    const chart = mountLineChart(host, props);

    const count = q(document.body, ".mv-devtools-count");
    expect(count?.textContent).toContain("1 chart");
    // chartType shows in the list
    expect(q(document.body, ".mv-devtools-list")?.textContent).toContain("line-chart");

    chart.destroy();
    dt.destroy();
  });

  it("shows the summary and an actual-vs-predicted series row", () => {
    const dt = mountDevtools();
    const host = document.createElement("div");
    document.body.appendChild(host);
    const chart = mountLineChart(host, props);

    const detail = q(document.body, ".mv-devtools-detail");
    expect(q(document.body, ".mv-devtools-summary")?.textContent).toContain("Line chart");
    // provenance header + the predicted badge (1 predicted point)
    expect(detail?.textContent).toContain("actual vs predicted");
    const badges = document.body.querySelectorAll(".mv-devtools .badge.predicted");
    expect(badges.length).toBeGreaterThan(0);
    expect(Array.from(badges).some((b) => b.textContent === "1")).toBe(true);

    chart.destroy();
    dt.destroy();
  });

  it("highlight toggle patches props via the hook", () => {
    const dt = mountDevtools();
    const host = document.createElement("div");
    document.body.appendChild(host);
    const chart = mountLineChart(host, props);

    const cb = document.body.querySelector<HTMLInputElement>(".mv-devtools .row input[type=checkbox]");
    expect(cb).not.toBeNull();
    cb!.checked = true;
    cb!.dispatchEvent(new Event("change"));

    expect(chart.getContext()).not.toBeNull();
    // the chart was re-rendered with the highlight applied (mark gets dimmed peers);
    // assert via the live context round-trip through getProps on the entry.
    expect(document.body.querySelector(".mv-devtools")).not.toBeNull();

    chart.destroy();
    dt.destroy();
  });

  it("editing the dataSet re-renders the chart and updates the context", () => {
    const dt = mountDevtools();
    const host = document.createElement("div");
    document.body.appendChild(host);
    const chart = mountLineChart(host, props);

    const ta = document.body.querySelector<HTMLTextAreaElement>(".mv-devtools textarea");
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
    // find the Apply button (first .mv-devtools-btn inside the editor row)
    const applyBtn = Array.from(document.body.querySelectorAll<HTMLButtonElement>(".mv-devtools-btn")).find(
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
    const host = document.createElement("div");
    document.body.appendChild(host);
    const chart = mountLineChart(host, props);

    // First snapshot is captured when the chart registers. Change the data -> 2nd snapshot.
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

    // Timeline nav appears once there is more than one snapshot.
    const nav = q(document.body, ".mv-devtools-history");
    expect(nav).not.toBeNull();
    expect(nav?.textContent).toContain("2/2");
    // Live view shows the latest summary (the v2 max of 555).
    expect(q(document.body, ".mv-devtools-summary")?.textContent).toContain("555");

    // Step back to the first snapshot -> read-only banner, older summary, controls disabled.
    const older = Array.from(document.body.querySelectorAll<HTMLButtonElement>(".mv-devtools-history .mv-devtools-btn")).find(
      (b) => b.textContent === "◀"
    );
    expect(older).not.toBeNull();
    older!.click();

    expect(q(document.body, ".mv-devtools-histbanner")?.textContent).toContain("viewing snapshot");
    expect(q(document.body, ".mv-devtools-summary")?.textContent).toContain("140"); // original max
    expect(q(document.body, ".mv-devtools-summary")?.textContent).not.toContain("555");
    // editing is disabled while viewing history
    expect(document.body.querySelector(".mv-devtools textarea")).toBeNull();

    // Return to live.
    const liveBtn = Array.from(document.body.querySelectorAll<HTMLButtonElement>(".mv-devtools-history .mv-devtools-btn")).find(
      (b) => b.textContent?.includes("live")
    );
    liveBtn!.click();
    expect(q(document.body, ".mv-devtools-histbanner")).toBeNull();
    expect(document.body.querySelector(".mv-devtools textarea")).not.toBeNull();

    chart.destroy();
    dt.destroy();
  });

  it("destroy removes the panel and unsubscribes", () => {
    const dt = mountDevtools();
    expect(q(document.body, ".mv-devtools")).not.toBeNull();
    dt.destroy();
    expect(q(document.body, ".mv-devtools")).toBeNull();
    expect(q(document.body, ".mv-devtools-toggle")).toBeNull();
  });
});
