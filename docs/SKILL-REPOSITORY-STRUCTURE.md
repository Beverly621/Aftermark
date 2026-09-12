# Recommended Skill Repository Structure

```text
aftermark/
├── SKILL.md
├── AGENTS.md
├── docs/
├── references/
│   ├── neon-scribble.md
│   ├── composition-grammar.md
│   ├── lettering.md
│   ├── material-classic.md
│   ├── negative-rules.md
│   └── visual/
├── scripts/
│   ├── create_session.py
│   ├── launch_studio.py
│   ├── wait_for_request.py
│   ├── set_status.py
│   ├── compose_record.py
│   └── export_share.py
├── studio/
│   └── existing Aftermark web UI adapted for local use
├── tests/
├── examples/
└── benchmarks/
    └── frozen provider benchmark infrastructure
```

## SKILL.md responsibility

Keep SKILL.md operational. It tells Codex:
- when to use Aftermark
- how to create the user project
- how to launch Studio
- how to wait for request
- which art-direction docs to read
- how to generate the outer art
- how to run compositor/export
- how to verify/deliver

Detailed visual rules live in `references/`.

## Installability

Desired eventual experience:

```text
clone/install Skill
→ user says: "Use Aftermark to make me a record."
→ local Studio opens
```

Finalize exact installation commands only after Task 2C04 verifies them.

## README freeze

Do not rewrite README during Tasks 2C01–2C04.
README is a Task 2C05 release artifact.
