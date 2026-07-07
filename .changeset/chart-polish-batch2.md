---
"@michi-vz/core": patch
---

Three band/label layout fixes surfaced by a live sdg-trade review. All are
internal behaviour changes - no new props, no breaking API.

ComparableVerticalBarChart / VerticalStackBarChart / FountainChart (shared
`chooseAxisMode`): the -45° rotated-label decision now keys on the PERPENDICULAR
gap between neighbouring labels (`bandWidth · cos45` vs a text line-height),
instead of comparing label WIDTH to 3× the band. Rotated labels trail as
parallel diagonal lines exactly one band apart, so a few long category labels at
wide bands (e.g. ~14 region names at ~50px bands) do not actually overlap when
rotated - they only need more bottom margin, which the engine already reserves.
The old width-based test wrongly forced those into horizontal thinning, dropping
half the region labels and overlapping the rest. Genuinely dense axes (bands
narrower than a line of text) still fall through to thinning exactly as before.

ComparableHorizontalBarChart: the left label gutter now auto-fits the widest row
label (measured via the existing `measureLabelWidth`) so long category names -
e.g. "Landlocked developing countries (LLDCs)" - render on one line instead of
being clipped to the fixed 120/100px default and forced into the 2-line ellipsis.
Only applies when the consumer left `margin`/`tickHtmlWidth` at their defaults
(an explicit value is honoured verbatim); the gutter only grows, never shrinks
below the default, and is capped at 40% of the chart width so one very long label
can't consume the plot (the 2-line ellipsis remains the safety net at the cap).

ScatterChart `pointLabels`: a point label whose default right-side placement
would cross the plot's right edge now flips to the LEFT of its point
(`text-anchor: "end"`), so a bubble hugging the right axis keeps its label
on-chart instead of having it cropped. Reuses the label width already measured
for overlap-hide; when the flipped label wouldn't fit on the left either, it
stays right (unchanged). Byte-identical output for any label that already fit.
