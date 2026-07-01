/// <reference types="@webgpu/types" />
// ⚠️ SHARED FOUNDATION - DO NOT EDIT/REMOVE per chart (agents/humans). Every
// packages/core/src/<chart>/renderWebgpu.ts imports this module; changing its exported
// API (drawMarksWebgpu / emptyBatch / MarkBatch / push* / markColor) breaks all charts.
// Add new geometry helpers here rather than reimplementing them per chart.
//
// Chart-agnostic WebGPU mark layer. Every chart's marks reduce to two GPU shapes:
//   • colored TRIANGLES (rects/bars, area & range bands, pie & radar wedges, line
//     strokes, filled polygons) - CPU-tessellated into a flat vertex buffer, and
//   • instanced CIRCLES (scatter/bubble point clouds, bar-bell dots) - one instance
//     per point, drawn with a fragment SDF (far cheaper than tessellating each disc).
// Text/axes/titles stay on the SVG layer. Colours are resolved via the existing
// light-DOM probe (resolveMarkColors) and converted to premultiplied RGBA here.
//
// Per-chart renderWebgpu files build a MarkBatch from their render model and call
// drawMarksWebgpu(). Everything is capability-gated upstream; this no-ops (returns
// false) when the device/context is unavailable so the engine paints the canvas
// fallback (incl. jsdom).
import { setupWebgpu } from "./setupWebgpu";
import { getGPUDeviceCached, ensureGPUDevice } from "./device";
import { isWebGPUAvailable } from "./capability";
import { cssColorToPremultiplied } from "./color";
import type { RGBA } from "./color";

const TRI_FLOATS = 6; // x, y, r, g, b, a
const CIRCLE_FLOATS = 7; // cx, cy, radius, r, g, b, a
const UNIT_QUAD = new Float32Array([-1, -1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1]);

// ---- geometry builders (pure; append premultiplied verts into a number[]) --------

/** Two triangles for an axis-aligned rect. */
export function pushRect(
  out: number[],
  x: number,
  y: number,
  w: number,
  h: number,
  c: RGBA
): void {
  const x2 = x + w;
  const y2 = y + h;
  pushTri(out, x, y, x2, y, x2, y2, c);
  pushTri(out, x, y, x2, y2, x, y2, c);
}

/** A filled band between an ordered TOP polyline and a BOTTOM polyline (same length). */
export function pushBandStrip(
  out: number[],
  top: Array<[number, number]>,
  bottom: Array<[number, number]>,
  c: RGBA
): void {
  const n = Math.min(top.length, bottom.length);
  for (let i = 0; i < n - 1; i++) {
    const [ax, ay] = top[i];
    const [bx, by] = top[i + 1];
    const [cx, cy] = bottom[i];
    const [dx, dy] = bottom[i + 1];
    pushTri(out, ax, ay, bx, by, cx, cy, c);
    pushTri(out, bx, by, dx, dy, cx, cy, c);
  }
}

/** A triangle fan from a center point through an ordered ring (pie/donut/radar). */
export function pushFan(
  out: number[],
  cx: number,
  cy: number,
  ring: Array<[number, number]>,
  c: RGBA,
  close = true
): void {
  const n = ring.length;
  const last = close ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const [ax, ay] = ring[i];
    const [bx, by] = ring[(i + 1) % n];
    pushTri(out, cx, cy, ax, ay, bx, by, c);
  }
}

/** A stroked polyline of constant width (miter-free; quad per segment). */
export function pushStroke(
  out: number[],
  pts: Array<[number, number]>,
  width: number,
  c: RGBA
): void {
  const hw = width / 2;
  for (let i = 0; i < pts.length - 1; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[i + 1];
    let dx = x2 - x1;
    let dy = y2 - y1;
    const len = Math.hypot(dx, dy) || 1;
    // normal * half-width
    const nx = (-dy / len) * hw;
    const ny = (dx / len) * hw;
    pushTri(out, x1 + nx, y1 + ny, x2 + nx, y2 + ny, x2 - nx, y2 - ny, c);
    pushTri(out, x1 + nx, y1 + ny, x2 - nx, y2 - ny, x1 - nx, y1 - ny, c);
  }
}

/** One instanced circle. */
export function pushCircle(
  out: number[],
  cx: number,
  cy: number,
  radius: number,
  c: RGBA
): void {
  out.push(cx, cy, radius, c[0], c[1], c[2], c[3]);
}

function pushTri(
  out: number[],
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  x3: number,
  y3: number,
  c: RGBA
): void {
  out.push(x1, y1, c[0], c[1], c[2], c[3]);
  out.push(x2, y2, c[0], c[1], c[2], c[3]);
  out.push(x3, y3, c[0], c[1], c[2], c[3]);
}

/** Parse a CSS colour and apply an opacity multiplier, staying premultiplied. */
export function markColor(css: string | undefined | null, opacity = 1): RGBA {
  const [r, g, b, a] = cssColorToPremultiplied(css);
  return [r * opacity, g * opacity, b * opacity, a * opacity];
}

// ---- pipelines (cached per device+format) ---------------------------------------

const TRI_WGSL = /* wgsl */ `
struct U { viewport: vec2<f32> };
@group(0) @binding(0) var<uniform> u: U;
struct VO { @builtin(position) pos: vec4<f32>, @location(0) color: vec4<f32> };
@vertex fn vs(@location(0) p: vec2<f32>, @location(1) color: vec4<f32>) -> VO {
  var o: VO;
  o.pos = vec4<f32>(p.x / u.viewport.x * 2.0 - 1.0, 1.0 - p.y / u.viewport.y * 2.0, 0.0, 1.0);
  o.color = color;
  return o;
}
@fragment fn fs(i: VO) -> @location(0) vec4<f32> { return i.color; }
`;

const CIRCLE_WGSL = /* wgsl */ `
struct U { viewport: vec2<f32> };
@group(0) @binding(0) var<uniform> u: U;
struct VO { @builtin(position) pos: vec4<f32>, @location(0) local: vec2<f32>, @location(1) color: vec4<f32> };
@vertex fn vs(@location(0) corner: vec2<f32>, @location(1) center: vec2<f32>, @location(2) radius: f32, @location(3) color: vec4<f32>) -> VO {
  var o: VO;
  let p = center + corner * radius;
  o.pos = vec4<f32>(p.x / u.viewport.x * 2.0 - 1.0, 1.0 - p.y / u.viewport.y * 2.0, 0.0, 1.0);
  o.local = corner; o.color = color;
  return o;
}
@fragment fn fs(i: VO) -> @location(0) vec4<f32> {
  let d = length(i.local);
  let aa = max(fwidth(d), 0.0001);
  let a = 1.0 - smoothstep(1.0 - aa, 1.0, d);
  if (a <= 0.0) { discard; }
  return i.color * a;
}
`;

const PREMULT_BLEND: GPUBlendState = {
  color: { srcFactor: "one", dstFactor: "one-minus-src-alpha", operation: "add" },
  alpha: { srcFactor: "one", dstFactor: "one-minus-src-alpha", operation: "add" },
};

interface Pipelines {
  device: GPUDevice;
  format: GPUTextureFormat;
  tri: GPURenderPipeline;
  circle: GPURenderPipeline;
  quad: GPUBuffer;
  uniform: GPUBuffer;
  triBind: GPUBindGroup;
  circleBind: GPUBindGroup;
}
let cached: Pipelines | null = null;

function getPipelines(device: GPUDevice, format: GPUTextureFormat): Pipelines {
  if (cached && cached.device === device && cached.format === format) return cached;

  const triMod = device.createShaderModule({ code: TRI_WGSL });
  const tri = device.createRenderPipeline({
    layout: "auto",
    vertex: {
      module: triMod,
      entryPoint: "vs",
      buffers: [
        {
          arrayStride: TRI_FLOATS * 4,
          attributes: [
            { shaderLocation: 0, offset: 0, format: "float32x2" },
            { shaderLocation: 1, offset: 8, format: "float32x4" },
          ],
        },
      ],
    },
    fragment: { module: triMod, entryPoint: "fs", targets: [{ format, blend: PREMULT_BLEND }] },
    primitive: { topology: "triangle-list" },
  });

  const circMod = device.createShaderModule({ code: CIRCLE_WGSL });
  const circle = device.createRenderPipeline({
    layout: "auto",
    vertex: {
      module: circMod,
      entryPoint: "vs",
      buffers: [
        { arrayStride: 8, stepMode: "vertex", attributes: [{ shaderLocation: 0, offset: 0, format: "float32x2" }] },
        {
          arrayStride: CIRCLE_FLOATS * 4,
          stepMode: "instance",
          attributes: [
            { shaderLocation: 1, offset: 0, format: "float32x2" },
            { shaderLocation: 2, offset: 8, format: "float32" },
            { shaderLocation: 3, offset: 12, format: "float32x4" },
          ],
        },
      ],
    },
    fragment: { module: circMod, entryPoint: "fs", targets: [{ format, blend: PREMULT_BLEND }] },
    primitive: { topology: "triangle-list" },
  });

  const quad = device.createBuffer({ size: UNIT_QUAD.byteLength, usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST });
  device.queue.writeBuffer(quad, 0, UNIT_QUAD);
  const uniform = device.createBuffer({ size: 16, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
  const triBind = device.createBindGroup({
    layout: tri.getBindGroupLayout(0),
    entries: [{ binding: 0, resource: { buffer: uniform } }],
  });
  const circleBind = device.createBindGroup({
    layout: circle.getBindGroupLayout(0),
    entries: [{ binding: 0, resource: { buffer: uniform } }],
  });

  cached = { device, format, tri, circle, quad, uniform, triBind, circleBind };
  return cached;
}

// ---- frame ----------------------------------------------------------------------

export interface MarkBatch {
  /** Flat [x,y,r,g,b,a] triangle verts (premultiplied). */
  triangles: number[];
  /** Flat [cx,cy,radius,r,g,b,a] circle instances (premultiplied). */
  circles: number[];
}

export const emptyBatch = (): MarkBatch => ({ triangles: [], circles: [] });

export interface DrawMarksOptions {
  width: number;
  height: number;
  /** Called once when the async device becomes ready, so the engine re-renders. */
  onReady?: () => void;
}

/**
 * Draw a MarkBatch to the given canvas via WebGPU. Returns false when the device
 * or context is not (yet) available - the caller then paints its canvas-2D fallback
 * and, if a device is still resolving, re-renders on onReady to upgrade to GPU.
 */
export function drawMarksWebgpu(
  canvas: HTMLCanvasElement | null,
  batch: MarkBatch,
  o: DrawMarksOptions
): boolean {
  const device = getGPUDeviceCached();
  if (!device) {
    if (isWebGPUAvailable()) {
      ensureGPUDevice().then((d) => {
        if (d && o.onReady) o.onReady();
      });
    }
    return false;
  }
  const setup = setupWebgpu(canvas, device, o.width, o.height);
  if (!setup) return false;
  const { ctx, format } = setup;

  const p = getPipelines(device, format);
  device.queue.writeBuffer(p.uniform, 0, new Float32Array([o.width, o.height, 0, 0]) as Float32Array<ArrayBuffer>);

  const encoder = device.createCommandEncoder();
  const view = ctx.getCurrentTexture().createView();
  const pass = encoder.beginRenderPass({
    colorAttachments: [{ view, clearValue: { r: 0, g: 0, b: 0, a: 0 }, loadOp: "clear", storeOp: "store" }],
  });

  // Triangles first (fills/strokes), circles on top (points).
  if (batch.triangles.length >= TRI_FLOATS * 3) {
    const data = new Float32Array(batch.triangles) as Float32Array<ArrayBuffer>;
    const buf = device.createBuffer({ size: data.byteLength, usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST });
    device.queue.writeBuffer(buf, 0, data);
    pass.setPipeline(p.tri);
    pass.setBindGroup(0, p.triBind);
    pass.setVertexBuffer(0, buf);
    pass.draw(data.length / TRI_FLOATS);
  }
  if (batch.circles.length >= CIRCLE_FLOATS) {
    const data = new Float32Array(batch.circles) as Float32Array<ArrayBuffer>;
    const buf = device.createBuffer({ size: data.byteLength, usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST });
    device.queue.writeBuffer(buf, 0, data);
    pass.setPipeline(p.circle);
    pass.setBindGroup(0, p.circleBind);
    pass.setVertexBuffer(0, p.quad);
    pass.setVertexBuffer(1, buf);
    pass.draw(6, data.length / CIRCLE_FLOATS);
  }

  pass.end();
  device.queue.submit([encoder.finish()]);
  return true;
}

/** Test-only: drop cached pipelines/buffers. */
export function __resetMarksForTest(): void {
  cached = null;
}
