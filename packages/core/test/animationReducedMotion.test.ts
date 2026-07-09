import { describe, it, expect, vi, afterEach } from "vitest";
import { defaultMotionPreference } from "../src/animation/reducedMotion";

const realMatchMedia = window.matchMedia;

afterEach(() => {
  if (realMatchMedia) window.matchMedia = realMatchMedia;
  else delete (window as { matchMedia?: unknown }).matchMedia;
});

describe("defaultMotionPreference", () => {
  it("reports false when matchMedia is unavailable", () => {
    delete (window as { matchMedia?: unknown }).matchMedia;
    const pref = defaultMotionPreference();
    expect(pref.prefersReduced()).toBe(false);
  });

  it("reports true when the reduce media query matches", () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: true });
    const pref = defaultMotionPreference();
    expect(pref.prefersReduced()).toBe(true);
    expect(window.matchMedia).toHaveBeenCalledWith("(prefers-reduced-motion: reduce)");
  });

  it("reports false when the reduce media query does not match", () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: false });
    const pref = defaultMotionPreference();
    expect(pref.prefersReduced()).toBe(false);
  });

  it("queries live on each call (no stale caching of the preference)", () => {
    const mm = vi.fn().mockReturnValue({ matches: false });
    window.matchMedia = mm;
    const pref = defaultMotionPreference();
    expect(pref.prefersReduced()).toBe(false);
    mm.mockReturnValue({ matches: true });
    expect(pref.prefersReduced()).toBe(true);
  });
});
