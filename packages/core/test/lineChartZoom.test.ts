// Drag-to-zoom (LineChart `zoom` prop). jsdom's zero getBoundingClientRect means
// clientX/clientY map 1:1 onto svg-local px, so the drag math is exact here.
// Chart geometry: width 600, height 300, default margin {top:50,right:50,bottom:50,left:60}
// -> plot x range [60, 550], y range [50, 250].
import { describe, it, expect, vi } from "vitest";
import { mountLineChart } from "../src/engine/lineChart";
import type { LineChartProps, LineDataItem } from "../src/types";

const annual = (
  vals: number[],
  start = 2016,
): { date: number; value: number; certainty: boolean }[] =>
  vals.map((value, i) => ({ date: start + i, value, certainty: true }));

// 10 yearly points, 2016..2025.
const sample: LineDataItem[] = [
  { label: "Alpha", color: "#ff0000", series: annual([10, 20, 15, 30, 25, 40, 35, 50, 45, 60]) },
];

function mount(extra: Partial<LineChartProps> = {}) {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const chart = mountLineChart(host, {
    dataSet: sample,
    title: "Zoom demo",
    width: 600,
    height: 300,
    xAxisDataType: "date_annual",
    ...extra,
  });
  return { host, chart };
}

const xLabels = (host: HTMLElement): string[] =>
  Array.from(host.querySelectorAll<SVGTextElement>(".mv-x-axis .mv-axis-label")).map(
    (t) => t.textContent ?? "",
  );

function drag(host: HTMLElement, fromX: number, toX: number, y = 150): void {
  host.dispatchEvent(new MouseEvent("mousedown", { clientX: fromX, clientY: y, bubbles: true }));
  host.dispatchEvent(
    new MouseEvent("mousemove", { clientX: (fromX + toX) / 2, clientY: y, bubbles: true }),
  );
  host.dispatchEvent(new MouseEvent("mousemove", { clientX: toX, clientY: y, bubbles: true }));
  window.dispatchEvent(new MouseEvent("mouseup", { clientX: toX, clientY: y }));
}

describe("LineChart drag-to-zoom (jsdom)", () => {
  it("is fully inert when the zoom prop is off", () => {
    const onZoomChange = vi.fn();
    const { host, chart } = mount({ onZoomChange });
    const btn = host.querySelector<HTMLButtonElement>(".mv-zoom-reset")!;
    expect(btn.style.display).toBe("none");
    drag(host, 150, 350);
    expect(onZoomChange).not.toHaveBeenCalled();
    expect(btn.style.display).toBe("none");
    expect(chart.resetZoom).toBeUndefined();
    expect(chart.setZoomDomain).toBeUndefined();
    chart.destroy();
    host.remove();
  });

  it("zooms the x-domain on a drag selection and shows the reset button", () => {
    const onZoomChange = vi.fn();
    const { host, chart } = mount({ zoom: true, onZoomChange });
    const before = xLabels(host);
    expect(before).toContain("2016");
    expect(before).toContain("2025");

    drag(host, 150, 350);

    expect(onZoomChange).toHaveBeenCalledTimes(1);
    const domain = onZoomChange.mock.calls[0][0] as [number, number];
    expect(Array.isArray(domain)).toBe(true);
    expect(domain[0]).toBeLessThan(domain[1]);
    // Inside the full domain: after 2016-01-01, before 2025-01-01.
    expect(domain[0]).toBeGreaterThan(new Date("2016-01-01").valueOf());
    expect(domain[1]).toBeLessThan(new Date("2025-01-01").valueOf());

    const after = xLabels(host);
    expect(after.length).toBeGreaterThan(0);
    expect(after).not.toContain("2016");
    expect(after).not.toContain("2025");

    // Marks are clipped to the plot box via the wrapper group.
    expect(host.querySelector("g.mv-zoom-clip")).not.toBeNull();
    expect(host.querySelector("g.mv-zoom-clip g.line-chart-content")).not.toBeNull();

    const btn = host.querySelector<HTMLButtonElement>(".mv-zoom-reset")!;
    expect(btn.style.display).not.toBe("none");
    expect(btn.textContent).toBe("Reset zoom");
    chart.destroy();
    host.remove();
  });

  it("restores the full domain from the reset button and reports null", () => {
    const onZoomChange = vi.fn();
    const { host, chart } = mount({ zoom: { resetLabel: "Alles zeigen" }, onZoomChange });
    drag(host, 150, 350);
    const btn = host.querySelector<HTMLButtonElement>(".mv-zoom-reset")!;
    expect(btn.textContent).toBe("Alles zeigen");
    btn.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(onZoomChange).toHaveBeenLastCalledWith(null);
    const labels = xLabels(host);
    expect(labels).toContain("2016");
    expect(labels).toContain("2025");
    expect(btn.style.display).toBe("none");
    expect(host.querySelector("g.mv-zoom-clip")).toBeNull();
    chart.destroy();
    host.remove();
  });

  it("treats a sub-threshold drag as a click (no zoom)", () => {
    const onZoomChange = vi.fn();
    const { host, chart } = mount({ zoom: true, onZoomChange });
    drag(host, 150, 153);
    expect(onZoomChange).not.toHaveBeenCalled();
    expect(xLabels(host)).toContain("2016");
    chart.destroy();
    host.remove();
  });

  it("ignores a selection narrower than minRange", () => {
    const onZoomChange = vi.fn();
    const TEN_YEARS_MS = 10 * 365 * 24 * 3600 * 1000;
    const { host, chart } = mount({ zoom: { minRange: TEN_YEARS_MS }, onZoomChange });
    drag(host, 150, 350); // ~3.7 years - below the configured minimum
    expect(onZoomChange).not.toHaveBeenCalled();
    expect(xLabels(host)).toContain("2016");
    chart.destroy();
    host.remove();
  });

  it("ignores a drag that starts outside the plot box", () => {
    const onZoomChange = vi.fn();
    const { host, chart } = mount({ zoom: true, onZoomChange });
    drag(host, 20, 350); // x=20 < margin.left=60
    expect(onZoomChange).not.toHaveBeenCalled();
    chart.destroy();
    host.remove();
  });

  it("supports programmatic setZoomDomain / resetZoom on the instance", () => {
    const onZoomChange = vi.fn();
    const { host, chart } = mount({ zoom: true, onZoomChange });
    const lo = new Date("2018-01-01").valueOf();
    const hi = new Date("2021-01-01").valueOf();
    chart.setZoomDomain!([lo, hi]);
    expect(onZoomChange).toHaveBeenLastCalledWith([lo, hi]);
    const zoomedLabels = xLabels(host);
    expect(zoomedLabels).not.toContain("2016");
    expect(zoomedLabels).not.toContain("2025");

    chart.resetZoom!();
    expect(onZoomChange).toHaveBeenLastCalledWith(null);
    expect(xLabels(host)).toContain("2016");
    chart.destroy();
    host.remove();
  });

  it("clamps a stored zoom to the data domain on update and drops a degenerate one", () => {
    const onZoomChange = vi.fn();
    const { host, chart } = mount({ zoom: true, onZoomChange });
    // Zoom into 2023..2025, then update to a dataSet ending in 2019: the
    // intersection is empty, so the zoom clears itself.
    chart.setZoomDomain!([new Date("2023-01-01").valueOf(), new Date("2025-01-01").valueOf()]);
    expect(xLabels(host)).not.toContain("2016");
    chart.update({
      dataSet: [{ label: "Alpha", color: "#ff0000", series: annual([1, 2, 3, 4]) }],
      title: "Zoom demo",
      width: 600,
      height: 300,
      xAxisDataType: "date_annual",
      zoom: true,
    });
    const labels = xLabels(host);
    expect(labels).toContain("2016");
    expect(labels).toContain("2019");
    const btn = host.querySelector<HTMLButtonElement>(".mv-zoom-reset")!;
    expect(btn.style.display).toBe("none");
    chart.destroy();
    host.remove();
  });

  it("keeps hit-data inside the zoomed domain so the crosshair cannot snap to clipped points", () => {
    const { host, chart } = mount({ zoom: true, showDataPoints: true });
    drag(host, 150, 350);
    // Hover far right inside the plot: the crosshair must sit at a point x
    // WITHIN the plot (never at a clipped point projected beyond it).
    host.dispatchEvent(new MouseEvent("mousemove", { clientX: 540, clientY: 150, bubbles: true }));
    const line = host.querySelector<SVGLineElement>(".mv-mouse-line");
    expect(line).not.toBeNull();
    const x1 = Number(line!.getAttribute("x1"));
    expect(x1).toBeGreaterThanOrEqual(60);
    expect(x1).toBeLessThanOrEqual(550);
    chart.destroy();
    host.remove();
  });
});
