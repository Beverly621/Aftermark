# PRODUCT.md

# Product Definition

## Brand

**Aftermark**

Brand line:

> Made to keep.

Working meaning:

> A mark left after a moment has passed.

Aftermark is the brand. The first product experience is the digital doodle record described below.

## Working concept
An AI-assisted digital gift and collectible experience that turns something the user loves into a one-of-one record.

The first form factor is a **digital doodle record**.

The record is a container for:

- a photo
- a memory
- a person
- a place
- artwork
- a favorite moment
- a feeling
- a short personal message

Music can inspire the experience, but the product is not limited to music and should not depend on copying recognizable album artwork.

## Core promise

Brand-level promise:

> Made to keep.

Product-level hook:

> Turn something you love into a record.

The user should feel:

- “This is mine.”
- “I helped shape this.”
- “It feels collectible.”
- “I want to save it.”
- “I want to show someone.”
- “I want to try again with different choices.”

## Product category
This is not primarily:

- a photo filter
- a style-transfer tool
- a quiz
- a music player
- an album-cover generator
- a generic prompt box

It is:

**User Input → Guided Art Direction → Style Grammar → Digital Gift**

## Participation principle
Do not automatically decide everything that could become a meaningful lightweight user choice.

The product should not behave like:

`upload → wait → receive AI image`

It should behave like:

`upload → participate → anticipate → reveal`

User choices are part of the emotional value of the product.

A normal session should contain:

- 1 image upload
- 3–5 lightweight choices
- 1 optional short text input
- 1 final generate action

Target interaction time before generation:

**20–45 seconds**

The user should never need to understand prompt engineering, rendering parameters, saturation, denoise values, model names, or other technical concepts.

## Visual product principle

### Record first
The final composition must read as a collectible record before it reads as an AI-generated poster.

Visual hierarchy:

1. Record
2. Doodle / marks
3. User image

### The center belongs to the user
The uploaded image is preserved in the center label.

The center label should generally occupy **28–32% of the record diameter**.

Allowed:

- crop
- scale
- circular mask
- light exposure adjustment
- light contrast adjustment
- subtle grain
- subtle color harmonization

Not allowed:

- changing identity
- re-drawing faces
- adding or removing people
- turning the source image into a different character
- replacing the source image with an AI reinterpretation

The central image should remain recognizably the user's original source.

### The outer record belongs to the art system
The outer vinyl area is the main creative canvas.

It may contain:

- acrylic paint marker strokes
- handwriting
- symbols
- stickers
- scratches
- tape
- stamps
- arrows
- small doodles
- short AI-written notes
- date
- catalog number
- collectible metadata

## First three Style Worlds

### 1. After Dark
Internal style key:

`neon_scribble`

Character:

- black vinyl
- acrylic paint marker
- energetic handwriting
- bold but handmade
- personal
- youthful
- colorful accents
- not cyberpunk UI

### 2. In a Drawer
Internal style key:

`analog_memory`

Character:

- aged paper
- tape
- handwritten notes
- stamps
- worn labels
- faded textures
- archival / nostalgic feeling

### 3. Somewhere in a Dream
Internal style key:

`dream_archive`

Character:

- translucent layers
- soft glow
- clouds
- stars
- floating marks
- haze
- dreamlike softness

Phase 1 should fully art-direct `neon_scribble`.
The other two worlds should exist in the UI/data model but may initially use simpler placeholder visual treatment.

## Materials
Phase 1 supports five record surfaces:

- `classic`
- `clear`
- `smoke`
- `aurora`
- `pearl`

### Classic
Traditional dark vinyl with visible grooves and restrained gloss.

### Clear
Transparent vinyl that can reveal part of the sleeve beneath it.

### Smoke
Semi-transparent black/gray vinyl with smoky variation.

### Aurora
Iridescent / holographic diffraction visible mainly in reflected light.
Do not render it as a flat rainbow gradient.

### Pearl
Milky, pearlescent, semi-translucent surface with subtle color shift.

## User control
The user should shape the artwork through visual, intuitive decisions.

Do not expose technical settings.

The three required art-direction decisions in Phase 1 are:

1. Style World
2. Doodle Intensity
3. Record Material

The architecture must support up to two additional lightweight choice screens later without restructuring the flow.

Possible future choice categories include:

- color direction
- mark language
- mood modifier
- relationship / recipient context

Do not add them to Phase 1 unless explicitly requested.

## User message
The user may leave exactly one short message.

Maximum:

- 30 words for space-separated languages
- use a reasonable equivalent character limit for languages such as Chinese or Japanese

The field may be optional.

Do not make the UI feel like a prompt box.

Presentation concept:

> LEAVE ONE MARK.

Examples:

- `summer never ended`
- `for L.`
- `17 Aug`
- `see you next summer`
- `we were here`

## AI-written text
AI may add **1–2 short phrases** in addition to the user's message.

Rules:

- short
- secondary
- not emotionally presumptuous
- not long motivational copy
- not fake confessions
- not paragraphs
- should feel like marginal notes

Good examples:

- `salt air`
- `late light`
- `good days`
- `same sea`

## Collectible metadata
Every record should contain deterministic collectible metadata such as:

- `ONE OF ONE`
- date
- catalog number
- optional `SIDE A`

Catalog example:

`NS-260910-037`

Style codes:

- `NS` = Neon Scribble
- `AM` = Analog Memory
- `DA` = Dream Archive

Global uniqueness is not required in Phase 1.
The purpose is collectible identity, not database identity.

## Record Type
The Reveal includes a name for the resulting artwork.

This is a **Record Type**, not a personality result.

It should describe this instance of the artwork.

It must not always equal the Style World.

Example names:

Neon family:
- SOFT STATIC
- AFTERGLOW
- CLEAR SIGNAL
- ELECTRIC SUMMER
- NEON RIOT
- MIDNIGHT COLOR

Analog family:
- FADED NOTE
- OLD HABITS
- LAST POSTCARD
- SUNDAY DRAWER

Dream family:
- SOFT ORBIT
- DREAM STATIC
- PALE MOON
- AFTER DREAM

Phase 1 may use a deterministic mapping + curated word bank.
Later versions may use AI naming.

## Output
Phase 1 experience should prepare for three outputs:

1. Main artwork — 1:1
2. Record close-up — 1:1
3. Share card — 9:16

Preferred final dimensions when real rendering is connected:

- main: 2048×2048
- share card: 1080×1920

The 9:16 share card must be independently composed.
Do not simply crop the square artwork.

## Share behavior
The share card should support the social loop:

`see result → want to try → make one → share result`

The result should be visually understandable in a screenshot.

## Tone and UI character
Desired UI qualities:

- mobile-first
- minimal
- large typography
- generous whitespace
- object-focused
- calm transitions
- emotionally expressive without becoming sentimental
- closer to a polished product launch / editorial experience than an AI SaaS dashboard

Avoid:

- dashboard layout
- dense nav bars
- model selectors
- technical settings
- pricing tables
- prompt-engineering language
- generic gradient-heavy AI branding

## MVP non-goals
Do not implement in Phase 1:

- authentication
- account profiles
- payments
- social graph
- public feed
- permanent gallery
- collaborative editing
- advanced canvas editor
- drag-and-drop doodle placement
- Blender workflow
- AR
- WebGL-based 3D
- full video generation
- music playback
- album lookup
- lyric scraping
- copyrighted album-cover replication
