# PROVIDER-BENCHMARK.md

# Aftermark Task 02-B — Provider Benchmark

## Goal
Select the best real image-generation provider for Neon Scribble outer-art generation.

The provider is not responsible for:
- preserving the center photo
- final user-message spelling
- catalog metadata
- sleeve/reveal UI

The provider is judged mainly on:
- acrylic paint physicality
- composition obedience
- reference-role fidelity
- source-informed motifs
- palette control
- consistency

## Current Shortlist

### Candidate A — OpenAI GPT-Image-2
Benchmark role:
`GENERAL QUALITY / INSTRUCTION FOLLOWING`

Why:
- current OpenAI state-of-the-art image generation/editing model
- supports image input/output
- supports high-fidelity image inputs
- suitable for detailed instruction following and reference-guided art direction

### Candidate B — Google Gemini 3 Pro Image
Benchmark role:
`MULTI-REFERENCE / PROFESSIONAL ASSET`

Why:
- positioned for professional asset production and complex instructions
- supports high-fidelity multi-image input
- suitable for role-based references
- can generate up to 4K

If iteration cost/latency is too high, Gemini 3.1 Flash Image can be tested later as a speed-oriented alternative.

### Candidate C — FLUX.2 Pro / Max
Benchmark role:
`COLOR CONTROL / MULTI-REFERENCE / ARTISTIC RENDERING`

Why:
- current BFL image generation/editing family
- multi-reference editing
- precise hex-color control
- strong fit for source-derived palette constraints

Start with one quality-oriented FLUX.2 variant, not several at once.

## Optional Specialist — Stability AI
Do not include in the initial three-provider bake-off unless needed.

Strength:
- explicit mask-based editing/inpainting

Why not primary:
Aftermark already protects the center deterministically.

## Benchmark Scoring — 100 points

### 1. Acrylic paint physicality — 25
Look for:
- pigment opacity
- uneven edges
- pressure variation
- repeated strokes
- hand wobble
- clear separation from glossy vinyl

### 2. Composition obedience — 20
Check:
- protected center
- text-led vs motif-led plan
- irregular/asymmetric layout
- medium density
- one larger motif limit

### 3. Reference-role fidelity — 15
Can the model use:
- composition reference
- paint-material reference
- vinyl-material reference

without blending/copying them indiscriminately?

### 4. Motif quality — 10
Relevant, concise, visually interesting, not clip-art or childlike sticker spam.

### 5. Palette control — 10
Source-derived palette + neutrals + one surprise accent.

### 6. Consistency — 10
Does style remain recognizably Aftermark across six renders?

### 7. Latency — 5

### 8. Cost — 5

## Bake-Off Procedure

### Step 1 — Freeze benchmark inputs
Use:
- G01 landscape
- G02 portrait
- G06 night

Each in:
- TEXT-LED
- MOTIF-LED

### Step 2 — Freeze render plan
Use same:
- palette
- motifs
- density
- material
- user text
- reference roles

as closely as provider APIs allow.

### Step 3 — Generate blind contact sheets
Show:
- source image
- anonymous outputs labeled P1 / P2 / P3

Prefer human scoring before revealing provider names.

### Step 4 — Score
Record hard failures:
- vector/sticker look
- AI text contamination
- center-zone violation
- too sparse
- too childlike
- radial/mechanical layout
- muddy colors
- crayon/chalk dominance

### Step 5 — Reveal provider names
Compare:
- visual score
- latency
- cost
- implementation complexity

Choose one production provider.

Keep provider abstraction intact.

## Important
Do not benchmark user-text rendering quality.

User text is deterministic.

Do not ask the provider to create the final sleeve/reveal composition.

Benchmark only the outer Neon Scribble contribution.
