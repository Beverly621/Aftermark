# Aftermark Art Direction

## Neon Scribble identity

**AFTER DARK** / `neon_scribble` is a collectible glossy black record marked with opaque, physical acrylic paint-pen traces while the user's original image remains intact in the center.

The result should feel handmade, personal, imperfect, energetic, tactile, youthful, and designed. It must not look like chalk, wax crayon, smooth vector art, an emissive neon sign, a cyberpunk HUD, a radial template, or a generic sticker pack. Playful is welcome; kindergarten drawing and recognizable franchise-kawaii character language are not.

## Medium-density anchor

R00 is the conceptual composition and density anchor for **LEAVE A TRACE** / `medium`:

- rich rather than sparse
- irregular and asymmetric
- visible groove breathing room
- roughly 65% micro/small marks
- at most one larger thematic motif
- strong color without equal-weight rainbow distribution

R00's visual file is not an approved runtime reference until its redistribution provenance is explicitly documented.

## Paint and vinyl

Marks should read as opaque acrylic/POSCA-like pigment sitting on physical vinyl: slightly irregular edges, pressure variation, occasional repeated passes, and hand wobble. The glossy groove surface and matte/opaque paint must respond differently to light. Classic vinyl is deep black with visible grooves and localized reflection, not a flat black disk.

The center image is never AI-redrawn. Marks may approach the protected-center boundary; only the actual protected center must remain clear. The application enforces that boundary deterministically.

## Source-derived color

Use the source as direction, not a mechanical palette match:

- about 65% source-derived colors
- about 25% neutral structure such as white, off-white, or gray
- about 10% one surprise accent

Keep dark vinyl dominant. Avoid equal color weighting, muddy paint, and full-rainbow overload.

## Source deconstruction

The source must be deconstructed into a vocabulary of marks instead of illustrated as one coherent scenic circular wreath. For example:

- cliff → broken contour
- sea → several wave strokes
- pebbles → irregular ovals or dots
- sun → imperfect circle
- horizon → loose line

This is the next visual-quality tuning concern; this documentation cleanup does not implement it.

## Composition modes

### TEXT-LED

Reserve one broad hero-lettering corridor. The application later renders the literal user message there. Generated paint may frame, orbit, underline, or point toward the corridor but must contain no letters or pseudo-lettering. Supporting source-derived motifs and micro marks remain secondary.

### MOTIF-LED

One source-derived motif may lead without becoming a polished standalone illustration. Smaller symbols, arrows, circles, stars, short strokes, and micro marks carry most of the composition. The deterministically rendered user message remains visible but secondary.

## Text ownership

Literal user text, marginal phrases, date, catalog number, and metadata are deterministic application layers. The image model receives none of them. Marginal phrases are restrained, short, and never invent personal context.

## Visual-reference policy

Text rules are the primary runtime source of truth. If visual references are used, each must declare a role such as `COMPOSITION_REF`, `PAINT_MATERIAL_REF`, `CLASSIC_VINYL_REF`, `LETTERING_REF`, or `NEGATIVE_REF`; never send an unlabeled bundle.

A public runtime reference must be Aftermark-owned/generated, CC0/public-domain, or explicitly licensed for redistribution. Research/borrow images may inform written rules but must not silently become runtime dependencies. Benchmark contact sheets measure providers and are not Golden References.

