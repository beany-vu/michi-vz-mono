// Guards the ONE failure this split can cause silently: React context identity is
// per module instance, so if a per-chart subpath module ever re-declared its own
// createContext, a mounted <MichiVzProvider> would reach nothing and colorsMapping
// / disabledItems would fall back to the empty defaults with no error anywhere.
// The provider is imported from the barrel and the hook from the internal module,
// so a duplicated identity fails this test and only this test.
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { MichiVzProvider } from "../src/index"; // barrel
import { useChartContext } from "../src/internal/context"; // subpath-side consumer

function Probe() {
  const ctx = useChartContext();
  return <span data-testid="probe">{ctx.colorsMapping?.Alpha ?? "MISSING"}</span>;
}

describe("MichiVzProvider across module boundaries", () => {
  it("reaches a consumer that imported the context from the internal module", () => {
    const { getByTestId } = render(
      <MichiVzProvider colorsMapping={{ Alpha: "#123456" }}>
        <Probe />
      </MichiVzProvider>,
    );
    // A duplicated createContext identity would fall back to the empty default.
    expect(getByTestId("probe").textContent).toBe("#123456");
  });
});
