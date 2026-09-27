// <MichiVzDevtools /> must see the charts that mount in the SAME commit. The panel
// module loads through a dynamic import (so production bundles can drop it), which
// resolves after every mount effect of that commit; a chart that mounted before the
// hook existed never registered, and the panel showed "0 charts" with the documented
// one-liner setup. The component now enables the core hook in a layout effect, which
// runs before the charts' passive mount effects.
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { getDevtoolsHook, type LineChartProps } from "@michi-vz/core";
import { MichiVzDevtools } from "../src/index";
import { LineChart } from "../src/line-chart";

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
      ],
    },
  ],
  width: 400,
  height: 200,
  xAxisDataType: "date_annual",
};

function resetDevtools(): void {
  g.__MICHI_VZ_DEVTOOLS__ = undefined;
  g.__MICHI_VZ_DEVTOOLS_HOOK__ = undefined;
}

describe("<MichiVzDevtools /> chart registration", () => {
  const env = process.env.NODE_ENV;
  beforeEach(resetDevtools);
  afterEach(() => {
    cleanup();
    process.env.NODE_ENV = env;
    resetDevtools();
  });

  it("registers a chart rendered after it in the same commit", () => {
    render(
      <>
        <MichiVzDevtools />
        <LineChart {...props} />
      </>,
    );
    expect(getDevtoolsHook()?.charts.size).toBe(1);
  });

  it("registers a chart rendered before it in the same commit", () => {
    render(
      <>
        <LineChart {...props} />
        <MichiVzDevtools />
      </>,
    );
    expect(getDevtoolsHook()?.charts.size).toBe(1);
  });

  it("stays inert in production unless forceMount is set", () => {
    process.env.NODE_ENV = "production";
    render(
      <>
        <MichiVzDevtools />
        <LineChart {...props} />
      </>,
    );
    expect(getDevtoolsHook()).toBeNull();
    cleanup();

    render(
      <>
        <MichiVzDevtools forceMount />
        <LineChart {...props} />
      </>,
    );
    expect(getDevtoolsHook()?.charts.size).toBe(1);
  });
});
