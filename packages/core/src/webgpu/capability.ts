// ⚠️ SHARED WebGPU foundation - do not edit/remove per chart (see webgpu/marks.ts).
// WebGPU capability gate. The renderer is EXPERIMENTAL and not Baseline web
// (Firefox-Linux off by default, Safari only since v26, can be disabled in
// managed/enterprise browsers), so every entry point downgrades gracefully.
import type { Renderer } from "../types";

/**
 * True when the current environment exposes the WebGPU entry point. Note this
 * only checks for `navigator.gpu` - it does NOT guarantee an adapter/device can
 * actually be acquired (that is async and can still fail; see webgpu/device.ts),
 * so callers must also handle a null device at draw time.
 */
export function isWebGPUAvailable(): boolean {
  return typeof navigator !== "undefined" && !!(navigator as Navigator & { gpu?: unknown }).gpu;
}

/**
 * The single capability gate: downgrade an opt-in "webgpu" request to "canvas"
 * when WebGPU is unavailable. "svg"/"canvas" pass through unchanged. Engines call
 * this in resolve() and use the returned EFFECTIVE renderer everywhere (so
 * getContext().renderer reports what actually painted).
 */
export function resolveRenderer(requested: Renderer | undefined): Renderer {
  if (requested === "webgpu" && !isWebGPUAvailable()) return "canvas";
  return requested ?? "svg";
}
