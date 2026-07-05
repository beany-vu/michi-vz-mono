---
"@michi-vz/core": patch
"@michi-vz/insights": patch
---

Dense band axes now thin their labels to a readable subset instead of smearing.

- `renderYAxisBand` (Gap, Comparable, Dual, Bar-Bell row labels): when bands are
  shorter than a text line, label an even subset (endpoints kept, numeric domains
  snapped to round values) and thin the per-band grid with it. New optional
  `maxTicks` on `YAxisBandOptions`. Marks and tooltips still render for every row.
- FountainChart snapshot mode now lays out its band x-axis with the shared
  `chooseAxisMode` policy (fit, else rotate with reserved bottom margin, else thin).
- insights: the exported `version` constant is now stamped from package.json at
  build time (it had drifted to "0.1.0"), so it can never go stale again.
