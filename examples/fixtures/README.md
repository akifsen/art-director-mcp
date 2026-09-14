# Review fixtures

Small static pages and briefs used by `tests/fixtures.test.mjs` to exercise the whole flow without a build step. They are not product demos.

- `portfolio/` — brief plus a healthy page. The audit must report no deterministic findings here (false-alarm check).
- `dashboard/` — brief plus `broken.html`, which contains two deliberate, scoped defects (a fixed-width table that overflows the page and a search input whose visible text is not associated with it, so it has no accessible name), and `fixed.html`, where both are corrected. The audit must find both defects in `broken.html` and none in `fixed.html`.

The React/Vite product example lives in `../expressive-product`.
