# Aftermark — Phase 2C: Skill-First Runtime

## Product decision

Aftermark is now **Skill-first**, not a hosted generation SaaS.

Target experience:

```text
clone/install
→ ask Codex to use Aftermark
→ open local Aftermark Studio
→ upload + choose
→ Studio emits request.json
→ Codex resumes
→ Codex built-in image generation
→ deterministic compositor
→ Studio Reveal
→ Save / Share
```

`aftermark.app` may later become a marketing/docs site. Hosted paid generation is a future decision, not a Phase 2C dependency.

## Relationship to Holo Card Studio

Same high-level model:

```text
Codex loads Skill
→ creates a user-owned project
→ generates assets
→ local scripts assemble output
→ local browser experience is delivered
```

Aftermark adds a mid-flow browser checkpoint:

```text
Codex launches Studio
→ user makes choices in browser
→ Studio writes request.json
→ a blocking waiter returns
→ Codex continues
```

The browser does **not** directly call Codex.

## Frozen flow

```text
Upload
→ Style World
→ Doodle Intensity
→ Composition Mode
→ Material
→ Leave One Mark
→ Making
→ Reveal
→ Save / Share
```

First production path:

- style: `neon_scribble`
- density: `medium`
- composition: `text_led` or `motif_led`
- material: `classic`

## Runtime architecture

```text
SKILL.md
→ create user project
→ launch Local Studio
→ browser writes request.json
→ wait_for_request exits
→ Codex reads request
→ built-in image generation
→ assets/outer-art.png
→ deterministic compositor
   + original center image
   + annular mask
   + deterministic user text
   + deterministic metadata
→ output/record.png
→ output/share-card.png
→ status.json = complete
→ Studio Reveal
```

## User-owned project

```text
<project>/
├── aftermark-session.json
├── request.json
├── status.json
├── assets/
│   ├── source.png
│   └── outer-art.png
├── output/
│   ├── record.png
│   └── share-card.png
└── logs/
    └── session.log
```

Never store user photos/results inside the reusable Skill directory.

## Existing provider architecture

Do not delete OpenAI / Gemini / FLUX adapters or benchmark infrastructure.

Freeze them as optional future backends:

- Codex Native — default Skill path
- OpenAI API — optional future BYOK/hosted
- Gemini API — optional future BYOK/hosted
- FLUX API — optional future BYOK/hosted

## Task sequence

### 2C01 — Skill Shell + Local Studio Handshake
Prove:
`Codex → Studio → request → waiter → dev artwork → compositor → Reveal`
without paid image generation.

### 2C02 — Codex Native Image Generation
Replace the dev artwork with Codex built-in image generation.

### 2C03 — Production Visual Quality
Tune Neon Scribble using the approved art direction and clean Golden References.

### 2C04 — Packaging + Installability
Make a fresh clone/install/run experience reliable.

### 2C05 — Public Release
Only now update README, add demo media, Golden Samples, install instructions, GitHub release/social launch.

README remains frozen until release unless explicitly approved.
