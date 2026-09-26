---
"@michi-vz/core": minor
"@michi-vz/wc": minor
---

SankeyChart `hoverHighlight`: hovering a node brings forward the node, every flow into or out of it and the nodes at their other ends; hovering a flow brings forward that flow and its two nodes. Everything else dims to the same level `highlightItems` uses. It works in the svg, canvas and webgpu renderers; on svg the marks update in place, so the element under the pointer is never replaced. Leaving restores the normal state, a pinned tooltip keeps its emphasis until it is unpinned, and `onHighlightItem` fires as before. Default off. The web component takes a `hover-highlight` attribute and `@michi-vz/angular` forwards the prop. Also: with the webgpu renderer, hovering a flow now shows its tooltip (it showed nothing once the GPU was painting).
