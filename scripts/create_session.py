#!/usr/bin/env python3
"""Create or resume a user-owned Aftermark project."""

from __future__ import annotations

import argparse
import json
import secrets
import sys

from runtime_common import (
    SESSION_SCHEMA,
    STATUS_SCHEMA,
    RuntimeValidationError,
    append_log,
    atomic_write_json,
    load_session,
    resolve_user_project,
    utc_now,
    validate_status,
)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--project", required=True, help="Absolute path for the user-owned project")
    args = parser.parse_args()

    try:
        project = resolve_user_project(args.project, create=True)
        for directory in ("assets", "output", "logs"):
            (project / directory).mkdir(parents=True, exist_ok=True)

        session_path = project / "aftermark-session.json"
        if session_path.exists():
            session = load_session(project)
            status = validate_status(
                json.loads((project / "status.json").read_text(encoding="utf-8")),
                session,
            )
            resumed = True
        else:
            created_at = utc_now()
            session = {
                "schemaVersion": SESSION_SCHEMA,
                "sessionId": f"am_{secrets.token_hex(12)}",
                "createdAt": created_at,
            }
            status = {
                "schemaVersion": STATUS_SCHEMA,
                "sessionId": session["sessionId"],
                "state": "waiting_for_user",
                "updatedAt": created_at,
                "message": "Open Aftermark Studio to begin.",
            }
            atomic_write_json(session_path, session)
            atomic_write_json(project / "status.json", status)
            resumed = False

        (project / "logs" / "session.log").touch(exist_ok=True)
        append_log(project, "Session resumed." if resumed else "Session created.")
        print(json.dumps({"project": str(project), "sessionId": session["sessionId"], "state": status["state"], "resumed": resumed}))
        return 0
    except (RuntimeValidationError, OSError, json.JSONDecodeError) as error:
        print(f"Aftermark session error: {error}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
