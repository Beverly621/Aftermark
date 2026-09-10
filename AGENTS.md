# AGENTS.md

## Project
Project name: **Aftermark**

Brand line: **Made to keep.**

Build a mobile-first web experience that turns a user-provided image into a personalized collectible digital record.

The product is not a generic AI image generator and not a personality test. It is an interactive digital-gift experience:

**upload → participate → anticipate → reveal**

## Read first
Before making product, UI, architecture, or visual decisions, read:

- `docs/PRODUCT.md`
- `docs/PHASE-1.md`
- `docs/styles/neon-scribble.md`

Treat those files as the source of truth.

## Phase 1 constraints
Do not add features that are not in the specs.

For Phase 1:

- no login
- no payments
- no database
- no social feed
- no permanent gallery
- no WebGL
- no complex 3D
- no backend-heavy architecture unless required for the mock renderer
- mobile first
- desktop responsive
- preserve the user's original center image
- keep the user's interaction meaningful
- do not collapse the experience into `upload → generate`

## Interaction principle
A normal creation session should require:

- 1 image upload
- 3–5 lightweight choices
- 1 short text input
- 1 final generate action

Choices must influence the artwork meaningfully while hiding technical image-generation parameters.

## Engineering principle
Keep the rendering layer replaceable.

Use a renderer interface so Phase 1 can run with a mock renderer and Phase 2 can later connect a real AI image-generation pipeline without rewriting the product flow.

## Working style
When requirements are ambiguous:

1. Prefer the smallest implementation consistent with the specs.
2. Do not invent new product features.
3. Surface unresolved visual/product decisions instead of silently choosing for the user.
4. Keep components small and readable.
5. Before declaring a task complete, run the app, test the full mobile flow, and report:
   - what was implemented
   - what remains
   - any deviations from the spec
   - any decisions that require human review

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
