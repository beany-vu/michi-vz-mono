// The host div must match the engine's default size (900 x 480), or a chart with no
// explicit width overflows its host (audit fountain #11).
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { FountainChart } from "../src/fountain-chart";

describe("FountainChart host size", () => {
  it("defaults to the engine's 900 x 480", () => {
    const { container } = render(<FountainChart dataSet={[{ label: "A", value: 1 }]} />);
    const host = container.firstElementChild as HTMLElement;
    expect(host.style.width).toBe("900px");
    expect(host.style.height).toBe("480px");
  });

  it("follows explicit width and height", () => {
    const { container } = render(
      <FountainChart dataSet={[{ label: "A", value: 1 }]} width={320} height={200} />,
    );
    const host = container.firstElementChild as HTMLElement;
    expect([host.style.width, host.style.height]).toEqual(["320px", "200px"]);
  });
});
