import { describe, it, expect, afterEach } from "vitest";
import { isWebGPUAvailable, resolveRenderer } from "../src/webgpu/capability";

// jsdom has no navigator.gpu; we toggle it per-case to exercise both branches.
function setGpu(present: boolean): void {
  if (present) {
    Object.defineProperty(navigator, "gpu", { value: {}, configurable: true });
  } else {
    delete (navigator as unknown as { gpu?: unknown }).gpu;
  }
}

afterEach(() => setGpu(false));

describe("webgpu capability gate", () => {
  it("passes svg/canvas through unchanged", () => {
    expect(resolveRenderer("svg")).toBe("svg");
    expect(resolveRenderer("canvas")).toBe("canvas");
  });

  it("defaults undefined to svg", () => {
    expect(resolveRenderer(undefined)).toBe("svg");
  });

  it("downgrades webgpu to canvas when navigator.gpu is absent", () => {
    setGpu(false);
    expect(isWebGPUAvailable()).toBe(false);
    expect(resolveRenderer("webgpu")).toBe("canvas");
  });

  it("keeps webgpu when navigator.gpu is present", () => {
    setGpu(true);
    expect(isWebGPUAvailable()).toBe(true);
    expect(resolveRenderer("webgpu")).toBe("webgpu");
  });
});
