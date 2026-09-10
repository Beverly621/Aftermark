# Aftermark — Codex Start Prompt

Read these files before writing code:

- `AGENTS.md`
- `docs/PRODUCT.md`
- `docs/PHASE-1.md`
- `docs/styles/neon-scribble.md`

Then implement **Phase 1 only**.

The project is **Aftermark** with the brand line **Made to keep.**

The goal is a polished, mobile-first prototype of an interactive digital record experience:

**upload → participate → anticipate → reveal**

Important product constraints:

- preserve the user's original image in the record center label
- require 1 upload, 3 meaningful choice steps, 1 optional short message (max 30 words), and 1 final generate action
- keep the architecture ready for up to 2 additional lightweight choice screens later
- use a replaceable `RecordRenderer` abstraction
- implement a `MockRecordRenderer` for Phase 1
- fully implement the user journey through Landing, Upload, Style World, Doodle Intensity, Material, Leave One Mark, Making, Reveal, and Share
- build mobile-first around 390×844
- do not add login, payments, database, social feed, permanent gallery, WebGL, complex 3D, or production AI generation
- do not redesign the product into a generic AI SaaS interface
- do not reduce the interaction to `upload → generate`

For `neon_scribble`, use the style spec exactly. The richer **first approved sample** is the reference for medium (`LEAVE A TRACE`) density; do not use the overly sparse later revision as the target.

Implementation order and acceptance criteria are in `docs/PHASE-1.md`.

After implementation:

1. run the app
2. test the full flow at 390×844
3. test at 375×667, 430×932, and desktop
4. report what was implemented
5. report anything incomplete
6. report any visual/product decisions that still need human review
7. do not silently add extra product features
