---
name: aftermark
description: Create a one-of-one Aftermark digital record through the local Aftermark Studio, using a user-owned project for uploads and outputs. Use when a user asks Codex to make an Aftermark record or run the Aftermark Studio workflow.
---

# Aftermark

Run the Aftermark workflow from this skill directory. Keep every user upload and generated result in a separate user-owned project; never place them in this reusable skill directory.

## Task 2C01 workflow

Task 2C01 proves the local handshake with a deterministic development outer-art placeholder. Do not invoke image generation or any paid provider during this workflow.

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

5. After the waiter exits successfully, run the local development pipeline:

   ```bash
   npm run studio:process -- --project <absolute-project-path>
   ```

6. Verify `status.json` is `complete` and both `output/record.png` and `output/share-card.png` exist. Open the running Studio so it can reveal and save the real project output.

If `request.json` already exists, validate it and continue only after the matching status has left `waiting_for_user`; do not ask the user to repeat valid choices. If `status.json` is already `complete` and both outputs exist, reopen Studio directly at Reveal.

## Runtime boundaries

- Bind Studio only to `127.0.0.1`; use the launcher's preferred-port fallback.
- Treat `aftermark-session.json`, `request.json`, and `status.json` as validated protocol files. Reject mismatched session IDs and unsafe paths.
- The browser writes only through the localhost request bridge. It never calls Codex or an image provider.
- In Task 2C01 Studio mode, only `neon_scribble`, `medium`, and `classic` are selectable; other visible options are disabled as `COMING LATER`. Both composition modes remain selectable.
- Task 2C01 uses `DevelopmentOuterArtProvider`; keep OpenAI, Gemini, FLUX, and benchmark infrastructure frozen and unused.
- Preserve the original source image in the protected center. The application owns user text, AI phrases, date, catalog number, and other deterministic metadata.
- Do not modify `README.md` before Phase 2C05.

## References

- Read [docs/RUNTIME-HANDSHAKE.md](docs/RUNTIME-HANDSHAKE.md) when operating or debugging the Studio bridge.
- Read [docs/PHASE-2C-SKILL-RUNTIME.md](docs/PHASE-2C-SKILL-RUNTIME.md) for phase boundaries.
- Read [docs/styles/neon-scribble.md](docs/styles/neon-scribble.md) before changing generation or compositing behavior.
- Read [docs/GOLDEN-REFERENCE-POLICY.md](docs/GOLDEN-REFERENCE-POLICY.md) before adding any visual reference.
