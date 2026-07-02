import { describe, it, expect, beforeEach } from "vitest";
import { mountDevtools } from "../src/production";

interface G {
  __MICHI_VZ_DEVTOOLS__?: boolean;
  __MICHI_VZ_DEVTOOLS_HOOK__?: unknown;
}
const g = globalThis as unknown as G;

describe("production entry", () => {
  beforeEach(() => {
    g.__MICHI_VZ_DEVTOOLS__ = undefined;
    g.__MICHI_VZ_DEVTOOLS_HOOK__ = undefined;
    document.body.innerHTML = "";
  });

  it("mountDevtools is a no-op: no DOM, no hook, a callable handle", () => {
    const dt = mountDevtools();
    expect(document.body.children.length).toBe(0);
    expect(g.__MICHI_VZ_DEVTOOLS__).toBeUndefined();
    expect(g.__MICHI_VZ_DEVTOOLS_HOOK__).toBeUndefined();
    expect(dt.getRoot()).toBeNull();
    // every handle method is safely callable
    dt.open();
    dt.close();
    dt.toggle();
    dt.refresh();
    dt.destroy();
  });
});
