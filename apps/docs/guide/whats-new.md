# What's new

The latest `@michi-vz` releases, newest first. All six packages -
[core](https://www.npmjs.com/package/@michi-vz/core),
[wc](https://www.npmjs.com/package/@michi-vz/wc),
[react](https://www.npmjs.com/package/@michi-vz/react),
[vue](https://www.npmjs.com/package/@michi-vz/vue),
[svelte](https://www.npmjs.com/package/@michi-vz/svelte),
[angular](https://www.npmjs.com/package/@michi-vz/angular) - share one version
number. Full per-commit detail lives in the
[GitHub releases](https://github.com/beany-vu/michi-vz-mono/releases).

## v1.2.1

- **Every npm page links its siblings.** Each package README now carries a *Framework packages* table linking all six packages, so from any wrapper you can reach the rest. A dead monorepo link was fixed.
- **All six packages realigned.** `vue`, `angular`, `svelte`, and `wc` were a version behind on npm; they are now published together with `core` and `react` at the same version.
- **Docs discoverability.** The [Installation](/guide/installation) table links each package to npm, and there is an npm button on the home page plus an npm icon in the top navigation.

## v1.2.0

The **drop-in compatibility** release: the scoped `@michi-vz/*` packages can replace the legacy single-package `michi-vz` with no chart regressions. Everything is backward-compatible.

- **Renderer-agnostic context.** `legendData` (the per-series colour contract for canvas / skip-mode consumers) on the Line/Gap/Area/Scatter/BarBell/Radar contexts; `renderedData` / `visibleItems`; every `on*Processed` is now idempotent, so it fires only when the context actually changes and never loops.
- **LineChart.** Loading / no-data states, axis config (`yTicks`, grid lines, zero-line highlight), `fontFamily`, and consumer-supplied `svgChildren`.
- **More chart props.** Gap shape legend; Comparable `maxBarHeight` / `symmetricXDomain`; VerticalStackBar label rotation + `keys`; Scatter band scale, crosshair, and per-point shapes; Radar legacy data shape + forgiving hit-test.
- **Axes, SEO, and a11y.** Adaptive auto-rotate and tick-thinning on crowded axes; the chart `<svg>` now carries `<title>`, `<desc>`, and schema.org JSON-LD `<metadata>`.
- **Experimental WebGPU** render path alongside SVG and canvas.

## v1.1.1

- **Bar-Bell fix.** End-cap circles render on top of the bar segments (previously a later segment could paint over the previous segment's cap), and the whole segment is hoverable for tooltips, not only the end-cap circle.
