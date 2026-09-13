# Aftermark Architecture

## System shape

Aftermark is Skill-first. Codex orchestrates a local Studio and deterministic rendering pipeline; the browser does not invoke Codex or an image provider.

```text
Local Studio
→ request.json
→ source analysis
→ generation-plan.json
→ Codex built-in image generation
→ assets/outer-art.raw.png
→ deterministic normalization + annular mask
→ assets/outer-art.png
→ Sharp compositor
→ output/record.png + output/share-card.png
→ Reveal
```

The exact protocol and generation-plan contracts live in code, chiefly `src/lib/studio/contracts.ts` and `src/lib/rendering/native-imagegen.ts`. Documentation should explain boundaries rather than duplicate those schemas.

## Ownership boundaries

Codex source analysis extracts visible palette, motifs, and mood. The image model owns only:

- doodle marks
- visual interpretation of source-derived motifs
- paint rhythm, pressure, and irregularity

The application owns:

- original source image and center crop
- vinyl geometry and material
- deterministic protected-center and outer-record masks
- literal user text and marginal phrases
- date, catalog number, Record Type, and metadata
- final composition and share card

The source photo is not sent to image generation as an edit/reference input. Generated art is an ingredient, never the final record.

## Current production path

The current path is intentionally narrow: `neon_scribble`, `medium`, `classic`, with `text_led` and `motif_led`. `scripts/prepare-native-generation.ts` validates the analysis and creates the privacy-safe plan. `scripts/finalize-native-generation.ts` validates the selected generated asset, invokes deterministic composition, and writes completion metadata.

`src/lib/rendering/outer-art-normalization.server.ts` converts the selected result to a 2048×2048 RGBA asset, checks transparency/coverage/text-review state, and enforces the annular mask. `src/lib/rendering/compositor.server.ts` renders vinyl/sleeve geometry, applies the outer art, restores the original center last, and adds application-owned text.

## Local Studio boundary

The reusable repository contains the Skill, Studio, scripts, and renderer. Uploads, generated assets, logs, and outputs live in a separate user-owned project. Studio reads and writes that project only through the localhost request bridge and validated relative paths. See `docs/RUNTIME.md`.

## Optional provider infrastructure

The OpenAI, Gemini, and FLUX adapters and their benchmark harness remain frozen for possible future BYOK or hosted exploration. They are not used by normal Skill execution, are not automatic fallbacks, and must remain server-side if reactivated. Their reproduction notes live in `benchmarks/README.md`.

