import { describe, it, expect, vi } from "vitest";
import { createManualTicker, defaultTicker } from "../src/animation/ticker";

describe("createManualTicker", () => {
  it("starts at time 0 and advances with tick()", () => {
    const t = createManualTicker();
    expect(t.now()).toBe(0);
    t.tick(16);
    expect(t.now()).toBe(16);
    t.tick(100);
    expect(t.now()).toBe(116);
  });

  it("fires a requested callback synchronously on the next tick with the new time", () => {
    const t = createManualTicker();
    const cb = vi.fn();
    t.request(cb);
    expect(cb).not.toHaveBeenCalled();
    t.tick(16);
    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenCalledWith(16);
  });

  it("only fires a callback once per request (rAF semantics)", () => {
    const t = createManualTicker();
    const cb = vi.fn();
    t.request(cb);
    t.tick(16);
    t.tick(16);
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it("runs callbacks re-requested during a flush on the following tick, not the same one", () => {
    const t = createManualTicker();
    const seen: number[] = [];
    const loop = (now: number) => {
      seen.push(now);
      if (seen.length < 3) t.request(loop);
    };
    t.request(loop);
    t.tick(10);
    expect(seen).toEqual([10]);
    t.tick(10);
    t.tick(10);
    expect(seen).toEqual([10, 20, 30]);
  });

  it("cancel() prevents a scheduled callback from firing", () => {
    const t = createManualTicker();
    const cb = vi.fn();
    const id = t.request(cb);
    t.cancel(id);
    t.tick(16);
    expect(cb).not.toHaveBeenCalled();
  });

  it("cancel() of one callback leaves others scheduled", () => {
    const t = createManualTicker();
    const a = vi.fn();
    const b = vi.fn();
    const idA = t.request(a);
    t.request(b);
    t.cancel(idA);
    t.tick(16);
    expect(a).not.toHaveBeenCalled();
    expect(b).toHaveBeenCalledTimes(1);
  });
});

describe("defaultTicker", () => {
  it("constructs without throwing and reports a finite, non-decreasing time", () => {
    const t = defaultTicker();
    const a = t.now();
    const b = t.now();
    expect(Number.isFinite(a)).toBe(true);
    expect(b).toBeGreaterThanOrEqual(a);
  });

  it("request returns a handle and cancel does not throw", () => {
    const t = defaultTicker();
    const id = t.request(() => {});
    expect(() => t.cancel(id)).not.toThrow();
  });
});
