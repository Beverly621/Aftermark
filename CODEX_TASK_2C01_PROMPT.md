# Task 2C01 — Aftermark Skill Shell + Local Studio Handshake

We are pivoting Aftermark to a **Skill-first** product.

Do not build hosted SaaS generation and do not run paid provider benchmarks.

Target loop:

```text
Codex loads Skill
→ creates user-owned project
→ launches Local Studio
→ user uploads and chooses
→ Studio writes request.json
→ Codex resumes from a blocking waiter
→ development outer-art placeholder
→ existing deterministic compositor
→ Studio detects complete
→ Reveal
→ Save
```

This task proves orchestration only. Real Codex-native image generation belongs to Task 2C02.

## Read first

- `AGENTS.md`
- `docs/PRODUCT.md`
- `docs/PHASE-1.md`
- `docs/PHASE-2A.md`
- `docs/PHASE-2B.md` if present
- `docs/PHASE-2C-SKILL-RUNTIME.md`
- `docs/RUNTIME-HANDSHAKE.md`
- `docs/GOLDEN-REFERENCE-POLICY.md`
- `docs/SKILL-REPOSITORY-STRUCTURE.md`
- existing Neon Scribble docs

Inspect the current UI, RecordArtDirection, renderer, compositor, export code, server routes, and frozen provider benchmark.

Do not delete provider adapters or benchmarks.

## Before coding

Report briefly:
1. current repo structure
2. UI entry point
3. RecordArtDirection/composition state
4. compositor/export path
5. server/API routes
6. reusable pieces for Local Studio
7. planned changed files

Then implement Task 2C01 only.

## Required

### 1. Add root `SKILL.md`
Operational scaffold for Codex:
- create user-owned project
- launch Studio
- wait for request
- continue dev pipeline
- run compositor
- open/deliver Reveal

Clearly state that Task 2C01 still uses a development outer-art placeholder.

### 2. Session initializer
Suggested:

```bash
python scripts/create_session.py --project <path>
```

Create:
- `aftermark-session.json`
- `status.json`
- `assets/`
- `output/`
- `logs/`

No user assets inside reusable Skill directory.

### 3. Local Studio launcher
Suggested:

```bash
python scripts/launch_studio.py --project <path>
```

Requirements:
- localhost only
- preferred port + fallback
- bound to one project/session
- no provider/API key
- reuse current Aftermark UI; do not build an unrelated second UI

### 4. Request bridge
On `MAKE MY RECORD`, atomically write validated `request.json`.

Use the schema in `RUNTIME-HANDSHAKE.md`.

### 5. Blocking waiter
Add:

```bash
python scripts/wait_for_request.py --project <path>
```

It must validate session/request, wait efficiently, support timeout/interrupt, and return when ready.

### 6. Development generation step
No paid APIs.
Use the existing dev outer-art adapter or a deterministic placeholder.

Then run the real deterministic compositor:
- protected original center
- deterministic user text
- metadata
- final `record.png`
- share output if existing path supports it

### 7. Status bridge
Support:

```text
waiting_for_user
request_ready
generating_outer_art
compositing
complete
error
```

Reveal must consume the actual project output.

### 8. Resume
Browser refresh and relaunching the same project must restore state.
If request already exists, waiter should return appropriately.

### 9. Tests
At least:
- session creation
- request schema
- session mismatch rejection
- wait behavior
- project stays outside Skill directory
- center protection regression
- deterministic user text
- no API credential required
- no secret exposed to browser

Run typecheck, tests, build, and one local browser acceptance if possible.

## Scope restrictions

Do not:
- call paid APIs
- run provider bake-off
- remove OpenAI/Gemini/FLUX adapters
- delete benchmark infrastructure
- add auth/payment/database
- build hosted generation
- expand styles/densities/material production support
- redesign Reveal animation
- modify README

## Acceptance demo

```text
create project
→ open Studio
→ upload
→ choose
→ request appears
→ waiter returns
→ dev outer-art created
→ compositor writes record
→ Studio reveals it
→ save works
```

## Final report

Report:
1. files changed
2. SKILL.md behavior
3. session format
4. launch command
5. waiter command
6. request/status schemas
7. compositor reuse
8. resume behavior
9. test/typecheck/build
10. browser acceptance
11. no paid API called
12. provider adapters retained
13. README unchanged
14. blockers before Task 2C02

Then stop for human review.
