---
"@michi-vz/core": patch
"@michi-vz/wc": patch
"@michi-vz/angular": patch
---

GapChart: added `showZeroLineForXAxis` and `maxBarHeight`, at parity with
ComparableHorizontalBarChart's existing props of the same name/behaviour.
`showZeroLineForXAxis` draws a solid (non-dashed) vertical line at x=0.
`maxBarHeight` caps each row's thickness so a 1-2 row chart doesn't stretch
its band across the full plot height (the band range shrinks to the capped
thickness and centres in the plot); no-op for dense charts.

ComparableHorizontalBarChart and GapChart's numeric value axis now opts into
the same `autoRotate`/`maxTicks` tick-collision avoidance already used by
LineChart/AreaChart's date axis: ticks tilt -45° before thinning, and only
thin (keeping the first + last tick) once even tilted labels would still
collide. Byte-identical output whenever ticks already fit without overlap.

Shared y-band row labels (`.mv-ylabel`, used by every band-axis chart:
ComparableHorizontalBarChart, GapChart, VerticalStackBarChart, BarBell) now
clamp to 2 lines with an ellipsis instead of wrapping unboundedly. The
previous behaviour let an overlong label spill into the empty inter-band
gap on either side - correct for an isolated long label, but adjacent rows
that both wrap to 2+ lines spilled into the same shared gap from opposite
directions and rendered as illegibly overlapping text. The full label
remains available via the row's existing `title` attribute.

Fixed: `showZeroLineForXAxis: true` alone did nothing when `showGrid` was left
at its default (`false`, e.g. ComparableHorizontalBarChart's own resolved
default) - the zero line's grid `<line>` was nested inside an `if (showGrid)`
block in the shared `renderXAxisLinear`, so no grid meant no zero line either,
contrary to every consumer's expectation that the two props are independent.
The zero line now draws as a dedicated baseline reference regardless of
`showGrid`; behaviour is unchanged for any consumer that already had
`showGrid: true` (GapChart's own default, since it never set `showGrid`
explicitly).

ComparableVerticalBarChart: the two sub-bars' paint order was FIXED
(valueBased always behind, valueCompared always in front, matching the legacy
vendored chart's own static order) - so whichever field was smaller on a given
row was drawn fully UNDER the taller one and rendered zero visible pixels,
not merely "harder to see". Now decided per row (mirrors
ComparableHorizontalBarChart's existing `comparableDrawOrder`): the shorter
sub-bar always paints last/on top, so neither value is ever fully hidden
regardless of which field it is. Colour/pattern assignment (based = hatch-
eligible, compared = solid) is unchanged - only paint order varies.

ComparableVerticalBarChart: the delta indicator's horizontal placement was
ported from the legacy chart at `bandwidth/3` (offset toward the left third of
the column, not centred) - an unintentional legacy quirk, not a deliberate
design choice. Now centred at `bandwidth/2`.

No breaking changes: all additions are optional/opt-in props or a provable
no-op (rotation/thinning only activates on genuine collision); the two render-
order/position fixes only change output for the specific cases that were
previously broken (a row where the "expected" field isn't the taller one; any
row with a delta indicator, which was never centred to begin with).
