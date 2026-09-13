# AGENTS.md

## Project
Project name: **Aftermark**

Brand line: **Made to keep.**

Build a mobile-first web experience that turns a user-provided image into a personalized collectible digital record.

The product is not a generic AI image generator and not a personality test. It is an interactive digital-gift experience:

**upload → participate → anticipate → reveal**

## Read order

Read only what the current task needs:

1. `SKILL.md` when operating the Aftermark Skill.
2. `docs/PRODUCT.md` for product behavior.
3. `docs/ARCHITECTURE.md` for system boundaries.
4. `docs/ART-DIRECTION.md` for generation or composition work.
5. `docs/RUNTIME.md` for Studio, session, or debugging work.
6. `docs/CURRENT-TASK.md` for the current implementation objective.

Major frozen choices live in `docs/DECISIONS.md`. The provider benchmark is documented separately in `benchmarks/README.md` and is not the normal Skill path.

## Interaction principle
A normal creation session should require:

- 1 image upload
- 3–5 lightweight choices
- 1 optional short text input
- 1 final generate action

Choices must influence the artwork meaningfully while hiding technical image-generation parameters.

## Product and engineering principles

- Prefer the smallest implementation consistent with the current source of truth.
- Do not invent product features or abstractions for unimplemented futures.
- Preserve the user's original image in the protected center.
- Keep the creation flow participatory; do not collapse it into `upload → generate`.
- Build mobile first and keep desktop responsive.
- Keep product UI polished, calm, and free of provider/model controls.

## Working style
When requirements are ambiguous:

1. Surface unresolved visual or product decisions instead of silently choosing for the user.
2. Keep components small and readable.
3. Validate in proportion to the change and report:
   - what was implemented
   - what remains
   - any deviations from the spec
   - any decisions that require human review

## Lean execution

- Prefer updating an existing source of truth over creating a new document; one concept should have one source of truth.
- Do not create progress or completion Markdown files by default.
- Prefer tests and executable contracts over duplicated prose.
- Avoid abstractions for unimplemented future features.
- Normal tasks should usually change code and at most one existing design/runtime document.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
