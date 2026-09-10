# Neon Scribble — Style Pack

Internal key:

`neon_scribble`

Display world:

`AFTER DARK`

# Definition

A real collectible vinyl record covered with personal, energetic acrylic paint-marker traces, while the user's original image remains intact in the center label.

The result should feel:

- handmade
- personal
- imperfect
- collectible
- energetic
- tactile
- youthful

It should not feel like:

- a cyberpunk UI
- a neon sign
- a generic AI poster
- a vector sticker pack
- a children's rainbow illustration

# Golden Sample reference

Use the **first approved Neon Scribble generation** as the density reference.

Important correction:

The later reduced version removed too many elements.
For `medium / LEAVE A TRACE`, preserve the richer first-version feeling.

# Composition

Primary artwork ratio:

`1:1`

Suggested visual proportions:

- vinyl width: roughly 68–74% of main composition
- center label: 28–32% of vinyl diameter
- sleeve visible behind record: roughly 20–30%
- keep a meaningful amount of vinyl groove visible

Visual hierarchy:

1. vinyl record
2. marks / doodles
3. center image

The image must not read first as a poster.

# Center label

The center is a protected user-image zone.

Allowed:

- circular crop
- scale
- light tonal harmonization
- subtle grain

Do not:

- redraw people
- replace faces
- add/remove people
- change the source into a different art style
- let doodles cover important faces/content

A small amount of mark overlap near the edge is acceptable if it feels natural.

# Surface and marker language

Primary drawing medium:

- acrylic paint marker
- opaque paint pen
- POSCA-like marker

Desired stroke qualities:

- opaque coverage
- slightly uneven edges
- visible human pressure variation
- occasional repeated pass
- hand-drawn wobble
- physical pigment sitting on vinyl

Avoid using these as the dominant medium:

- chalk
- crayon
- watercolor
- smooth vector lines
- digital neon glow
- spray-airbrush gradients

Small supporting use of highlighter, sticker, scratch, or tape is acceptable.

# Density

For `medium / LEAVE A TRACE`, use the first approved sample as the reference.

Guidance:

- roughly 6–10 meaningful larger elements
- roughly 10–18 smaller marks
- counts are not strict
- avoid uniform filling
- maintain hierarchy and breathing room

Do not reduce the design to only a few sparse symbols.

Do not fill every available area.

# Color system

The artwork should feel derived from the source image without becoming mechanically matched to it.

Suggested doodle color distribution:

- ~65% source-image-derived colors
- ~25% neutral structural colors
- ~10% surprise accent

Neutral structural colors may include:

- white
- off-white
- gray

Surprise accent examples:

- fluorescent pink
- acid green
- bright orange

Rules:

- black/dark vinyl remains visually dominant
- do not distribute every color evenly
- avoid full-rainbow appearance unless specifically justified
- one surprise accent is better than many competing accents

Example for a coastal photo:

- cyan / blue = primary
- white = structure
- sand / cream = minor
- pink = surprise

# Doodle vocabulary

Allowed visual vocabulary includes:

- stars
- sun
- heart
- arrows
- waves
- eyes
- smiley
- flowers
- lightning
- cloud
- tiny animal sketch
- circles
- underlines
- cross-outs
- dots
- paint streaks
- small stickers
- small labels
- numbers
- symbols

The art system should extract a few semantic motifs from the uploaded image.

Example:

A coastal cliff photo might inspire:

- sea
- cliff contour
- sun
- birds
- shell
- wave

Do not turn every motif into a polished full illustration.

At most one larger thematic illustration is acceptable.
The rest should remain doodle-like.

# Text system

## User message
The user's message is the primary personal text.

Exactly one user message may be present.

Maximum:

- 30 words
- equivalent CJK character limit in UI

It may be empty.

## AI-written phrases
AI may add:

**1–2 short phrases**

Rules:

- secondary to user message
- usually 2–5 words
- feel like marginal notes
- relevant to the image/theme
- emotionally restrained

Good examples:

- `salt air`
- `late light`
- `good days`
- `same sea`

Avoid:

- long slogans
- motivational copy
- fake confessions
- invented life stories
- paragraphs

## Deterministic metadata
Prefer deterministic rendering for:

- `SIDE A`
- `ONE OF ONE`
- date
- catalog number

Do not depend on image generation for text correctness.

# Handwriting and lettering

Do not rely on random web fonts with unclear licensing.

Implementation direction:

- use a small set of clearly licensed fonts
- combine them with a stroke / mark system
- handwriting should not look perfectly typeset

Recommended functional font categories:

1. bold marker-like display hand
2. thin handwritten annotation
3. machine / label / mono metadata

Human feel should also come from:

- arrows
- underlines
- imperfect circles
- strike-throughs
- repeated strokes
- slight rotation
- varied scale
- irregular placement

A font alone is not enough.

# Sleeve

The sleeve is secondary.

Suggested treatment:

- dark matte paper
- subtle grain
- small catalog label
- light wear
- very restrained marks

Do not decorate the sleeve as densely as the vinyl.

# Lighting

The record should have enough physical realism to feel collectible.

Use:

- visible grooves
- restrained specular highlights
- subtle reflective sweep
- slight depth

Avoid:

- futuristic CGI showroom
- chrome-heavy 3D rendering
- excessive bloom
- synthetic glowing edges

The handmade marks should remain more important than rendering spectacle.

# Failure conditions

A Neon Scribble render fails if:

- it reads as a poster before a record
- the user image is no longer recognizable
- the center image is reinterpreted by AI
- the record becomes a generic cyberpunk object
- text overwhelms the artwork
- AI invents many long phrases
- doodles look like clean vector icons
- all colors are equally saturated
- the design becomes a children's sticker collage
- the black/dark record surface disappears
- the result is dramatically sparser than the first approved sample at medium density
