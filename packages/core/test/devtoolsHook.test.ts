import { describe, it, expect, beforeEach } from "vitest";
import { enableDevtools, getDevtoolsHook, attachDevtools } from "../src/devtools/hook";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { mountLineChart } from "../src/engine/lineChart";
import { mountScatterChart } from "../src/engine/scatterChart";
import { mountPieChart } from "../src/engine/pieChart";
import type { ChartInstance, LineChartProps } from "../src/types";

interface G {
  __MICHI_VZ_DEVTOOLS__?: boolean;
  __MICHI_VZ_DEVTOOLS_HOOK__?: unknown;
}
const g = globalThis as unknown as G;

function resetDevtools(): void {
  g.__MICHI_VZ_DEVTOOLS__ = undefined;
  g.__MICHI_VZ_DEVTOOLS_HOOK__ = undefined;
}

const props: LineChartProps = {
  dataSet: [{ label: "A", series: [{ date: 2020, value: 1, certainty: true }] }],
  width: 300,
  height: 150,
  xAxisDataType: "date_annual",
};

describe("core devtools hook", () => {
  beforeEach(resetDevtools);

  it("is disabled (no hook) until enabled", () => {
    expect(getDevtoolsHook()).toBeNull();
    const hook = enableDevtools();
    expect(hook).toBe(getDevtoolsHook());
    expect(hook.isMichiVzDevtools).toBe(true);
  });

  it("attachDevtools is a no-op when disabled", () => {
    const fake = {
      update() {},
      getContext: () => null,
      destroy() {},
    } as ChartInstance<LineChartProps>;
    const out = attachDevtools(fake, document.createElement("div"), "line-chart", () => props);
    expect(out).toBe(fake); // returned untouched
    expect(getDevtoolsHook()).toBeNull();
  });

  it("registers a mounted chart and unregisters it on destroy", () => {
    const hook = enableDevtools();
    const host = document.createElement("div");
    document.body.appendChild(host);

    const chart = mountLineChart(host, props);
    expect(hook.charts.size).toBe(1);
    const [entry] = [...hook.charts.values()];
    expect(entry.chartType).toBe("line-chart");
    expect(entry.getContext()?.chartType).toBe("line-chart");
    expect((entry.getProps() as LineChartProps).dataSet).toHaveLength(1);

    chart.destroy();
    expect(hook.charts.size).toBe(0);
    host.remove();
  });

  it("setProps patches a single field and re-renders, and notifies subscribers", () => {
    const hook = enableDevtools();
    const host = document.createElement("div");
    document.body.appendChild(host);
    let notifications = 0;
    hook.subscribe(() => notifications++);

    const chart = mountLineChart(host, props);
    const [entry] = [...hook.charts.values()];
    entry.setProps({ title: "Patched" });
    expect(entry.getContext()?.title).toBe("Patched");
    // setProps -> update -> notify fires the subscriber at least once.
    expect(notifications).toBeGreaterThan(0);

    chart.destroy();
    host.remove();
  });
});

describe("DevtoolsChartEntry.hitReporting", () => {
  beforeEach(resetDevtools);

  it("is 'canvas' for an engine that reports canvas hits, 'none' otherwise", () => {
    const hook = enableDevtools();
    const h1 = document.createElement("div");
    const h2 = document.createElement("div");
    document.body.append(h1, h2);
    const scatter = mountScatterChart(h1, {
      dataSet: [{ label: "P", x: 1, y: 2, d: 3 }],
      width: 300,
      height: 200,
      xAxisDataType: "number",
    });
    const pie = mountPieChart(h2, {
      dataSet: [{ label: "A", value: 1 }],
      width: 200,
      height: 200,
    });
    const byType = new Map([...hook.charts.values()].map((e) => [e.chartType, e]));
    expect(byType.get("scatter-plot-chart")?.hitReporting).toBe("canvas");
    expect(byType.get("pie-chart")?.hitReporting).toBe("none");
    scatter.destroy();
    pie.destroy();
  });

  it("guard: every engine that calls reportDevtoolsHit declares hitReporting 'canvas', and only those", () => {
    const dir = join(dirname(fileURLToPath(import.meta.url)), "../src/engine");
    const mismatches: string[] = [];
    for (const file of readdirSync(dir).filter((f) => f.endsWith(".ts"))) {
      const src = readFileSync(join(dir, file), "utf8");
      const reports = src.includes("reportDevtoolsHit(");
      const declares = /attachDevtools\([^;]*hitReporting:\s*"canvas"/s.test(src);
      if (reports !== declares) mismatches.push(`${file} reports=${reports} declares=${declares}`);
    }
    expect(mismatches).toEqual([]);
  });
});
