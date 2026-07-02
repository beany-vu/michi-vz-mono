---
"@michi-vz/devtools": minor
"@michi-vz/react": minor
---

DevTools now opens the way you expect from a devtools overlay: mounting it shows a small floating button bearing the Michi shield (the library's crest) instead of covering the app with the panel. Click the button (or Ctrl/Cmd+Shift+M) to open; the open/closed state is remembered per browser, so a reload comes back exactly how you left it (an explicit `open: true/false` still forces the initial state). The button is draggable anywhere on screen and the dragged spot is remembered, so it never fights another floating widget for a corner; the new `buttonPosition` option ("bottom-right" default, or any corner) picks where it starts. The handle gained `isOpen()` (the `/production` stub always reports false), and `<MichiVzDevtools />` in `@michi-vz/react` passes through the new `buttonPosition` prop.
