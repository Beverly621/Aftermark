---
name: aftermark
description: Create a one-of-one Aftermark digital record through the local Aftermark Studio, using a user-owned project for uploads and outputs. Use when a user asks Codex to make an Aftermark record or run the Aftermark Studio workflow.
---

# Aftermark

Create a one-of-one Aftermark record through the local Studio. Run commands from this Skill directory, but keep every upload and generated result in a separate user-owned project.

## Workflow

1. Choose an absolute project path outside this Skill directory, then create or resume it:

   ```bash
   python3 scripts/create_session.py --project <absolute-project-path>
   ```

2. Launch the localhost-only Studio and keep it running:

   ```bash
   python3 scripts/launch_studio.py --project <absolute-project-path>
   ```

3. Wait for the user to finish the Studio choices:

   ```bash
   python3 scripts/wait_for_request.py --project <absolute-project-path>
   ```

4. Set status to `analyzing_source`. Visually inspect the project-local source image and write `<project>/analysis.json`. Describe only visible color, motifs, and mood; do not infer personal facts. Include the SHA-256 of the exact source. Follow the executable analysis contract in `src/lib/rendering/native-imagegen.ts`.

5. Validate the analysis and compile the generation plan:

   ```bash
   npm run studio:prepare -- --project <absolute-project-path>
   ```

6. Read `<project>/generation-plan.json`. Load the installed system `imagegen` Skill and generate one new image using `compiledPrompt`. Do not pass the source photo as an edit or reference input. Do not use an API or CLI fallback.

7. Inspect the result for real transparency and readable or pseudo-readable text. Copy the selected generated PNG into the project as `assets/outer-art.raw.png`.

8. Normalize, mask, validate, and composite:

   ```bash
   npm run studio:finalize -- --project <absolute-project-path> --attempt 1 --visual-text-check pass
   ```

   Use `fail` when inspection finds readable or pseudo-readable text. If the command supplies a correction after attempt 1, make exactly one targeted built-in generation retry, replace `assets/outer-art.raw.png`, and finalize with `--attempt 2`. Never make a third generation attempt for that record.

9. Verify `status.json` is `complete` and the project contains `analysis.json`, `generation-plan.json`, `outer-art-qa.json`, `assets/outer-art.raw.png`, `assets/outer-art.png`, `output/record.png`, and `output/share-card.png`. Reopen Studio to Reveal and deliver the project-local outputs.

If a valid request already exists, resume it after its matching status has left `waiting_for_user`. If status is already `complete` and all required outputs exist, reopen Reveal instead of repeating work.

## Boundaries

- The production path supports `neon_scribble`, `medium`, `classic`, and both `text_led` and `motif_led`. Other visible choices remain disabled as `COMING LATER`.
- Codex built-in image generation is the default. Normal Skill use requires no creator API key and has no automatic API/CLI fallback.
- The image model generates only transparent outer-art marks. It does not receive the source photo, literal user message, marginal phrases, date, catalog number, metadata, or a request to render the final record.
- The application deterministically owns the original center image, center protection, vinyl/material, literal text, metadata, final composition, and share card.
- Keep the user project outside the reusable Skill repository. Treat session files as validated protocol files and accept browser writes only through the localhost bridge.
- OpenAI, Gemini, FLUX, and provider-benchmark infrastructure are frozen optional future backends, not the current runtime.
- The development placeholder is available only through `npm run studio:process:development` for regression/debugging; it is not a production result.
- Do not modify `README.md` unless a public-release task explicitly requests it.

## References

- Product behavior: [docs/PRODUCT.md](docs/PRODUCT.md)
- System ownership and pipeline: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- Visual grammar and reference policy: [docs/ART-DIRECTION.md](docs/ART-DIRECTION.md)
- Studio protocol and recovery: [docs/RUNTIME.md](docs/RUNTIME.md)
