---
"@michi-vz/core": minor
---

`TimelineController.seek(p)` now looks for the period first, comparing as text, so `seek(2021)` and `seek("2021")` both land on 2021 whether the data's periods are numbers or strings. A number counts as a position only when no period matches it, and a string that matches none does nothing. New `seekIndex(i)` always goes by position (clamped, rounded), and the built-in scrubber uses it. Behaviour change: code that passed a position which is also a period value (for example `seek(2)` on periods 1-12) now lands on that period; call `seekIndex` to go by position.
