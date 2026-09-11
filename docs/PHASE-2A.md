# PHASE-2A.md

# Aftermark Phase 2A — Neon Scribble Artwork Engine

## Status

Phase 1 is frozen as the interaction prototype.

Phase 2A turns the `AFTER DARK / neon_scribble` path from a frontend mock into a real artwork-generation pipeline while preserving the Phase 1 user journey.

Do not redesign the Phase 1 flow in this phase unless a rendering requirement makes a small UI change necessary.

---

# Phase 2A Goal

Make one style world genuinely work:

`AFTER DARK` → `neon_scribble`

The user should be able to:

1. upload an image
2. choose `AFTER DARK`
3. choose doodle intensity
4. choose record material
5. optionally leave one short message
6. generate
7. receive a real personalized Neon Scribble record
8. save/share the result

The generated artwork must feel materially closer to the approved first Neon Scribble Golden Sample than to the current deterministic Phase 1 mock.

---

# Core Principle

The artwork pipeline is not:

`upload image → ask AI to redraw everything`

It is:

```text
user source image
+ user choices
+ palette analysis
+ semantic motif analysis
+ Neon Scribble style grammar
        ↓
AI-generated outer artwork layer
        ↓
deterministic composition
        ↓
original center image
+ deterministic metadata
+ user message
+ 1–2 restrained AI phrases
        ↓
final collectible artwork
```

The center belongs to the user.

The outer record belongs to the art system.

---

# README Freeze

**Do not modify `README.md` during Phase 2A.**

Do not automatically update the README after tasks, commits, pushes, or milestones.

Do not add progress notes, screenshots, badges, setup notes, API notes, or Phase 2A status to the README.

The README will be edited manually near the end of the project.

Phase-specific implementation notes belong in code comments or the existing phase/spec files, not in `README.md`.

---

# Scope

Phase 2A includes:

- production-ready Neon Scribble rendering architecture
- protected center-image composition
- image palette extraction
- image semantic motif extraction abstraction
- Neon Scribble prompt/art-direction builder
- real outer-art generation provider abstraction
- one concrete production image-generation provider adapter when credentials/configuration are available
- deterministic final compositing
- AI short-phrase generation with strict limits
- deterministic text/metadata rendering
- support for all three doodle intensity levels
- support for the five existing record materials
- save/share using the real rendered result
- error/retry states required by real generation
- visual comparison against the Golden Sample criteria

Phase 2A does not include:

- Analog Memory production generation
- Dream Archive production generation
- login
- payments
- database
- user accounts
- permanent galleries
- public result URLs
- social feed
- music playback
- lyric scraping
- album lookup
- copyrighted album-cover replication
- video generation
- 3D / Blender
- WebGL
- README editing

---

# Golden Path First

Do not attempt all combinations immediately.

The first production path to stabilize is:

```text
style: neon_scribble / AFTER DARK
density: medium / LEAVE A TRACE
material: classic
center: original uploaded image
message: optional
```

This is the Golden Path.

Only after the Golden Path passes visual and technical review should the implementation expand to:

- low density
- high density
- clear
- smoke
- aurora
- pearl

---

# Golden Sample Direction

The richer **first approved Neon Scribble generation** is the reference for medium density.

Important:

- the later reduced revision removed too much content
- do not use the sparse revision as the target
- medium should feel rich, energetic, and collectible while still visibly being a vinyl record

Golden Sample intent:

- obvious real vinyl
- user photo preserved in center
- energetic painted marks around the outer record
- visible record grooves
- strong but controlled color
- personal text
- collectible metadata
- one or two image-derived thematic motifs
- handmade imperfection

---

# Neon Scribble Visual Grammar

Read and preserve the existing:

`docs/styles/neon-scribble.md`

Phase 2A implementation must treat that file as the style source of truth.

Key rules repeated here because they are rendering-critical:

## Marker medium

Primary mark language:

- acrylic paint marker
- opaque paint pen
- POSCA-like marker

Desired characteristics:

- opaque pigment
- hand pressure variation
- slightly uneven edges
- repeated strokes
- physical paint sitting on vinyl
- hand-drawn wobble

Avoid dominant:

- chalk
- crayon
- watercolor
- perfect vector line art
- generic digital neon glow
- cyberpunk HUD
- glossy 3D neon signage

## Center label

Keep the original uploaded image recognizable.

Target center-label diameter:

`28–32%` of record diameter

Allowed:

- crop
- scale
- circular mask
- subtle exposure adjustment
- subtle contrast adjustment
- subtle grain
- restrained color harmonization

Not allowed:

- AI redraw of faces
- changing identity
- replacing source image
- adding/removing people
- major background replacement
- doodles obscuring important center content

## Density

Medium / `LEAVE A TRACE` should be rich.

Guidance, not strict counts:

- ~6–10 meaningful larger elements
- ~10–18 smaller marks
- leave visible grooves
- avoid uniform filling
- avoid excessive empty space

## Color

Suggested doodle-color distribution:

- ~65% source-image-derived palette
- ~25% neutral structural colors
- ~10% surprise accent

Neutral examples:

- white
- off-white
- gray

Surprise examples:

- fluorescent pink
- acid green
- bright orange

Do not spread all colors evenly.

## Doodle semantics

Use the uploaded image to inspire a small number of motifs.

Example coastal image:

- wave
- cliff contour
- sun
- birds
- shell

Do not turn every motif into a polished illustration.

At most one larger thematic doodle should dominate.

The rest should remain small, loose, handwritten, and marker-like.

---

# Text Policy

## User text

The user may provide one message.

Limit:

- maximum 30 words for space-separated languages
- use the existing CJK equivalent limit in the product

The message remains the primary personal text.

Do not rewrite the user's message without explicit product logic.

## AI text

The system may generate:

`1–2 short phrases`

Target length:

`2–5 words each`

Examples:

- `salt air`
- `late light`
- `same sea`
- `good days`

Requirements:

- image/theme relevant
- secondary to the user's message
- emotionally restrained
- no invented personal history
- no fake confession
- no motivational paragraph
- no long slogan

AI phrases should be returned as structured text data and rendered deterministically whenever possible.

## Deterministic metadata

The application owns:

- `ONE OF ONE`
- date
- catalog number
- optional `SIDE A`
- Record Type

Do not rely on the image model to spell these correctly.

---

# Rendering Architecture

Keep the existing Phase 1 `RecordRenderer` contract or evolve it carefully without breaking the creation flow.

Recommended layering:

```text
RecordRenderer
  └── AIRecordRenderer
        ├── SourceImageAnalyzer
        │     ├── palette
        │     └── semantic motifs
        ├── NeonScribbleArtDirectionBuilder
        ├── ArtworkGenerationProvider
        ├── PhraseGenerator
        └── FinalRecordCompositor
```

Names may differ if the implementation is cleaner.

The responsibilities should remain separate.

---

# Source Image Analysis

## Palette extraction

Reuse or improve the existing local palette extraction.

Return a structured palette similar to:

```ts
type ArtworkPalette = {
  primary: string;
  secondary: string;
  neutral: string;
  surprise: string;
};
```

Requirements:

- stable for the same image
- visually representative
- avoid choosing near-identical primary and secondary colors
- preserve a neutral structural color
- surprise color should not simply be another dominant image color

Do not alter the original center image to force palette compliance.

## Semantic motif extraction

Create an abstraction:

```ts
interface SourceImageAnalyzer {
  analyze(input: SourceImageInput): Promise<SourceImageAnalysis>;
}
```

Suggested result:

```ts
type SourceImageAnalysis = {
  palette: ArtworkPalette;
  motifs: string[];
  sceneSummary?: string;
};
```

Motifs should be concise and visual.

Examples:

- `wave`
- `cliff`
- `sun`
- `bird`
- `flower`
- `streetlight`
- `cat`
- `window`
- `cloud`

Limit the number used in final art direction.

Do not dump a verbose caption into the image-generation prompt.

If semantic analysis requires an external provider, keep it behind an adapter.

---

# Art Direction Builder

Create a deterministic builder that combines:

- style pack
- density
- material
- palette
- motifs
- user message
- AI short phrases
- composition constraints

Suggested concept:

```ts
buildNeonScribbleArtDirection(input)
```

The builder should output structured instructions, not an unstructured ad-hoc prompt string only.

Example shape:

```ts
type NeonScribbleRenderPlan = {
  palette: ArtworkPalette;
  density: "low" | "medium" | "high";
  material: RecordMaterial;
  motifs: string[];
  userMessage?: string;
  aiPhrases: string[];
  composition: {
    centerLabelRatio: number;
    preserveGrooves: boolean;
    maxLargeMotifs: number;
  };
  prompt: string;
  negativePrompt?: string;
};
```

The exact schema may differ.

The point is to make the art logic inspectable and testable.

---

# Artwork Generation Provider

Create a provider abstraction.

Example:

```ts
interface ArtworkGenerationProvider {
  generate(
    request: ArtworkGenerationRequest
  ): Promise<ArtworkGenerationResult>;
}
```

Do not bind page components directly to a vendor SDK.

Phase 2A should support one concrete provider adapter when configuration/credentials are available.

Provider requirements:

- server-side secret usage
- no API keys exposed to browser
- configurable through environment variables
- clear missing-config state
- timeouts
- error translation
- retry-safe request handling
- no silent fallback to fake production output

If production credentials are unavailable during Task 01, implement the provider boundary and compositor first.
Do not invent credentials.

---

# Protected Center Strategy

The safest preferred approach is to avoid asking the image model to regenerate the user's center photo.

Preferred output strategy:

1. generate the outer record art separately
2. reserve/mask a clean circular center-label zone
3. composite the original uploaded image into that zone after generation
4. overlay deterministic text and metadata after generation

Possible implementations include:

- generating an outer-ring asset with transparent center
- generating a square layer and applying a deterministic center mask
- generating marks separately and compositing them onto a programmatically rendered vinyl

Choose the approach that preserves the original center image most reliably.

The center image must never depend on image-model fidelity.

---

# Vinyl Base and Material Separation

Do not require the image model to correctly simulate every physical material.

Prefer separating:

- base vinyl/material rendering
- AI mark layer
- center image
- sleeve
- typography/metadata

Where practical:

```text
programmatic material
+ AI paint/doodle layer
+ deterministic center photo
+ deterministic typography
```

This gives better consistency across:

- Classic
- Clear
- Smoke
- Aurora
- Pearl

For the Golden Path, stabilize `Classic` first.

---

# Final Composition

Use a deterministic compositor on the server or in a reliable export layer.

It should be able to combine:

1. sleeve/background
2. vinyl/material base
3. generated doodle/art layer
4. original center image
5. user message
6. AI short phrases
7. metadata
8. subtle final texture/shadow if required

Recommended implementation may use:

- server-side image composition library
- Canvas where reliable
- SVG + raster export
- another deterministic image-composition approach

The final exported image must not depend on screenshotting the browser UI if avoidable.

---

# Typography

The application should own critical text.

Use clearly licensed fonts only.

Functional categories:

1. bold marker-like display hand
2. thin handwritten annotation
3. mono / label / metadata

Do not import random web handwriting fonts with unclear licensing.

Handmade feeling should also come from:

- slight rotation
- varied scale
- irregular placement
- underline strokes
- arrows
- imperfect circles
- repeated marker strokes

Font choice alone is not the handwriting system.

---

# Sleeve

For the Golden Path:

- dark matte sleeve
- subtle paper grain
- restrained marks
- small catalog identity
- visually secondary to the record

Do not make the sleeve as visually dense as the vinyl.

---

# Record Type

Keep the Phase 1 Record Type concept.

The artwork name is not a personality label.

For Phase 2A, the Record Type may continue to use curated deterministic mapping.

Do not spend generation budget on AI naming until the artwork itself is stable.

---

# Error States

Real generation requires explicit states.

Implement at least:

## Missing configuration
Explain that image generation is not configured.
Do not expose secrets.

## Generation failed
Allow retry.

## Analysis failed
Use a safe local fallback where possible, such as palette-only art direction.

## Unsupported/corrupt image
Return the user to image selection with a clear message.

## Timeout
Show a retry action.

Do not lose the user's selections unnecessarily after a generation failure.

---

# Loading / Making State

Keep the existing ritual language.

Do not replace it with a technical progress dashboard.

Allowed:

- `MAKING IT YOURS.`
- `Finding the right marks.`
- `Leaving a little chaos.`
- `Almost yours.`

The UI may reflect actual pipeline stages internally, but the user-facing presentation should stay emotional and simple.

---

# Output Requirements

Real Phase 2A result must feed the existing Reveal and Share flow.

Outputs:

## Main artwork
Preferred:

`2048 × 2048`

## Share card
Existing Phase 1 composition:

`1080 × 1920`

The share card must use the real artwork.

Do not redesign the share card in Task 01 unless required to consume the real result.

---

# Repository / Commit Discipline

Do not modify `README.md`.

Do not auto-update documentation unrelated to Phase 2A.

Do not make a commit or push merely to record every small substep unless the user explicitly asks for that workflow.

When committing/pushing is requested, keep commit scope coherent.

Do not let documentation housekeeping interrupt implementation.

---

# Phase 2A Task Plan

## Task 01 — Neon Scribble Golden Path Pipeline

Goal:

Build the production-ready rendering foundation for:

```text
AFTER DARK
+ LEAVE A TRACE
+ CLASSIC
```

Task 01 should:

1. inspect the existing Phase 1 renderer and state model
2. preserve the current user journey
3. introduce/evolve the production `AIRecordRenderer`
4. introduce the source-image analysis contract
5. reuse existing local palette extraction
6. introduce semantic-analysis abstraction
7. create `NeonScribbleRenderPlan`
8. create the artwork-generation provider abstraction
9. create the final deterministic compositor
10. implement the protected center-image strategy
11. preserve deterministic metadata
12. keep user text deterministic
13. support 1–2 structured AI phrases through an interface
14. wire the Golden Path through the existing Making → Reveal flow
15. provide a deterministic/fake outer-art development adapter only if real provider credentials are unavailable
16. add tests for the render-plan builder and center protection
17. do not expand to other materials or density levels yet
18. do not modify README

Task 01 is an architecture + Golden Path task.
It is not permission to implement the entire Phase 2A scope at once.

### Task 01 success criteria

- Phase 1 flow still works
- `AFTER DARK + LEAVE A TRACE + CLASSIC` uses the new rendering pipeline
- original uploaded center image is preserved exactly through deterministic composition
- palette is passed into the render plan
- semantic motifs have a provider boundary
- outer-art provider has a clean adapter boundary
- deterministic metadata remains correctly spelled
- user message is not generated inside the artwork model
- AI phrases are structured and limited to 1–2
- final renderer returns a real composited asset contract suitable for Reveal/Share
- no API secret is exposed client-side
- no README change occurs

Human review is required before starting Task 02.

---

## Task 02 — Connect and Tune the Real Neon Scribble Generator

After Task 01 review:

- connect/configure the chosen real image-generation provider
- tune the outer-art prompt
- compare against Golden Sample
- tune motif count
- tune marker texture
- tune color ratio
- tune groove visibility
- tune text placement strategy
- stabilize retry/error behavior

Do not begin until Task 01 is approved.

---

## Task 03 — Density Expansion

After the medium Classic path is visually approved:

- low / KEEP IT CLEAN
- high / GO ALL IN

Ensure they are genuinely different art-direction states, not simple opacity changes.

---

## Task 04 — Material Expansion

After Classic is stable:

- Clear
- Smoke
- Aurora
- Pearl

Keep material rendering as deterministic/programmatic as practical.

Do not make each material a completely separate generation system.

---

## Task 05 — Export and Mobile QA

Verify:

- real main artwork
- 9:16 share card
- Save
- native Share
- retry
- mobile performance
- reduced motion
- source image preservation
- no layout regressions

---

# Phase 2A Acceptance Criteria

Phase 2A is complete when:

- `AFTER DARK / neon_scribble` uses a real generation path
- center image is always the original upload
- medium Classic result visually approaches the Golden Sample
- low/medium/high have meaningful art-direction differences
- five materials work without breaking the Neon style
- palette is source-informed
- semantic motifs are source-informed
- user text remains controlled and correct
- AI adds no more than 1–2 short phrases
- deterministic metadata remains correct
- Reveal consumes the real artwork
- Share Card consumes the real artwork
- Save/Share work
- generation errors can be retried
- secrets stay server-side
- README has not been modified
- Analog Memory and Dream Archive remain outside production scope

---

# Human Review Gates

Stop for human review after:

1. Task 01 architecture + Golden Path wiring
2. first real Golden Path render
3. first approved prompt/visual tuning pass
4. density expansion
5. material expansion

Do not silently continue through all gates in one long implementation pass.
