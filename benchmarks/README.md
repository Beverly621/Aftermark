# Frozen Provider Benchmark

## Purpose and status

This harness compares outer-art provider adapters under the same Neon Scribble inputs and render plan. It is frozen infrastructure for possible future BYOK/hosted evaluation and is not the current Skill generation path. It does not choose a winner, tune production visuals, render user text, or create final records.

Run a dry run with:

```bash
npm run benchmark:providers
```

The matrix is fixed at three inputs × two composition modes × three providers = 18 jobs. Configuration lives in `benchmarks/provider-benchmark.config.json`; execution lives in `scripts/run-provider-benchmark.ts`.

## Frozen inputs

All providers and later comparisons must use these exact local files and SHA-256 values:

| ID | File | SHA-256 | Provenance |
|---|---|---|---|
| G01 | `assets/benchmark-inputs/G01_DAY_LANDSCAPE_COAST.png` | `2c412d974cc67eb4fffbd8799c4a9c2bc97abec4019510817c22bb06498b1e4e` | Original coast input used for the R00 sample; redistribution rights are not explicitly documented in the repository. |
| G02 | `assets/benchmark-inputs/G02_PORTRAIT_CC0.jpg` | `3bd51cd75d45eb1ef0179487544636a6d5638b22bb1e5e8c255b54282f43eb8f` | “Texting Woman Phone,” Kristin Hardwick, CC0 1.0; source metadata is pinned in `assets/benchmark-inputs/FIXED_SOURCES.json`. |
| G06 | `assets/benchmark-inputs/G06_NIGHT_LOW_SATURATION_CC0.jpg` | `cbdeb205b5265c3309b4a4e16bc4305906b22791226b1d4f51045cc23e545336` | “Street at night, black and white,” www.Pixel.la Free Stock Photos, CC0 1.0; source metadata is pinned in `assets/benchmark-inputs/FIXED_SOURCES.json`. |

Do not re-download, substitute, regenerate, or silently accept a hash mismatch.

## Providers and blind review

The frozen aliases are:

- P1: OpenAI, default model `gpt-image-2`
- P2: Google, fixed model `gemini-3-pro-image`
- P3: Black Forest Labs, default model `flux-2-pro`

The reviewer-facing `blind-review-manifest.json` exposes aliases only. Provider identity stays in `provider-key.json` until blind scoring is complete. Internal `manifest.json` and `request-log.jsonl` retain implementation diagnostics without raw provider prompts or credentials. `anonymous-contact-sheet.png` is a review artifact, not a runtime Golden Reference.

Artifacts are under `benchmarks/artifacts/task-02-b01/`.

## Paid execution gate

Real provider calls require both:

```text
--execute
AND
AFTERMARK_BENCHMARK_PAID_APPROVED=true
```

Requesting execution does not mean a provider call was attempted. The manifest tracks the request/approval state separately from `paidGenerationStarted`. Credentials remain server-side environment variables and must never be committed.

The adapters enforce the artwork-provider privacy boundary: user message, catalog number, date, deterministic metadata, and application-rendered marginal phrases must not enter provider requests.
