# Aftermark Local Studio ↔ Codex Runtime Handshake

## Core rule

The browser cannot directly spend or invoke the user's Codex generation allowance.

The Skill must orchestrate Codex.

```text
Codex starts Studio
→ Codex runs blocking wait_for_request
→ user finishes choices
→ Studio atomically writes request.json
→ waiter returns
→ Codex reads request
→ Codex continues generation
```

## Session files

```text
<project>/
├── aftermark-session.json
├── request.json
├── status.json
├── assets/source.<ext>
├── assets/outer-art.png
├── output/record.png
└── output/share-card.png
```

## request.json

Example:

```json
{
  "schemaVersion": "aftermark-request-v1",
  "sessionId": "am_...",
  "sourceImagePath": "assets/source.png",
  "stylePack": "neon_scribble",
  "doodleDensity": "medium",
  "compositionMode": "text_led",
  "material": "classic",
  "userMessage": "summer never ended",
  "createdAt": "..."
}
```

Use project-relative paths where possible.

## Atomic write

Preferred:

```text
request.json.tmp
→ close/fsync
→ rename to request.json
```

The waiter reacts only to complete validated JSON whose matching session status has left `waiting_for_user`.

## status.json

States:

```text
waiting_for_user
request_ready
generating_outer_art
compositing
complete
error
```

Studio polls status through a localhost-only endpoint.

## Waiter

Suggested command:

```bash
python scripts/wait_for_request.py --project <project>
```

It must:
- validate project/session
- wait efficiently
- reject stale/mismatched sessions
- validate request schema
- keep waiting while status is `waiting_for_user`
- resume when status is `request_ready`, `generating_outer_art`, `compositing`, `complete`, or `error`
- support timeout and Ctrl+C
- exit 0 when ready

## Codex continuation

After waiter returns:

1. read request
2. validate source image
3. read art-direction references
4. in Task 2C01, run the deterministic development outer-art placeholder; Task 2C02 may replace this step with Codex-native image generation
5. save `assets/outer-art.png`
6. run deterministic compositor
7. write final outputs
8. set `status.json` to `complete`

## Completion

Reveal only when:
- `output/record.png` exists
- `output/share-card.png` exists
- status is `complete`

## Security

- localhost only
- no creator API key
- no secrets in browser
- constrain writes to current project
- validate upload MIME/size
- no arbitrary command execution from request fields
