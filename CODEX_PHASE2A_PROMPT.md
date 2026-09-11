# Codex Phase 2A Start Prompt

## Task name

**Task 01 — Neon Scribble Golden Path Pipeline**

Read these files before writing code:

- `AGENTS.md`
- `docs/PRODUCT.md`
- `docs/PHASE-1.md`
- `docs/PHASE-2A.md`
- `docs/styles/neon-scribble.md`

Then implement **Task 01 only** from `docs/PHASE-2A.md`.

The goal of this task is to build the production-ready rendering foundation for the single Golden Path:

```text
AFTER DARK
+ LEAVE A TRACE
+ CLASSIC
```

Preserve the existing Phase 1 user journey.

Key requirements:

- keep the original uploaded image protected in the record center label
- do not ask an image model to redraw the center photo
- build/evolve an `AIRecordRenderer` behind the existing renderer abstraction
- create a source-image analysis contract
- reuse the existing local palette extraction
- create a semantic-motif analysis abstraction
- create a structured Neon Scribble render plan / art-direction builder
- create an artwork-generation provider abstraction
- create a deterministic final compositor
- keep user text and critical metadata deterministic
- AI may contribute only 1–2 short structured phrases
- keep all provider secrets server-side
- if real provider credentials/configuration are unavailable, do not invent credentials; implement the provider boundary and use a clearly marked development adapter only where necessary to complete Task 01
- do not expand to low/high density yet
- do not expand to Clear/Smoke/Aurora/Pearl yet
- do not implement Analog Memory or Dream Archive production generation
- do not redesign the Phase 1 pages unless a minimal rendering integration change is necessary

## README rule

**Do not modify `README.md`.**

Do not update the README after this task.
Do not update the README after commits or pushes.
Do not add Phase 2A progress, setup notes, screenshots, badges, implementation notes, or API notes to the README.

I will edit the README manually near the end of the project.

Do not let README/documentation maintenance interrupt implementation.

## Scope discipline

Implement only Task 01.

Do not silently continue into Task 02 after Task 01 passes.

Do not add login, payments, database, gallery, public result URLs, social feed, WebGL, 3D, music playback, lyric scraping, or video generation.

## Before coding

Inspect the existing Phase 1 implementation and report, briefly:

1. current `RecordRenderer` shape
2. current palette extraction location
3. current final export/composition path
4. which files you plan to modify/create for Task 01

Then proceed with implementation unless you discover a blocking contradiction with the specs.

## After implementation

1. run typecheck
2. run build
3. run relevant tests
4. test the existing Phase 1 flow for regressions
5. verify the original center image is preserved
6. verify critical metadata is deterministic
7. verify no API secret is present in client bundles/source
8. verify `README.md` is unchanged
9. report:
   - files changed
   - architecture implemented
   - what is real vs development/mock
   - test/build results
   - any unresolved provider configuration
   - visual/product decisions requiring human review

Stop after Task 01 and wait for review.
