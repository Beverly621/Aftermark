# Aftermark Product

## Identity

**Aftermark** — **Made to keep.**

Aftermark is an AI-assisted digital gift and collectible that turns something a user loves into a one-of-one digital record. It is not a generic image generator, prompt box, photo filter, personality test, or album-cover copier.

The experience is:

`upload → participate → anticipate → reveal`

The user should feel that the result is theirs, that their choices shaped it, and that it is worth saving or sharing.

## Product principles

### Record first

The final composition must read in this order:

1. collectible record
2. doodle and paint marks
3. user image

The result must not read first as an AI poster.

### The center belongs to the user

The original upload remains recognizable in a protected circular center, generally 28–32% of the record diameter. Crop, scale, light tonal adjustment, subtle grain, and color harmonization are allowed. Redrawing identity, replacing faces, adding/removing people, or converting the source into a different character or style are not.

### Participation matters

A normal session uses one image, 3–5 lightweight visual choices, one optional short message, and one final generate action. Choices must influence the artwork without exposing prompts, models, denoise values, or other technical controls. Do not collapse the experience into `upload → wait → image`.

### Keep the message personal and small

The user may leave one optional short message, up to 30 words or a reasonable equivalent for CJK languages. It is application-rendered, not model-rendered, and should feel like leaving a mark rather than filling in a prompt.

Aftermark may add one or two restrained marginal phrases. They must be short, image/theme relevant, and never invent memories, relationships, confessions, or motivational copy.

## Current production path

Currently production-supported:

- Style World: **AFTER DARK** / `neon_scribble`
- Doodle Intensity: **LEAVE A TRACE** / `medium`
- Material: **CLASSIC** / `classic`
- Composition: **THE WORDS** / `text_led`
- Composition: **THE MARKS** / `motif_led`

Unsupported choices may remain visible in Local Studio only when disabled and clearly labeled `COMING LATER`. The runtime must never silently replace a visible selection.

## Planned product vocabulary

These names remain part of the long-term product language but are not production rendering promises today.

Style Worlds coming later:

- **IN A DRAWER** / `analog_memory`: tape, stamps, worn labels, aged paper, archival warmth
- **SOMEWHERE IN A DREAM** / `dream_archive`: translucent layers, haze, clouds, stars, soft glow

Doodle intensities coming later:

- `low`
- `high`

Materials coming later:

- `clear`: transparent vinyl with physical grooves and refraction
- `smoke`: irregular translucent dark marbling
- `aurora`: reflected holographic diffraction, never a flat rainbow gradient
- `pearl`: clear-white pearlescence with fine sparkle and subtle color shift

Do not implement or expose these as working production choices until a task explicitly expands the supported path.

## Text and collectible identity

The application owns all literal text. Typical deterministic elements include:

- user message
- one or two restrained marginal phrases
- `ONE OF ONE`
- date
- catalog number
- optional `SIDE A`

Catalog numbers provide collectible identity rather than global database uniqueness. A Neon Scribble example is `NS-260910-037`.

Reveal includes a **Record Type** describing this artwork instance, not the user or a personality result. Examples include `NEON RIOT`, `AFTERGLOW`, `CLEAR SIGNAL`, and `MIDNIGHT COLOR`.

## Outputs and reveal

The current pipeline produces:

- a 2048×2048 main record artwork
- a separately composed 1080×1920 share card

Reveal should feel like the payoff after participation and anticipation. The share card should be understandable in a screenshot and support the loop `see → want to try → make → share`. It must not be a simple crop of the square artwork.

## Experience quality

- mobile first, desktop responsive
- minimal, editorial, object-focused UI
- large typography and generous whitespace
- calm transitions with an expressive reveal
- no dashboard layout, dense navigation, model selectors, technical controls, or generic AI branding

## Current non-goals

Unless explicitly introduced by a future task, do not add authentication, payments, profiles, databases, a social feed, permanent galleries, collaborative editing, advanced canvas tooling, WebGL/3D, AR, video generation, music playback, album lookup, lyric scraping, or copyrighted album-cover replication.
