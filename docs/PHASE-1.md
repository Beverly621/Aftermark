# PHASE-1.md

# Phase 1 — Aftermark Mobile Product Prototype

## Objective
Implement a polished, mobile-first, end-to-end prototype of the digital record experience.

Phase 1 validates:

- the interaction flow
- the participation model
- the mobile visual rhythm
- the material selector
- the Reveal ritual
- the share-card composition
- the data model used later by a real AI renderer

Phase 1 does **not** need production AI generation.

Use a replaceable mock renderer.

## Recommended stack

- Next.js
- TypeScript
- Tailwind CSS
- Framer Motion
- Vercel-compatible deployment

Do not introduce a larger stack unless necessary.

## Responsive baseline
Design first for:

`390 × 844`

Also verify:

- 375 × 667
- 430 × 932
- desktop 1440px wide

Principle:

**one screen, one decision**

Avoid long scrolling during the creation flow.

## User journey

```text
Landing
→ Upload
→ Style World
→ Doodle Intensity
→ Material
→ Leave One Mark
→ Making
→ Reveal
→ Share
```

Interaction budget:

- upload: 1
- lightweight choice taps: 3 required
- architecture must support up to 5 total
- text entry: 1 optional short message
- final generate action: 1

Do not collapse the flow into fewer steps unless explicitly requested.

---

# Screen 00 — Landing

## Copy

Brand:

```text
AFTERMARK
```

Primary line:

```text
MADE TO KEEP.
```

Product hook:

```text
Turn something you love into a one-of-one record.
```

CTA:

```text
MAKE ONE
```

Implementation note:

- Keep `AFTERMARK` visually restrained.
- `MADE TO KEEP.` may carry the largest typographic emphasis.
- The product hook should make the experience understandable within a few seconds.
- If testing shows the product meaning is not clear enough, the fallback hero line is:
  `TURN SOMETHING YOU LOVE INTO A RECORD.`

## Visual behavior

- large typography
- generous whitespace
- one hero record object
- subtle slow rotation is allowed
- no dashboard
- no dense navigation
- no login/pricing/features sections

The page should communicate the idea in roughly 3 seconds.

---

# Screen 01 — Upload

## Copy

```text
GIVE IT SOMETHING
YOU LOVE.
```

Supporting text:

```text
A person. A place. Artwork. A moment. Anything.
```

Upload affordance:

```text
+ Add a photo
```

## Behavior

After a user selects an image:

1. load it locally
2. crop/mask it into a circular center label preview
3. place it inside a record preview
4. animate the record around it
5. do not call AI

Suggested motion:

```text
photo
→ circular mask
→ vinyl expands around it
→ slight 3–5° rotation
```

Target response:

`300–500ms`

This is the first micro “wow” moment.

## Image requirements

Preserve the source image.
Do not redraw or reinterpret it.

---

# Screen 02 — Style World

## Heading

```text
WHERE DOES
THIS RECORD LIVE?
```

## Options

### AFTER DARK
Value:

`neon_scribble`

Visual preview:

- black vinyl
- acrylic marker
- energetic handwritten marks
- bright accent colors

### IN A DRAWER
Value:

`analog_memory`

Visual preview:

- aged paper
- tape
- stamp
- worn notes
- archival texture

### SOMEWHERE IN A DREAM
Value:

`dream_archive`

Visual preview:

- translucency
- glow
- stars
- haze
- soft floating marks

## Interaction
Use large visual cards, not radio buttons.

The user should choose by feeling and appearance rather than by reading technical descriptions.

---

# Screen 03 — Doodle Intensity

## Heading

```text
HOW FAR
SHOULD WE TAKE IT?
```

## Options

```text
KEEP IT CLEAN
LEAVE A TRACE
GO ALL IN
```

Values:

```ts
type DoodleDensity = "low" | "medium" | "high";
```

`medium` should visually resemble the richness of the approved first Neon Scribble sample, not the later over-reduced sample.

Guidance:

- low: sparse intentional marks
- medium: rich but still clearly vinyl
- high: expressive, dense, layered

Do not treat element counts as hard validation.
They are art-direction guidelines.

---

# Screen 04 — Material

## Heading

```text
PICK A SURFACE.
```

## Interaction
Build as a horizontally swipeable material carousel.

A large record preview should change visually as the user swipes.

Supported materials:

```ts
type RecordMaterial =
  | "classic"
  | "clear"
  | "smoke"
  | "aurora"
  | "pearl";
```

## Material behavior

### CLASSIC
- dark vinyl
- visible grooves
- restrained specular highlight

### CLEAR
- transparent vinyl
- sleeve may show through

### SMOKE
- semi-transparent black/gray
- organic smoky variation

### AURORA
- iridescent / holographic reflection
- diffraction appears through light
- do not use a flat rainbow gradient

### PEARL
- milky / pearlescent
- soft reflective color shift

## Compatibility layer
Do not hardcode material behavior into page components.

Create a function such as:

```ts
getMaterialStyleModifiers(stylePack, material)
```

Examples:

```text
Dream + Aurora → glow stronger
Analog + Aurora → iridescence restrained
Neon + Pearl → marker contrast increased
```

A minimal rule set is enough in Phase 1.

---

# Screen 05 — Leave One Mark

## Heading

```text
LEAVE ONE MARK.
```

Placeholder:

```text
A name, a date, a secret...
```

Support text:

```text
Keep it short.
```

CTA:

```text
MAKE MY RECORD
```

## Validation

Maximum:

- 30 words for space-separated languages
- implement a reasonable equivalent limit for CJK languages

The field may be empty.

Avoid presenting this as a prompt-engineering text area.

---

# Art Direction object

Create a shared type similar to:

```ts
interface RecordArtDirection {
  image: string;

  stylePack:
    | "neon_scribble"
    | "analog_memory"
    | "dream_archive";

  doodleDensity:
    | "low"
    | "medium"
    | "high";

  material:
    | "classic"
    | "clear"
    | "smoke"
    | "aurora"
    | "pearl";

  userMessage?: string;

  date: string;

  catalogNumber: string;

  recordType?: string;

  imagePalette?: {
    primary: string;
    secondary: string;
    neutral: string;
    surprise: string;
  };
}
```

All creation screens must update this shared state.

The data model should remain independent of page layout.

---

# Catalog number

Create a small catalog helper.

Format example:

```text
NS-260910-037
```

Components:

- style code
- YYMMDD
- short random or local sequence

Style code map:

```text
NS → neon_scribble
AM → analog_memory
DA → dream_archive
```

Phase 1 does not require globally unique IDs.

---

# Record Type mapper

Create a curated mapping layer.

Do not make the Record Type equal to the style name.

Inputs may include:

- stylePack
- material
- density
- later: palette

Example curated names:

## Neon
- SOFT STATIC
- AFTERGLOW
- CLEAR SIGNAL
- ELECTRIC SUMMER
- NEON RIOT
- MIDNIGHT COLOR

## Analog
- FADED NOTE
- OLD HABITS
- LAST POSTCARD
- SUNDAY DRAWER

## Dream
- SOFT ORBIT
- DREAM STATIC
- PALE MOON
- AFTER DREAM

Phase 1 can use deterministic rules plus a small random seed.

---

# Renderer abstraction

Create an interface:

```ts
interface RecordRenderer {
  render(input: RecordArtDirection): Promise<RecordRenderResult>;
}
```

Implement:

```text
MockRecordRenderer
```

Phase 1 should not depend on a production AI API.

The mock result may use composited frontend layers, predefined sample art, or another deterministic approach.

The interface must allow a future:

```text
AIRecordRenderer
```

without rewriting the creation flow.

---

# Screen 06 — Making

## Copy

Primary:

```text
MAKING IT YOURS.
```

Optional rotating secondary lines:

```text
Finding the right marks.
Leaving a little chaos.
Almost yours.
```

## Behavior
Do not show SaaS-style progress such as:

```text
AI processing...
Generating 34%...
```

Use a visual construction sequence:

```text
center photo remains
→ material develops
→ grooves appear
→ marks arrive
→ sleeve slides out
→ reveal transition
```

Use CSS / Framer Motion.
Do not add WebGL.

---

# Screen 07 — Reveal

## Sequence

Initial copy:

```text
YOUR RECORD IS—
```

Pause briefly.

Reveal the Record Type:

```text
SOFT STATIC
```

Then show:

- full record
- sleeve
- `ONE OF ONE`
- catalog number
- date
- user's message if present

Example:

```text
ONE OF ONE
SS-260910-042
10 SEP 2026

summer never ended.
```

The Record Type is the artwork's name, not a personality label.

---

# Screen 08 — Share

Create a separate 9:16 share-card layout.

Do not crop the square artwork.

Suggested hierarchy:

```text
YOUR RECORD

[large record artwork]

SOFT STATIC

summer never ended.

ONE OF ONE
SS-260910-042
```

Brand signature:

```text
AFTERMARK
```

Keep it small and secondary to the user's artwork.

Actions:

```text
SAVE
SHARE
MAKE ANOTHER
```

`MAKE ANOTHER` resets creation state and returns the user to the creation flow.

---

# Main components

Suggested structure:

```text
/app
  /page.tsx
  /create
  /reveal

/components
  LandingHero.tsx
  PhotoUploader.tsx
  RecordPreview.tsx
  StyleWorldSelector.tsx
  DensitySelector.tsx
  MaterialSelector.tsx
  MessageInput.tsx
  MakingAnimation.tsx
  RevealCard.tsx
  ShareCard.tsx

/lib
  art-direction.ts
  catalog.ts
  record-types.ts
  palette.ts
  renderer.ts
  style-packs/

/lib/style-packs
  neon-scribble.ts
  analog-memory.ts
  dream-archive.ts

/types
  record.ts
```

This is guidance, not a requirement if a simpler structure is cleaner.

---

# State management

Do not use Redux.

Use:

- React Context, or
- Zustand

State should cover:

- uploadedImage
- stylePack
- doodleDensity
- material
- userMessage
- artDirection
- renderResult

Persistence is not required.
A page refresh may reset the session in Phase 1.

---

# Phase 1 implementation order

Implement in this order:

1. Scaffold Next.js + TypeScript project
2. Add Tailwind and Framer Motion
3. Create global visual tokens
4. Build mobile shell
5. Build Landing
6. Build Upload
7. Build circular image-label preview
8. Build Style World selector
9. Build Doodle Intensity selector
10. Build Material carousel
11. Build Leave One Mark input + validation
12. Create shared `RecordArtDirection`
13. Create catalog generator
14. Create Record Type mapper
15. Create `RecordRenderer` interface
16. Implement `MockRecordRenderer`
17. Build Making animation
18. Build Reveal
19. Build 9:16 Share Card
20. Add Save functionality
21. Add Make Another reset flow
22. Test responsive layouts
23. Accessibility / touch-target pass
24. Deploy or prepare for Vercel preview

---

# Acceptance criteria

Phase 1 is complete when:

- mobile landing clearly establishes the Aftermark brand and communicates the product in about 3 seconds
- user can upload a normal phone image
- image immediately appears as the record center label
- full flow works without prompt knowledge
- user performs 3 meaningful art-direction choices
- architecture supports 2 additional choice screens later
- short user message supports up to 30 words
- material carousel visibly changes the record
- center image remains the original source
- Making screen feels like a reveal ritual, not SaaS processing
- Reveal displays a Record Type, date, catalog number, and one-of-one identity
- 9:16 share card is independently composed
- user can save the result
- user can restart via Make Another
- desktop does not break
- no unrequested auth/database/payment/social/WebGL features were added

---

# Human review checkpoints

Stop and ask for review if implementation requires choosing among materially different visual directions for:

- Landing typography/layout
- material rendering style
- Style World preview artwork
- Reveal animation
- share-card hierarchy

Do not silently lock in a strong visual direction that is not specified.
