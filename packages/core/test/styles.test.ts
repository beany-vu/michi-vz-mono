import { describe, it, expect, vi, beforeEach } from "vitest";

// The greeting + style injection both guard on module-level flags, so reset the module
// between tests to exercise the first-call path each time.
describe("ensureStyles - once-per-page console greeting", () => {
  beforeEach(() => {
    vi.resetModules();
    delete (globalThis as Record<string, unknown>).__MICHI_VZ_NO_GREETING__;
  });

  const greetingCalls = (spy: ReturnType<typeof vi.spyOn>) =>
    spy.mock.calls.filter((c) => String(c[0]).includes("michi-vz")).length;

  it("greets exactly once across multiple ensureStyles calls", async () => {
    const { ensureStyles } = await import("../src/styles");
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    ensureStyles();
    ensureStyles();
    ensureStyles();
    expect(greetingCalls(spy)).toBe(1);
    spy.mockRestore();
  });

  it("stays silent when opted out via __MICHI_VZ_NO_GREETING__", async () => {
    (globalThis as Record<string, unknown>).__MICHI_VZ_NO_GREETING__ = true;
    const { ensureStyles } = await import("../src/styles");
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    ensureStyles();
    expect(greetingCalls(spy)).toBe(0);
    spy.mockRestore();
  });

  it("links the docs + source URLs in the greeting", async () => {
    const { ensureStyles } = await import("../src/styles");
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    ensureStyles();
    const msg = String(spy.mock.calls[0]?.[0] ?? "");
    expect(msg).toContain("https://michi-vz.netlify.app");
    expect(msg).toContain("https://github.com/beany-vu/michi-vz-mono");
    spy.mockRestore();
  });
});

describe("CORE_CSS - .mv-mouse-line crosshair rule (legacy parity)", () => {
  it("styles the crosshair SOLID via --michi-vz-crosshair with the legacy grey default", async () => {
    const { CORE_CSS } = await import("../src/styles");
    const rule = /\.michi-vz \.mv-mouse-line\s*\{([^}]*)\}/.exec(CORE_CSS)?.[1] ?? "";
    expect(rule).toContain("var(--michi-vz-crosshair, #a9a9a9)");
    expect(rule).toMatch(/stroke-width:\s*var\(--michi-vz-crosshair-width,\s*1\)/);
    expect(rule).toMatch(/stroke-dasharray:\s*var\(--michi-vz-crosshair-dash,\s*none\)/);
  });
});
