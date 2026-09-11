# PHASE-2B.md

# Aftermark — Task 02-B
## Connect and Tune the Real Neon Scribble Generator

## Status
Task 01 architecture is complete locally.

Phase 2B focuses on visual quality and production-provider selection for:

`AFTER DARK / neon_scribble`

Do not expand into Analog Memory or Dream Archive.

## Frozen Product Decisions

### 1. Golden Density
`R00 / Aftermark Golden Sample v1` is the official visual density anchor for:

`LEAVE A TRACE / medium`

Medium should preserve:
- rich doodle density
- strong color
- many small marks
- visible vinyl
- protected user center image
- user text + restrained AI notes
- irregular / personal composition

### 2. Composition Mode is a User Choice
Add a fourth lightweight choice:

`WHAT SHOULD LEAD?`

- `THE WORDS` → `text_led`
- `THE MARKS` → `motif_led`

Updated flow:

`Upload → Style World → Doodle Intensity → Composition Mode → Material → Leave One Mark → Generate`

### 3. User Text is Deterministic
The user message must be rendered by the application.

Never rely on the image-generation model to spell the user's message.

Principle:

`AI owns paint feeling; the application owns text correctness.`

AI may still contribute 1–2 short structured marginal phrases.

## Phase 2B Primary Goal
Produce stable, aesthetically strong Neon Scribble results across varied user images using a real production image-generation provider.

First tuned target:

- style: `neon_scribble`
- density: `medium / LEAVE A TRACE`
- material: `classic`
- compositionMode: `text_led` or `motif_led`

Both composition modes must work before density/material expansion.

## Artwork Layering
Keep responsibilities separated:

`physical record material + AI doodle/paint layer + original center photo + deterministic user text + deterministic metadata + structured AI marginal phrases + sleeve/reveal UI`

Do not ask one image-generation call to solve every layer.

## TEXT-LED Grammar
The user's words become the dominant designed mark on the outer vinyl.

The model must not render the user message itself.

Instead, the render plan reserves a Hero Lettering zone and generates supporting marks around it.

Required:
- one Hero Lettering zone
- user message or selected short segment rendered deterministically later
- artistic lettering treatment
- supporting image-derived motifs
- micro marks
- 1–2 optional AI note phrases
- visible vinyl breathing room

Allowed:
- curved around the vinyl
- angled across an open region
- layered outline + fill
- slightly rotated
- integrated with underline / arrows / paint streaks

Avoid:
- clean corporate typography
- perfect vector placement
- generic sticker label
- wedding calligraphy
- AI-generated misspelled text

## MOTIF-LED Grammar
Image-derived doodles lead the composition.

Suggested structure:
- roughly 65% micro symbols / small marks
- one larger concrete thematic motif allowed
- user text remains visible but secondary
- 1–2 AI note phrases maximum
- irregular / asymmetric layout

Do not create multiple large polished illustrations.

## Physical Paint Target
Primary outer-art medium:
- acrylic paint marker
- opaque paint pen
- POSCA-like marker

Required cues:
- pigment visibly sits on vinyl
- strong opacity
- pressure variation
- repeated pass / overdraw
- slight hand wobble
- irregular edges
- glossy vinyl and paint respond differently to light

Avoid:
- crayon-dominant texture
- chalk-dominant texture
- smooth vector lines
- generic neon glow
- cyberpunk HUD
- sticker-pack look

## Color Target
Maintain:
- ~65% source-image-derived palette
- ~25% neutral structural colors
- ~10% surprise accent

Additional:
- increase saturation enough for acrylic marks to visibly sit above dark vinyl
- do not make all colors equally loud
- avoid full-rainbow overload

## Runtime Reference Policy
Pinterest, Behance, Etsy, Landbook, etc. are for human art-direction extraction.

Do not make production runtime depend on unlicensed third-party artworks.

Runtime references should prioritize:
- Aftermark-owned Golden Samples
- Aftermark-generated approved material samples
- clearly licensed / user-owned references

Every runtime reference must have a declared role, such as:
- `COMPOSITION_REF`
- `PAINT_MATERIAL_REF`
- `CLASSIC_VINYL_REF`
- `LETTERING_REF`
- `NEGATIVE_REF`

Do not send an unlabeled bundle of references to a model.

## Reveal / Sleeve Separation
R00 review identified the simple black sleeve-under-record presentation as too ordinary.

Future Reveal may explore:
- record sliding out
- record rotating out
- partial sleeve reveal

This is not part of generator tuning.

## Task 02-B Work Plan

### B01 — Provider Benchmark Harness
Compare real image-generation providers using the same render plans and same images.

Deliver:
- benchmark runner behind existing provider abstraction
- normalized request logging without secrets
- provider/model identifier in dev diagnostics
- benchmark contact sheets
- latency and cost-estimate fields when available
- no README changes

Stop for human review after benchmark artifacts are produced.

### B02 — Choose Production Provider
Choose from human visual review + technical score.

Do not select a provider based only on latency or cost.

### B03 — Tune TEXT-LED
Tune:
- Hero Lettering reserved zone
- AI paint around text
- typography overlay system
- small motif count
- color
- physical acrylic feeling

### B04 — Tune MOTIF-LED
Tune:
- semantic motif selection
- small-symbol richness
- one larger motif limit
- irregular composition
- user-text placement

### B05 — Consolidate Neon Scribble Medium / Classic
Both modes must:
- feel related
- not look templated
- preserve center image
- retain vinyl identity
- achieve R00-class richness

## README Rule
Do not modify `README.md` during Task 02-B.

No automatic README updates after tasks, commits, pushes, benchmarks, or tuning passes.

README will be edited manually near the end of the project.
