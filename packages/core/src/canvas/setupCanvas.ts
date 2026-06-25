// Moved verbatim from michi-vz src/components/hooks/canvas/setupCanvas.ts.
// Sizes the backing store for devicePixelRatio, applies the dpr transform so
// callers draw in CSS pixels, and clears the frame. jsdom has no 2D context →
// returns null (every draw routine must early-return on null).

export interface CanvasSetup {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
}

export const setupCanvas = (
  canvas: HTMLCanvasElement | null,
  width: number,
  height: number
): CanvasSetup | null => {
  if (!canvas) return null;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const dpr = window.devicePixelRatio || 1;
  const pxW = Math.round(width * dpr);
  const pxH = Math.round(height * dpr);
  if (canvas.width !== pxW || canvas.height !== pxH) {
    canvas.width = pxW;
    canvas.height = pxH;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);

  return { ctx, width, height };
};
