import { describe, it, expect } from "vitest";
import { createHatchPattern } from "../src/canvas/createHatchPattern";

describe("createHatchPattern", () => {
  it("returns an encoded SVG data-URI", () => {
    const uri = createHatchPattern({ color: "#123456" });
    expect(uri.startsWith("data:image/svg+xml;charset=utf-8,")).toBe(true);
    const svg = decodeURIComponent(uri.split(",")[1]);
    expect(svg).toContain("<svg");
    expect(svg).toContain('stroke="#123456"');
    expect(svg).toContain('width="6"'); // default spacing
  });

  it("honours spacing / strokeWidth / background and the -45 angle", () => {
    const uri = createHatchPattern({ color: "red", spacing: 8, strokeWidth: 2, background: "#fff", angle: -45 });
    const svg = decodeURIComponent(uri.split(",")[1]);
    expect(svg).toContain('width="8"');
    expect(svg).toContain('stroke-width="2"');
    expect(svg).toContain('fill="#fff"');
    // -45 ("↘") path starts at the origin with a positive diagonal
    expect(svg).toContain("M 0,0 l 8,8");
  });

  it("encodes non-Latin1 colours safely (encodeURIComponent, not btoa)", () => {
    expect(() => createHatchPattern({ color: "rgb(10, 20, 30)" })).not.toThrow();
    const svg = decodeURIComponent(createHatchPattern({ color: "rgb(10, 20, 30)" }).split(",")[1]);
    expect(svg).toContain("stroke=\"rgb(10, 20, 30)\"");
  });
});
