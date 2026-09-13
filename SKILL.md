---
name: aftermark
description: Create a one-of-one Aftermark digital record through the local Aftermark Studio, using a user-owned project for uploads and outputs. Use when a user asks Codex to make an Aftermark record or run the Aftermark Studio workflow.
---

# Aftermark

Run the Aftermark workflow from this skill directory. Keep every user upload and generated result in a separate user-owned project; never place them in this reusable skill directory.

## Task 2C02 workflow

Task 2C02 uses Codex built-in image generation for one outer-art ingredient. It does not use a creator API key, call a provider adapter, or ask an image model to render the final record.

1. Choose an absolute project path outside this skill directory.
2. Create or resume it:

   ```bash
   python3 scripts/create_session.py --project <absolute-project-path>
   ```

3. Launch the localhost-only Studio and keep the process running:

   ```bash
   python3 scripts/launch_studio.py --project <absolute-project-path>
   ```

4. Wait until the user completes Studio choices:

   ```bash
   python3 scripts/wait_for_request.py --project <absolute-project-path>
   ```

5. Mark source analysis as active, visually inspect the project-local source image, and write `<project>/analysis.json`. Describe only visible color, motifs, and mood; do not invent personal facts. Include the SHA-256 of the exact source file. Do not pass the source image to image generation.

   ```bash
   python3 scripts/set_status.py --project <absolute-project-path> --state analyzing_source --message "Reading the source image."
   ```

   Use `schemaVersion: "aftermark-source-analysis-v1"` with exactly: `sessionId`, `sourceImageSha256`, a compact `sourceSummary`, `palette` (`primary`, `neutral`, `surprise`; 3–5 distinct hex colors total), 3–6 `motifs` (`name`, `visualShorthand`, `salience`), 2–4 `mood` values, and `avoidMotifs`.

6. Validate the analysis and compile the versioned, privacy-safe generation plan:

   ```bash
   npm run studio:prepare -- --project <absolute-project-path>
   ```

7. Read `generation-plan.json`. Load the installed system `imagegen` Skill, then use Codex built-in image generation with `compiledPrompt`. Generate one image without using the source photo as an edit/reference target. Do not use an API/CLI fallback.

8. Inspect the result for real transparency and readable or pseudo-readable text. Copy the selected generated PNG from the built-in generated-image location into the user project as `assets/outer-art.raw.png`; the project must not depend on a file that exists only below `$CODEX_HOME/generated_images`.

9. Normalize, validate, mask, and deterministically composite it:

   ```bash
   npm run studio:finalize -- --project <absolute-project-path> --attempt 1 --visual-text-check pass
   ```

   Pass `fail` if visual inspection finds readable/pseudo-readable text. If the command reports a retry correction, make exactly one targeted built-in generation retry, replace `assets/outer-art.raw.png`, and rerun with `--attempt 2`. Never make a third generation call for the record.

10. Verify `status.json` is `complete`; `analysis.json`, `generation-plan.json`, `outer-art-qa.json`, `assets/outer-art.raw.png`, `assets/outer-art.png`, `output/record.png`, and `output/share-card.png` exist. Open the running Studio so it reveals the real project output.

If `request.json` already exists, validate it and continue only after the matching status has left `waiting_for_user`; do not ask the user to repeat valid choices. If `status.json` is already `complete` and both outputs exist, reopen Studio directly at Reveal.

## Runtime boundaries

- Bind Studio only to `127.0.0.1`; use the launcher's preferred-port fallback.
- Treat `aftermark-session.json`, `request.json`, and `status.json` as validated protocol files. Reject mismatched session IDs and unsafe paths.
- The browser writes only through the localhost request bridge. It never calls Codex or an image provider.
- Only `neon_scribble`, `medium`, and `classic` are selectable; other visible options stay disabled as `COMING LATER`. Both composition modes remain selectable.
- Built-in generation owns only transparent paint marks. It receives no literal user message, marginal phrase, date, catalog number, metadata, source photo, or final-record task.
- `assets/outer-art.raw.png` is the selected built-in result. `assets/outer-art.png` is the normalized 2048×2048 RGBA ingredient with a deterministic outer-circle and protected-center mask.
- The original 2C01 development provider remains available only as the explicit `npm run studio:process:development` fallback for regression/debugging. Do not use it for a 2C02 result.
- Keep OpenAI, Gemini, FLUX, and benchmark infrastructure frozen and unused.
- Preserve the original source image in the protected center. The application owns user text, AI phrases, date, catalog number, and other deterministic metadata.
- Do not modify `README.md` before Phase 2C05.

## References

- Read [docs/RUNTIME-HANDSHAKE.md](docs/RUNTIME-HANDSHAKE.md) when operating or debugging the Studio bridge.
- Read [docs/PHASE-2C-SKILL-RUNTIME.md](docs/PHASE-2C-SKILL-RUNTIME.md) for phase boundaries.
- Read [docs/styles/neon-scribble.md](docs/styles/neon-scribble.md) before changing generation or compositing behavior.
- Read [docs/GOLDEN-REFERENCE-POLICY.md](docs/GOLDEN-REFERENCE-POLICY.md) before adding any visual reference.
