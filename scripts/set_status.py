#!/usr/bin/env python3
"""Atomically update an Aftermark project status."""

from __future__ import annotations

import argparse
import json
import sys

from runtime_common import STATUS_SCHEMA, STATUS_STATES, RuntimeValidationError, append_log, atomic_write_json, load_session, resolve_user_project, utc_now


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--project", required=True)
    parser.add_argument("--state", required=True, choices=sorted(STATUS_STATES))
    parser.add_argument("--message", default="")
    args = parser.parse_args()

    try:
        project = resolve_user_project(args.project)
        session = load_session(project)
        if args.state == "complete":
            for relative in ("output/record.png", "output/share-card.png"):
                if not (project / relative).is_file():
                    raise RuntimeValidationError(f"Cannot mark complete before {relative} exists.")
        status = {
            "schemaVersion": STATUS_SCHEMA,
            "sessionId": session["sessionId"],
            "state": args.state,
            "updatedAt": utc_now(),
            "message": args.message,
        }
        atomic_write_json(project / "status.json", status)
        append_log(project, f"Status changed to {args.state}.")
        print(json.dumps(status))
        return 0
    except (RuntimeValidationError, OSError) as error:
        print(f"Aftermark status error: {error}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
