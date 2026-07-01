/// <reference types="@webgpu/types" />
// ⚠️ SHARED WebGPU foundation - do not edit/remove per chart (see webgpu/marks.ts).
// The setupCanvas() analog for WebGPU. Sizes the backing store for
// devicePixelRatio (identical math to canvas/setupCanvas.ts) and configures the
// GPUCanvasContext with premultiplied alpha + the preferred format. Returns null
// when WebGPU is unavailable (e.g. jsdom), so every draw routine early-returns -
// mirroring the canvas null-guard the whole library relies on.

export interface WebgpuSetup {
  ctx: GPUCanvasContext;
  format: GPUTextureFormat;
  /** Backing-store size in device pixels (CSS size * dpr). */
  pxWidth: number;
  pxHeight: number;
  dpr: number;
}

export const setupWebgpu = (
  canvas: HTMLCanvasElement | null,
  device: GPUDevice | null,
  width: number,
  height: number
): WebgpuSetup | null => {
  if (!canvas || !device) return null;
  const gpu = typeof navigator !== "undefined" ? navigator.gpu : undefined;
  if (!gpu) return null;

  let ctx: GPUCanvasContext | null;
  try {
    ctx = canvas.getContext("webgpu") as GPUCanvasContext | null;
  } catch {
    ctx = null;
  }
  if (!ctx) return null;

  const dpr = window.devicePixelRatio || 1;
  const pxW = Math.round(width * dpr);
  const pxH = Math.round(height * dpr);
  // Backing store in device px; CSS box stays in logical px (matches setupCanvas).
  if (canvas.width !== pxW || canvas.height !== pxH) {
    canvas.width = pxW;
    canvas.height = pxH;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
  }

  const format = gpu.getPreferredCanvasFormat();
  // Re-configure on every setup - configure() must be re-run after a resize, and
  // it is idempotent for an unchanged size.
  ctx.configure({ device, format, alphaMode: "premultiplied" });

  return { ctx, format, pxWidth: pxW, pxHeight: pxH, dpr };
};
