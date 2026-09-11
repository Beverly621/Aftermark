# Codex addendum — Freeze G02 and G06

Use `docs/FIXED-BENCHMARK-INPUTS.md` and
`assets/benchmark-inputs/FIXED_SOURCES.json` as the source of truth.

G02 and G06 are now frozen.

Fetch each source once, save it locally using the exact filenames, compute SHA-256,
and update the benchmark manifest to pin those hashes.

Do not substitute different images.
Do not generate replacement images.
Do not create fake benchmark results if a download or credential is unavailable.
Do not modify README.

After fetching, re-run the dry-run and report:
- G01/G02/G06 local-path status
- SHA-256 for G02 and G06
- which jobs remain blocked only by provider credentials
- confirmation that the 18-job matrix is unchanged

Do not start paid generation until human approval.
