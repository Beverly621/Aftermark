# Codex Task 02-B01 Prompt

## Task name
**Task 02-B01 — Real Provider Benchmark Harness**

Read before coding:
- `AGENTS.md`
- `docs/PRODUCT.md`
- `docs/PHASE-1.md`
- `docs/PHASE-2A.md`
- `docs/PHASE-2B.md`
- `docs/styles/neon-scribble.md`
- `docs/GOLDEN-TEST-SET.md`
- `docs/PROVIDER-BENCHMARK.md`
- `NEON-SCRIBBLE-REFERENCE-SYNTHESIS-v1.1.md` if present

Implement **Task 02-B01 only**.

Do not begin provider tuning or select a winner automatically.

## Frozen product changes

Add the fourth user choice:

`WHAT SHOULD LEAD?`

- `THE WORDS` → `text_led`
- `THE MARKS` → `motif_led`

This choice must become part of `RecordArtDirection`.

Updated flow:

`Upload → Style World → Doodle Intensity → Composition Mode → Material → Leave One Mark → Generate`

## Text rule
User text must be rendered deterministically by Aftermark.

Do not ask the artwork provider to render the user's message.

For TEXT-LED mode, generate an open/reserved Hero Lettering zone plus supporting paint marks. Aftermark overlays the real user text later.

AI may contribute only 1–2 short structured marginal phrases.

## Benchmark goal
Build a provider-benchmark harness that can run the same Neon Scribble render plan against multiple provider adapters and export comparable results.

Initial candidates are documented in `docs/PROVIDER-BENCHMARK.md`.

Do not hard-bind UI components to any provider.

Do not expose API keys client-side.

Do not invent credentials.

## Benchmark subset
Use:
- G01 day landscape
- G02 portrait
- G06 night/low-saturation

Run:
- TEXT-LED
- MOTIF-LED

Target:
6 renders per provider candidate.

If all provider credentials are not available, implement adapters/harness for those that can be configured and report what remains unavailable.

## Deliverables
- composition mode type/state
- Composition Mode UI screen
- updated `RecordArtDirection`
- structured TEXT-LED render plan
- structured MOTIF-LED render plan
- benchmark runner
- normalized provider result metadata
- latency recording
- cost field / cost-estimate field where provider data allows
- anonymous contact-sheet export support
- benchmark result manifest JSON
- tests for composition-mode plan behavior
- regression tests for protected center and deterministic user text
- no README changes

## README freeze
**Do not modify `README.md`.**

Do not update it after this task, after commits, or after pushes.

## Stop gate
Stop after the benchmark harness and available benchmark artifacts are produced.

Do not:
- choose the winning provider
- tune prompts deeply for one provider
- begin TEXT-LED visual tuning
- begin MOTIF-LED visual tuning
- expand density
- expand materials
- modify Analog/Dream
- modify README

## After implementation
Report:
1. files changed
2. composition-mode UI/state changes
3. providers implemented/configurable
4. which benchmark providers actually ran
5. benchmark artifact paths
6. tests/typecheck/build results
7. confirmation README is unchanged
8. missing credentials/configuration
9. blocking provider API differences

Then stop for human review.
