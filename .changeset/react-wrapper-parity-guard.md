---
"@michi-vz/react": patch
---

Consumer verification suspected the React wrapper silently dropped
ScatterChart's `pointLabels`/`drawOrder` and TreemapChart's `tileValueLabels`
(a naive grep of the built `@michi-vz/react` dist found zero mentions of any
of the three, versus several in `@michi-vz/core`'s dist). Investigated and
confirmed this was a false positive: every React chart component forwards
props via a rest spread (`{ ...coreProps }` / `{ ...resolveEffectiveProps(coreProps, shared) }`,
or `props` passed straight through with no destructuring at all), so a prop's
literal name never appears in the compiled bundle even when it's forwarded
correctly - a rest spread carries every key not explicitly named on its
left-hand side. A live jsdom + react-dom mount confirmed `pointLabels`,
`drawOrder="sizeAscending"`, and `tileValueLabels` all already reach the
engine and render correctly through `@michi-vz/react` (labels present,
draw-order flipped, value-label text correct). No source changes were needed
for these three props.

To close this drift class for good (and stop naive dist-grepping from being
anyone's source of truth again), `apps/docs/scripts/wrapper-parity.test.mjs`
now ALSO statically verifies, for all 21 charts, that the React component
never destructures a real core prop out of its rest element without
re-adding it under the same key - the only way a rest-spread wrapper can
actually drop a prop. Verified end-to-end: the new check fails against a
deliberately reintroduced drop (temporarily destructuring `pointLabels` out
of `ScatterChart` without re-adding it) and passes again once reverted. A
static rename-on-destructure canary makes the check fail loudly rather than
silently blind-spot itself if a future component ever does `{ foo: bar,
...coreProps }`. Running the extended suite against the current tree found
zero other charts dropping any other prop.
