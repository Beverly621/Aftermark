# Aftermark Local Runtime

## Runtime model

Codex creates or resumes a user-owned project, launches Local Studio on loopback, waits for a validated request, performs generation/composition, and lets Studio reveal project-local outputs.

```text
Codex starts Studio
→ user submits choices
→ Studio atomically writes source + request.json + request_ready status
→ waiter returns
→ Codex resumes the pipeline
→ status becomes complete
→ Studio reveals outputs
```

## Project files

Important protocol files:

- `aftermark-session.json`: stable session identity and creation time
- `request.json`: validated user choices and source-image path
- `status.json`: current state, user-facing status message, and completion output metadata

Pipeline files include `analysis.json`, `generation-plan.json`, `outer-art-qa.json`, `assets/source.*`, `assets/outer-art.raw.png`, `assets/outer-art.png`, `output/record.png`, `output/share-card.png`, and `logs/session.log`.

Exact schemas and allowed values are authoritative in `src/lib/studio/contracts.ts`, `src/lib/rendering/native-imagegen.ts`, and `scripts/runtime_common.py`.

## Lifecycle

Status states are:

```text
waiting_for_user
request_ready
analyzing_source
planning_art
generating_outer_art
validating_outer_art
compositing
complete
error
```

`scripts/wait_for_request.py` returns only when both the request and matching source are valid and the matching status has left `waiting_for_user`. Any later state is resumable, including `complete` and `error`; the orchestrator then decides whether to continue, reveal, or surface the error.

Reveal requires `complete` status with valid output metadata and existing `record.png`, `share-card.png`, and `outer-art.png`.

## Atomicity and identity

Protocol writes use a temporary file followed by an atomic rename. The Python helper also flushes the file and parent directory. Session IDs must match across session, request, and status files; timestamps are validated, and stale requests are rejected. This ordering prevents the waiter from resuming on a request that is visible before its `request_ready` status.

## Restart and resume

`scripts/create_session.py` reuses a valid existing session instead of overwriting it. A valid request is not resubmitted. Completed sessions reopen directly at Reveal when their required outputs remain present. Intermediate states preserve enough project-local artifacts for Codex to inspect and continue safely.

Errors are written as the `error` state with a restrained message; generation validation permits at most one targeted retry.

## Isolation and security

- User projects must be outside the reusable Skill repository.
- Runtime paths must be project-relative and may not escape the project root.
- Studio binds to `127.0.0.1`, checks same-origin/loopback requests, and exposes no public listener.
- Upload type, byte size, decoded dimensions, session identity, and protocol fields are validated.
- Provider secrets are removed from the Studio process environment.
- Browser fields cannot execute commands or select a provider.
- No creator API key is required for the default Codex-native path.

