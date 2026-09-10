# Aftermark

**Made to keep.**

Aftermark is a mobile-first digital gift experience that turns a user-provided image into a one-of-one collectible record through a guided creative flow:

`upload → participate → anticipate → reveal`

This repository contains the Phase 1 prototype. It uses a deterministic frontend mock renderer and does not call a production AI service.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Production verification:

```bash
npm run typecheck
npm run build
```

## Phase 1 flow

1. Landing
2. Upload
3. Style World
4. Doodle Intensity
5. Record Material
6. Leave One Mark
7. Making
8. Reveal
9. Share

The three visual choices require an explicit user tap. The optional message is limited to 30 space-separated words or 30 CJK characters. The uploaded image is used unchanged in the circular center label.

## Architecture

- `src/context/CreationContext.tsx` — creation state independent of page layout
- `src/types/record.ts` — shared `RecordArtDirection`, render result, and renderer contract
- `src/lib/renderer.ts` — replaceable `RecordRenderer` abstraction and Phase 1 `MockRecordRenderer`
- `src/lib/materials.ts` — style/material compatibility modifiers
- `src/lib/catalog.ts` — collectible catalog metadata
- `src/lib/record-types.ts` — curated deterministic artwork naming
- `src/lib/palette.ts` — lightweight local palette extraction from the uploaded image
- `src/lib/share.ts` — independently composed 1080×1920 PNG export
- `src/components/RecordPreview.tsx` — CSS/SVG record renderer that preserves the original center image

The creation flow is modeled as ordered screens, so up to two additional lightweight decision screens can be inserted without changing the art-direction or renderer contract.

## Scope

Phase 1 intentionally has no login, payments, database, social feed, permanent gallery, WebGL, complex 3D, or production AI generation.

See [docs/PHASE1-COMPLETION.md](docs/PHASE1-COMPLETION.md) for the delivery checklist and verification record.
