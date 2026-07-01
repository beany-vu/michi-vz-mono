/// <reference types="@webgpu/types" />
// ⚠️ SHARED WebGPU foundation — do not edit/remove per chart (see webgpu/marks.ts).
// Page-level GPUDevice singleton. One device is shared by every WebGPU chart on
// the page (per the porting-lessons design doc) — adapters/devices are scarce and
// expensive to acquire. Acquisition is async, but the engines' render() path is
// synchronous, so we expose BOTH a sync cached accessor (used during render) and
// an async ensure() that re-triggers a render via onDeviceReady when it resolves.

let cachedDevice: GPUDevice | null = null;
let inFlight: Promise<GPUDevice | null> | null = null;
// Set true once a device has been lost; ensureGPUDevice() will re-acquire on the
// next call (the memo is cleared) and engines downgrade to canvas until then.
let lost = false;
const readyCallbacks = new Set<() => void>();

function flushReady(): void {
  const cbs = [...readyCallbacks];
  readyCallbacks.clear();
  for (const cb of cbs) cb();
}

/**
 * Synchronous accessor for the resolved device. Returns null until the device is
 * ready (or if acquisition failed / the device was lost). Engines call this during
 * the synchronous render() and paint a canvas-2D fallback while it is null.
 */
export function getGPUDeviceCached(): GPUDevice | null {
  return lost ? null : cachedDevice;
}

/**
 * Memoized async device acquisition. Safe to call repeatedly — concurrent callers
 * share one in-flight request. Resolves to null when WebGPU is unavailable or the
 * adapter/device cannot be acquired. Registers a one-time device.lost handler that
 * clears the memo so the next call re-acquires.
 */
export function ensureGPUDevice(): Promise<GPUDevice | null> {
  if (cachedDevice && !lost) return Promise.resolve(cachedDevice);
  if (inFlight) return inFlight;

  const gpu = typeof navigator !== "undefined" ? navigator.gpu : undefined;
  if (!gpu) return Promise.resolve(null);

  inFlight = (async () => {
    try {
      const adapter = await gpu.requestAdapter();
      if (!adapter) return null;
      const device = await adapter.requestDevice();
      cachedDevice = device;
      lost = false;
      // When the device is lost (driver crash, TDR, OS reset), clear the memo so a
      // later ensureGPUDevice() re-acquires; engines fall back to canvas meanwhile.
      device.lost.then((info) => {
        if (cachedDevice === device) {
          cachedDevice = null;
          lost = true;
          inFlight = null;
          // Nudge any mounted charts to re-render (they will downgrade to canvas).
          flushReady();
        }
        return info;
      });
      return device;
    } catch {
      return null;
    } finally {
      inFlight = null;
    }
  })();
  // Once the device resolves, wake any engine waiting to upgrade canvas → GPU.
  inFlight.then((d) => {
    if (d) flushReady();
  });
  return inFlight;
}

/**
 * One-shot subscription: `cb` fires the next time a device becomes ready (or is
 * lost). Engines use this to re-run render() so the first GPU frame replaces the
 * canvas-2D stopgap. Returns an unsubscribe function.
 */
export function onDeviceReady(cb: () => void): () => void {
  readyCallbacks.add(cb);
  return () => readyCallbacks.delete(cb);
}

/** Test-only: reset the module singleton between cases. */
export function __resetGPUDeviceForTest(): void {
  cachedDevice = null;
  inFlight = null;
  lost = false;
  readyCallbacks.clear();
}
