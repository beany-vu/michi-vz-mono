---
"@michi-vz/core": minor
"@michi-vz/react": minor
"@michi-vz/wc": minor
"@michi-vz/angular": minor
---

Export: `chartToPngDataUrl` gains `title` / `caption` text blocks (word-wrapped, alignment/size/colour configurable via `PngTextBlock`) composited above/below the chart, plus `textFontFamily`.

LineChart: opt-in x-axis drag-to-zoom. New `zoom` prop (`boolean | LineZoomConfig` with `minRange`, `resetButton`, `resetLabel`), `onZoomChange` callback (WC event `michi-vz:zoomchange`), and `resetZoom()` / `setZoomDomain()` instance + React handle methods. Dragging a horizontal range inside the plot zooms the x-domain: marks clip to the plot box (SVG clipPath wrapper / canvas ctx.clip), axis ticks, crosshair snapping, and tooltips follow the zoomed domain, and a built-in "Reset zoom" chip restores the full view. The y-domain intentionally stays full. The webgpu renderer falls back to canvas while zoomed (no clip support there).
