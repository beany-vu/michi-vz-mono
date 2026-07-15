import { describe, it, expect } from "vitest";
import { mountSankeyChart } from "../src/engine/sankeyChart";
import { createManualTicker, type ManualTicker } from "../src/animation/ticker";
import type { SankeyChartProps, SankeyNodeItem, SankeyLinkItem } from "../src/types";

// Nodes are shared across years (no `date`); a year's snapshot is the LINKS
// sharing that date. Germany->Asia only exists in 2019.
const nodes: SankeyNodeItem[] = [{ id: "France" }, { id: "Germany" }, { id: "EU" }, { id: "Asia" }];
const linksByYear: SankeyLinkItem[] = [
  { source: "France", target: "EU", value: 40, date: "2018" },
  { source: "Germany", target: "EU", value: 30, date: "2018" },
  { source: "France", target: "EU", value: 60, date: "2019" },
  { source: "Germany", target: "EU", value: 30, date: "2019" },
  { source: "Germany", target: "Asia", value: 10, date: "2019" },
];

function mount(extra: Partial<SankeyChartProps> = {}, ticker?: ManualTicker) {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const chart = mountSankeyChart(
    host,
    { nodes, links: linksByYear, width: 600, height: 400, ...extra },
    ticker ? { ticker } : undefined,
  );
  return { host, chart };
}

const visibleLinkPairs = (host: HTMLElement): Set<string> =>
  new Set(
    Array.from(host.querySelectorAll("path.link")).map(
      (e) => `${e.getAttribute("data-source")}->${e.getAttribute("data-target")}`,
    ),
  );

describe("sankey chart timeline (off by default)", () => {
  it("renders no control and exposes no timeline() when the prop is unset", () => {
    const { host, chart } = mount();
    expect(host.querySelector(".mv-timeline")).toBeNull();
    expect(chart.timeline).toBeUndefined();
    // Regression guard: all rows render (no timeline filtering applied).
    expect(visibleLinkPairs(host).has("Germany->Asia")).toBe(true);
    expect(host.querySelectorAll("rect.node").length).toBe(4); // nodes are shared, unaffected
    chart.destroy();
    host.remove();
  });
});

describe("sankey chart timeline (enabled)", () => {
  it("snapshots the FIRST period on mount and exposes the controller", () => {
    const { host, chart } = mount({ timeline: true });
    const pairs = visibleLinkPairs(host);
    expect(pairs.has("France->EU")).toBe(true);
    expect(pairs.has("Germany->Asia")).toBe(false); // only exists in 2019
    expect(host.querySelectorAll("rect.node").length).toBe(4); // nodes stay shared
    const tl = chart.timeline!()!;
    expect(tl.getState().periods).toEqual(["2018", "2019"]);
    expect(tl.getState().index).toBe(0);
    chart.destroy();
    host.remove();
  });

  it("stepForward() reveals the later-only link (Germany->Asia)", () => {
    const { host, chart } = mount({ timeline: true });
    chart.timeline!()!.stepForward();
    expect(visibleLinkPairs(host).has("Germany->Asia")).toBe(true);
    chart.destroy();
    host.remove();
  });

  it("plays through periods on the injected ticker", () => {
    const ticker = createManualTicker();
    const { host, chart } = mount({ timeline: { speedMs: 500 } }, ticker);
    const tl = chart.timeline!()!;
    tl.play();
    ticker.tick(500);
    expect(tl.getState().index).toBe(1);
    expect(visibleLinkPairs(host).has("Germany->Asia")).toBe(true);
    chart.destroy();
    host.remove();
  });
});

describe("sankey chart timeline control UI", () => {
  it("renders a play button, a scrubber, and the current period label", () => {
    const { host, chart } = mount({ timeline: true });
    const root = host.querySelector<HTMLElement>(".mv-timeline")!;
    expect(root).not.toBeNull();
    expect(root.querySelector("button")).not.toBeNull();
    expect(root.querySelector('input[type="range"]')).not.toBeNull();
    expect(root.querySelector(".mv-timeline-period")!.textContent).toBe("2018");
    chart.destroy();
    host.remove();
  });
});

describe("sankey chart timeline precedence", () => {
  it("timeline wins over progressiveDraw when both are set (no reveal clip)", () => {
    const ticker = createManualTicker();
    const { host, chart } = mount({ timeline: true, progressiveDraw: true }, ticker);
    expect(host.querySelector("clipPath rect")).toBeNull();
    chart.destroy();
    host.remove();
  });

  it("no `label` field on links: interpolateRows can't match by label, so a shared link's value hard-cuts to the target instead of tweening", () => {
    const ticker = createManualTicker();
    const { host, chart } = mount({ timeline: { easing: "linear", tweenMs: 400 } }, ticker);
    const tl = chart.timeline!()!;
    tl.stepForward(); // 2018 -> 2019, starts a tween attempt
    ticker.tick(200); // halfway through the 400ms tween window
    const ctx = chart.getContext() as {
      links: { source: string; target: string; value: number }[];
    };
    const franceToEu = ctx.links.find((l) => l.source === "France" && l.target === "EU")!;
    expect(franceToEu.value).toBe(60); // target value immediately, not 50 (the midpoint)
    chart.destroy();
    host.remove();
  });
});
