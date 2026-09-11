# GOLDEN-TEST-SET.md

# Aftermark Neon Scribble — Golden Test Set

## Purpose
Prevent prompt/provider tuning from overfitting to one attractive source image.

## Full Test Set

### G01 — Day Landscape
Use the existing coastal/cliff image already used for R00.

Tests:
- blue/neutral palette extraction
- landscape motifs
- wave / cliff / bird semantics
- large empty sky
- non-human center image

### G02 — Single Person / Portrait
Use an ordinary phone portrait.

Tests:
- personal center anchor
- center crop
- color extraction
- doodles should not become face decorations

### G03 — Two-Person Photo
Use a casual friend/couple photo.

Tests:
- center crop robustness
- gift use case
- no invented relationship claims

### G04 — Pet
Suggested: cat or dog.

Tests:
- recognizable motif extraction
- playful marks without children's sticker art
- text/motif balance

### G05 — Anime / Artwork
Use user-provided or clearly usable artwork.

Tests:
- center image remains untouched
- outer Neon Scribble does not blindly copy source drawing style
- avoid franchise-character sticker language

### G06 — Night / Low-Saturation Image
Tests:
- dark palette handling
- surprise accent
- avoid muddy acrylic marks
- maintain record contrast

### G07 — Ordinary / Imperfect Mobile Input
Examples:
- screenshot
- compressed phone image
- awkward crop
- unremarkable scene

Tests:
- result still desirable
- no dependence on beautiful photography
- crop/palette robustness

## Provider Benchmark Subset
Use:
- G01 Day Landscape
- G02 Portrait
- G06 Night / Low-Saturation

For each source run:
- TEXT-LED
- MOTIF-LED

Per provider:
`3 images × 2 modes = 6 renders`

For three candidates:
`18 benchmark renders`

## Winner Validation
After choosing the leading provider:

`7 images × 2 modes = 14 renders`

Only then begin fine tuning.

## Fixed Benchmark Settings
Keep constant:
- style: `neon_scribble`
- density: `medium`
- material: `classic`
- same source-image analysis result where possible
- same palette
- same motifs
- same user message
- same AI phrase data where possible
- same composition-mode plan
- same output target
- same reference roles

Do not let each provider receive a substantially different art direction during the initial benchmark.

## Suggested Test Message
English:
`summer never ended`

Chinese overlay test:
`夏天没有结束`

User text must remain application-rendered.

## Human Review
For every output record:
- provider
- model
- input ID
- composition mode
- seed if available
- latency
- estimated/actual cost if available
- visual score
- notes

Do not rely on one lucky seed.
