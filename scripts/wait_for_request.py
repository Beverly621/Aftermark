#!/usr/bin/env python3
"""Block efficiently until a valid Aftermark Studio request is ready."""

from __future__ import annotations

import argparse
import json
import sys
import time

from runtime_common import RuntimeValidationError, append_log, load_request_when_ready, load_session, resolve_user_project


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--project", required=True)
    parser.add_argument("--timeout", type=float, default=0, help="Seconds to wait; 0 waits indefinitely")
    parser.add_argument("--poll-interval", type=float, default=0.25)
    args = parser.parse_args()

    try:
        project = resolve_user_project(args.project)
        load_session(project)
        started = time.monotonic()
        while True:
            request_path = project / "request.json"
            if request_path.is_file():
                request = load_request_when_ready(project)
                if request is not None:
                    append_log(project, "Validated request and matching status are ready for Codex continuation.")
                    print(json.dumps(request, ensure_ascii=False))
                    return 0

            if args.timeout > 0 and time.monotonic() - started >= args.timeout:
                print("Timed out waiting for a valid Aftermark request.", file=sys.stderr)
                return 3
            time.sleep(max(0.05, args.poll_interval))
    except KeyboardInterrupt:
        print("Interrupted while waiting for Aftermark Studio.", file=sys.stderr)
        return 130
    except (RuntimeValidationError, OSError, json.JSONDecodeError) as error:
        print(f"Aftermark request error: {error}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
