# Benchmark inputs

Bundled:
- `G01_DAY_LANDSCAPE_COAST.png` — original coast photo used for the R00 Golden Sample.

Still required before the real 18-render bake-off:
- `G02_PORTRAIT.*` — ordinary single-person phone portrait.
- `G06_NIGHT_LOW_SATURATION.*` — night or low-saturation photo.

Do not silently substitute generated provider outputs for missing benchmark inputs.
A dry-run may mark jobs skipped until these two inputs are supplied.

Provider credentials are intentionally NOT bundled in this package.
They must be configured locally/server-side using environment variables and must never be committed.
