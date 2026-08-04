---
"@michi-vz/core": minor
---

Top/Bottom ranking + legend hiding: the line, comparable-horizontal-bar and comparable-vertical-bar pipelines now rank/slice the FULL set before removing `disabledItems`, so hiding a ranked series via the legend is a view-level hide — the chart draws N−1 series and the (limit+1)-th item never backfills the freed slot (GapChart and the stacked-bar group slice already worked this way). While a `filter` is active, `legendData` is built from the pre-hide ranked slice (a hidden ranked series keeps its greyed pill) and `renderedRankedIds` emits the pre-hide ranked codes, so consumers that mirror the rendered set into a selection (e.g. thd MonitorV2's TopXResultSync) keep the hidden item selected. Without a filter, semantics are unchanged.
