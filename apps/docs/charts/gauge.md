---
title: Gauge (Rings)
description: "Concentric ring gauge: one ring per item sweeping value/max of a full circle over a background track, with hover-activated rings and a built-in centre readout."
---
# Gauge (Rings)

<span class="vp-badge tip">Composition</span>

"How far along is each of these, against the same scale?" A gauge answers it with concentric rings, outer to inner: each ring sweeps `value / max` of a full circle clockwise from 12 o'clock over a background track. Hovering a ring **activates** it (emphasis + the built-in centre readout); `defaultActive` picks the resting ring, and a ring whose value is `null` renders its track only - "no data" without hiding the gauge.

<ChartDemo chart="gauge-chart" :legend="false" />

Almost everything is configurable: ring thickness and gap, track colours and opacities per ring, start angle, rounded caps, per-ring arc opacity (for single-hue designs), and the centre label - swap it entirely with `centerContent`, or turn it off with `showCenterLabel: false` and drive your own overlay from `onHighlightItem`:

<ChartDemo chart="gauge-chart" :index="1" :legend="false" />

> Rings share one scale (`max`, default 100). For values on different scales, normalize first - or reach for a [comparable bar](/charts/comparable), which reads absolute values more precisely.

## Half gauge and gradients

`sweepAngle` narrows the gauge from a full circle to an arc, clockwise from `startAngle`; `gradient` swaps a ring's solid colour for a multi-stop linear ramp. The classic half gauge is `startAngle: -90, sweepAngle: 180`:

<ChartDemo chart="gauge-chart" :index="2" :legend="false" />

Two things a first read easily gets wrong:

- **The track spans the sweep too.** A half gauge's background track is a half circle, not a full one - `sweepAngle` shortens both the track and the value arc together, so there is no "hidden" other half showing through.
- **The gradient ramp is anchored to the full sweep, not the drawn portion.** A given colour always sits at the same *value*, not at the same position along whatever arc happens to be drawn - so a half-full gauge shows the first half of the ramp, not the whole ramp compressed into the half. A ring's own `gradient` overrides the chart-level one.

## When to reach for it

- **Share-of-market rings.** One product's share of nested scopes (world, region, market) in a single compact figure.
- **Progress / KPI rings.** Activity-tracker style: one hue with per-ring opacity steps, `roundedCaps`, and a custom centre readout.

## Renderers

`renderer: "svg"` (default), `"canvas"` (the same rings on a 2D canvas; consumer CSS still reaches the arcs through the colour probe), or `"webgpu"` <span class="vp-badge warning">Experimental</span> (annulus band strips on the GPU; falls back to canvas until the device is ready).
