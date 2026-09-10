# Aftermark Phase 1 — Delivery Checklist

Date: 10 Sep 2026

## Product flow

- [x] Landing communicates `AFTERMARK`, `MADE TO KEEP.`, and the one-of-one record concept.
- [x] Upload accepts local images and immediately preserves the original as a circular center label.
- [x] Style World offers `AFTER DARK`, `IN A DRAWER`, and `SOMEWHERE IN A DREAM` as visual cards.
- [x] Doodle Intensity offers low, medium, and high; medium retains the richer `LEAVE A TRACE` treatment.
- [x] Material selection is a swipeable five-surface carousel with a live record preview.
- [x] Style, intensity, and material each require an explicit user choice.
- [x] Leave One Mark accepts an optional message with 30-word / 30-CJK-character validation.
- [x] Making uses a visual construction ritual rather than a SaaS progress indicator.
- [x] Reveal presents an artwork Record Type, `ONE OF ONE`, catalog number, date, and optional message.
- [x] Share uses an independently composed 9:16 card rather than cropping the square artwork.
- [x] Save generates a 1080×1920 PNG locally.
- [x] Share uses the native Web Share API when supported and otherwise falls back to saving.
- [x] Make Another clears the uploaded image and all creation state.

## Engineering

- [x] Next.js + TypeScript + Tailwind CSS + Framer Motion scaffold.
- [x] Shared `RecordArtDirection` model is independent from the page components.
- [x] Replaceable `RecordRenderer` interface with a Phase 1 `MockRecordRenderer`.
- [x] Deterministic catalog-number and curated Record Type mapping layers.
- [x] Material/style compatibility rules are outside page components.
- [x] Local image palette extraction informs doodle colors without altering the original image.
- [x] Flow can accept two future lightweight decision screens without restructuring the renderer contract.
- [x] Visible keyboard focus, semantic controls, ARIA radio groups, status messages, and reduced-motion support.
- [x] No login, payments, database, social feed, permanent gallery, WebGL, 3D, or production AI features added.
- [x] Vercel-compatible production build.

## Verification performed

- [x] `npm run typecheck`
- [x] `npm run build`
- [x] `npm audit --omit=dev` — 0 vulnerabilities
- [x] Full browser flow at 390×844, including a real local file selection
- [x] Source image remained visible through Upload, choices, Making, Reveal, and Share
- [x] 31-word message was rejected; a valid short message proceeded
- [x] Save completed and showed `SAVED TO YOUR DEVICE.`
- [x] Make Another returned to Upload with no image and a disabled continue action
- [x] 375×667 compact mobile layout inspected; controls remained visible without document overflow
- [x] 430×932 mobile layout inspected; headline and artwork remained in bounds
- [x] 1440px desktop Landing and Upload layouts inspected; no horizontal document overflow

## Phase 1 limitations (expected)

- `analog_memory` and `dream_archive` have intentionally simpler placeholder art direction than the fully directed `neon_scribble` world.
- Rendering is deterministic frontend composition; the production AI renderer is reserved for a later phase.
- State is session-only and resets on refresh, as allowed by the specification.
- There is no deployed public preview in this delivery; the project is prepared for Vercel deployment.

## Human review decisions

The following visual choices are implemented as a coherent first review version, not treated as permanently approved:

- Landing: oversized grotesk headline with outlined `KEEP.` and an off-canvas rotating record.
- Materials: layered CSS surface simulations, with Aurora appearing as reflected diffraction rather than a flat rainbow.
- Style previews: one shared record silhouette with three distinct mark grammars; Analog and Dream remain intentionally simpler.
- Reveal: dark stage, acid Record Type, sleeve/record overlap, then metadata.
- Share card: artwork first, large Record Type second, message and metadata third, small brand signature last.

No product decisions outside the Phase 1 specification were added.
